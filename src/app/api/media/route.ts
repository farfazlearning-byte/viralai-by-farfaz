import { handler, ok, bad, body, str } from "@/lib/api";
import { q } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth";
import { storeMedia, blobReady } from "@/lib/blob";

export const dynamic = "force-dynamic";

const LIMITS: Record<string, number> = { image: 5, logo: 5, audio: 10, video: 25 }; // MB

/** The media family a real file belongs to, from its own content type.
 *  The file itself is the source of truth — never the dropdown alone. */
function familyOf(contentType: string): "image" | "audio" | "video" | null {
  const t = contentType.toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("video/")) return "video";
  return null;
}

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await q(
    `SELECT id, kind, name, blob_url, content_type, size_bytes, created_at FROM media WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200`,
    [user.id],
  );
  return ok({ media: rows, blobReady: blobReady(), limitsMb: LIMITS });
});

/** POST {kind, name, rightsConfirmed, dataBase64, contentType}
 *  All error messages are plain bilingual sentences — never raw codes. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  let kind = str(b.kind, 10);
  if (!LIMITS[kind]) {
    return bad("That file type is not supported. Please choose an image, logo, audio or video file. / அந்தக் கோப்பு வகை பயன்படாது. படம், logo, ஒலி அல்லது வீடியோ கோப்பைத் தேர்ந்தெடுங்கள்.", 400);
  }
  if (b.rightsConfirmed !== true) {
    return bad("Please confirm you have the rights to use this file. / இந்தக் கோப்பைப் பயன்படுத்த உங்களுக்கு உரிமை உள்ளது என்பதை உறுதிப்படுத்துங்கள்.", 400);
  }
  const contentType = str(b.contentType, 80) || "application/octet-stream";
  // Auto-detect: if the file's own type disagrees with the chosen kind,
  // the file wins (a logo stays a logo only for real image files).
  const family = familyOf(contentType);
  let kindCorrected = false;
  if (family) {
    if (kind === "logo") {
      if (family !== "image") {
        return bad("A logo must be an image file (JPG, PNG or WebP). Your file was saved as its real type instead — please try again. / Logo ஒரு படக் கோப்பாக இருக்க வேண்டும் (JPG, PNG அல்லது WebP).", 400);
      }
    } else if (family !== kind) {
      kind = family;
      kindCorrected = true;
    }
  }
  const dataBase64 = typeof b.dataBase64 === "string" ? b.dataBase64 : "";
  const buf = Buffer.from(dataBase64, "base64");
  const maxBytes = LIMITS[kind] * 1024 * 1024;
  if (buf.length === 0) {
    return bad("The file arrived empty — please choose it again and retry. / கோப்பு காலியாக வந்துள்ளது — மீண்டும் தேர்ந்தெடுத்து முயற்சியுங்கள்.", 400);
  }
  if (buf.length > maxBytes) {
    return bad(`This file is too large — the limit for ${kind} files is ${LIMITS[kind]} MB. / இந்தக் கோப்பு மிகப் பெரியது — ${kind} கோப்புகளுக்கான வரம்பு ${LIMITS[kind]} MB.`, 413);
  }
  if (!blobReady()) {
    return bad("Media storage is being set up — uploads will open as soon as the owner connects storage. Text designs work fully meanwhile. / Media சேமிப்பு அமைக்கப்படுகிறது — உரிமையாளர் சேமிப்பை இணைத்ததும் பதிவேற்றம் திறக்கும்.", 503);
  }
  const name = str(b.name, 120) || `${kind}-upload`;
  const stored = await storeMedia(user.id, name, buf, contentType);
  const rows = await q<{ id: number }>(
    `INSERT INTO media (user_id, kind, name, blob_url, content_type, size_bytes, rights_confirmed)
     VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
    [user.id, kind, name, stored.url, contentType, buf.length],
  );
  await logActivity(user.id, "media_upload", `${kind}:${name}`);
  return ok({ id: rows[0].id, url: stored.url, kind, kindCorrected });
});

export const DELETE = handler(async (req: Request) => {
  const user = await requireUser();
  const id = Number(new URL(req.url).searchParams.get("id"));
  await q(`DELETE FROM media WHERE id=$1 AND user_id=$2`, [id, user.id]);
  return ok({});
});
