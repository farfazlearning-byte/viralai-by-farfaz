import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, requireOwner } from "@/lib/auth";
import { upiPayload, qrSvg } from "@/lib/qr";
import { addPremiumPeriod } from "@/lib/position";

export const dynamic = "force-dynamic";

interface Settings { monthly: number | null; yearly: number | null; currency: string; upi: string; payee: string }

async function settings(): Promise<Settings> {
  const r = await q1<{ monthly_price_minor: number | null; yearly_price_minor: number | null; currency: string; upi_address: string; upi_payee: string }>(
    `SELECT monthly_price_minor, yearly_price_minor, currency, upi_address, upi_payee FROM payment_settings WHERE id=1`);
  return { monthly: r?.monthly_price_minor ?? null, yearly: r?.yearly_price_minor ?? null, currency: r?.currency ?? "INR", upi: r?.upi_address ?? "", payee: r?.upi_payee ?? "" };
}

/** GET /api/payments — plans with owner-set prices, per-country routes,
 *  ready QR payloads/SVGs per plan, and the caller's own payments. Wire
 *  details are shown only when the owner has filled them and only the fields
 *  needed to send a transfer; nothing is ever pre-filled by the app. */
export const GET = handler(async () => {
  const user = await requireUser();
  const s = await settings();
  const countries = await q(`SELECT * FROM country_payments ORDER BY country`);
  const mine = await q(`SELECT id, plan, amount_minor, currency, method, country, status, created_at FROM payments WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [user.id]);
  const plans: Record<string, { priceMinor: number | null; payload: string | null; svg: string | null }> = {};
  for (const [plan, price] of [["monthly", s.monthly], ["yearly", s.yearly]] as const) {
    if (price && s.upi) {
      const payload = upiPayload(s.upi, s.payee, price / 100, `ViralAI ${plan}`);
      plans[plan] = { priceMinor: price, payload, svg: await qrSvg(payload) };
    } else {
      plans[plan] = { priceMinor: price, payload: null, svg: null };
    }
  }
  return ok({ plans, currency: s.currency, upi: s.upi, payee: s.payee, countries, mine });
});

/** POST {action: pay | setPrices | setUpi | setCountry | decide} */
export const POST = handler(async (req: Request) => {
  const b = await body(req);
  const action = str(b.action, 30);

  if (action === "setPrices" || action === "setUpi" || action === "setCountry" || action === "decide") {
    await requireOwner();
  } else {
    await requireUser();
  }
  const user = await requireUser();

  if (action === "pay") {
    const plan = str(b.plan, 20);
    if (!["monthly", "yearly"].includes(plan)) return bad("Bad plan", 400);
    const method = str(b.method, 10) === "wire" ? "wire" : "upi";
    const country = str(b.country, 80);
    const clientKey = str(b.clientKey, 80);
    const s = await settings();
    let amount: number | null = plan === "monthly" ? s.monthly : s.yearly;
    let currency = s.currency;
    if (method === "wire") {
      const cp = await q1<{ status: string; currency: string; wire_account_number: string }>(
        `SELECT status, currency, wire_account_number FROM country_payments WHERE country=$1`, [country]);
      if (!cp) return bad("Country route not found", 404);
      if (cp.status !== "live" || !cp.wire_account_number) {
        return bad("Wire details are being added by the owner — payments for this country open once they are set. / உரிமையாளர் விவரங்கள் சேர்க்கிறார் — அமைந்ததும் இந்த நாட்டுக்குப் பணம் திறக்கும்.", 409);
      }
      currency = cp.currency || currency;
      amount = null; // per-country price is owner-set in that currency; the member enters the plan price shown for their country
      const entered = Number(b.amountMinor);
      if (!entered || entered <= 0) return bad("Enter the amount you sent. / நீங்கள் அனுப்பிய தொகையை உள்ளிடுங்கள்.", 400);
      amount = Math.round(entered);
    }
    if (!amount || amount <= 0) return bad("Payments open soon — the owner is setting the prices. / பணம் விரைவில் திறக்கும் — உரிமையாளர் விலைகளை அமைக்கிறார்.", 409);
    const rows = await q<{ id: number; status: string }>(
      `INSERT INTO payments (user_id, plan, amount_minor, currency, method, country, client_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id, client_key) WHERE client_key <> '' DO NOTHING RETURNING id, status`,
      [user.id, plan, amount, currency, method, country, clientKey],
    );
    if (!rows.length && clientKey) {
      const existing = await q1<{ id: number; status: string }>(`SELECT id, status FROM payments WHERE user_id=$1 AND client_key=$2`, [user.id, clientKey]);
      return ok({ payment: existing, duplicate: true });
    }
    return ok({ payment: rows[0] });
  }

  if (action === "setPrices") {
    const monthly = b.monthlyMinor === null ? null : Math.max(0, Math.round(Number(b.monthlyMinor) || 0)) || null;
    const yearly = b.yearlyMinor === null ? null : Math.max(0, Math.round(Number(b.yearlyMinor) || 0)) || null;
    await q(`UPDATE payment_settings SET monthly_price_minor=$1, yearly_price_minor=$2, updated_at=now() WHERE id=1`, [monthly, yearly]);
    return ok({});
  }
  if (action === "setUpi") {
    const upi = str(b.upi, 120);
    const payee = str(b.payee, 120);
    if (!upi.includes("@")) return bad("That does not look like a UPI address.", 400);
    await q(`UPDATE payment_settings SET upi_address=$1, upi_payee=$2, updated_at=now() WHERE id=1`, [upi, payee]);
    return ok({});
  }
  if (action === "setCountry") {
    const country = str(b.country, 80);
    const fields = ["wire_bank_name", "wire_swift", "wire_holder_name", "wire_account_number", "wire_clearing_code", "wire_reference_note"] as const;
    const vals = fields.map((f) => str((b as Record<string, unknown>)[f], 200));
    const status = vals[3] ? "live" : "details_pending"; // live only once the account number field is filled by the owner
    await q(
      `UPDATE country_payments SET wire_bank_name=$2, wire_swift=$3, wire_holder_name=$4, wire_account_number=$5, wire_clearing_code=$6, wire_reference_note=$7, status=$8, updated_at=now() WHERE country=$1`,
      [country, ...vals, status],
    );
    return ok({ status });
  }
  if (action === "decide") {
    const id = Number(b.id);
    const approve = b.approve === true;
    const payment = await q1<{ id: number; user_id: number; plan: string; status: string }>(
      `SELECT id, user_id, plan, status FROM payments WHERE id=$1`, [id]);
    if (!payment) return bad("Payment not found", 404);
    if (payment.status !== "pending") return bad("Already decided", 409);
    await q(`UPDATE payments SET status=$2, decided_at=now(), decided_by=$3 WHERE id=$1`, [id, approve ? "approved" : "rejected", user.id]);
    if (approve) {
      // Monthly = Basic 30 days; Yearly = High 365 days — stacked.
      await addPremiumPeriod(payment.user_id, payment.plan === "yearly" ? "high" : "basic", payment.plan === "yearly" ? 365 : 30, "payment", payment.id);
    }
    return ok({});
  }
  return bad("Unknown action", 400);
});
