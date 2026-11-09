-- 0010: Community Feed — members publish their own creatives / My Media
-- videos to a shared feed; other members like, share (with their OWN
-- invite code) and, when the owner of the design allows it, reuse it.
-- All counts come from real stored rows — there are no seeded or
-- simulated engagement numbers anywhere in this feature.
-- Idempotent: safe to re-run. The API also self-initialises these tables
-- on first use (see src/lib/community.ts), so this file is the record of
-- the schema, not a required manual step.
CREATE TABLE IF NOT EXISTS community_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creative_id BIGINT REFERENCES creatives(id) ON DELETE SET NULL,
  media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  allow_reuse BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_posts_one_source CHECK (creative_id IS NOT NULL OR media_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_likes (
  post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_shares (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_shares_post ON community_shares(post_id);
