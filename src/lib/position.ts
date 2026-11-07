import { q, q1 } from "./db";
import type { SessionUser } from "./auth";

export type Tier = "free" | "basic" | "high";

export interface Position {
  tier: Tier;
  viaFreeDays: boolean;
  viaGrant: boolean;
  premiumFreeUntil: string | null;
  founderNumber: number | null;
  isOwner: boolean;
  sourceLabel: "PAID" | "OWNER-GIFTED" | "SYSTEM-FREE" | "FREE" | "OWNER";
}

/** Compute the member's position from REAL records only: approved premium
 *  periods (stacked; monthly=basic 30d, yearly=high 365d), active owner
 *  grants, and free Premium days. Never from printed claims. */
export async function getPosition(user: SessionUser): Promise<Position> {
  const u = await q1<{ premium_free_until: string | null }>(
    `SELECT premium_free_until FROM users WHERE id = $1`,
    [user.id],
  );
  const freeUntilMs = u?.premium_free_until ? new Date(u.premium_free_until).getTime() : 0;
  const periods = await q<{ level: string; ends_at: string; source: string }>(
    `SELECT level, ends_at, source FROM premium_periods
      WHERE user_id = $1 AND ends_at > now() ORDER BY ends_at DESC`,
    [user.id],
  );
  const grants = await q<{ level: string; ends_at: string }>(
    `SELECT level, ends_at FROM premium_grants
      WHERE user_id = $1 AND ended_at IS NULL AND ends_at > now() ORDER BY ends_at DESC`,
    [user.id],
  );
  let tier: Tier = "free";
  let sourceLabel: Position["sourceLabel"] = "FREE";
  const rank = (t: Tier) => (t === "high" ? 2 : t === "basic" ? 1 : 0);
  const raise = (t: Tier, label: Position["sourceLabel"]) => {
    if (rank(t) > rank(tier)) {
      tier = t;
      sourceLabel = label;
    }
  };
  for (const p of periods) {
    raise(p.level === "high" ? "high" : "basic", p.source === "grant" ? "OWNER-GIFTED" : "PAID");
  }
  let viaGrant = false;
  for (const g of grants) {
    viaGrant = true;
    raise(g.level === "high" ? "high" : "basic", "OWNER-GIFTED");
  }
  const viaFreeDays = freeUntilMs > Date.now() && tier === "free";
  if (viaFreeDays) {
    tier = "basic"; // active free Premium days act at Premium level
    sourceLabel = "SYSTEM-FREE";
  }
  if (user.is_owner) {
    tier = "high";
    sourceLabel = "OWNER";
  }
  return {
    tier,
    viaFreeDays,
    viaGrant,
    premiumFreeUntil: u?.premium_free_until ?? null,
    founderNumber: user.founder_number,
    isOwner: user.is_owner,
    sourceLabel,
  };
}

const DAY = 86400_000;

/** Extend free Premium days (Founders / referral / activation). */
export async function addFreeDays(userId: number, days: number): Promise<void> {
  const u = await q1<{ premium_free_until: string | null }>(
    `SELECT premium_free_until FROM users WHERE id = $1`,
    [userId],
  );
  const base = Math.max(Date.now(), u?.premium_free_until ? new Date(u.premium_free_until).getTime() : 0);
  const until = new Date(base + days * DAY);
  await q(`UPDATE users SET premium_free_until = $2 WHERE id = $1`, [userId, until.toISOString()]);
}

/** Create a paid premium period starting at the latest existing end (stacking). */
export async function addPremiumPeriod(
  userId: number,
  level: "basic" | "high",
  days: number,
  source: "payment" | "grant",
  paymentId?: number,
  grantId?: number,
): Promise<void> {
  const latest = await q1<{ ends_at: string }>(
    `SELECT ends_at FROM premium_periods WHERE user_id = $1 AND ends_at > now() ORDER BY ends_at DESC LIMIT 1`,
    [userId],
  );
  const starts = latest ? new Date(latest.ends_at) : new Date();
  const ends = new Date(starts.getTime() + days * DAY);
  await q(
    `INSERT INTO premium_periods (user_id, source, level, starts_at, ends_at, payment_id, grant_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [userId, source, level, starts.toISOString(), ends.toISOString(), paymentId ?? null, grantId ?? null],
  );
}
