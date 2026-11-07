import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth";
import { designById } from "@/lib/designs";
import { getPosition } from "@/lib/position";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const user = await requireUser();
  // Resolve the placed media's real Blob URL + kind server-side, so a saved
  // creative always plays back exactly what was placed (the hosted edition
  // lost the media on save — here the join makes that impossible to hide).
  const rows = await q(
    `SELECT c.id, c.campaign_id, c.design_key, c.title, c.headline, c.body, c.language,
            c.media_id, c.logo_media_id, c.audio_media_id, c.workflow_status, c.created_at, c.data,
            m.blob_url AS media_url, m.kind AS media_kind,
            lm.blob_url AS logo_url, am.blob_url AS audio_url
       FROM creatives c
       LEFT JOIN media m ON m.id = c.media_id AND m.user_id = c.user_id
       LEFT JOIN media lm ON lm.id = c.logo_media_id AND lm.user_id = c.user_id
       LEFT JOIN media am ON am.id = c.audio_media_id AND am.user_id = c.user_id
      WHERE c.user_id=$1 ORDER BY c.created_at DESC LIMIT 200`,
    [user.id],
  );
  return ok({ creatives: rows });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);

  if (action === "create") {
    const designKey = str(b.designKey, 160);
    const design = designKey ? designById(designKey) : undefined;
    // Server-side Premium gate: saving a premium design requires active Premium.
    if (design?.premium) {
      const pos = await getPosition(user);
      if (pos.tier === "free") {
        return bad("This is a Premium design — preview is free, but saving needs Premium. / இது Premium design — முன்னோட்டம் இலவசம், சேமிக்க Premium தேவை.", 402);
      }
    }
    const campaignId = b.campaignId ? Number(b.campaignId) : null;
    if (campaignId) {
      const own = await q1<{ id: number }>(`SELECT id FROM campaigns WHERE id=$1 AND user_id=$2`, [campaignId, user.id]);
      if (!own) return bad("Campaign not found", 404);
      // Attaching a premium design to a campaign is gated the same way.
      if (design?.premium) {
        const pos = await getPosition(user);
        if (pos.tier === "free") return bad("Premium design — Premium required to attach. / Premium design — இணைக்க Premium தேவை.", 402);
      }
    }
    const rows = await q<{ id: number }>(
      `INSERT INTO creatives (user_id, campaign_id, design_key, title, headline, body, language, media_id, logo_media_id, audio_media_id, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        user.id, campaignId, designKey, str(b.title, 200), str(b.headline, 300), str(b.bodyText, 1000),
        str(b.language, 8) === "ta" ? "ta" : "en",
        b.mediaId ? Number(b.mediaId) : null, b.logoMediaId ? Number(b.logoMediaId) : null, b.audioMediaId ? Number(b.audioMediaId) : null,
        JSON.stringify({ business: str(b.business, 120), offer: str(b.offer, 200) }),
      ],
    );
    await logActivity(user.id, "creative_create", str(b.title, 80));
    return ok({ id: rows[0].id });
  }
  if (action === "delete") {
    await q(`DELETE FROM creatives WHERE id=$1 AND user_id=$2`, [Number(b.id), user.id]);
    return ok({});
  }
  return bad("Unknown action", 400);
});
