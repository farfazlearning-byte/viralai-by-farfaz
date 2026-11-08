import { handler, ok } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/store-dashboard — everything the My Store Dashboard shows, from
 *  real stored rows only: my stores + products (with photo URLs), orders
 *  received (buyer details — visible ONLY to that order's seller, who is
 *  the caller here), sales totals grouped by status, my delivery-partner
 *  work, and store enquiries received/sent.
 *
 *  The enquiries table arrives with migration 0008; until it has been run,
 *  `enquiriesReady` is false and the UI says so honestly instead of
 *  erroring. */
export const GET = handler(async () => {
  const user = await requireUser();

  const stores = await q(`SELECT * FROM stores WHERE user_id=$1 ORDER BY created_at DESC`, [user.id]);
  const ids = stores.map((s) => (s as { id: number }).id);
  const products = ids.length
    ? await q(
        `SELECT p.*, m.blob_url AS photo_url FROM products p
           LEFT JOIN media m ON m.id = p.photo_media_id
          WHERE p.store_id = ANY($1) ORDER BY p.created_at DESC`,
        [ids],
      )
    : [];

  const orders = await q(
    `SELECT o.*, s.name AS store_name FROM orders o JOIN stores s ON s.id = o.store_id
      WHERE o.seller_id = $1 ORDER BY o.created_at DESC LIMIT 200`,
    [user.id],
  );
  const totals = await q(
    `SELECT currency, status, COUNT(*)::int AS n, COALESCE(SUM(total_minor), 0)::text AS total_minor
       FROM orders WHERE seller_id = $1 GROUP BY currency, status ORDER BY currency, status`,
    [user.id],
  );

  const partner = await q1<{ id: number; name: string; city: string; suspended: boolean }>(
    `SELECT id, name, city, suspended FROM delivery_partners WHERE user_id=$1`,
    [user.id],
  );
  let deliveries: unknown[] = [];
  let deliveryStats = { completed: 0, feesEarnedMinor: 0 };
  if (partner) {
    deliveries = await q(
      `SELECT o.*, s.name AS store_name FROM orders o JOIN stores s ON s.id = o.store_id
        WHERE o.delivery_partner_id = $1 ORDER BY o.created_at DESC LIMIT 100`,
      [partner.id],
    );
    const st = await q1<{ done: string; fees: string }>(
      `SELECT COUNT(*)::text AS done, COALESCE(SUM(delivery_fee_minor),0)::text AS fees
         FROM orders WHERE delivery_partner_id=$1 AND status='delivered'`,
      [partner.id],
    );
    deliveryStats = { completed: Number(st?.done ?? 0), feesEarnedMinor: Number(st?.fees ?? 0) };
  }

  let enquiriesReceived: unknown[] = [];
  let enquiriesSent: unknown[] = [];
  let enquiriesReady = true;
  try {
    enquiriesReceived = await q(
      `SELECT e.*, s.name AS store_name, u.name AS buyer_name
         FROM store_enquiries e
         JOIN stores s ON s.id = e.store_id
         JOIN users u ON u.id = e.buyer_id
        WHERE e.seller_id = $1 ORDER BY e.created_at DESC LIMIT 100`,
      [user.id],
    );
    enquiriesSent = await q(
      `SELECT e.*, s.name AS store_name
         FROM store_enquiries e JOIN stores s ON s.id = e.store_id
        WHERE e.buyer_id = $1 ORDER BY e.created_at DESC LIMIT 100`,
      [user.id],
    );
  } catch {
    enquiriesReady = false;
  }

  return ok({
    stores,
    products,
    orders,
    totals,
    partner,
    deliveries,
    deliveryStats,
    enquiriesReceived,
    enquiriesSent,
    enquiriesReady,
  });
});
