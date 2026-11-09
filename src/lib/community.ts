import { q } from "./db";

// Community Feed tables, self-initialised on first API use — the same
// pattern as the founder counter in src/app/api/auth/route.ts: the schema
// also lives in migrations/0010_community.sql, but no manual migration
// step is required for the feature to work. If the tables cannot be
// created (e.g. database still being set up), the API reports an honest
// "being set up" state instead of crashing.
let ensured: Promise<boolean> | null = null;

export function ensureCommunityTables(): Promise<boolean> {
  if (!ensured) {
    ensured = (async () => {
      try {
        await q(
          `CREATE TABLE IF NOT EXISTS community_posts (
             id BIGSERIAL PRIMARY KEY,
             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             creative_id BIGINT REFERENCES creatives(id) ON DELETE SET NULL,
             media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
             title TEXT NOT NULL DEFAULT '',
             caption TEXT NOT NULL DEFAULT '',
             allow_reuse BOOLEAN NOT NULL DEFAULT false,
             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
             CONSTRAINT community_posts_one_source CHECK (creative_id IS NOT NULL OR media_id IS NOT NULL)
           )`,
        );
        await q(
          `CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC)`,
        );
        await q(
          `CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id, created_at DESC)`,
        );
        await q(
          `CREATE TABLE IF NOT EXISTS community_likes (
             post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
             PRIMARY KEY (post_id, user_id)
           )`,
        );
        await q(
          `CREATE TABLE IF NOT EXISTS community_shares (
             id BIGSERIAL PRIMARY KEY,
             post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             created_at TIMESTAMPTZ NOT NULL DEFAULT now()
           )`,
        );
        await q(
          `CREATE INDEX IF NOT EXISTS idx_community_shares_post ON community_shares(post_id)`,
        );
        // ── Social Pack (Phase 2) — mirrors migrations/0011_social.sql ──
        await q(
          `CREATE TABLE IF NOT EXISTS community_comments (
             id BIGSERIAL PRIMARY KEY,
             post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             body TEXT NOT NULL DEFAULT '',
             created_at TIMESTAMPTZ NOT NULL DEFAULT now()
           )`,
        );
        await q(
          `CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at)`,
        );
        await q(
          `CREATE TABLE IF NOT EXISTS community_follows (
             follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             followee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
             PRIMARY KEY (follower_id, followee_id),
             CONSTRAINT community_follows_no_self CHECK (follower_id <> followee_id)
           )`,
        );
        await q(
          `CREATE INDEX IF NOT EXISTS idx_community_follows_followee ON community_follows(followee_id)`,
        );
        await q(
          `CREATE TABLE IF NOT EXISTS community_saves (
             post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
             PRIMARY KEY (post_id, user_id)
           )`,
        );
        await q(
          `CREATE TABLE IF NOT EXISTS community_stories (
             id BIGSERIAL PRIMARY KEY,
             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             creative_id BIGINT REFERENCES creatives(id) ON DELETE SET NULL,
             media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
             CONSTRAINT community_stories_one_source CHECK (creative_id IS NOT NULL OR media_id IS NOT NULL)
           )`,
        );
        await q(
          `CREATE INDEX IF NOT EXISTS idx_community_stories_created ON community_stories(created_at DESC)`,
        );
        await q(
          `CREATE TABLE IF NOT EXISTS community_story_views (
             story_id BIGINT NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
             PRIMARY KEY (story_id, user_id)
           )`,
        );
        await q(
          `CREATE TABLE IF NOT EXISTS community_reports (
             id BIGSERIAL PRIMARY KEY,
             post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
             user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
             reason TEXT NOT NULL DEFAULT '',
             status TEXT NOT NULL DEFAULT 'open',
             created_at TIMESTAMPTZ NOT NULL DEFAULT now()
           )`,
        );
        await q(
          `CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status, created_at DESC)`,
        );
        return true;
      } catch {
        // Do not cache a failure — the next request retries.
        ensured = null;
        return false;
      }
    })();
  }
  return ensured;
}
