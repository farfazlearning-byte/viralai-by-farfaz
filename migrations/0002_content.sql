-- ViralAI by FARFAZ — migration 0002: campaigns, creatives, media, guardrails log

CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id BIGINT,                    -- set when owned by a team workspace (0005)
  category TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | active | paused | archived
  budget_minor BIGINT NOT NULL DEFAULT 0, -- guidance only; never a charge
  currency TEXT NOT NULL DEFAULT 'INR',
  is_sample BOOLEAN NOT NULL DEFAULT false,
  self_created BOOLEAN NOT NULL DEFAULT true, -- referral activation counts only self-created, non-sample
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS creatives (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id BIGINT,
  campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
  design_key TEXT NOT NULL DEFAULT '',    -- key into the programmatic design library
  title TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en',    -- en | ta
  media_id BIGINT,                        -- -> media(id), wired in 0003 (no FK to keep order flexible)
  logo_media_id BIGINT,
  audio_media_id BIGINT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creatives_user ON creatives(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS media (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id BIGINT,
  kind TEXT NOT NULL,                     -- image | logo | audio | video
  name TEXT NOT NULL DEFAULT '',
  blob_url TEXT NOT NULL,                 -- Vercel Blob URL (or documented fallback host)
  content_type TEXT NOT NULL DEFAULT '',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  rights_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_user ON media(user_id, created_at DESC);

ALTER TABLE creatives ADD CONSTRAINT fk_creatives_media
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE creatives ADD CONSTRAINT fk_creatives_logo
  FOREIGN KEY (logo_media_id) REFERENCES media(id) ON DELETE SET NULL;
ALTER TABLE creatives ADD CONSTRAINT fk_creatives_audio
  FOREIGN KEY (audio_media_id) REFERENCES media(id) ON DELETE SET NULL;
