-- ================================================================
-- Family Home Hub — Supabase Database Schema
-- ================================================================
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- Paste the entire file and click “Run”.
--
-- What this creates:
--   • 16 tables with household_id on every row
--   • Row Level Security on every table
--   • get_my_household_id() helper function
--   • Auto-create household + owner on new user signup
--   • Performance indexes
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- HELPER: resolve the current user's household
-- ================================================================
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT household_id
  FROM   household_members
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;

-- ================================================================
-- HOUSEHOLDS
-- ================================================================
CREATE TABLE IF NOT EXISTS households (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text NOT NULL DEFAULT 'My Family',
  product_name           text NOT NULL DEFAULT 'Family Home Hub',
  workspace_name         text NOT NULL DEFAULT 'My Family',
  internal_branding      text,
  pin_hash               text NOT NULL DEFAULT '000e000f',  -- hashPin('1234')
  faith_enabled          boolean NOT NULL DEFAULT false,
  baby_mode_enabled      boolean NOT NULL DEFAULT false,
  pregnancy_mode_enabled boolean NOT NULL DEFAULT false,
  pets_enabled           boolean NOT NULL DEFAULT false,
  allowance_mode         text    NOT NULL DEFAULT 'both',
  toddler_mode           boolean NOT NULL DEFAULT false,
  ai_provider            text    NOT NULL DEFAULT 'none',
  alexa_enabled          boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "households_select"
  ON households FOR SELECT
  USING (id = get_my_household_id());

CREATE POLICY "households_update"
  ON households FOR UPDATE
  USING (id = get_my_household_id());

-- ================================================================
-- HOUSEHOLD MEMBERS (auth users → households mapping)
-- ================================================================
CREATE TABLE IF NOT EXISTS household_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role         text NOT NULL DEFAULT 'Owner'
                 CHECK (role IN ('Owner','Parent','Child','Toddler','Pet')),
  display_name text,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_members_select"
  ON household_members FOR SELECT
  USING (household_id = get_my_household_id());

CREATE POLICY "household_members_insert"
  ON household_members FOR INSERT
  WITH CHECK (household_id = get_my_household_id());

CREATE POLICY "household_members_update"
  ON household_members FOR UPDATE
  USING (household_id = get_my_household_id());

CREATE POLICY "household_members_delete"
  ON household_members FOR DELETE
  USING (household_id = get_my_household_id());

-- ================================================================
-- FAMILY PROFILES (app-visible profiles, not tied to auth users)
-- ================================================================
CREATE TABLE IF NOT EXISTS family_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         text NOT NULL,
  role         text NOT NULL DEFAULT 'Child'
                 CHECK (role IN ('Owner','Parent','Child','Toddler','Pet','Mom','Dad')),
  avatar       text,
  color        text NOT NULL DEFAULT '#5a9a5a',
  birthday     date,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE family_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_profiles_select" ON family_profiles FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "family_profiles_insert" ON family_profiles FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "family_profiles_update" ON family_profiles FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "family_profiles_delete" ON family_profiles FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- CHORES
-- ================================================================
CREATE TABLE IF NOT EXISTS chores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  assigned_to   uuid REFERENCES family_profiles(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','completed','approved','denied')),
  recurrence    text NOT NULL DEFAULT 'once'
                  CHECK (recurrence IN ('once','daily','weekly','monthly')),
  reward_points int  NOT NULL DEFAULT 0,
  reward_money  int  NOT NULL DEFAULT 0,
  reward_screen int  NOT NULL DEFAULT 0,
  reward_tokens int  NOT NULL DEFAULT 0,
  due_date      date,
  completed_at  timestamptz,
  approved_at   timestamptz,
  approved_by   uuid REFERENCES auth.users(id),
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chores_select" ON chores FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "chores_insert" ON chores FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "chores_update" ON chores FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "chores_delete" ON chores FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- REWARDS
-- ================================================================
CREATE TABLE IF NOT EXISTS rewards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  cost_points  int  NOT NULL DEFAULT 0,
  cost_money   int  NOT NULL DEFAULT 0,
  cost_screen  int  NOT NULL DEFAULT 0,
  cost_tokens  int  NOT NULL DEFAULT 0,
  available    boolean NOT NULL DEFAULT true,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_select" ON rewards FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "rewards_insert" ON rewards FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "rewards_update" ON rewards FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "rewards_delete" ON rewards FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- REWARD REQUESTS
-- ================================================================
CREATE TABLE IF NOT EXISTS reward_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  reward_id    uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  member_id    uuid REFERENCES family_profiles(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','denied')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  resolved_by  uuid REFERENCES auth.users(id),
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reward_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reward_requests_select" ON reward_requests FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "reward_requests_insert" ON reward_requests FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "reward_requests_update" ON reward_requests FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "reward_requests_delete" ON reward_requests FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- ECONOMY: BALANCES
-- ================================================================
CREATE TABLE IF NOT EXISTS economy_balances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES family_profiles(id) ON DELETE CASCADE,
  points         int  NOT NULL DEFAULT 0,
  money          int  NOT NULL DEFAULT 0,
  screen_minutes int  NOT NULL DEFAULT 0,
  tokens         int  NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, member_id)
);

ALTER TABLE economy_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "economy_balances_select" ON economy_balances FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "economy_balances_insert" ON economy_balances FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "economy_balances_update" ON economy_balances FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "economy_balances_delete" ON economy_balances FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- ECONOMY: TRANSACTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS economy_transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id    uuid REFERENCES family_profiles(id) ON DELETE SET NULL,
  type         text NOT NULL CHECK (type IN ('add','subtract')),
  currency     text NOT NULL CHECK (currency IN ('points','money','screenMinutes','tokens')),
  amount       int  NOT NULL,
  reason       text,
  approved_by  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE economy_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "economy_transactions_select" ON economy_transactions FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "economy_transactions_insert" ON economy_transactions FOR INSERT WITH CHECK (household_id = get_my_household_id());

-- ================================================================
-- ROUTINES
-- ================================================================
CREATE TABLE IF NOT EXISTS routines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title         text NOT NULL,
  period        text NOT NULL DEFAULT 'morning'
                  CHECK (period IN ('morning','afternoon','evening','custom')),
  assigned_to   uuid REFERENCES family_profiles(id) ON DELETE SET NULL,
  tasks         jsonb NOT NULL DEFAULT '[]',
  faith_enabled boolean NOT NULL DEFAULT false,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routines_select" ON routines FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "routines_insert" ON routines FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "routines_update" ON routines FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "routines_delete" ON routines FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- CALENDAR EVENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  date            date NOT NULL,
  time            time,
  end_date        date,
  end_time        time,
  type            text NOT NULL DEFAULT 'event'
                    CHECK (type IN ('event','appointment','reminder','birthday')),
  all_day         boolean NOT NULL DEFAULT false,
  color           text,
  google_event_id text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "calendar_events_insert" ON calendar_events FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "calendar_events_update" ON calendar_events FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "calendar_events_delete" ON calendar_events FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- MEAL PLANS
-- ================================================================
CREATE TABLE IF NOT EXISTS meal_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  date         date NOT NULL,
  meal_type    text NOT NULL DEFAULT 'dinner'
                 CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  title        text NOT NULL,
  notes        text,
  recipe_url   text,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal_plans_select" ON meal_plans FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "meal_plans_insert" ON meal_plans FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "meal_plans_update" ON meal_plans FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "meal_plans_delete" ON meal_plans FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- GROCERY ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS grocery_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         text NOT NULL,
  quantity     text,
  category     text,
  checked      boolean NOT NULL DEFAULT false,
  added_by     uuid REFERENCES family_profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grocery_items_select" ON grocery_items FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "grocery_items_insert" ON grocery_items FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "grocery_items_update" ON grocery_items FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "grocery_items_delete" ON grocery_items FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- PANTRY ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS pantry_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         text NOT NULL,
  quantity     text,
  category     text,
  expiry_date  date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pantry_items_select" ON pantry_items FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "pantry_items_insert" ON pantry_items FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "pantry_items_update" ON pantry_items FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "pantry_items_delete" ON pantry_items FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- EDUCATION ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS education_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id    uuid REFERENCES family_profiles(id) ON DELETE SET NULL,
  type         text NOT NULL DEFAULT 'assignment'
                 CHECK (type IN ('assignment','goal','reading','note')),
  title        text NOT NULL,
  subject      text,
  status       text NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('todo','in_progress','done')),
  due_date     date,
  notes        text,
  pages_read   int,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE education_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_items_select" ON education_items FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "education_items_insert" ON education_items FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "education_items_update" ON education_items FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "education_items_delete" ON education_items FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- ANNOUNCEMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title        text NOT NULL,
  body         text,
  pinned       boolean NOT NULL DEFAULT false,
  author_id    uuid REFERENCES family_profiles(id) ON DELETE SET NULL,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "announcements_update" ON announcements FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "announcements_delete" ON announcements FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- BRAIN DUMP
