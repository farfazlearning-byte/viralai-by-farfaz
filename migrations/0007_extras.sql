-- ViralAI by FARFAZ — migration 0007: per-user settings, showcase design state

-- Per-user guardrails (own kill switch, safety budget cap, language, categories prompt state)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- Owner-managed state for the 11 rich showcase designs (definitions live in code;
-- only enable/reorder state is stored)
CREATE TABLE IF NOT EXISTS showcase_design_state (
  design_key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed marker so the code-driven seed (partners, house ads, country payment rows)
-- runs exactly once per database.
INSERT INTO settings (key, value) VALUES ('seeds', '{"v1": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
