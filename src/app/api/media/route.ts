import { handler, ok, bad, body, str } from "@/lib/api";
import { q } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth";
import { storeMedia, blobReady } from "@/lib/blob";

export const dynamic = "force-dynamic";

const LIMITS: Record<string, number> = { image: 5, logo: 5, audio: 10, video: 25 }; // MB

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await q(
    `SELECT id, kind, name, blob_url, content_type, size_bytes, created_at FROM media WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200`,
    [user.id],
  );
  return ok({ media: rows, blobReady: blobReady(), limitsMb: LIMITS });
});

/** POST {kind, name, rightsConfirmed, dataBase64, contentType} */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const kind = str(b.kind, 10);
  if (!LIMITS[kind]) return bad("Unknown media kind", 400);
  if (b.rightsConfirmed !== true) {
    return bad("Please confirm you have the rights to use this file. / இந்தக் கோப்பைப் பயன்படுத்த உங்களுக்கு உரிமை உள்ளது என்பதை உறுதிப்படுத்துங்கள்.", 400);
  }
  const dataBase64 = typeof b.dataBase64 === "string" ? b.dataBase64 : "";
  const buf = Buffer.from(dataBase64, "base64");
  const maxBytes = LIMITS[kind] * 1024 * 1024;
  if (buf.length === 0) return bad("Empty file", 400);
  if (buf.length > maxBytes) return bad(`File is too large — the limit for ${kind} is ${LIMITS[kind]} MB.`, 413);
  if (!blobReady()) {
    return bad("Media storage is being set up (Blob token not configured yet). Text designs work fully meanwhile. / Media சேமிப்பு அமைக்கப்படுகிறது.", 503);
  }
  const name = str(b.name, 120) || `${kind}-upload`;
  const stored = await storeMedia(user.id, name, buf, str(b.contentType, 80) || "application/octet-stream");
  const rows = await q<{ id: number }>(
    `INSERT INTO media (user_id, kind, name, blob_url, content_type, size_bytes, rights_confirmed)
     VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
    [user.id, kind, name, stored.url, str(b.contentType, 80), buf.length],
  );
  await logActivity(user.id, "media_upload", `${kind}:${name}`);
  return ok({ id: rows[0].id, url: stored.url });
});

export const DELETE = handler(async (req: Request) => {
  const user = await requireUser();
  const id = Number(new URL(req.url).searchParams.get("id"));
  await q(`DELETE FROM media WHERE id=$1 AND user_id=$2`, [id, user.id]);
  return ok({});
});
