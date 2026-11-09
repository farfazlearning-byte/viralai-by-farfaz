-- 0011_social.sql — Social Pack for the Community Feed (Phase 2).
-- Idempotent: safe to run more than once. The app also self-initialises
-- these tables on first API use (src/lib/community.ts), so applying this
-- file by hand is optional. All counts (comments, followers, saves,
-- story views) are COUNT(*) over these real rows — nothing is simulated.

CREATE TABLE IF NOT EXISTS community_comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS community_follows (
  follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT community_follows_no_self CHECK (follower_id <> followee_id)
);
CREATE INDEX IF NOT EXISTS idx_community_follows_followee ON community_follows(followee_id);

CREATE TABLE IF NOT EXISTS community_saves (
  post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_stories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creative_id BIGINT REFERENCES creatives(id) ON DELETE SET NULL,
  media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_stories_one_source CHECK (creative_id IS NOT NULL OR media_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_community_stories_created ON community_stories(created_at DESC);

CREATE TABLE IF NOT EXISTS community_story_views (
  story_id BIGINT NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_reports (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status, created_at DESC);