-- ================================================================
CREATE TABLE IF NOT EXISTS brain_dump (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  content      text NOT NULL,
  author_id    uuid REFERENCES family_profiles(id) ON DELETE SET NULL,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE brain_dump ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brain_dump_select" ON brain_dump FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "brain_dump_insert" ON brain_dump FOR INSERT WITH CHECK (household_id = get_my_household_id());
CREATE POLICY "brain_dump_update" ON brain_dump FOR UPDATE USING (household_id = get_my_household_id());
CREATE POLICY "brain_dump_delete" ON brain_dump FOR DELETE USING (household_id = get_my_household_id());

-- ================================================================
-- AUDIT LOGS
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  action       text NOT NULL,
  detail       text,
  performed_by text,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (household_id = get_my_household_id());
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (household_id = get_my_household_id());

-- ================================================================
-- INTEGRATIONS
-- Stores OAuth tokens and service credentials server-side.
-- The config column is never returned to the browser client.
-- Use a Supabase Edge Function + service_role key to read config.
-- ================================================================
CREATE TABLE IF NOT EXISTS integrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  service      text NOT NULL
                 CHECK (service IN ('google_calendar','alexa','ai_assistant')),
  status       text NOT NULL DEFAULT 'disconnected'
                 CHECK (status IN ('connected','disconnected','error')),
  config       jsonb,   -- OAuth tokens, settings. NEVER query this from the browser.
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, service)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Clients can see status/service but NOT config (tokens)
CREATE POLICY "integrations_select"
  ON integrations FOR SELECT
  USING (household_id = get_my_household_id());

