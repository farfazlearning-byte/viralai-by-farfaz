import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, notify } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ItemIn { productId: number; qty: number }

/** GET /api/orders — buyer's orders + seller's store orders. */
export const GET = handler(async () => {
  const user = await requireUser();
  const asBuyer = await q(
    `SELECT o.*, s.name AS store_name, s.payment_link AS store_payment_link
       FROM orders o JOIN stores s ON s.id=o.store_id
      WHERE o.buyer_id=$1 ORDER BY o.created_at DESC LIMIT 200`, [user.id]);
  const asSeller = await q(
    `SELECT o.*, s.name AS store_name FROM orders o JOIN stores s ON s.id=o.store_id
      WHERE o.seller_id=$1 ORDER BY o.created_at DESC LIMIT 200`, [user.id]);
  return ok({ asBuyer, asSeller });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);

  if (action === "place") {
    const storeId = Number(b.storeId);
    const clientKey = str(b.clientKey, 80);
    if (!clientKey) return bad("Missing client key", 400);
    // Duplicate guard: same buyer + client key returns the SAME order.
    const dup = await q1(`SELECT * FROM orders WHERE buyer_id=$1 AND client_key=$2`, [user.id, clientKey]);
    if (dup) return ok({ order: dup, duplicate: true });
    const store = await q1<{ id: number; user_id: number; delivery_fee_minor: number; currency: string; suspended: boolean }>(
      `SELECT id, user_id, delivery_fee_minor, currency, suspended FROM stores WHERE id=$1`, [storeId]);
    if (!store || store.suspended) return bad("Store not available. / கடை கிடைக்கவில்லை.", 404);
    const itemsIn: ItemIn[] = Array.isArray(b.items) ? (b.items as ItemIn[]) : [];
    if (!itemsIn.length) return bad("Your cart is empty. / உங்கள் கூடை காலி.", 400);
    let total = 0;
    const items: Array<{ productId: number; name: string; priceMinor: number; qty: number }> = [];
    for (const it of itemsIn.slice(0, 50)) {
      const p = await q1<{ id: number; name: string; price_minor: number; active: boolean }>(
        `SELECT id, name, price_minor, active FROM products WHERE id=$1 AND store_id=$2`, [Number(it.productId), storeId]);
      if (!p || !p.active) return bad("A product in your cart is no longer available.", 409);
      const qty = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
      total += p.price_minor * qty; // server-recomputed — client totals are never trusted
      items.push({ productId: p.id, name: p.name, priceMinor: p.price_minor, qty });
    }
    const wantsDelivery = b.delivery === true;
    const fee = wantsDelivery ? store.delivery_fee_minor : 0;
    const rows = await q(
      `INSERT INTO orders (store_id, seller_id, buyer_id, client_key, items, total_minor, currency, buyer_name, buyer_phone, buyer_address, pay_method, delivery_fee_minor, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'placed') RETURNING *`,
      [storeId, store.user_id, user.id, clientKey, JSON.stringify(items), total + fee, store.currency,
       str(b.buyerName, 120), str(b.buyerPhone, 40), str(b.buyerAddress, 500), b.payMethod === "link" ? "link" : "cod", fee],
    );
    await notify(store.user_id, "order_placed", `New order at your store — total ${(total + fee) / 100}.`, `உங்கள் கடையில் புதிய order — மொத்தம் ${(total + fee) / 100}.`, "/app/orders");
    return ok({ order: rows[0] });
  }

  const id = Number(b.id);
  const order = await q1<{ id: number; seller_id: number; buyer_id: number; status: string }>(
    `SELECT id, seller_id, buyer_id, status FROM orders WHERE id=$1`, [id]);
  if (!order) return bad("Order not found", 404);
  const isSeller = order.seller_id === user.id;
  const isBuyer = order.buyer_id === user.id;

  if (action === "sellerStatus") {
    if (!isSeller) return bad("Only the store can do this.", 403);
    const status = str(b.status, 30);
    if (!["confirmed", "packed", "shipped", "cancelled"].includes(status)) return bad("Bad status", 400);
    await q(`UPDATE orders SET status=$2, updated_at=now() WHERE id=$1`, [id, status]);
    await notify(order.buyer_id, "order_update", `Your order is now: ${status} (updated by the store — not GPS tracking).`, `உங்கள் order இப்போது: ${status} (கடையால் புதுப்பிக்கப்பட்டது — GPS அல்ல).`, "/app/orders");
    return ok({});
  }
  if (action === "buyerPaid") {
    if (!isBuyer) return bad("Only the buyer can do this.", 403);
    await q(`UPDATE orders SET buyer_marked_paid=true, updated_at=now() WHERE id=$1`, [id]);
    await notify(order.seller_id, "order_paid_mark", "The buyer marked this order as paid — please confirm when the money reaches you.", "வாங்குபவர் பணம் செலுத்தியதாகக் குறித்தார் — பணம் வந்ததும் உறுதிப்படுத்துங்கள்.", "/app/orders");
    return ok({});
  }
  if (action === "sellerConfirmPayment") {
    if (!isSeller) return bad("Only the store can do this.", 403);
    await q(`UPDATE orders SET seller_confirmed_payment=true, updated_at=now() WHERE id=$1`, [id]);
    return ok({});
  }
  if (action === "buyerCancel") {
    if (!isBuyer) return bad("Only the buyer can do this.", 403);
    if (!["placed", "confirmed"].includes(order.status)) return bad("This order can no longer be cancelled by the buyer.", 409);
    await q(`UPDATE orders SET status='cancelled', updated_at=now() WHERE id=$1`, [id]);
    return ok({});
  }
  return bad("Unknown action", 400);
});
