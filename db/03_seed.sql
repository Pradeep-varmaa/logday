-- ============================================================================
-- DayLog Database Seed Script
-- File: /db/03_seed.sql
-- Contains default activities and optional realistic sample history.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Section 1: Core Activities & Settings (REQUIRED)
-- ----------------------------------------------------------------------------
SELECT sp_seed_default_activities();

-- ----------------------------------------------------------------------------
-- Section 2: Optional Sample Data (SAFE TO SKIP / REMOVE IN PRODUCTION)
-- Populates 30 days of realistic daily data for analytics, charts, and streaks
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_walk_id UUID;
  v_workout_id UUID;
  v_ig_id UUID;
  v_water_id UUID;
  v_sleep_id UUID;
  v_learn_id UUID;
  v_plan_id UUID;
  v_curr_date DATE;
  v_day_offset INT;
  v_step_val NUMERIC;
  v_workout_val NUMERIC;
  v_water_val NUMERIC;
  v_sleep_val NUMERIC;
  v_learn_val NUMERIC;
  v_ig_completed BOOLEAN;
  v_plan_completed BOOLEAN;
BEGIN
  -- Grab activity IDs
  SELECT id INTO v_walk_id FROM activities WHERE name LIKE 'Walk%' LIMIT 1;
  SELECT id INTO v_workout_id FROM activities WHERE name LIKE 'Workout%' LIMIT 1;
  SELECT id INTO v_ig_id FROM activities WHERE name LIKE 'Post%' LIMIT 1;
  SELECT id INTO v_water_id FROM activities WHERE name LIKE 'Drink%' LIMIT 1;
  SELECT id INTO v_sleep_id FROM activities WHERE name LIKE 'Sleep%' LIMIT 1;
  SELECT id INTO v_learn_id FROM activities WHERE name LIKE 'Learn%' LIMIT 1;
  SELECT id INTO v_plan_id FROM activities WHERE name LIKE 'Plan%' LIMIT 1;

  -- Generate 30 days of data ending today
  FOR v_day_offset IN REVERSE 29..0 LOOP
    v_curr_date := (CURRENT_DATE - (v_day_offset || ' days')::INTERVAL)::DATE;

    -- Realistic variations (most days are good, some are partial)
    IF v_day_offset % 7 = 3 THEN
      -- Off day / rest day
      v_step_val := 7420;
      v_workout_val := 0;
      v_ig_completed := TRUE;
      v_water_val := 2.2;
      v_sleep_val := 6.5;
      v_learn_val := 15;
      v_plan_completed := TRUE;
    ELSIF v_day_offset < 14 THEN
      -- Strong streak days leading up to today
      v_step_val := 10500 + (v_day_offset * 120);
      v_workout_val := 20;
      v_ig_completed := TRUE;
      v_water_val := 3.2;
      v_sleep_val := 7.5;
      v_learn_val := 35;
      v_plan_completed := TRUE;
    ELSE
      -- Solid consistency
      v_step_val := 9800 + ((v_day_offset % 5) * 450);
      v_workout_val := 15;
      v_ig_completed := (v_day_offset % 2 = 0);
      v_water_val := 3.0;
      v_sleep_val := 7.0;
      v_learn_val := 30;
      v_plan_completed := TRUE;
    END IF;

    -- Upsert logs using the procedure
    IF v_walk_id IS NOT NULL THEN
      PERFORM sp_upsert_activity_log(v_walk_id, v_curr_date, v_step_val, 'Daily evening walk', NULL);
    END IF;

    IF v_workout_id IS NOT NULL THEN
      PERFORM sp_upsert_activity_log(v_workout_id, v_curr_date, v_workout_val, 'Morning HIIT workout', NULL);
    END IF;

    IF v_ig_id IS NOT NULL THEN
      PERFORM sp_upsert_activity_log(v_ig_id, v_curr_date, CASE WHEN v_ig_completed THEN 1 ELSE 0 END, 'Shared daily progress card', CASE WHEN v_ig_completed THEN 'https://instagram.com/p/sample123' ELSE NULL END);
    END IF;

    IF v_water_id IS NOT NULL THEN
      PERFORM sp_upsert_activity_log(v_water_id, v_curr_date, v_water_val, '3 bottles recorded', NULL);
    END IF;

    IF v_sleep_id IS NOT NULL THEN
      PERFORM sp_upsert_activity_log(v_sleep_id, v_curr_date, v_sleep_val, 'Tracked with smart band', NULL);
    END IF;

    IF v_learn_id IS NOT NULL THEN
      PERFORM sp_upsert_activity_log(v_learn_id, v_curr_date, v_learn_val, 'Learned Next.js & Server Actions', NULL);
    END IF;

    IF v_plan_id IS NOT NULL THEN
      PERFORM sp_upsert_activity_log(v_plan_id, v_curr_date, CASE WHEN v_plan_completed THEN 1 ELSE 0 END, 'Calendar reviewed for tomorrow', NULL);
    END IF;

  END LOOP;
END $$;

COMMIT;
