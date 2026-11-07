-- ViralAI by FARFAZ — migration 0005: team workspaces, partners & earnings, owner audit

CREATE TABLE IF NOT EXISTS workspaces (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',         -- admin | editor | approver | viewer (server-enforced)
  department TEXT NOT NULL DEFAULT '',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS workspace_invites (
  id BIGSERIAL PRIMARY KEY,
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | accepted | declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, invited_user_id)
);

CREATE TABLE IF NOT EXISTS approval_events (
  id BIGSERIAL PRIMARY KEY,
  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  item_kind TEXT NOT NULL,                     -- campaign | creative
  item_id BIGINT NOT NULL,
  actor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,                        -- submit | approve | request_changes | assign
  comment TEXT NOT NULL DEFAULT '',
  assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approvals_ws ON approval_events(workspace_id, created_at DESC);

-- item workflow state lives on the item rows themselves
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'draft';
  -- draft | in_review | approved | changes_requested
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_ws
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE creatives ADD CONSTRAINT fk_creatives_ws
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE stores ADD CONSTRAINT fk_stores_ws
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE media ADD CONSTRAINT fk_media_ws
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS item_comments (
  id BIGSERIAL PRIMARY KEY,
  workspace_id BIGINT REFERENCES workspaces(id) ON DELETE CASCADE,
  item_kind TEXT NOT NULL,
  item_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_item ON item_comments(item_kind, item_id, created_at);

-- Partner programmes: all REGISTERED until the owner actually joins one.
CREATE TABLE IF NOT EXISTS partners (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,                      -- platforms | networks | affiliates | sponsorship
  status TEXT NOT NULL DEFAULT 'registered',   -- registered | joined
  how_money_flows_en TEXT NOT NULL DEFAULT '',
  how_money_flows_ta TEXT NOT NULL DEFAULT '',
  owner_step_en TEXT NOT NULL DEFAULT '',
  owner_step_ta TEXT NOT NULL DEFAULT '',
  typical_terms_en TEXT NOT NULL DEFAULT '',   -- always labelled "not a promise" in the UI
  typical_terms_ta TEXT NOT NULL DEFAULT '',
  tracked_link TEXT NOT NULL DEFAULT '',       -- owner-editable, https only, empty until set
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_events (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,                          -- click | signup
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, user_id, kind)           -- dedupe: one signup counted once per user
);
CREATE INDEX IF NOT EXISTS idx_partner_events ON partner_events(partner_id, kind);

CREATE TABLE IF NOT EXISTS owner_audit_log (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON owner_audit_log(created_at DESC);

-- Connected-platform registry (honest statuses; nothing is connected at launch)
CREATE TABLE IF NOT EXISTS api_connections (
  key TEXT PRIMARY KEY,                        -- meta | google | whatsapp | google_signin
  status TEXT NOT NULL DEFAULT 'registered',   -- registered | connected
  note_en TEXT NOT NULL DEFAULT '',
  note_ta TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO api_connections (key, status, note_en, note_ta) VALUES
  ('meta', 'registered', 'Not connected. Real ads run only from the owner''s own Meta account, after he connects it and approves spend.', 'இணைக்கப்படவில்லை.'),
  ('google', 'registered', 'Not connected. Real ads run only from the owner''s own Google Ads account, after he connects it and approves spend.', 'இணைக்கப்படவில்லை.'),
  ('whatsapp', 'registered', 'Not connected. WhatsApp sending uses the owner''s own WhatsApp Business account once connected.', 'இணைக்கப்படவில்லை.'),
  ('google_signin', 'registered', 'Google sign-in is being connected by the owner. Until then, email + password sign-in works. The app never asks for a Google password — real Google sign-in happens on Google''s own page.', 'Google உள்நுழைவு இணைக்கப்படுகிறது.')
ON CONFLICT (key) DO NOTHING;
