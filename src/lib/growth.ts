import { q, q1 } from "./db";
import { notify } from "./auth";

/** Referral activation: when an invitee creates their FIRST self-created,
 *  non-sample campaign, record the activation once and credit the sharer:
 *  +7 free days per activation, +1 bonus month per 5 activations, with the
 *  sharer's free-until capped at 12 months from now (rolling cap). */
export async function maybeActivateReferral(inviteeId: number, campaignId: number): Promise<void> {
  const invitee = await q1<{ referred_by: number | null }>(
    `SELECT referred_by FROM users WHERE id = $1`,
    [inviteeId],
  );
  if (!invitee?.referred_by) return;
  const sharerId = invitee.referred_by;
  const inserted = await q<{ id: number }>(
    `INSERT INTO referral_activations (invitee_id, sharer_id, campaign_id)
     VALUES ($1,$2,$3) ON CONFLICT (invitee_id) DO NOTHING RETURNING id`,
    [inviteeId, sharerId, campaignId],
  );
  if (!inserted.length) return; // already activated before
  const countRow = await q1<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM referral_activations WHERE sharer_id = $1`,
    [sharerId],
  );
  const activations = parseInt(countRow?.n ?? "0", 10);
  let days = 7;
  if (activations > 0 && activations % 5 === 0) days += 30; // +1 month per 5
  await addFreeDaysCapped(sharerId, days);
  await notify(
    sharerId,
    "referral_activated",
    `Good news — someone you invited created their first campaign. +${days} free Premium days added.`,
    `நல்ல செய்தி — நீங்கள் அழைத்தவர் தன் முதல் பிரச்சாரத்தை உருவாக்கினார். +${days} இலவச Premium நாட்கள் சேர்க்கப்பட்டது.`,
    "/app/growth",
  );
}

/** addFreeDays with the 12-month rolling cap applied. */
export async function addFreeDaysCapped(userId: number, days: number): Promise<void> {
  const cap = Date.now() + 365 * 86400_000;
  const u = await q1<{ premium_free_until: string | null }>(
    `SELECT premium_free_until FROM users WHERE id = $1`,
    [userId],
  );
  const base = Math.max(Date.now(), u?.premium_free_until ? new Date(u.premium_free_until).getTime() : 0);
  const until = Math.min(base + days * 86400_000, cap);
  await q(`UPDATE users SET premium_free_until = $2 WHERE id = $1`, [userId, new Date(until).toISOString()]);
}

export async function growthStats(userId: number): Promise<{
  inviteCode: string;
  invites: number;
  activations: number;
}> {
  const u = await q1<{ invite_code: string }>(`SELECT invite_code FROM users WHERE id = $1`, [userId]);
  const inv = await q1<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM users WHERE referred_by = $1`,
    [userId],
  );
  const act = await q1<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM referral_activations WHERE sharer_id = $1`,
    [userId],
  );
  return {
    inviteCode: u?.invite_code ?? "",
    invites: parseInt(inv?.n ?? "0", 10),
    activations: parseInt(act?.n ?? "0", 10),
  };
}
