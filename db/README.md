# DayLog Database Setup Guide (Neon Serverless Postgres)

This folder contains the complete SQL schema, procedures, and seed datasets for DayLog.

---

## 1. Execution Order in Neon SQL Editor

Log in to your [Neon Console](https://console.neon.tech), select your project, open the **SQL Editor**, and run the scripts in this exact sequence:

1. **`01_tables.sql`**:
   - Enables `uuid-ossp` and `pgcrypto`.
   - Creates the `activities`, `activity_logs`, `daily_summary`, and `app_settings` tables.
   - Sets up automatic `updated_at` triggers and indexes.
   - Idempotent: safe to run multiple times.

2. **`02_procedures.sql`**:
   - Creates stored procedures and analytical functions:
     - `sp_refresh_daily_summary(p_date)`: Materializes day-level progress, steps, and streak qualification.
     - `sp_upsert_activity_log(...)`: Atomic log insert/update with summary recomputation.
     - `fn_get_streaks()`: Computes current and all-time best streaks using the SQL gaps-and-islands technique.
     - `fn_get_dashboard(p_today)`: Returns activities, streaks, 7-day steps, and monthly heatmap in a single fast JSON payload.
     - `fn_get_month_analytics(p_year, p_month)`: Monthly analytics, per-activity rates, KPIs, best/weakest day, and previous-month delta.
     - `fn_get_year_analytics(p_year)`: 12-month analytics, 365-day heatmap, yearly records.
     - `sp_seed_default_activities()`: Initializes default activities and default app settings.

3. **`03_seed.sql`**:
   - Seeds the default 7 core activities (Walk 10k steps, Workout 15m, Instagram post, Water 3L, Sleep 7h, Learn 30m, Plan tomorrow).
   - Contains an optional section generating 30 days of realistic sample tracking data for instant dashboard/analytics visualization.

---

## 2. Automated Migration Script

Instead of copying and pasting into the Neon SQL Editor manually, you can run the provided migration runner:

```bash
# Ensure DATABASE_URL is defined in .env.local
npm run db:migrate
```

This script reads and executes `01_tables.sql`, `02_procedures.sql`, and `03_seed.sql` sequentially against your Neon database using `@neondatabase/serverless`.

---

## 3. Rollback / Reset Instructions

To completely reset the database to a blank state, execute this in the Neon SQL Editor:

```sql
BEGIN;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS daily_summary CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP FUNCTION IF EXISTS sp_upsert_activity_log CASCADE;
DROP FUNCTION IF EXISTS sp_refresh_daily_summary CASCADE;
DROP FUNCTION IF EXISTS fn_get_dashboard CASCADE;
DROP FUNCTION IF EXISTS fn_get_month_analytics CASCADE;
DROP FUNCTION IF EXISTS fn_get_year_analytics CASCADE;
DROP FUNCTION IF EXISTS fn_get_streaks CASCADE;
DROP FUNCTION IF EXISTS sp_seed_default_activities CASCADE;
DROP FUNCTION IF EXISTS trigger_set_timestamp CASCADE;
COMMIT;
```

After dropping, re-run `01_tables.sql`, `02_procedures.sql`, and `03_seed.sql`.

---

## 4. Connecting From the App

1. In the Neon Console Dashboard, locate your **Connection Details**.
2. Select **Connection string** and make sure **Pooled connection** is checked (this appends `-pooler` to the host name, e.g. `postgresql://user:pass@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`).
3. Copy this URL and paste it into your `.env.local` file:
   ```env
   DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
4. The application uses `@neondatabase/serverless` with `neon(process.env.DATABASE_URL)` for fast serverless HTTP SQL execution without exhausting connection limits.
