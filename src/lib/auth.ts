import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { q, q1 } from "./db";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  country: string;
  city: string;
  is_owner: boolean;
  founder_number: number | null;
  invite_code: string;
  suspended: boolean;
}

const COOKIE = "viralai_session";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number, keepSignedIn = true): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await q(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,$3)`, [
    hashToken(token),
    userId,
    expires.toISOString(),
  ]);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // "Keep me signed in" (default on): a persistent 30-day cookie that
    // survives browser/app close. Off: a browser-session cookie only —
    // it disappears when the browser is closed. The cookie holds only the
    // random session token; the password is never stored anywhere.
    ...(keepSignedIn ? { expires } : {}),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await q(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)]).catch(() => {});
  }
  store.delete(COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const row = await q1<SessionUser & { expires_at: string }>(
    `SELECT u.id, u.name, u.email, u.country, u.city, u.is_owner, u.founder_number,
            u.invite_code, u.suspended, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1`,
    [hashToken(token)],
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  if (row.suspended) return null;
  const { expires_at: _ignored, ...user } = row;
  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.is_owner) throw new Error("OWNER_ONLY");
  return user;
}

/** Public base URL of the current request (used to build invite links). */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function logActivity(userId: number | null, kind: string, detail = ""): Promise<void> {
  await q(`INSERT INTO activity_log (user_id, kind, detail) VALUES ($1,$2,$3)`, [
    userId,
    kind,
    detail.slice(0, 500),
  ]).catch(() => {});
}

export async function notify(
  userId: number,
  kind: string,
  textEn: string,
  textTa: string,
  link = "",
): Promise<void> {
  await q(
    `INSERT INTO notifications (user_id, kind, text_en, text_ta, link) VALUES ($1,$2,$3,$4,$5)`,
    [userId, kind, textEn, textTa, link],
  ).catch(() => {});
}
