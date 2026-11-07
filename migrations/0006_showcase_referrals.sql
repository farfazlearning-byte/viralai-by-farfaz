-- ViralAI by FARFAZ — migration 0006: house-ad showcase, referral activations

CREATE TABLE IF NOT EXISTS house_ads (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL DEFAULT '',
  title_ta TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  body_ta TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',              -- honesty badge: LIVE | DEMO | PROPOSAL | PRACTICE | REGISTERED
  how_made_en TEXT NOT NULL DEFAULT '',        -- "how this ad was made" teaching note
  how_made_ta TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral activation: recorded once, when the invitee creates their FIRST
-- self-created, non-sample campaign. The sharer is credited at that moment.
CREATE TABLE IF NOT EXISTS referral_activations (
  id BIGSERIAL PRIMARY KEY,
  invitee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  sharer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ref_act_sharer ON referral_activations(sharer_id);
