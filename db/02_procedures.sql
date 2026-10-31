-- ============================================================================
-- DayLog Database Procedures & Analytical Functions
-- File: /db/02_procedures.sql
-- Idempotent, safe to rerun with CREATE OR REPLACE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. sp_refresh_daily_summary(p_date DATE)
-- Recalculates metrics for a single date:
--   - completion_pct: average progress across active activities, capped at 100%
--   - completed_count: count of active activities where is_completed = true
--   - total_count: count of active activities
--   - steps_total: logged value for the activity named 'Walk 10,000 steps' (or type=number & unit='steps')
--   - is_streak_day: true if completion_pct >= streak threshold (default 100%)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_refresh_daily_summary(p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_streak_threshold NUMERIC;
  v_total_active INT;
  v_completed_count INT;
  v_avg_completion NUMERIC(5, 2);
  v_steps NUMERIC(10, 2);
  v_is_streak BOOLEAN;
BEGIN
  -- Read streak threshold percentage from app_settings (default 100.0)
  SELECT COALESCE(NULLIF(value, '')::NUMERIC, 100.00)
    INTO v_streak_threshold
    FROM app_settings
   WHERE key = 'streak_threshold_pct';

  IF v_streak_threshold IS NULL THEN
    v_streak_threshold := 100.00;
  END IF;

  -- Count total active activities
  SELECT COUNT(*)
    INTO v_total_active
    FROM activities
   WHERE is_active = TRUE;

  IF v_total_active = 0 THEN
    -- If no active activities, upsert a zero summary
    INSERT INTO daily_summary (
      log_date, completion_pct, completed_count, total_count, steps_total, is_streak_day, updated_at
    ) VALUES (
      p_date, 0.00, 0, 0, 0.00, FALSE, NOW()
    )
    ON CONFLICT (log_date) DO UPDATE SET
      completion_pct = 0.00,
      completed_count = 0,
      total_count = 0,
      steps_total = 0.00,
      is_streak_day = FALSE,
      updated_at = NOW();
    RETURN;
  END IF;

  -- Calculate summary metrics across all active activities for this date
  SELECT
    COUNT(CASE WHEN l.is_completed = TRUE THEN 1 END),
    COALESCE(
      ROUND(
        AVG(
          LEAST(100.00, 
            CASE 
              WHEN a.daily_target <= 0 THEN (CASE WHEN COALESCE(l.is_completed, FALSE) THEN 100.00 ELSE 0.00 END)
              ELSE (COALESCE(l.value, 0) / a.daily_target) * 100.00
            END
          )
        ), 2
      ), 0.00
    )
  INTO v_completed_count, v_avg_completion
  FROM activities a
  LEFT JOIN activity_logs l ON l.activity_id = a.id AND l.log_date = p_date
  WHERE a.is_active = TRUE;

  -- Calculate steps total for this date (from activity unit 'steps' or name containing 'step')
  SELECT COALESCE(SUM(l.value), 0.00)
    INTO v_steps
    FROM activities a
    JOIN activity_logs l ON l.activity_id = a.id AND l.log_date = p_date
   WHERE a.is_active = TRUE 
     AND (LOWER(a.unit) = 'steps' OR LOWER(a.name) LIKE '%step%');

  v_is_streak := (v_avg_completion >= v_streak_threshold);

  -- Upsert into daily_summary
  INSERT INTO daily_summary (
    log_date,
    completion_pct,
    completed_count,
    total_count,
    steps_total,
    is_streak_day,
    updated_at
  ) VALUES (
    p_date,
    v_avg_completion,
    v_completed_count,
    v_total_active,
    v_steps,
    v_is_streak,
    NOW()
  )
  ON CONFLICT (log_date) DO UPDATE SET
    completion_pct = EXCLUDED.completion_pct,
    completed_count = EXCLUDED.completed_count,
    total_count = EXCLUDED.total_count,
    steps_total = EXCLUDED.steps_total,
    is_streak_day = EXCLUDED.is_streak_day,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 2. sp_upsert_activity_log
-- Upserts an entry for a specific activity & date, computes is_completed,
-- and automatically updates the daily_summary table.
-- Returns the saved record as JSON.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_upsert_activity_log(
  p_activity_id UUID,
  p_log_date DATE,
  p_value NUMERIC,
  p_note TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_target NUMERIC;
  v_type VARCHAR(20);
  v_completed BOOLEAN;
  v_record RECORD;
BEGIN
  -- Fetch target and type
  SELECT daily_target, type
    INTO v_target, v_type
    FROM activities
   WHERE id = p_activity_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity with id % not found', p_activity_id;
  END IF;

  -- Determine completion
  IF v_type = 'check' THEN
    v_completed := (p_value >= 1);
  ELSE
    v_completed := (p_value >= v_target);
  END IF;

  -- Upsert the log
  INSERT INTO activity_logs (
    activity_id,
    log_date,
    value,
    is_completed,
    note,
    link,
    updated_at
  ) VALUES (
    p_activity_id,
    p_log_date,
    GREATEST(0, p_value),
    v_completed,
    p_note,
    p_link,
    NOW()
  )
  ON CONFLICT (activity_id, log_date) DO UPDATE SET
    value = EXCLUDED.value,
    is_completed = EXCLUDED.is_completed,
    note = EXCLUDED.note,
    link = EXCLUDED.link,
    updated_at = NOW()
  RETURNING * INTO v_record;

  -- Refresh daily summary for that date
  PERFORM sp_refresh_daily_summary(p_log_date);

  RETURN to_jsonb(v_record);
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 3. fn_get_streaks()
-- Computes the current streak and all-time best streak using
-- the classic SQL gaps-and-islands technique over daily_summary.
-- Streak is defined as consecutive days where is_streak_day = TRUE.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_streaks(p_as_of_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
  v_current_streak INT := 0;
  v_best_streak INT := 0;
  v_streak_threshold NUMERIC;
BEGIN
  -- Gaps and islands query:
  -- We group consecutive streak days by (log_date - ROW_NUMBER() * interval '1 day')
  WITH streak_islands AS (
    SELECT
      log_date,
      log_date - (ROW_NUMBER() OVER (ORDER BY log_date))::int AS island_group
    FROM daily_summary
    WHERE is_streak_day = TRUE
  ),
  island_lengths AS (
    SELECT
      island_group,
      MIN(log_date) AS start_date,
      MAX(log_date) AS end_date,
      COUNT(*)::int AS length
    FROM streak_islands
    GROUP BY island_group
  )
  SELECT
    COALESCE(MAX(length), 0),
    COALESCE(
      (
        SELECT length
        FROM island_lengths
        -- Current streak is active if the island includes today OR yesterday (to allow today's log)
        WHERE end_date >= (p_as_of_date - INTERVAL '1 day')::DATE
        ORDER BY end_date DESC
        LIMIT 1
      ), 0
    )
  INTO v_best_streak, v_current_streak
  FROM island_lengths;

  RETURN jsonb_build_object(
    'current_streak', COALESCE(v_current_streak, 0),
    'best_streak', GREATEST(COALESCE(v_best_streak, 0), COALESCE(v_current_streak, 0))
  );
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 4. fn_get_dashboard(p_today DATE DEFAULT CURRENT_DATE)
-- Returns the full payload required for the Dashboard view:
--   - today's activities with values, targets, completion status
--   - today's summary metrics (completion %, count, steps)
--   - current & best streak
--   - last 7 days of steps (for weekly steps bar chart)
--   - month heatmap data (log_date, completion_pct, is_streak_day)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_dashboard(p_today DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
  v_activities JSONB;
  v_today_summary JSONB;
  v_streaks JSONB;
  v_weekly_steps JSONB;
  v_month_heatmap JSONB;
  v_start_of_month DATE := DATE_TRUNC('month', p_today)::DATE;
  v_end_of_month DATE := (DATE_TRUNC('month', p_today) + INTERVAL '1 month - 1 day')::DATE;
BEGIN
  -- Ensure today's summary is fresh
  PERFORM sp_refresh_daily_summary(p_today);

  -- 1. Activities for today
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'icon', a.icon,
        'type', a.type,
        'unit', a.unit,
        'daily_target', a.daily_target,
        'sort_order', a.sort_order,
        'is_active', a.is_active,
        'reminder_time', a.reminder_time,
        'value', COALESCE(l.value, 0),
        'is_completed', COALESCE(l.is_completed, FALSE),
        'note', l.note,
        'link', l.link,
        'progress_pct', LEAST(100.0, CASE WHEN a.daily_target <= 0 THEN 0 ELSE ROUND((COALESCE(l.value, 0) / a.daily_target) * 100.0, 1) END)
      ) ORDER BY a.sort_order ASC, a.name ASC
    ), '[]'::jsonb
  ) INTO v_activities
  FROM activities a
  LEFT JOIN activity_logs l ON l.activity_id = a.id AND l.log_date = p_today
  WHERE a.is_active = TRUE;

  -- 2. Today's summary
  SELECT to_jsonb(s.*)
    INTO v_today_summary
    FROM daily_summary s
   WHERE s.log_date = p_today;

  IF v_today_summary IS NULL THEN
    v_today_summary := jsonb_build_object(
      'log_date', p_today,
      'completion_pct', 0,
      'completed_count', 0,
      'total_count', (SELECT COUNT(*) FROM activities WHERE is_active = TRUE),
      'steps_total', 0,
      'is_streak_day', FALSE
    );
  END IF;

  -- 3. Streaks
  v_streaks := fn_get_streaks(p_today);

  -- 4. Last 7 days steps (p_today - 6 to p_today)
  WITH days AS (
    SELECT generate_series(p_today - INTERVAL '6 days', p_today, INTERVAL '1 day')::DATE AS day
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', d.day,
        'day_name', TO_CHAR(d.day, 'Dy'),
        'steps', COALESCE(s.steps_total, 0),
        'target', 10000,
        'is_completed', (COALESCE(s.steps_total, 0) >= 10000)
      ) ORDER BY d.day ASC
    ), '[]'::jsonb
  ) INTO v_weekly_steps
  FROM days d
  LEFT JOIN daily_summary s ON s.log_date = d.day;

  -- 5. Heatmap for the current month
  WITH month_days AS (
    SELECT generate_series(v_start_of_month, v_end_of_month, INTERVAL '1 day')::DATE AS day
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', md.day,
        'day_of_month', EXTRACT(DAY FROM md.day)::int,
        'day_of_week', EXTRACT(ISODOW FROM md.day)::int,
        'completion_pct', COALESCE(s.completion_pct, 0),
        'is_streak_day', COALESCE(s.is_streak_day, FALSE),
        'steps_total', COALESCE(s.steps_total, 0),
        'completed_count', COALESCE(s.completed_count, 0)
      ) ORDER BY md.day ASC
    ), '[]'::jsonb
  ) INTO v_month_heatmap
  FROM month_days md
  LEFT JOIN daily_summary s ON s.log_date = md.day;

  RETURN jsonb_build_object(
    'date', p_today,
    'activities', v_activities,
    'summary', v_today_summary,
    'streaks', v_streaks,
    'weekly_steps', v_weekly_steps,
    'month_heatmap', v_month_heatmap
  );
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 5. fn_get_month_analytics(p_year INT, p_month INT)
-- Comprehensive monthly statistics:
--   - daily completion series (for line/area chart)
--   - per-activity completion rate
--   - total steps and average steps
--   - workout minutes total
--   - Instagram posts count
--   - best day & weakest day
--   - longest streak in the month
--   - comparison with previous month
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_month_analytics(p_year INT, p_month INT)
RETURNS JSONB AS $$
DECLARE
  v_start_date DATE := MAKE_DATE(p_year, p_month, 1);
  v_end_date DATE := (MAKE_DATE(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::DATE;
  v_prev_start DATE := (MAKE_DATE(p_year, p_month, 1) - INTERVAL '1 month')::DATE;
  v_prev_end DATE := (MAKE_DATE(p_year, p_month, 1) - INTERVAL '1 day')::DATE;

  v_daily_series JSONB;
  v_activity_rates JSONB;
  v_total_steps NUMERIC := 0;
  v_avg_steps NUMERIC := 0;
  v_workout_minutes NUMERIC := 0;
  v_instagram_posts INT := 0;
  v_avg_completion NUMERIC := 0;
  v_best_day JSONB;
  v_weakest_day JSONB;
  v_longest_streak INT := 0;

  -- Previous month stats for comparison
  v_prev_avg_completion NUMERIC := 0;
  v_prev_total_steps NUMERIC := 0;
  v_prev_workout_minutes NUMERIC := 0;
  v_prev_instagram_posts INT := 0;
BEGIN
  -- 1. Daily completion series (every calendar day of the month)
  WITH month_days AS (
    SELECT generate_series(v_start_date, v_end_date, INTERVAL '1 day')::DATE AS day
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', md.day,
        'day', EXTRACT(DAY FROM md.day)::int,
        'day_label', TO_CHAR(md.day, 'Mon DD'),
        'completion_pct', COALESCE(s.completion_pct, 0),
        'steps', COALESCE(s.steps_total, 0),
        'is_streak_day', COALESCE(s.is_streak_day, FALSE)
      ) ORDER BY md.day ASC
    ), '[]'::jsonb
  ) INTO v_daily_series
  FROM month_days md
  LEFT JOIN daily_summary s ON s.log_date = md.day;

  -- 2. Overall Month Aggregates
  SELECT
    COALESCE(SUM(s.steps_total), 0),
    COALESCE(ROUND(AVG(s.steps_total), 0), 0),
    COALESCE(ROUND(AVG(s.completion_pct), 1), 0)
  INTO v_total_steps, v_avg_steps, v_avg_completion
  FROM daily_summary s
  WHERE s.log_date BETWEEN v_start_date AND v_end_date;

  -- Workout minutes (activities with type='duration' and name/unit containing workout/min/exercise)
  SELECT COALESCE(SUM(l.value), 0)
    INTO v_workout_minutes
    FROM activity_logs l
    JOIN activities a ON a.id = l.activity_id
   WHERE l.log_date BETWEEN v_start_date AND v_end_date
     AND a.type = 'duration'
     AND (LOWER(a.name) LIKE '%workout%' OR LOWER(a.name) LIKE '%exercise%' OR LOWER(a.unit) LIKE '%min%');

  -- Instagram posts count (activities containing instagram or posts with link/check)
  SELECT COUNT(*)
    INTO v_instagram_posts
    FROM activity_logs l
    JOIN activities a ON a.id = l.activity_id
   WHERE l.log_date BETWEEN v_start_date AND v_end_date
     AND (LOWER(a.name) LIKE '%instagram%' OR LOWER(a.name) LIKE '%post%')
     AND l.is_completed = TRUE;

  -- 3. Per-activity completion rate in this month
  WITH days_in_month AS (
    SELECT COUNT(*)::NUMERIC AS total_days
    FROM generate_series(v_start_date, v_end_date, INTERVAL '1 day')
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'activity_id', a.id,
        'name', a.name,
        'icon', a.icon,
        'unit', a.unit,
        'target', a.daily_target,
        'completed_days', COUNT(CASE WHEN l.is_completed = TRUE THEN 1 END),
        'total_logged', COALESCE(SUM(l.value), 0),
        'completion_rate', ROUND((COUNT(CASE WHEN l.is_completed = TRUE THEN 1 END)::NUMERIC / (SELECT total_days FROM days_in_month)) * 100.0, 1)
      ) ORDER BY a.sort_order ASC
    ), '[]'::jsonb
  ) INTO v_activity_rates
  FROM activities a
  LEFT JOIN activity_logs l ON l.activity_id = a.id AND l.log_date BETWEEN v_start_date AND v_end_date
  WHERE a.is_active = TRUE
  GROUP BY a.id, a.name, a.icon, a.unit, a.daily_target, a.sort_order;

  -- 4. Best day and weakest day
  SELECT jsonb_build_object('date', log_date, 'completion_pct', completion_pct)
    INTO v_best_day
    FROM daily_summary
   WHERE log_date BETWEEN v_start_date AND v_end_date
   ORDER BY completion_pct DESC, log_date ASC
   LIMIT 1;

  SELECT jsonb_build_object('date', log_date, 'completion_pct', completion_pct)
    INTO v_weakest_day
    FROM daily_summary
   WHERE log_date BETWEEN v_start_date AND v_end_date
   ORDER BY completion_pct ASC, log_date ASC
   LIMIT 1;

  -- 5. Longest streak inside this month
  WITH streak_islands AS (
    SELECT
      log_date,
      log_date - (ROW_NUMBER() OVER (ORDER BY log_date))::int AS grp
    FROM daily_summary
    WHERE is_streak_day = TRUE AND log_date BETWEEN v_start_date AND v_end_date
  )
  SELECT COALESCE(MAX(cnt), 0)
    INTO v_longest_streak
    FROM (
      SELECT COUNT(*)::int AS cnt
      FROM streak_islands
      GROUP BY grp
    ) sub;

  -- 6. Comparison stats with previous month
  SELECT
    COALESCE(SUM(s.steps_total), 0),
    COALESCE(ROUND(AVG(s.completion_pct), 1), 0)
  INTO v_prev_total_steps, v_prev_avg_completion
  FROM daily_summary s
  WHERE s.log_date BETWEEN v_prev_start AND v_prev_end;

  SELECT COALESCE(SUM(l.value), 0)
    INTO v_prev_workout_minutes
    FROM activity_logs l
    JOIN activities a ON a.id = l.activity_id
   WHERE l.log_date BETWEEN v_prev_start AND v_prev_end
     AND a.type = 'duration'
     AND (LOWER(a.name) LIKE '%workout%' OR LOWER(a.name) LIKE '%exercise%' OR LOWER(a.unit) LIKE '%min%');

  SELECT COUNT(*)
    INTO v_prev_instagram_posts
    FROM activity_logs l
    JOIN activities a ON a.id = l.activity_id
   WHERE l.log_date BETWEEN v_prev_start AND v_prev_end
     AND (LOWER(a.name) LIKE '%instagram%' OR LOWER(a.name) LIKE '%post%')
     AND l.is_completed = TRUE;

  RETURN jsonb_build_object(
    'year', p_year,
    'month', p_month,
    'start_date', v_start_date,
    'end_date', v_end_date,
    'kpis', jsonb_build_object(
      'avg_completion_pct', v_avg_completion,
      'total_steps', v_total_steps,
      'avg_steps', v_avg_steps,
      'workout_minutes', v_workout_minutes,
      'instagram_posts', v_instagram_posts,
      'longest_streak', v_longest_streak,
      'best_day', v_best_day,
      'weakest_day', v_weakest_day
    ),
    'comparison_prev_month', jsonb_build_object(
      'prev_avg_completion_pct', v_prev_avg_completion,
      'diff_avg_completion_pct', ROUND(v_avg_completion - v_prev_avg_completion, 1),
      'prev_total_steps', v_prev_total_steps,
      'diff_total_steps', v_total_steps - v_prev_total_steps,
      'prev_workout_minutes', v_prev_workout_minutes,
      'diff_workout_minutes', v_workout_minutes - v_prev_workout_minutes,
      'prev_instagram_posts', v_prev_instagram_posts,
      'diff_instagram_posts', v_instagram_posts - v_prev_instagram_posts
    ),
    'daily_series', v_daily_series,
    'activity_rates', v_activity_rates
  );
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 6. fn_get_year_analytics(p_year INT)
-- Yearly overview:
--   - month-by-month completion %, steps, and workout totals (12 months)
--   - per-activity yearly completion rate
--   - best month & longest streak of the year
--   - total active days count
--   - full 365/366 day heatmap
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_year_analytics(p_year INT)
RETURNS JSONB AS $$
DECLARE
  v_start_date DATE := MAKE_DATE(p_year, 1, 1);
  v_end_date DATE := MAKE_DATE(p_year, 12, 31);
  v_months_series JSONB;
  v_yearly_activity_rates JSONB;
  v_heatmap_365 JSONB;
  v_active_days INT := 0;
  v_longest_streak INT := 0;
  v_best_month JSONB;
  v_total_steps NUMERIC := 0;
  v_total_workout_minutes NUMERIC := 0;
  v_yearly_avg_completion NUMERIC := 0;
