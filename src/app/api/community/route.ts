import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, requestOrigin, logActivity } from "@/lib/auth";
import { ensureCommunityTables } from "@/lib/community";

export const dynamic = "force-dynamic";

// Community Feed. Members publish THEIR OWN saved creatives or THEIR OWN
// My Media videos; ownership is verified server-side on every publish.
// Likes are one-per-account (PRIMARY KEY (post_id, user_id)) and toggle.
// Shares are recorded as real rows and the share copy always carries the
// SHARER's own invite code — never the poster's, never a shared code.
// All counts are COUNT(*) over real rows; nothing is simulated.

const NOT_READY = "Community is being set up — please try again in a little while. / சமூகப் பகுதி அமைக்கப்படுகிறது — சிறிது நேரம் கழித்து மீண்டும் முயற்சியுங்கள்.";

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
  liked_by_me: boolean;
}

async function feedRows(userId: number): Promise<FeedRow[]> {
  return q<FeedRow>(
    `SELECT p.id, p.user_id, u.name AS poster_name, u.founder_number AS poster_founder,
            p.title, p.caption, p.allow_reuse, p.created_at,
            p.creative_id, c.design_key, c.headline, c.body AS creative_body,
            c.data->>'business' AS business, c.data->>'offer' AS offer,
            cm.blob_url AS creative_media_url, cm.kind AS creative_media_kind,
            p.media_id, m.blob_url AS media_url, m.kind AS media_kind,
            (SELECT COUNT(*)::int FROM community_likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*)::int FROM community_shares s WHERE s.post_id = p.id) AS share_count,
            EXISTS(SELECT 1 FROM community_likes lm WHERE lm.post_id = p.id AND lm.user_id = $1) AS liked_by_me
       FROM community_posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN creatives c ON c.id = p.creative_id
       LEFT JOIN media cm ON cm.id = c.media_id AND cm.user_id = c.user_id
       LEFT JOIN media m ON m.id = p.media_id
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 100`,
    [userId],
  );
}

export const GET = handler(async () => {
  const user = await requireUser();
  if (!(await ensureCommunityTables())) return ok({ ready: false, posts: [] });
  const posts = await feedRows(user.id);
  return ok({ ready: true, posts });
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
    const post = await q1<{ id: number }>(`SELECT id FROM community_posts WHERE id=$1`, [postId]);
    if (!post) return bad("That post no longer exists. / அந்தப் பதிவு இனி இல்லை.", 404);
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
    const count = await q1<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM community_likes WHERE post_id=$1`,
      [postId],
    );
    return ok({ liked, likeCount: count?.n ?? 0 });
  }

  if (action === "share") {
    const postId = Number(b.postId);
    const post = await q1<{ id: number; title: string }>(
      `SELECT id, title FROM community_posts WHERE id=$1`,
      [postId],
    );
    if (!post) return bad("That post no longer exists. / அந்தப் பதிவு இனி இல்லை.", 404);
    await q(`INSERT INTO community_shares (post_id, user_id) VALUES ($1,$2)`, [postId, user.id]);
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

  return bad("Unknown action", 400);
});
