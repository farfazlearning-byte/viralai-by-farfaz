import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireOwner, logActivity } from "@/lib/auth";
import { getPosition, addPremiumPeriod } from "@/lib/position";
import { platformSettings, setPlatformSettings } from "@/lib/guard";
import { dbReady } from "@/lib/db";
import { blobReady } from "@/lib/blob";
import { COUNTRIES } from "@/lib/registry";

export const dynamic = "force-dynamic";

async function audit(ownerId: number, action: string, targetUserId: number | null, detail: string) {
  await q(`INSERT INTO owner_audit_log (owner_id, action, target_user_id, detail) VALUES ($1,$2,$3,$4)`,
    [ownerId, action, targetUserId, detail.slice(0, 400)]);
}

/** GET /api/owner?board=members|exceptions|health|map|audit|connections|payments
 *  Every board is computed from real stored rows. */
export const GET = handler(async (req: Request) => {
  const owner = await requireOwner();
  const board = new URL(req.url).searchParams.get("board") ?? "members";

  if (board === "members") {
    const users = await q(`SELECT id, name, email, country, city, is_owner, founder_number, suspended, created_at FROM users ORDER BY created_at`);
    const members = [];
    for (const u of users as Array<{ id: number }>) {
      const full = await q1<{ id: number; name: string; email: string; country: string; city: string; is_owner: boolean; founder_number: number | null; suspended: boolean }>(
        `SELECT id, name, email, country, city, is_owner, founder_number, suspended FROM users WHERE id=$1`, [u.id]);
      if (!full) continue;
      const pos = await getPosition({ ...owner, id: full.id, is_owner: full.is_owner, founder_number: full.founder_number } as never);
      members.push({ ...full, position: pos });
    }
    return ok({ members });
  }

  if (board === "payments") {
    const pending = await q(
      `SELECT p.*, u.name AS user_name, u.email AS user_email FROM payments p JOIN users u ON u.id=p.user_id
        WHERE p.status='pending' ORDER BY p.created_at`);
    const decided = await q(
      `SELECT p.*, u.name AS user_name FROM payments p JOIN users u ON u.id=p.user_id
        WHERE p.status<>'pending' ORDER BY p.decided_at DESC NULLS LAST LIMIT 50`);
    const totals = await q1<{ approved_total: string; approved_count: string }>(
      `SELECT COALESCE(SUM(amount_minor),0)::text AS approved_total, COUNT(*)::text AS approved_count FROM payments WHERE status='approved'`);
    return ok({ pending, decided, totals: { approvedTotalMinor: Number(totals?.approved_total ?? 0), approvedCount: Number(totals?.approved_count ?? 0) } });
  }

  if (board === "exceptions") {
    const counts = await q1<{ pending_payments: string; pending_donations: string; unresolved_errors: string; store_reports: string; partner_reports: string; suspended_members: string }>(
      `SELECT
        (SELECT COUNT(*)::text FROM payments WHERE status='pending') AS pending_payments,
        (SELECT COUNT(*)::text FROM donations WHERE status='pending') AS pending_donations,
        (SELECT COUNT(*)::text FROM error_log WHERE resolved=false) AS unresolved_errors,
        (SELECT COUNT(*)::text FROM store_reports) AS store_reports,
        (SELECT COUNT(*)::text FROM delivery_partner_reports) AS partner_reports,
        (SELECT COUNT(*)::text FROM users WHERE suspended=true) AS suspended_members`);
    const errors = await q(`SELECT * FROM error_log ORDER BY created_at DESC LIMIT 50`);
    return ok({ counts: {
      pendingPayments: Number(counts?.pending_payments ?? 0),
      pendingDonations: Number(counts?.pending_donations ?? 0),
      unresolvedErrors: Number(counts?.unresolved_errors ?? 0),
      storeReports: Number(counts?.store_reports ?? 0),
      partnerReports: Number(counts?.partner_reports ?? 0),
      suspendedMembers: Number(counts?.suspended_members ?? 0),
    }, errors });
  }

  if (board === "health") {
    const checks: Array<{ name: string; ok: boolean; note: string }> = [];
    checks.push({ name: "Database connection", ok: dbReady(), note: dbReady() ? "DATABASE_URL is configured" : "DATABASE_URL missing" });
    try {
      const t = await q1<{ n: string }>(`SELECT COUNT(*)::text AS n FROM users`);
      checks.push({ name: "Users table readable", ok: true, note: `${t?.n ?? 0} accounts` });
    } catch (e) {
      checks.push({ name: "Users table readable", ok: false, note: e instanceof Error ? e.message : "error" });
    }
    checks.push({ name: "Media storage (Vercel Blob)", ok: blobReady(), note: blobReady() ? "Blob token configured" : "Blob token not configured — uploads paused, everything else works" });
    checks.push({ name: "Backup", ok: false, note: "Not available on this host — Neon keeps point-in-time history on paid tiers; export data regularly." });
    const errCount = await q1<{ n: string }>(`SELECT COUNT(*)::text AS n FROM error_log WHERE resolved=false`).catch(() => null);
    checks.push({ name: "Unresolved errors", ok: Number(errCount?.n ?? 0) === 0, note: `${errCount?.n ?? "?"} unresolved` });
    return ok({ checks, platform: await platformSettings() });
  }

  if (board === "map") {
    const cells = [];
    for (const c of COUNTRIES) {
      const m = await q1<{ members: string; stores_n: string; orders_n: string }>(
        `SELECT (SELECT COUNT(*)::text FROM users WHERE country=$1) AS members,
                (SELECT COUNT(*)::text FROM stores WHERE country=$1) AS stores_n,
                (SELECT COUNT(*)::text FROM orders o JOIN stores s ON s.id=o.store_id WHERE s.country=$1) AS orders_n`,
        [c.en]);
      const cp = await q1<{ route: string; status: string }>(`SELECT route, status FROM country_payments WHERE country=$1`, [c.en]);
      cells.push({ code: c.code, country: c.en, countryTa: c.ta, currency: c.currency, members: Number(m?.members ?? 0), stores: Number(m?.stores_n ?? 0), orders: Number(m?.orders_n ?? 0), paymentRoute: cp?.route ?? "wire", paymentStatus: cp?.status ?? "details_pending", joinOpen: true });
    }
    return ok({ cells });
  }

  if (board === "audit") {
    const rows = await q(`SELECT * FROM owner_audit_log ORDER BY created_at DESC LIMIT 100`);
    return ok({ audit: rows });
  }

  if (board === "connections") {
    const rows = await q(`SELECT * FROM api_connections ORDER BY key`);
    return ok({ connections: rows });
  }

  if (board === "houseads") {
    const rows = await q(`SELECT id, slug, title_en, title_ta, enabled, sort FROM house_ads ORDER BY sort ASC, id ASC`);
    return ok({ houseAds: rows });
  }

  if (board === "guardrails") {
    const settings = (await q1<{ value: { monthlyCapMinor?: number; dailyCapMinor?: number; autoPublish?: boolean; notes?: string } }>(
      `SELECT value FROM settings WHERE key='guardrails'`))?.value ?? {};
    return ok({ guardrails: settings });
  }

  return bad("Unknown board", 400);
});

