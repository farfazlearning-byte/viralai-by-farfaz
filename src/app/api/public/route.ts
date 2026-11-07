import { handler, ok } from "@/lib/api";
import { q } from "@/lib/db";
import { ensureSeeds } from "@/lib/seed";
import { COUNTRIES } from "@/lib/registry";
import { dbReady } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/public — signed-out-safe data for the landing page and Explore:
 *  labels-only world board, connection statuses, counts of REAL records.
 *  No member details are ever exposed here. */
export const GET = handler(async () => {
  if (!dbReady()) return ok({ ready: false, cells: [], connections: [] });
  await ensureSeeds();
  const cells = [];
  for (const c of COUNTRIES) {
    const m = await q<{ n: string }>(
      `SELECT (SELECT COUNT(*) FROM users WHERE country=$1) + (SELECT COUNT(*) FROM stores WHERE country=$1) AS n`, [c.en]).catch(() => [{ n: "0" }]);
    const cp = await q(`SELECT route, status FROM country_payments WHERE country=$1`, [c.en]).catch(() => []);
    const row = (cp[0] ?? {}) as { route?: string; status?: string };
    cells.push({ code: c.code, country: c.en, countryTa: c.ta, activity: Number(m[0]?.n ?? 0), paymentRoute: row.route ?? "wire", paymentStatus: row.status ?? "details_pending" });
  }
  const connections = await q(`SELECT key, status, note_en, note_ta FROM api_connections ORDER BY key`);
  const totals = await q(
    `SELECT (SELECT COUNT(*)::int FROM users) AS users, (SELECT COUNT(*)::int FROM stores) AS stores, (SELECT COUNT(*)::int FROM campaigns) AS campaigns`,
  ).catch(() => [{ users: 0, stores: 0, campaigns: 0 }]);
  return ok({ ready: true, cells, connections, totals: totals[0] });
});
