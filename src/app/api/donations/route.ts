import { handler, ok, bad, body, str, num } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { currentUser, requireOwner } from "@/lib/auth";
import { upiPayload, qrSvg } from "@/lib/qr";

export const dynamic = "force-dynamic";

/** GET /api/donations — public: the support QR flow + confirmed-only thank-you
 *  wall. Totals here are the OWNER board's; the public wall shows names only
 *  for confirmed donors who opted in (never anonymous donors). */
export const GET = handler(async (req: Request) => {
  const amount = Math.max(0, Math.round(num(new URL(req.url).searchParams.get("amount")) * 100));
  const s = await q1<{ upi_address: string; upi_payee: string }>(`SELECT upi_address, upi_payee FROM payment_settings WHERE id=1`);
  let svg: string | null = null;
  let payload: string | null = null;
  if (s?.upi_address && amount > 0) {
    payload = upiPayload(s.upi_address, s.upi_payee, amount / 100, "Support ViralAI development");
    svg = await qrSvg(payload);
    // Count each in-app QR generation honestly as "QR shown in app".
    const me = await currentUser();
    await q(`INSERT INTO donation_qr_views (user_id, amount_minor) VALUES ($1,$2)`, [me?.id ?? null, amount]);
  }
  const wall = await q(
    `SELECT donor_name, amount_minor, created_at FROM donations
      WHERE status='confirmed' AND wall_opt_in=true AND anonymous=false
      ORDER BY created_at DESC LIMIT 50`);
  return ok({ svg, payload, upi: s?.upi_address ?? "", payee: s?.upi_payee ?? "", wall });
});

/** POST {action: record | board | decide | manualAdd} */
export const POST = handler(async (req: Request) => {
  const b = await body(req);
  const action = str(b.action, 30);

  if (action === "record") {
    const me = await currentUser();
    const amount = Math.round(num(b.amountMajor) * 100);
    if (amount <= 0) return bad("Enter the amount you donated. / நீங்கள் கொடுத்த தொகையை உள்ளிடுங்கள்.", 400);
    const anonymous = b.anonymous === true;
    const donorName = anonymous ? "Anonymous" : str(b.donorName, 120) || me?.name || "Supporter";
    await q(
      `INSERT INTO donations (user_id, donor_name, anonymous, amount_minor, status, source, wall_opt_in)
       VALUES ($1,$2,$3,$4,'pending','in_app',$5)`,
      [me?.id ?? null, donorName, anonymous, amount, anonymous ? false : b.wallOptIn === true],
    );
    return ok({});
  }

  await requireOwner();

  if (action === "board") {
    const rows = await q(`SELECT * FROM donations ORDER BY created_at DESC LIMIT 200`);
    const t = await q1<{ confirmed_count: string; confirmed_total: string; pending_count: string; today_count: string; today_total: string; total_total: string; qr_views: string }>(
      `SELECT
        (SELECT COUNT(*)::text FROM donations WHERE status='confirmed') AS confirmed_count,
        (SELECT COALESCE(SUM(amount_minor),0)::text FROM donations WHERE status='confirmed') AS confirmed_total,
        (SELECT COUNT(*)::text FROM donations WHERE status='pending') AS pending_count,
        (SELECT COUNT(*)::text FROM donations WHERE status='confirmed' AND created_at >= date_trunc('day', now())) AS today_count,
        (SELECT COALESCE(SUM(amount_minor),0)::text FROM donations WHERE status='confirmed' AND created_at >= date_trunc('day', now())) AS today_total,
        (SELECT COALESCE(SUM(amount_minor),0)::text FROM donations WHERE status='confirmed') AS total_total,
        (SELECT COUNT(*)::text FROM donation_qr_views) AS qr_views`);
    return ok({
      donations: rows,
      totals: {
        confirmedCount: Number(t?.confirmed_count ?? 0),
        confirmedTotalMinor: Number(t?.confirmed_total ?? 0),
        pendingCount: Number(t?.pending_count ?? 0),
        todayCount: Number(t?.today_count ?? 0),
        todayTotalMinor: Number(t?.today_total ?? 0),
        allTimeTotalMinor: Number(t?.total_total ?? 0),
        qrViews: Number(t?.qr_views ?? 0),
      },
    });
  }
  if (action === "decide") {
    // The Owner Control page sends {confirm: true|false}; accept that field
    // as well as {approve: ...}. Reading only `approve` turned every
    // "Confirm" tap into a rejection.
    const approve = b.approve === true || b.confirm === true;
    await q(`UPDATE donations SET status=$2, decided_at=now() WHERE id=$1 AND status='pending'`, [Number(b.id), approve ? "confirmed" : "rejected"]);
    return ok({});
  }
  if (action === "manualAdd") {
    const amount = Math.round(num(b.amountMajor) * 100);
    if (amount <= 0) return bad("Enter the amount.", 400);
    await q(
      `INSERT INTO donations (user_id, donor_name, anonymous, amount_minor, status, source, wall_opt_in, decided_at)
       VALUES (NULL,$1,false,$2,'confirmed','owner_added',false,now())`,
      [str(b.donorName, 120) || "Direct supporter", amount],
    );
    return ok({});
  }
  return bad("Unknown action", 400);
});
