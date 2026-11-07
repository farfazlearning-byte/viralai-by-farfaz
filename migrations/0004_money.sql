-- ViralAI by FARFAZ — migration 0004: payments, country routes, donations, grants, tiers

CREATE TABLE IF NOT EXISTS payment_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  monthly_price_minor BIGINT,                  -- NULL until the owner sets it (never invented)
  yearly_price_minor BIGINT,
  currency TEXT NOT NULL DEFAULT 'INR',
  upi_address TEXT NOT NULL DEFAULT 'nisa-trading@ptyes',  -- owner-supplied India receiving address
  upi_payee TEXT NOT NULL DEFAULT 'NISA TRADING',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Per-country payment registry. India = UPI QR (LIVE). Canada + rest of world = wire route
-- whose fields are filled ONLY by the owner in Owner Control. NO bank detail is seeded here.
CREATE TABLE IF NOT EXISTS country_payments (
  country TEXT PRIMARY KEY,
  currency TEXT NOT NULL DEFAULT '',
  route TEXT NOT NULL DEFAULT 'wire',          -- upi_qr | wire
  status TEXT NOT NULL DEFAULT 'details_pending', -- live | details_pending
  wire_bank_name TEXT NOT NULL DEFAULT '',
  wire_swift TEXT NOT NULL DEFAULT '',
  wire_holder_name TEXT NOT NULL DEFAULT '',
  wire_account_number TEXT NOT NULL DEFAULT '',
  wire_clearing_code TEXT NOT NULL DEFAULT '',
  wire_reference_note TEXT NOT NULL DEFAULT '',
  join_open BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO country_payments (country, currency, route, status) VALUES
  ('India',  'INR', 'upi_qr', 'live'),
  ('Canada', 'CAD', 'wire',   'details_pending')
ON CONFLICT (country) DO NOTHING;

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,                          -- monthly | yearly
  amount_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  method TEXT NOT NULL DEFAULT 'upi',          -- upi | wire
  country TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | approved | rejected
  client_key TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_client_key
  ON payments(user_id, client_key) WHERE client_key <> '';

-- Approved paid premium time (stacks; position engine reads this)
CREATE TABLE IF NOT EXISTS premium_periods (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,                        -- payment | grant
  level TEXT NOT NULL,                         -- basic | high
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
  grant_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_periods_user ON premium_periods(user_id, ends_at DESC);

CREATE TABLE IF NOT EXISTS premium_grants (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,                         -- basic | high
  days INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',               -- owner-only private note
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,                        -- set when the owner ends/revokes early
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grants_user ON premium_grants(user_id, created_at DESC);
ALTER TABLE premium_periods ADD CONSTRAINT fk_periods_grant
  FOREIGN KEY (grant_id) REFERENCES premium_grants(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS donations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,  -- NULL for owner manual-adds of non-members
  donor_name TEXT NOT NULL DEFAULT '',
  anonymous BOOLEAN NOT NULL DEFAULT false,
  amount_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | confirmed | rejected
  source TEXT NOT NULL DEFAULT 'in_app',       -- in_app | owner_added
  wall_opt_in BOOLEAN NOT NULL DEFAULT false,  -- forced false server-side when anonymous
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status, created_at DESC);

-- Counts each time a donation QR is generated in-app. Labelled honestly in the UI
-- as "QR shown in app" — a bare UPI QR scanned outside the app cannot be detected.
CREATE TABLE IF NOT EXISTS donation_qr_views (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  amount_minor BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