BEGIN
  -- 1. Month-by-month metrics (12 months)
  WITH months AS (
    SELECT generate_series(1, 12) AS m
  ),
  month_metrics AS (
    SELECT
      m.m,
      TO_CHAR(MAKE_DATE(p_year, m.m, 1), 'Mon') AS month_name,
      MAKE_DATE(p_year, m.m, 1) AS m_start,
      (MAKE_DATE(p_year, m.m, 1) + INTERVAL '1 month - 1 day')::DATE AS m_end
    FROM months m
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'month', mm.m,
        'month_name', mm.month_name,
        'avg_completion_pct', COALESCE(ROUND(AVG(s.completion_pct), 1), 0),
        'total_steps', COALESCE(SUM(s.steps_total), 0),
        'active_days', COUNT(CASE WHEN s.completion_pct > 0 THEN 1 END),
        'streak_days', COUNT(CASE WHEN s.is_streak_day = TRUE THEN 1 END)
      ) ORDER BY mm.m ASC
    ), '[]'::jsonb
  ) INTO v_months_series
  FROM month_metrics mm
  LEFT JOIN daily_summary s ON s.log_date BETWEEN mm.m_start AND mm.m_end
  GROUP BY mm.m, mm.month_name;

  -- 2. Total active days & aggregate metrics
  SELECT
    COUNT(CASE WHEN completion_pct > 0 THEN 1 END),
    COALESCE(SUM(steps_total), 0),
    COALESCE(ROUND(AVG(completion_pct), 1), 0)
  INTO v_active_days, v_total_steps, v_yearly_avg_completion
  FROM daily_summary
  WHERE log_date BETWEEN v_start_date AND v_end_date;

  -- Total workout minutes for the year
  SELECT COALESCE(SUM(l.value), 0)
    INTO v_total_workout_minutes
    FROM activity_logs l
    JOIN activities a ON a.id = l.activity_id
   WHERE l.log_date BETWEEN v_start_date AND v_end_date
     AND a.type = 'duration'
     AND (LOWER(a.name) LIKE '%workout%' OR LOWER(a.name) LIKE '%exercise%' OR LOWER(a.unit) LIKE '%min%');

  -- 3. Longest streak in the year
  WITH streak_islands AS (
    SELECT
      log_date,
      log_date - (ROW_NUMBER() OVER (ORDER BY log_date))::int AS grp
    FROM daily_summary
    WHERE is_streak_day = TRUE AND log_date BETWEEN v_start_date AND v_end_date
  )
  SELECT COALESCE(MAX(cnt), 0)
    INTO v_longest_streak
    FROM (
      SELECT COUNT(*)::int AS cnt
      FROM streak_islands
      GROUP BY grp
    ) sub;

  -- 4. Best month
  WITH month_avgs AS (
    SELECT
      EXTRACT(MONTH FROM log_date)::int AS m,
      TO_CHAR(DATE_TRUNC('month', log_date), 'Month') AS m_name,
      ROUND(AVG(completion_pct), 1) AS avg_pct
    FROM daily_summary
    WHERE log_date BETWEEN v_start_date AND v_end_date
    GROUP BY EXTRACT(MONTH FROM log_date), DATE_TRUNC('month', log_date)
  )
  SELECT jsonb_build_object('month', m, 'month_name', TRIM(m_name), 'avg_completion_pct', avg_pct)
    INTO v_best_month
    FROM month_avgs
   ORDER BY avg_pct DESC
   LIMIT 1;

  -- 5. Per-activity yearly completion rate
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'activity_id', a.id,
        'name', a.name,
        'icon', a.icon,
        'unit', a.unit,
        'completed_days', COUNT(CASE WHEN l.is_completed = TRUE THEN 1 END),
        'total_logged', COALESCE(SUM(l.value), 0),
        'completion_rate', ROUND((COUNT(CASE WHEN l.is_completed = TRUE THEN 1 END)::NUMERIC / 365.0) * 100.0, 1)
      ) ORDER BY a.sort_order ASC
    ), '[]'::jsonb
  ) INTO v_yearly_activity_rates
  FROM activities a
  LEFT JOIN activity_logs l ON l.activity_id = a.id AND l.log_date BETWEEN v_start_date AND v_end_date
  WHERE a.is_active = TRUE
  GROUP BY a.id, a.name, a.icon, a.unit, a.sort_order;

  -- 6. Full year 365-day heatmap
  WITH year_days AS (
    SELECT generate_series(v_start_date, v_end_date, INTERVAL '1 day')::DATE AS day
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', yd.day,
        'month', EXTRACT(MONTH FROM yd.day)::int,
        'day', EXTRACT(DAY FROM yd.day)::int,
        'day_of_week', EXTRACT(ISODOW FROM yd.day)::int,
        'completion_pct', COALESCE(s.completion_pct, 0),
        'is_streak_day', COALESCE(s.is_streak_day, FALSE),
        'steps_total', COALESCE(s.steps_total, 0)
      ) ORDER BY yd.day ASC
    ), '[]'::jsonb
  ) INTO v_heatmap_365
  FROM year_days yd
  LEFT JOIN daily_summary s ON s.log_date = yd.day;

  RETURN jsonb_build_object(
    'year', p_year,
    'kpis', jsonb_build_object(
      'yearly_avg_completion_pct', v_yearly_avg_completion,
      'total_steps', v_total_steps,
      'total_workout_minutes', v_total_workout_minutes,
      'active_days', v_active_days,
      'longest_streak', v_longest_streak,
      'best_month', v_best_month
    ),
    'months_series', v_months_series,
    'activity_rates', v_yearly_activity_rates,
    'heatmap_365', v_heatmap_365
  );
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 7. sp_seed_default_activities()
-- Inserts the 7 default activities if the activities table is currently empty.
-- Safe to call at any time.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_seed_default_activities()
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM activities LIMIT 1) THEN
    INSERT INTO activities (name, icon, type, unit, daily_target, sort_order, is_active, reminder_time)
    VALUES
      ('Walk 10,000 steps', 'Footprints', 'number', 'steps', 10000.00, 1, TRUE, '18:00:00'),
      ('Workout 15 minutes', 'Flame', 'duration', 'mins', 15.00, 2, TRUE, '08:00:00'),
      ('Post the UpThree post on Instagram', 'Share2', 'check', '', 1.00, 3, TRUE, '12:00:00'),
      ('Drink 3 L of water', 'Droplet', 'number', 'L', 3.00, 4, TRUE, NULL),
      ('Sleep 7+ hours', 'Moon', 'number', 'hrs', 7.00, 5, TRUE, '22:30:00'),
      ('Learn or code for 30 minutes', 'Code', 'duration', 'mins', 30.00, 6, TRUE, '19:00:00'),
      ('Plan tomorrow', 'CheckSquare', 'check', '', 1.00, 7, TRUE, '21:30:00');
  END IF;

  -- Also ensure basic app settings exist
  INSERT INTO app_settings (key, value, description)
  VALUES
    ('streak_threshold_pct', '100.00', 'Percentage of daily target completion required to qualify as a streak day'),
    ('timezone', 'Asia/Kolkata', 'User local timezone for calendar calculations'),
    ('theme', 'dark', 'Application UI theme preference')
  ON CONFLICT (key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
