import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, notify } from "@/lib/auth";
import { getPosition } from "@/lib/position";
import { platformSettings } from "@/lib/guard";

export const dynamic = "force-dynamic";

async function myPartner(userId: number) {
  return q1<{ id: number; name: string; city: string; suspended: boolean }>(
    `SELECT id, name, city, suspended FROM delivery_partners WHERE user_id=$1`, [userId]);
}

/** GET /api/delivery — partner profile, available deliveries in my city
 *  (buyer details BLANKED until claim), my claimed deliveries, my stats. */
export const GET = handler(async () => {
  const user = await requireUser();
  const partner = await myPartner(user.id);
  const platform = await platformSettings();
  if (!partner) return ok({ partner: null, platformFeePercent: platform.platformFeePercent ?? 0 });
  const available = await q(
    `SELECT o.id, o.store_id, s.name AS store_name, s.city AS store_city, o.total_minor, o.delivery_fee_minor, o.currency, o.status, o.created_at,
            '' AS buyer_name, '' AS buyer_phone, '' AS buyer_address
       FROM orders o JOIN stores s ON s.id=o.store_id
      WHERE o.delivery_partner_id IS NULL AND o.delivery_fee_minor > 0
        AND o.status IN ('confirmed','packed','shipped')
        AND lower(s.city) = lower($1)
      ORDER BY o.created_at ASC LIMIT 100`,
    [partner.city],
  );
  const mine = await q(
    `SELECT o.*, s.name AS store_name FROM orders o JOIN stores s ON s.id=o.store_id
      WHERE o.delivery_partner_id=$1 ORDER BY o.created_at DESC LIMIT 100`, [partner.id]);
  const stats = await q1<{ done: string; fees: string }>(
    `SELECT COUNT(*)::text AS done, COALESCE(SUM(delivery_fee_minor),0)::text AS fees
       FROM orders WHERE delivery_partner_id=$1 AND status='delivered'`, [partner.id]);
  return ok({
    partner,
    available,
    mine,
    stats: { completed: Number(stats?.done ?? 0), feesEarnedMinor: Number(stats?.fees ?? 0) },
    platformFeePercent: platform.platformFeePercent ?? 0,
  });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);

  if (action === "register") {
    // Delivery claiming requires Basic+ position — enforced here at register too.
    const pos = await getPosition(user);
    if (pos.tier === "free") return bad("Delivery Partner needs a Basic or High position. / Delivery Partner-க்கு Basic அல்லது High நிலை தேவை.", 402);
    const name = str(b.name, 120);
    if (!name) return bad("Name is required", 400);
    const rows = await q<{ id: number }>(
      `INSERT INTO delivery_partners (user_id, name, type, country, city, areas, vehicle, phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city, areas=EXCLUDED.areas, vehicle=EXCLUDED.vehicle, phone=EXCLUDED.phone
       RETURNING id`,
      [user.id, name, str(b.type, 20) === "courier" ? "courier" : "individual", str(b.country, 80) || user.country, str(b.city, 80) || user.city, str(b.areas, 300), str(b.vehicle, 60), str(b.phone, 40)],
    );
    return ok({ id: rows[0].id });
  }

  const partner = await myPartner(user.id);
  if (!partner) return bad("Register as a Delivery Partner first.", 400);
  if (partner.suspended) return bad("This partner account is suspended.", 403);
  const orderId = Number(b.orderId);

  if (action === "claim") {
    // First-claim-wins, enforced atomically server-side.
    const rows = await q<{ id: number; buyer_id: number }>(
      `UPDATE orders SET delivery_partner_id=$2, updated_at=now()
        WHERE id=$1 AND delivery_partner_id IS NULL AND status IN ('confirmed','packed','shipped')
        RETURNING id, buyer_id`,
      [orderId, partner.id],
    );
    if (!rows.length) return bad("This delivery was already claimed by someone else. / இந்த delivery வேறொருவரால் எடுக்கப்பட்டுவிட்டது.", 409);
    await notify(rows[0].buyer_id, "delivery_claimed", `A delivery partner (${partner.name.split(" ")[0]}) has taken your order.`, `Delivery கூட்டாளர் (${partner.name.split(" ")[0]}) உங்கள் order-ஐ எடுத்துள்ளார்.`, "/app/orders");
    const full = await q1(`SELECT * FROM orders WHERE id=$1`, [orderId]);
    return ok({ order: full }); // buyer details revealed only now, to the claimer
  }

  if (action === "step") {
    const step = str(b.step, 30);
    if (!["picked_up", "out_for_delivery", "delivered"].includes(step)) return bad("Bad step", 400);
    const rows = await q<{ id: number; buyer_id: number }>(
      `UPDATE orders SET status=$3, updated_at=now() WHERE id=$1 AND delivery_partner_id=$2 RETURNING id, buyer_id`,
      [orderId, partner.id, step],
    );
    if (!rows.length) return bad("Not your delivery.", 403);
    await notify(rows[0].buyer_id, "delivery_step", `Delivery update: ${step.replace(/_/g, " ")} (updated by your delivery partner).`, `Delivery புதுப்பிப்பு: ${step} (உங்கள் delivery கூட்டாளரால்).`, "/app/orders");
    return ok({});
  }

  if (action === "report") {
    await q(`INSERT INTO delivery_partner_reports (partner_id, reporter_id, reason) VALUES ($1,$2,$3)`,
      [Number(b.partnerId), user.id, str(b.reason, 300)]);
    return ok({});
  }
  return bad("Unknown action", 400);
});
