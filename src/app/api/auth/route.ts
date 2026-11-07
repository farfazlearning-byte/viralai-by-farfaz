import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, currentUser, logActivity } from "@/lib/auth";
import { getPosition } from "@/lib/position";
import { ensureSeeds } from "@/lib/seed";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

function inviteCode(userCount: number): string {
  return `VIRAL-${userCount + 1}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/** POST /api/auth {action: signup|signin|signout}. Sign-up: owner bootstrap —
 *  the FIRST account ever created becomes Owner and Founder #1. Founders
 *  (first 1,000 accounts) get 90 free Premium days; a valid invite code adds
 *  the referred member's 14 free days. */
export const POST = handler(async (req: Request) => {
  const b = await body(req);
  const action = str(b.action, 20);
  await ensureSeeds();

  if (action === "signout") {
    await destroySession();
    return ok({});
  }

  if (action === "signin") {
    const email = str(b.email, 200).toLowerCase();
    const password = str(b.password, 200);
    const user = await q1<{ id: number; password_hash: string; suspended: boolean }>(
      `SELECT id, password_hash, suspended FROM users WHERE email = $1`,
      [email],
    );
    if (!user || !verifyPassword(password, user.password_hash)) {
      return bad("Email or password is wrong. / மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு.", 401);
    }
    if (user.suspended) {
      return bad("This account is suspended. Please contact the owner. / இந்தக் கணக்கு இடைநிறுத்தப்பட்டுள்ளது.", 403);
    }
    await createSession(user.id, b.keepSignedIn !== false);
    await logActivity(user.id, "signin", "");
    const me = await currentUser();
    return ok({ user: me, position: me ? await getPosition(me) : null });
  }

  if (action === "signup") {
    const name = str(b.name, 120);
    const email = str(b.email, 200).toLowerCase();
    const password = str(b.password, 200);
    const country = str(b.country, 80);
    const city = str(b.city, 80);
    const ref = str(b.ref, 40).toUpperCase();
    if (!name || !email || !email.includes("@") || password.length < 6) {
      return bad("Name, a valid email and a password of 6+ characters are required. / பெயர், சரியான மின்னஞ்சல் மற்றும் 6+ எழுத்துக் கடவுச்சொல் தேவை.", 400);
    }
    const existing = await q1<{ id: number }>(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing) return bad("An account with this email already exists — sign in instead. / இந்த மின்னஞ்சலில் கணக்கு ஏற்கனவே உள்ளது — உள்நுழையுங்கள்.", 409);

    const countRow = await q1<{ n: string }>(`SELECT COUNT(*)::text AS n FROM users`);
    const total = parseInt(countRow?.n ?? "0", 10);
    const isOwner = total === 0;
    const founderNumber = total < 1000 ? total + 1 : null;
    let referredBy: number | null = null;
    if (ref) {
      const sharer = await q1<{ id: number }>(`SELECT id FROM users WHERE invite_code = $1`, [ref]);
      if (sharer) referredBy = sharer.id;
    }
    const freeDays = (founderNumber ? 90 : 0) + (referredBy ? 14 : 0);
    const freeUntil = freeDays > 0 ? new Date(Date.now() + freeDays * 86400_000).toISOString() : null;
    const rows = await q<{ id: number }>(
      `INSERT INTO users (name, email, password_hash, country, city, is_owner, founder_number, invite_code, referred_by, premium_free_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [name, email, hashPassword(password), country, city, isOwner, founderNumber, inviteCode(total), referredBy, freeUntil],
    );
    const userId = rows[0].id;
    const samples: Array<[string, string]> = [
      ["Sample — Festival Offer (SAMPLE)", "sales"],
      ["Sample — New Arrival (SAMPLE)", "awareness"],
      ["Sample — Store Opening (SAMPLE)", "traffic"],
      ["Sample — Weekend Sale (SAMPLE)", "sales"],
      ["Sample — Service Intro (SAMPLE)", "leads"],
      ["Sample — Thank-You Post (SAMPLE)", "engagement"],
    ];
    for (const [n, obj] of samples) {
      await q(
        `INSERT INTO campaigns (user_id, name, objective, status, is_sample, self_created) VALUES ($1,$2,$3,'draft',true,false)`,
        [userId, n, obj],
      );
    }
    await createSession(userId, b.keepSignedIn !== false);
    await logActivity(userId, "signup", isOwner ? "owner bootstrap" : founderNumber ? `founder #${founderNumber}` : "");
    const me = await currentUser();
    return ok({ user: me, position: me ? await getPosition(me) : null, founderNumber, freeDays });
  }

  return bad("Unknown action", 400);
});
