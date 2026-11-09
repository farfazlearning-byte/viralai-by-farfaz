import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, requestOrigin, logActivity, notify } from "@/lib/auth";
import { ensureCommunityTables } from "@/lib/community";

export const dynamic = "force-dynamic";

// Community Feed + Social Pack. Members publish THEIR OWN saved creatives
// or THEIR OWN My Media videos; ownership is verified server-side on every
// publish. Likes are one-per-account (PRIMARY KEY (post_id, user_id)) and
// toggle. Shares are recorded as real rows and the share copy always
// carries the SHARER's own invite code — never the poster's, never a
// shared code. Comments, follows, saves, stories (24h, expiry enforced in
// SQL), story views and reports are all real stored rows; every count is
// COUNT(*) over those rows — nothing is simulated. Like/comment/follow/
// share events create IN-APP notifications for the other member (the app
// never sends email or push).

const NOT_READY = "Community is being set up — please try again in a little while. / சமூகப் பகுதி அமைக்கப்படுகிறது — சிறிது நேரம் கழித்து மீண்டும் முயற்சியுங்கள்.";
const POST_GONE = "That post no longer exists. / அந்தப் பதிவு இனி இல்லை.";

interface FeedRow {
  id: number;
  user_id: number;
  poster_name: string;
  poster_founder: number | null;
  title: string;
  caption: string;
  allow_reuse: boolean;
  created_at: string;
  creative_id: number | null;
  design_key: string | null;
  headline: string | null;
  creative_body: string | null;
  business: string | null;
  offer: string | null;
  creative_media_url: string | null;
  creative_media_kind: string | null;
  media_id: number | null;
  media_url: string | null;
  media_kind: string | null;
  like_count: number;
  share_count: number;
  comment_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  following_poster: boolean;
  tags?: string[];
}

interface StoryRow {
  id: number;
  user_id: number;
  poster_name: string;
  poster_founder: number | null;
  created_at: string;
  creative_id: number | null;
  design_key: string | null;
  headline: string | null;
  business: string | null;
  offer: string | null;
  creative_media_url: string | null;
  creative_media_kind: string | null;
  media_id: number | null;
  media_url: string | null;
  media_kind: string | null;
  view_count: number;
  viewed_by_me: boolean;
}

/** #hashtags parsed from real caption/title text (letters, numbers, _). */
function tagsOf(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/#([\p{L}\p{N}_]{1,40})/gu)) out.add(m[1]);
  return [...out];
}

interface FeedOpts { view?: string; search?: string; tag?: string; authorId?: number }