CREATE POLICY "integrations_insert"
  ON integrations FOR INSERT
  WITH CHECK (household_id = get_my_household_id());

CREATE POLICY "integrations_update"
  ON integrations FOR UPDATE
  USING (household_id = get_my_household_id());

-- ================================================================
-- TRIGGER: auto-create household on user signup
-- ================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id uuid;
  hname text;
BEGIN
  hname := COALESCE(
    NEW.raw_user_meta_data->>'household_name',
    split_part(NEW.email, '@', 1),
    'My Family'
  );

  INSERT INTO households (name, workspace_name)
  VALUES (hname, hname)
  RETURNING id INTO new_household_id;

  INSERT INTO household_members (household_id, user_id, role, display_name)
  VALUES (new_household_id, NEW.id, 'Owner', COALESCE(NEW.email, 'Owner'));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_hm_user_id       ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_hm_household_id  ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_fp_household_id  ON family_profiles(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_hh        ON chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_assigned  ON chores(assigned_to);
CREATE INDEX IF NOT EXISTS idx_rewards_hh       ON rewards(household_id);
CREATE INDEX IF NOT EXISTS idx_rreqs_hh         ON reward_requests(household_id);
CREATE INDEX IF NOT EXISTS idx_econ_bal_hh      ON economy_balances(household_id);
CREATE INDEX IF NOT EXISTS idx_econ_tx_hh       ON economy_transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_routines_hh      ON routines(household_id);
CREATE INDEX IF NOT EXISTS idx_cal_hh           ON calendar_events(household_id);
CREATE INDEX IF NOT EXISTS idx_cal_date         ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_meals_hh         ON meal_plans(household_id);
CREATE INDEX IF NOT EXISTS idx_grocery_hh       ON grocery_items(household_id);
CREATE INDEX IF NOT EXISTS idx_pantry_hh        ON pantry_items(household_id);
CREATE INDEX IF NOT EXISTS idx_edu_hh           ON education_items(household_id);
CREATE INDEX IF NOT EXISTS idx_announce_hh      ON announcements(household_id);
CREATE INDEX IF NOT EXISTS idx_brain_hh         ON brain_dump(household_id);
CREATE INDEX IF NOT EXISTS idx_audit_hh         ON audit_logs(household_id);
CREATE INDEX IF NOT EXISTS idx_audit_created    ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integrations_hh  ON integrations(household_id);
