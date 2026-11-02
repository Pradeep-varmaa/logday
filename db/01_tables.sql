-- ============================================================================
-- DayLog Database Schema: Tables, Indexes, Constraints, and Triggers
-- File: /db/01_tables.sql
-- Idempotent, safe to rerun.
-- ============================================================================

BEGIN;

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update updated_at timestamp columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Table: activities
-- Defines user-configurable trackable daily goals/habits
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  icon VARCHAR(60) NOT NULL DEFAULT 'CheckCircle',
  type VARCHAR(20) NOT NULL CHECK (type IN ('check', 'number', 'duration')),
  unit VARCHAR(30) NOT NULL DEFAULT '',
  daily_target NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (daily_target >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time TIME NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
                        
-- Trigger for activities updated_at
DROP TRIGGER IF EXISTS set_timestamp_activities ON activities;
CREATE TRIGGER set_timestamp_activities
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- Table: activity_logs
-- Daily entries per activity, keyed by local calendar date (YYYY-MM-DD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  value NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT NULL,
  link TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_activity_log_date UNIQUE (activity_id, log_date)
);

-- Trigger for activity_logs updated_at
DROP TRIGGER IF EXISTS set_timestamp_activity_logs ON activity_logs;
CREATE TRIGGER set_timestamp_activity_logs
BEFORE UPDATE ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- Table: daily_summary
-- Materialized day-level stats for fast dashboards, heatmaps, and streaks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_summary (
  log_date DATE PRIMARY KEY,
  completion_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  completed_count INT NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
  total_count INT NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  steps_total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (steps_total >= 0),
  is_streak_day BOOLEAN NOT NULL DEFAULT FALSE,
  mood VARCHAR(30) NULL,
  reflection TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column additions for existing installations
ALTER TABLE daily_summary ADD COLUMN IF NOT EXISTS mood VARCHAR(30) NULL;
ALTER TABLE daily_summary ADD COLUMN IF NOT EXISTS reflection TEXT NULL;

-- Trigger for daily_summary updated_at
DROP TRIGGER IF EXISTS set_timestamp_daily_summary ON daily_summary;
CREATE TRIGGER set_timestamp_daily_summary
BEFORE UPDATE ON daily_summary
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- Table: app_settings
-- System and user configuration (e.g., streak threshold, timezone, theme)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for app_settings updated_at
DROP TRIGGER IF EXISTS set_timestamp_app_settings ON app_settings;
CREATE TRIGGER set_timestamp_app_settings
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- Table: todos
-- Persistent task / to-do list (open-ended without a single-day timeline; stays active until checked)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for todos updated_at
DROP TRIGGER IF EXISTS set_timestamp_todos ON todos;
CREATE TRIGGER set_timestamp_todos
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ----------------------------------------------------------------------------
-- Indexes for performance
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity ON activity_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_date ON activity_logs(activity_id, log_date);
CREATE INDEX IF NOT EXISTS idx_activities_sort ON activities(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_daily_summary_streak ON daily_summary(is_streak_day, log_date);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(is_completed, created_at DESC);

COMMIT;
