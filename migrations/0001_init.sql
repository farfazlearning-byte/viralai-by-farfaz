-- ViralAI by FARFAZ — migration 0001: core accounts, settings, activity
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- scrypt: salt:hash (see src/lib/password.ts)
  country TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  is_owner BOOLEAN NOT NULL DEFAULT false,
  founder_number INTEGER,               -- 1..1000 for Founders, else NULL
  invite_code TEXT NOT NULL UNIQUE,
  referred_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  suspended BOOLEAN NOT NULL DEFAULT false,
  premium_free_until TIMESTAMPTZ,       -- system-free days (Founder / referral)
  chosen_categories TEXT[] NOT NULL DEFAULT '{}',
  categories_chosen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,          -- sha256 of the cookie token; raw token never stored
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  text_en TEXT NOT NULL DEFAULT '',
  text_ta TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS error_log (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  retries INTEGER NOT NULL DEFAULT 0,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the platform kill switch + guardrails (safe defaults)
INSERT INTO settings (key, value) VALUES
  ('platform', '{"killSwitch": false, "platformFeePercent": 0}'::jsonb),
  ('guardrails', '{"dailyBudgetCapInr": null, "requireApprovalAboveInr": null, "autopilotPublish": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