/** POST {action: grant|endGrant|suspend|reactivate|killSwitch|platformFee|retryError|resolveError} */
export const POST = handler(async (req: Request) => {
  const owner = await requireOwner();
  const b = await body(req);
  const action = str(b.action, 30);
  const targetId = Number(b.userId);

  if (action === "grant") {
    const level = str(b.level, 10) === "high" ? "high" : "basic";
    const preset = str(b.preset, 20);
    const days = preset === "1m" ? 30 : preset === "3m" ? 90 : preset === "6m" ? 180 : preset === "1y" ? 365 : Math.max(1, Math.floor(Number(b.customDays) || 0));
    if (!days) return bad("Choose a duration.", 400);
    const note = str(b.note, 300);
    const starts = new Date();
    const ends = new Date(Date.now() + days * 86400_000);
    const g = await q<{ id: number }>(
      `INSERT INTO premium_grants (user_id, granted_by, level, days, note, starts_at, ends_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [targetId, owner.id, level, days, note, starts.toISOString(), ends.toISOString()]);
    await addPremiumPeriod(targetId, level, days, "grant", undefined, g[0].id);
    await audit(owner.id, "grant", targetId, `${level} × ${days}d`);
    await logActivity(owner.id, "owner_grant", `${targetId}:${level}:${days}`);
    return ok({ grantId: g[0].id });
  }
  if (action === "endGrant") {
    const grantId = Number(b.grantId);
    const g = await q1<{ user_id: number }>(`SELECT user_id FROM premium_grants WHERE id=$1`, [grantId]);
    await q(`UPDATE premium_grants SET ended_at=now() WHERE id=$1 AND ended_at IS NULL`, [grantId]);
    await q(`UPDATE premium_periods SET ends_at=now() WHERE grant_id=$1 AND ends_at > now()`, [grantId]);
    await audit(owner.id, "end_grant", g?.user_id ?? null, `grant ${grantId}`);
    return ok({});
  }
  if (action === "suspend" || action === "reactivate") {
    if (targetId === owner.id) return bad("The owner account cannot be suspended.", 400);
    await q(`UPDATE users SET suspended=$2 WHERE id=$1`, [targetId, action === "suspend"]);
    if (action === "suspend") await q(`DELETE FROM sessions WHERE user_id=$1`, [targetId]);
    await audit(owner.id, action, targetId, "");
    return ok({});
  }
  if (action === "killSwitch") {
    await setPlatformSettings({ killSwitch: b.on === true });
    await audit(owner.id, b.on === true ? "kill_switch_on" : "kill_switch_off", null, "");
    return ok({});
  }
  if (action === "platformFee") {
    const pct = Math.max(0, Math.min(30, Number(b.percent) || 0));
    await setPlatformSettings({ platformFeePercent: pct });
    await audit(owner.id, "platform_fee", null, `${pct}%`);
    return ok({});
  }
  if (action === "guardrails") {
    const patch = {
      monthlyCapMinor: Math.max(0, Math.floor(Number(b.monthlyCapMinor) || 0)),
      dailyCapMinor: Math.max(0, Math.floor(Number(b.dailyCapMinor) || 0)),
      autoPublish: false, // autopilot never publishes — this can never be switched on
      notes: str(b.notes, 300),
    };
    await q(`INSERT INTO settings (key, value) VALUES ('guardrails', $1::jsonb)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [JSON.stringify(patch)]);
    await audit(owner.id, "guardrails", null, `monthly ${patch.monthlyCapMinor} daily ${patch.dailyCapMinor}`);
    return ok({ guardrails: patch });
  }
  if (action === "retryError") {
    await q(`UPDATE error_log SET retries=retries+1 WHERE id=$1`, [Number(b.errorId)]);
    return ok({});
  }
  if (action === "resolveError") {
    await q(`UPDATE error_log SET resolved=true WHERE id=$1`, [Number(b.errorId)]);
    return ok({});
  }
  return bad("Unknown action", 400);
});
