import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, requireOwner, logActivity } from "@/lib/auth";
import { ensureSeeds } from "@/lib/seed";
import { OUTREACH_TEMPLATES } from "@/lib/houseAds";

export const dynamic = "force-dynamic";

/** GET /api/partners — all partner programmes with real counters.
 *  Earnings are honestly ₹0 until a programme actually pays (nothing here
 *  invents earnings; joined status is owner-recorded). */
export const GET = handler(async () => {
  const user = await requireUser();
  await ensureSeeds();
  const partners = await q(
    `SELECT p.*, COALESCE(c.clicks,0) AS clicks, COALESCE(s.signups,0) AS signups
       FROM partners p
       LEFT JOIN (SELECT partner_id, COUNT(*)::int AS clicks FROM partner_events WHERE kind='click' GROUP BY partner_id) c ON c.partner_id=p.id
       LEFT JOIN (SELECT partner_id, COUNT(*)::int AS signups FROM partner_events WHERE kind='signup' GROUP BY partner_id) s ON s.partner_id=p.id
      ORDER BY p.id`);
  const joined = partners.filter((p) => (p as { status: string }).status === "joined").length;
  return ok({ partners, templates: OUTREACH_TEMPLATES, earnings: { earnedMinor: 0, partnersJoined: joined, note: "No programme has paid yet — the board shows ₹0 until a real payout is recorded." } });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);
  const partnerId = Number(b.partnerId);
  const partner = await q1<{ id: number; tracked_link: string; status: string }>(`SELECT id, tracked_link, status FROM partners WHERE id=$1`, [partnerId]);
  if (!partner) return bad("Partner not found", 404);

  if (action === "click") {
    if (!partner.tracked_link) return bad("The owner has not added this partner's tracked link yet. / உரிமையாளர் இன்னும் இணைப்பைச் சேர்க்கவில்லை.", 409);
    await q(`INSERT INTO partner_events (partner_id, user_id, kind) VALUES ($1,$2,'click') ON CONFLICT DO NOTHING`, [partnerId, user.id]);
    await logActivity(user.id, "partner_click", String(partnerId));
    return ok({ link: partner.tracked_link });
  }
  if (action === "signup") {
    const rows = await q<{ id: number }>(
      `INSERT INTO partner_events (partner_id, user_id, kind) VALUES ($1,$2,'signup') ON CONFLICT DO NOTHING RETURNING id`,
      [partnerId, user.id]);
    return ok({ alreadyRecorded: rows.length === 0 });
  }
  if (action === "setLink") {
    await requireOwner();
    const link = str(b.link, 500);
    if (link && !link.startsWith("https://")) return bad("Tracked links must start with https://", 400);
    await q(`UPDATE partners SET tracked_link=$2 WHERE id=$1`, [partnerId, link]);
    return ok({});
  }
  if (action === "setStatus") {
    await requireOwner();
    const status = str(b.status, 20) === "joined" ? "joined" : "registered";
    await q(`UPDATE partners SET status=$2 WHERE id=$1`, [partnerId, status]);
    return ok({});
  }
  return bad("Unknown action", 400);
});
