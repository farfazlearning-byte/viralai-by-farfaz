import { handler, ok, bad, body, str } from "@/lib/api";
import { requireUser, logActivity } from "@/lib/auth";
import { blobReady } from "@/lib/blob";
import {
  MEDIA_LIMITS,
  MSG_KIND,
  MSG_RIGHTS,
  MSG_PATH,
  MSG_SETUP,
  MSG_NOT_FOUND,
  tooLargeMsg,
  correctKind,
  insertMediaRow,
  headBlob,
} from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * POST /api/media/register {url, pathname, kind, name, rightsConfirmed, contentType}
 *
 * Second half of the client direct-to-Blob upload: after the browser has
 * uploaded the file straight to Blob storage, the page calls here to put
 * the file on the member's My Media shelf. Nothing is trusted from the
 * request alone — the blob must really exist (head()), its real content
 * type and size come from Blob itself, the pathname must sit inside the
 * caller's own media folder, the family auto-detect rules are applied,
 * and the per-kind size cap is enforced against the real size.
 * Registration is idempotent on blob_url: if the upload-completed
 * callback already registered the file, this returns the same row.
 * All error messages are plain bilingual sentences — never raw codes.
 */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  let kind = str(b.kind, 10);
  if (!MEDIA_LIMITS[kind]) {
    return bad(MSG_KIND, 400);
  }
  if (b.rightsConfirmed !== true) {
    return bad(MSG_RIGHTS, 400);
  }
  const pathname = str(b.pathname, 300);
  if (!pathname.startsWith(`media/u${user.id}/`)) {
    return bad(MSG_PATH, 403);
  }
  const url = str(b.url, 1000);
  if (!url) {
    return bad(MSG_NOT_FOUND, 400);
  }
  if (!blobReady()) {
    return bad(MSG_SETUP, 503);
  }
  let meta;
  try {
    meta = await headBlob(url);
  } catch {
    return bad(MSG_NOT_FOUND, 400);
  }
  if (meta.pathname !== pathname) {
    return bad(MSG_NOT_FOUND, 400);
  }
  // The blob itself is the source of truth for type and size.
  const contentType = meta.contentType || str(b.contentType, 80);
  const c = correctKind(kind, contentType);
  if ("error" in c) {
    return bad(c.error, 400);
  }
  kind = c.kind;
  if (meta.size > MEDIA_LIMITS[kind] * 1024 * 1024) {
    return bad(tooLargeMsg(kind), 413);
  }
  const name = str(b.name, 120) || `${kind}-upload`;
  const { id, inserted } = await insertMediaRow({
    userId: user.id,
    kind,
    name,
    url: meta.url,
    contentType,
    size: meta.size,
  });
  if (inserted) await logActivity(user.id, "media_upload", `${kind}:${name}`);
  return ok({ id, url: meta.url, kind, kindCorrected: c.kindCorrected });
});
