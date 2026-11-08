import { handler, ok, bad, body, str, num } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, logActivity, notify } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/stores — public marketplace list (all live stores + products),
 *  plus the caller's own stores. */
export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";
  const stores = mine
    ? await q(`SELECT * FROM stores WHERE user_id=$1 ORDER BY created_at DESC`, [user.id])
    : await q(`SELECT * FROM stores WHERE suspended=false ORDER BY created_at DESC LIMIT 200`);
  const ids = stores.map((s) => (s as { id: number }).id);
  const products = ids.length
    ? await q(`SELECT p.*, m.blob_url AS photo_url FROM products p LEFT JOIN media m ON m.id=p.photo_media_id WHERE p.store_id = ANY($1) AND p.active=true ORDER BY p.created_at DESC`, [ids])
    : [];
  return ok({ stores, products });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);

  if (action === "createStore") {
    const name = str(b.name, 160);
    if (!name) return bad("Store name is required. / கடையின் பெயர் தேவை.", 400);
    const rows = await q<{ id: number }>(
      `INSERT INTO stores (user_id, name, category, country, city, about_en, about_ta, payment_link, cod_enabled, delivery_fee_minor, currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [user.id, name, str(b.category, 60), str(b.country, 80) || user.country, str(b.city, 80) || user.city,
       str(b.aboutEn, 600), str(b.aboutTa, 600), str(b.paymentLink, 300), b.codEnabled === true,
       Math.round(num(b.deliveryFeeMajor) * 100), str(b.currency, 8) || "INR"],
    );
    await logActivity(user.id, "store_create", name);
    return ok({ id: rows[0].id });
  }

  if (action === "updateStore") {
    const id = Number(b.id);
    const own = await q1(`SELECT id FROM stores WHERE id=$1 AND user_id=$2`, [id, user.id]);
    if (!own) return bad("Store not found", 404);
    await q(
      `UPDATE stores SET name=$3, category=$4, about_en=$5, about_ta=$6, payment_link=$7, cod_enabled=$8, delivery_fee_minor=$9 WHERE id=$1 AND user_id=$2`,
      [id, user.id, str(b.name, 160), str(b.category, 60), str(b.aboutEn, 600), str(b.aboutTa, 600), str(b.paymentLink, 300), b.codEnabled === true, Math.round(num(b.deliveryFeeMajor) * 100)],
    );
    return ok({});
  }

  if (action === "addProduct") {
    const storeId = Number(b.storeId);
    const own = await q1<{ currency: string }>(`SELECT currency FROM stores WHERE id=$1 AND user_id=$2`, [storeId, user.id]);
    if (!own) return bad("Store not found", 404);
    const name = str(b.name, 160);
    if (!name) return bad("Product name is required. / பொருளின் பெயர் தேவை.", 400);
    const rows = await q<{ id: number }>(
      `INSERT INTO products (store_id, user_id, name, price_minor, currency, photo_media_id, scene, description_en, description_ta, stock, in_stock, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [storeId, user.id, name, Math.round(num(b.priceMajor) * 100), own.currency,
       b.photoMediaId ? Number(b.photoMediaId) : null, str(b.scene, 40), str(b.descriptionEn, 600), str(b.descriptionTa, 600),
       Math.max(0, Math.floor(num(b.stock))), b.inStock !== false, str(b.category, 60)],
    );
    return ok({ id: rows[0].id });
  }

  if (action === "updateProduct") {
    const id = Number(b.id);
    await q(
      `UPDATE products SET name=$3, price_minor=$4, description_en=$5, description_ta=$6, stock=$7, in_stock=$8, active=$9 WHERE id=$1 AND user_id=$2`,
      [id, user.id, str(b.name, 160), Math.round(num(b.priceMajor) * 100), str(b.descriptionEn, 600), str(b.descriptionTa, 600), Math.max(0, Math.floor(num(b.stock))), b.inStock !== false, b.active !== false],
    );
    return ok({});
  }

  if (action === "deleteProduct") {
    await q(`DELETE FROM products WHERE id=$1 AND user_id=$2`, [Number(b.id), user.id]);
    return ok({});
  }

  if (action === "contactStore") {
    // Buyer → store contact: a RECORDED enquiry the seller reads in the
    // My Store Dashboard. Not chat, not real-time — labelled so in the UI.
    const storeId = Number(b.storeId);
    const message = str(b.message, 1000);
    if (!message) return bad("Write a message first. / முதலில் ஒரு செய்தி எழுதுங்கள்.", 400);
    const store = await q1<{ id: number; user_id: number; name: string; suspended: boolean }>(
      `SELECT id, user_id, name, suspended FROM stores WHERE id=$1`, [storeId]);
    if (!store || store.suspended) return bad("Store not available. / கடை கிடைக்கவில்லை.", 404);
    if (store.user_id === user.id) return bad("This is your own store. / இது உங்கள் சொந்தக் கடை.", 400);
    try {
      await q(`INSERT INTO store_enquiries (store_id, seller_id, buyer_id, message) VALUES ($1,$2,$3,$4)`,
        [storeId, store.user_id, user.id, message]);
    } catch {
      return bad("Store messages are being set up — please try again soon. / கடைச் செய்திகள் அமைக்கப்படுகிறது — சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.", 503);
    }
    await notify(store.user_id, "store_enquiry",
      `New message for your store "${store.name}" — read it in My Store Dashboard.`,
      `உங்கள் கடை "${store.name}"-க்குப் புதிய செய்தி — என் கடை Dashboard-இல் படியுங்கள்.`,
      "/app/store-dashboard");
    await logActivity(user.id, "store_enquiry", store.name);
    return ok({});
  }

  if (action === "reportStore") {
    await q(`INSERT INTO store_reports (store_id, reporter_id, reason) VALUES ($1,$2,$3)`, [Number(b.storeId), user.id, str(b.reason, 300)]);
    return ok({});
  }
  return bad("Unknown action", 400);
});