async function feedRows(userId: number, opts: FeedOpts = {}): Promise<FeedRow[]> {
  const conds: string[] = [];
  const params: unknown[] = [userId];
  if (opts.view === "following") {
    conds.push(`p.user_id IN (SELECT followee_id FROM community_follows WHERE follower_id = $1)`);
  }
  if (opts.view === "saved") {
    conds.push(`EXISTS(SELECT 1 FROM community_saves sv WHERE sv.post_id = p.id AND sv.user_id = $1)`);
  }
  if (opts.authorId) {
    params.push(opts.authorId);
    conds.push(`p.user_id = $${params.length}`);
  }
  if (opts.search) {
    params.push(`%${opts.search}%`);
    conds.push(`(p.title ILIKE $${params.length} OR p.caption ILIKE $${params.length})`);
  }
  if (opts.tag) {
    params.push(`%#${opts.tag}%`);
    conds.push(`(p.title ILIKE $${params.length} OR p.caption ILIKE $${params.length})`);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  let rows = await q<FeedRow>(
    `SELECT p.id, p.user_id, u.name AS poster_name, u.founder_number AS poster_founder,
            p.title, p.caption, p.allow_reuse, p.created_at,
            p.creative_id, c.design_key, c.headline, c.body AS creative_body,
            c.data->>'business' AS business, c.data->>'offer' AS offer,
            cm.blob_url AS creative_media_url, cm.kind AS creative_media_kind,
            p.media_id, m.blob_url AS media_url, m.kind AS media_kind,
            (SELECT COUNT(*)::int FROM community_likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*)::int FROM community_shares s WHERE s.post_id = p.id) AS share_count,
            (SELECT COUNT(*)::int FROM community_comments cc WHERE cc.post_id = p.id) AS comment_count,
            EXISTS(SELECT 1 FROM community_likes lm WHERE lm.post_id = p.id AND lm.user_id = $1) AS liked_by_me,
            EXISTS(SELECT 1 FROM community_saves sv WHERE sv.post_id = p.id AND sv.user_id = $1) AS saved_by_me,
            EXISTS(SELECT 1 FROM community_follows f WHERE f.follower_id = $1 AND f.followee_id = p.user_id) AS following_poster
       FROM community_posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN creatives c ON c.id = p.creative_id
       LEFT JOIN media cm ON cm.id = c.media_id AND cm.user_id = c.user_id
       LEFT JOIN media m ON m.id = p.media_id
      ${where}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 100`,
    params,
  );
  if (opts.tag) {
    const want = opts.tag.toLowerCase();
    rows = rows.filter((r) => tagsOf(`${r.title} ${r.caption}`).some((t) => t.toLowerCase() === want));
  }
  for (const r of rows) r.tags = tagsOf(`${r.title} ${r.caption}`);
  return rows;
}

async function storyRows(userId: number): Promise<StoryRow[]> {
  // Expiry is enforced here in SQL: a story older than 24 hours is never
  // returned, so it can never be shown.
  return q<StoryRow>(
    `SELECT s.id, s.user_id, u.name AS poster_name, u.founder_number AS poster_founder,
            s.created_at,
            s.creative_id, c.design_key, c.headline,
            c.data->>'business' AS business, c.data->>'offer' AS offer,
            cm.blob_url AS creative_media_url, cm.kind AS creative_media_kind,
            s.media_id, m.blob_url AS media_url, m.kind AS media_kind,
            (SELECT COUNT(*)::int FROM community_story_views v WHERE v.story_id = s.id) AS view_count,
            EXISTS(SELECT 1 FROM community_story_views vm WHERE vm.story_id = s.id AND vm.user_id = $1) AS viewed_by_me
       FROM community_stories s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN creatives c ON c.id = s.creative_id
       LEFT JOIN media cm ON cm.id = c.media_id AND cm.user_id = c.user_id
       LEFT JOIN media m ON m.id = s.media_id
      WHERE s.created_at > now() - interval '24 hours'
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT 100`,
    [userId],
  );
}

async function commentsFor(postId: number) {
  return q(
    `SELECT c.id, c.post_id, c.user_id, u.name AS author_name,
            u.founder_number AS author_founder, c.body, c.created_at
       FROM community_comments c
       JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC, c.id ASC
      LIMIT 200`,
    [postId],
  );
}

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  if (!(await ensureCommunityTables())) return ok({ ready: false, posts: [] });
  const sp = new URL(req.url).searchParams;

  const commentsPostId = Number(sp.get("comments") ?? 0);
  if (commentsPostId) {
    const post = await q1<{ id: number }>(`SELECT id FROM community_posts WHERE id=$1`, [commentsPostId]);
    if (!post) return bad(POST_GONE, 404);
    return ok({ comments: await commentsFor(commentsPostId) });
  }

  const profileId = Number(sp.get("profile") ?? 0);
  if (profileId) {
    // Public profile: display name + Founder badge + real counts + their
    // published posts. No email, no phone — never selected, never sent.
    const member = await q1<{ id: number; name: string; founder_number: number | null }>(
      `SELECT id, name, founder_number FROM users WHERE id=$1 AND suspended=false`,
      [profileId],
    );
    if (!member) return bad("That member was not found. / அந்த உறுப்பினர் கிடைக்கவில்லை.", 404);
    const counts = await q1<{ followers: number; following: number; is_following: boolean }>(
      `SELECT (SELECT COUNT(*)::int FROM community_follows WHERE followee_id=$1) AS followers,
              (SELECT COUNT(*)::int FROM community_follows WHERE follower_id=$1) AS following,
              EXISTS(SELECT 1 FROM community_follows WHERE follower_id=$2 AND followee_id=$1) AS is_following`,
      [profileId, user.id],
    );
    const posts = await feedRows(user.id, { authorId: profileId });
    return ok({
      member: {
        id: member.id,
        name: member.name,
        founder_number: member.founder_number,
        followers: counts?.followers ?? 0,
        following: counts?.following ?? 0,
        is_following: counts?.is_following ?? false,
        is_me: Number(member.id) === Number(user.id),
      },
      posts,
    });
  }

  const view = sp.get("view") ?? "all";
  const search = (sp.get("search") ?? "").trim().slice(0, 100);
  const tag = (sp.get("tag") ?? "").trim().replace(/^#/, "").slice(0, 40);
  const posts = await feedRows(user.id, { view, search, tag });
  const stories = await storyRows(user.id);
  const out: Record<string, unknown> = { ready: true, posts, stories };
  if (search) {
    out.members = await q(
      `SELECT id, name, founder_number FROM users
        WHERE suspended=false AND name ILIKE $1
        ORDER BY (founder_number IS NULL), founder_number, name
        LIMIT 10`,
      [`%${search}%`],
    );
  }
  return ok(out);
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);
  if (!(await ensureCommunityTables())) return bad(NOT_READY, 503);

  if (action === "publish") {
    const title = str(b.title, 200);
    if (!title) {
      return bad("Please add a title for your post. / உங்கள் பதிவுக்கு ஒரு தலைப்பு போடுங்கள்.", 400);
    }
    const caption = str(b.caption, 1000);
    const allowReuse = b.allowReuse === true;
    const creativeId = b.creativeId ? Number(b.creativeId) : null;
    const mediaId = b.mediaId ? Number(b.mediaId) : null;
    if ((creativeId === null) === (mediaId === null)) {
      return bad("Choose one creative or one video to publish. / வெளியிட ஒரு creative அல்லது ஒரு வீடியோவைத் தேர்ந்தெடுங்கள்.", 400);
    }
    if (creativeId !== null) {
      // Ownership is verified against the caller's own rows — an id that
      // belongs to someone else is rejected here, never published.
      const own = await q1<{ id: number }>(
        `SELECT id FROM creatives WHERE id=$1 AND user_id=$2`,
        [creativeId, user.id],
      );
      if (!own) {
        return bad("That creative was not found in your own library. / அந்த creative உங்கள் சொந்த நூலகத்தில் இல்லை.", 404);
      }
    } else {
      const own = await q1<{ id: number; kind: string }>(
        `SELECT id, kind FROM media WHERE id=$1 AND user_id=$2`,
        [mediaId, user.id],
      );
      if (!own) {
        return bad("That video was not found in your own My Media. / அந்த வீடியோ உங்கள் சொந்த My Media-வில் இல்லை.", 404);
      }
      if (own.kind !== "video") {
        return bad("Only videos from My Media can be published to the feed. / My Media-வில் இருந்து வீடியோக்கள் மட்டுமே ஊட்டத்தில் வெளியிடலாம்.", 400);
      }
    }
    const rows = await q<{ id: number }>(
      `INSERT INTO community_posts (user_id, creative_id, media_id, title, caption, allow_reuse)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [user.id, creativeId, mediaId, title, caption, allowReuse],
    );
    await logActivity(user.id, "community_publish", title);
    const posts = await feedRows(user.id);
    return ok({ id: rows[0].id, posts });
  }

  if (action === "like") {
    const postId = Number(b.postId);
    const post = await q1<{ id: number; user_id: number; title: string }>(
      `SELECT id, user_id, title FROM community_posts WHERE id=$1`, [postId],
    );
    if (!post) return bad(POST_GONE, 404);
    // Toggle: try to remove an existing like first; if there was none,
    // add it. The (post_id, user_id) primary key makes a second like
    // from the same account impossible even under parallel taps.
    const removed = await q<{ post_id: number }>(
      `DELETE FROM community_likes WHERE post_id=$1 AND user_id=$2 RETURNING post_id`,
      [postId, user.id],
    );
    let liked: boolean;
    if (removed.length > 0) {
      liked = false;
    } else {
      const added = await q<{ post_id: number }>(
        `INSERT INTO community_likes (post_id, user_id) VALUES ($1,$2)
         ON CONFLICT DO NOTHING RETURNING post_id`,
        [postId, user.id],
      );
      liked = added.length > 0;
    }
    if (liked && post.user_id !== user.id) {
      await notify(
        post.user_id, "like",
        `${user.name} liked your community post "${post.title}".`,
        `${user.name} உங்கள் சமூகப் பதிவை விரும்பினார்: "${post.title}".`,
        "/app/community",
      );
    }
    const count = await q1<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM community_likes WHERE post_id=$1`,
      [postId],
    );
    return ok({ liked, likeCount: count?.n ?? 0 });
  }

  if (action === "share") {
    const postId = Number(b.postId);
    const post = await q1<{ id: number; user_id: number; title: string }>(
      `SELECT id, user_id, title FROM community_posts WHERE id=$1`,
      [postId],
    );
    if (!post) return bad(POST_GONE, 404);
    await q(`INSERT INTO community_shares (post_id, user_id) VALUES ($1,$2)`, [postId, user.id]);
    if (post.user_id !== user.id) {
      await notify(
        post.user_id, "share",
        `${user.name} shared your community post "${post.title}".`,
        `${user.name} உங்கள் சமூகப் பதிவைப் பகிர்ந்தார்: "${post.title}".`,
        "/app/community",
      );
    }
    const count = await q1<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM community_shares WHERE post_id=$1`,
      [postId],
    );
    // Per-person rule: the copy carries the SHARER's (the caller's) own
    // invite code and link — built from this request's origin.
    const origin = await requestOrigin();
    const link = `${origin}/?ref=${encodeURIComponent(user.invite_code)}`;
    const en = `From the ViralAI by FARFAZ community: "${post.title}" — see what members are making. Join free with my invite link: ${link}`;
    const ta = `ViralAI by FARFAZ சமூகத்திலிருந்து: "${post.title}" — உறுப்பினர்கள் உருவாக்குவதைப் பாருங்கள். என் அழைப்பு இணைப்பில் இலவசமாகச் சேருங்கள்: ${link}`;
    return ok({ shareCount: count?.n ?? 0, link, en, ta });
  }

  if (action === "unpublish") {
    const postId = Number(b.postId);
    const removed = await q<{ id: number }>(
      `DELETE FROM community_posts WHERE id=$1 AND user_id=$2 RETURNING id`,
      [postId, user.id],
    );
    if (removed.length === 0) {
      return bad("Only the member who published a post can remove it. / வெளியிட்ட உறுப்பினர் மட்டுமே அந்தப் பதிவை நீக்க முடியும்.", 403);
    }
    const posts = await feedRows(user.id);
    return ok({ posts });
  }

  if (action === "comment_add") {
    const postId = Number(b.postId);
    const text = str(b.body, 500);
    if (!text) {
      return bad("Write a comment first. / முதலில் ஒரு கருத்தை எழுதுங்கள்.", 400);
    }
    const post = await q1<{ id: number; user_id: number; title: string }>(
      `SELECT id, user_id, title FROM community_posts WHERE id=$1`, [postId],
    );
    if (!post) return bad(POST_GONE, 404);
    await q(`INSERT INTO community_comments (post_id, user_id, body) VALUES ($1,$2,$3)`, [postId, user.id, text]);
    if (post.user_id !== user.id) {
      await notify(
        post.user_id, "comment",
        `${user.name} commented on your post "${post.title}": "${text.slice(0, 80)}"`,
        `${user.name} உங்கள் பதிவில் கருத்து சொன்னார் "${post.title}": "${text.slice(0, 80)}"`,
        "/app/community",
      );
    }
    const comments = await commentsFor(postId);
    return ok({ comments, commentCount: comments.length });
  }

  if (action === "comment_delete") {
    const commentId = Number(b.commentId);
    const row = await q1<{ id: number; post_id: number; user_id: number; post_owner: number }>(
      `SELECT c.id, c.post_id, c.user_id, p.user_id AS post_owner
         FROM community_comments c JOIN community_posts p ON p.id = c.post_id
        WHERE c.id=$1`,
      [commentId],
    );
    if (!row) return bad("That comment no longer exists. / அந்தக் கருத்து இனி இல்லை.", 404);
    // The comment's author OR the post's owner may delete it — nobody else.
    if (row.user_id !== user.id && row.post_owner !== user.id) {
      return bad("Only the comment writer or the post owner can delete this comment. / கருத்து எழுதியவர் அல்லது பதிவின் உரிமையாளர் மட்டுமே இதை நீக்க முடியும்.", 403);
    }
    await q(`DELETE FROM community_comments WHERE id=$1`, [commentId]);
    const comments = await commentsFor(row.post_id);
    return ok({ comments, commentCount: comments.length, postId: row.post_id });
  }

  if (action === "follow") {
    const targetId = Number(b.userId);
    // user.id arrives from Postgres as a string (BIGINT) — compare as
    // numbers or the self-check misses and the table's no-self CHECK
    // turns it into a 500 instead of this plain bilingual 400.
    if (!targetId || targetId === Number(user.id)) {
      return bad("You cannot follow yourself. / நீங்கள் உங்களையே பின்தொடர முடியாது.", 400);
    }
    const target = await q1<{ id: number; name: string }>(
      `SELECT id, name FROM users WHERE id=$1 AND suspended=false`, [targetId],
    );
    if (!target) return bad("That member was not found. / அந்த உறுப்பினர் கிடைக்கவில்லை.", 404);
    const removed = await q<{ follower_id: number }>(
      `DELETE FROM community_follows WHERE follower_id=$1 AND followee_id=$2 RETURNING follower_id`,
      [user.id, targetId],
    );
    let following: boolean;
    if (removed.length > 0) {
      following = false;
    } else {
      const added = await q<{ follower_id: number }>(
        `INSERT INTO community_follows (follower_id, followee_id) VALUES ($1,$2)
         ON CONFLICT DO NOTHING RETURNING follower_id`,
        [user.id, targetId],
      );
      following = added.length > 0;
    }
    if (following) {
      await notify(
        targetId, "follow",
        `${user.name} started following you.`,
        `${user.name} உங்களைப் பின்தொடரத் தொடங்கினார்.`,
        `/app/member?u=${user.id}`,
      );
    }
    const counts = await q1<{ followers: number; following_n: number }>(
      `SELECT (SELECT COUNT(*)::int FROM community_follows WHERE followee_id=$1) AS followers,
              (SELECT COUNT(*)::int FROM community_follows WHERE follower_id=$1) AS following_n`,
      [targetId],
    );
    return ok({ following, followerCount: counts?.followers ?? 0, targetFollowingCount: counts?.following_n ?? 0 });
  }

  if (action === "save") {
    const postId = Number(b.postId);
    const post = await q1<{ id: number }>(`SELECT id FROM community_posts WHERE id=$1`, [postId]);
    if (!post) return bad(POST_GONE, 404);
    const removed = await q<{ post_id: number }>(
      `DELETE FROM community_saves WHERE post_id=$1 AND user_id=$2 RETURNING post_id`,
      [postId, user.id],
    );
    let saved: boolean;
    if (removed.length > 0) {
      saved = false;
    } else {
      const added = await q<{ post_id: number }>(
        `INSERT INTO community_saves (post_id, user_id) VALUES ($1,$2)
         ON CONFLICT DO NOTHING RETURNING post_id`,
        [postId, user.id],
      );
      saved = added.length > 0;
    }
    return ok({ saved });
  }

  if (action === "story_publish") {
    const creativeId = b.creativeId ? Number(b.creativeId) : null;
    const mediaId = b.mediaId ? Number(b.mediaId) : null;
    if ((creativeId === null) === (mediaId === null)) {
      return bad("Choose one creative or one video for your story. / உங்கள் story-க்கு ஒரு creative அல்லது ஒரு வீடியோவைத் தேர்ந்தெடுங்கள்.", 400);
    }
    if (creativeId !== null) {
      const own = await q1<{ id: number }>(
        `SELECT id FROM creatives WHERE id=$1 AND user_id=$2`,
        [creativeId, user.id],
      );
      if (!own) {
        return bad("That creative was not found in your own library. / அந்த creative உங்கள் சொந்த நூலகத்தில் இல்லை.", 404);
      }
    } else {
      const own = await q1<{ id: number; kind: string }>(
        `SELECT id, kind FROM media WHERE id=$1 AND user_id=$2`,
        [mediaId, user.id],
      );
      if (!own) {
        return bad("That video was not found in your own My Media. / அந்த வீடியோ உங்கள் சொந்த My Media-வில் இல்லை.", 404);
      }
      if (own.kind !== "video") {
        return bad("Only videos from My Media can be stories. / My Media-வில் இருந்து வீடியோக்கள் மட்டுமே story ஆகலாம்.", 400);
      }
    }
    await q(
      `INSERT INTO community_stories (user_id, creative_id, media_id) VALUES ($1,$2,$3)`,
      [user.id, creativeId, mediaId],
    );
    await logActivity(user.id, "community_story", "");
    return ok({ stories: await storyRows(user.id) });
  }

  if (action === "story_view") {
    const storyId = Number(b.storyId);
    const story = await q1<{ id: number; user_id: number }>(
      `SELECT id, user_id FROM community_stories
        WHERE id=$1 AND created_at > now() - interval '24 hours'`,
      [storyId],
    );
    if (!story) return bad("That story has expired or no longer exists. / அந்த story காலாவதியானது அல்லது இனி இல்லை.", 404);
    // Views are real rows, one per member; the author's own opening of
    // their story is not counted as a view.
    if (story.user_id !== user.id) {
      await q(
        `INSERT INTO community_story_views (story_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [storyId, user.id],
      );
    }
    const count = await q1<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM community_story_views WHERE story_id=$1`,
      [storyId],
    );
    return ok({ viewCount: count?.n ?? 0 });
  }

  if (action === "report") {
    const postId = Number(b.postId);
    const reason = str(b.reason, 300);
    const post = await q1<{ id: number }>(`SELECT id FROM community_posts WHERE id=$1`, [postId]);
    if (!post) return bad(POST_GONE, 404);
    await q(
      `INSERT INTO community_reports (post_id, user_id, reason) VALUES ($1,$2,$3)`,
      [postId, user.id, reason],
    );
    await logActivity(user.id, "community_report", `post ${postId}`);
    return ok({ reported: true });
  }

  return bad("Unknown action", 400);
});
