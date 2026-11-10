import { head } from "@vercel/blob";
import { q } from "./db";
import { blobToken } from "./blob";

/** head() against the public media store, with a hard time bound: an
 *  unreachable or forged blob URL must fail fast with an honest error,
 *  never hang the request. */
export async function headBlob(
  url: string,
  ms = 8000,
): Promise<Awaited<ReturnType<typeof head>>> {
  return await Promise.race([
    head(url, { token: blobToken() }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("HEAD_TIMEOUT")), ms)),
  ]);
}

// Shared My Media rules — one home for the size limits, the file-family
// auto-detect, the row insert and the upload-token validation, so the
// media API, the client-upload token route and the register route all
// enforce exactly the same rules.

export const MEDIA_LIMITS: Record<string, number> = { image: 5, logo: 5, audio: 10, video: 25 }; // MB

export const MSG_KIND =
  "That file type is not supported. Please choose an image, logo, audio or video file. / அந்தக் கோப்பு வகை பயன்படாது. படம், logo, ஒலி அல்லது வீடியோ கோப்பைத் தேர்ந்தெடுங்கள்.";
export const MSG_RIGHTS =
  "Please confirm you have the rights to use this file. / இந்தக் கோப்பைப் பயன்படுத்த உங்களுக்கு உரிமை உள்ளது என்பதை உறுதிப்படுத்துங்கள்.";
export const MSG_NAME =
  "The file name is missing — please choose the file again. / கோப்பின் பெயர் இல்லை — கோப்பை மீண்டும் தேர்ந்தெடுங்கள்.";
export const MSG_PATH =
  "That upload address is not yours — the file was not saved. / அந்தப் பதிவேற்ற முகவரி உங்களுடையது அல்ல — கோப்பு சேமிக்கப்படவில்லை.";
export const MSG_SETUP =
  "Media storage is being set up — uploads will open as soon as the owner connects storage. Text designs work fully meanwhile. / Media சேமிப்பு அமைக்கப்படுகிறது — உரிமையாளர் சேமிப்பை இணைத்ததும் பதிவேற்றம் திறக்கும்.";
export const MSG_NOT_FOUND =
  "We could not find that uploaded file — please try the upload again. / பதிவேற்றிய கோப்பைக் கண்டுபிடிக்க முடியவில்லை — மீண்டும் பதிவேற்ற முயற்சியுங்கள்.";
export const MSG_LOGO =
  "A logo must be an image file (JPG, PNG or WebP). Your file was saved as its real type instead — please try again. / Logo ஒரு படக் கோப்பாக இருக்க வேண்டும் (JPG, PNG அல்லது WebP).";

export function tooLargeMsg(kind: string): string {
  return `This file is too large — the limit for ${kind} files is ${MEDIA_LIMITS[kind]} MB. / இந்தக் கோப்பு மிகப் பெரியது — ${kind} கோப்புகளுக்கான வரம்பு ${MEDIA_LIMITS[kind]} MB.`;
}

/** The media family a real file belongs to, from its own content type.
 *  The file itself is the source of truth — never the dropdown alone. */
export function familyOf(contentType: string): "image" | "audio" | "video" | null {
  const t = contentType.toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("audio/")) return "audio";
  if (t.startsWith("video/")) return "video";
  return null;
}

/** Apply the family auto-detect rules to a chosen kind: the file wins.
 *  A logo stands only for a real image file; any other mismatch is
 *  corrected to the file's real family. */
export function correctKind(
  kind: string,
  contentType: string,
): { kind: string; kindCorrected: boolean } | { error: string } {
  const family = familyOf(contentType);
  if (!family) return { kind, kindCorrected: false };
  if (kind === "logo") {
    if (family !== "image") return { error: MSG_LOGO };
    return { kind, kindCorrected: false };
  }
  if (family !== kind) return { kind: family, kindCorrected: true };
  return { kind, kindCorrected: false };
}

// media.blob_url must be unique: one file can be registered twice — by
// the Blob upload-completed callback AND by the page's register call —
// and both paths insert idempotently (ON CONFLICT DO NOTHING below).
// Self-initialised on first use like the community tables (the schema
// also lives in migrations/0012_media_blob_url_unique.sql).
let ensured: Promise<boolean> | null = null;

export function ensureMediaIndex(): Promise<boolean> {
  if (!ensured) {
    ensured = (async () => {
      try {
        await q(`CREATE UNIQUE INDEX IF NOT EXISTS uq_media_blob_url ON media(blob_url)`);
        return true;
      } catch {
        return false;
      }
    })();
  }
  return ensured;
}

/** Insert one media row, idempotently on blob_url. Returns the row id and
 *  whether this call actually inserted (false = already registered). */
export async function insertMediaRow(row: {
  userId: number;
  kind: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
}): Promise<{ id: number; inserted: boolean }> {
  await ensureMediaIndex();
  const rows = await q<{ id: number }>(
    `INSERT INTO media (user_id, kind, name, blob_url, content_type, size_bytes, rights_confirmed)
     VALUES ($1,$2,$3,$4,$5,$6,true)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [row.userId, row.kind, row.name, row.url, row.contentType, row.size],
  );
  if (rows[0]) return { id: rows[0].id, inserted: true };
  const existing = await q<{ id: number }>(
    `SELECT id FROM media WHERE blob_url=$1 ORDER BY id ASC LIMIT 1`,
    [row.url],
  );
  return { id: existing[0]?.id ?? 0, inserted: false };
}

export class MediaValidationError extends Error {}

/** Validate a client-upload token request: the pathname must live under
 *  the caller's own media folder, and the clientPayload must carry a
 *  supported kind, a file name and the rights confirmation. Throws
 *  MediaValidationError with a plain bilingual message. */
export function validateUploadRequest(
  pathname: string,
  clientPayload: string | null,
  userId: number,
): { kind: string; name: string } {
  if (!pathname.startsWith(`media/u${userId}/`)) {
    throw new MediaValidationError(MSG_PATH);
  }
  let p: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(clientPayload ?? "{}") as unknown;
    if (typeof parsed === "object" && parsed !== null) p = parsed as Record<string, unknown>;
  } catch {
    throw new MediaValidationError(MSG_KIND);
  }
  const kind = typeof p.kind === "string" ? p.kind : "";
  if (!MEDIA_LIMITS[kind]) throw new MediaValidationError(MSG_KIND);
  const name = typeof p.name === "string" ? p.name.trim().slice(0, 120) : "";
  if (!name) throw new MediaValidationError(MSG_NAME);
  if (p.rightsConfirmed !== true) throw new MediaValidationError(MSG_RIGHTS);
  return { kind, name };
}
