import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { handler, bad, body } from "@/lib/api";
import { requireUser, logActivity } from "@/lib/auth";
import { blobReady, blobToken } from "@/lib/blob";
import {
  MEDIA_LIMITS,
  MSG_SETUP,
  MediaValidationError,
  validateUploadRequest,
  correctKind,
  insertMediaRow,
  headBlob,
} from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * Client direct-to-Blob upload handshake (POST /api/media/upload-token).
 *
 * The browser uploads the file straight to Vercel Blob storage with a
 * short-lived client token issued here — the file bytes never pass
 * through this serverless function, so the ~4.5 MB function payload
 * limit no longer kills large video uploads.
 *
 * Two event types arrive here:
 *  - "blob.generate-client-token": a signed-in member asks for a token.
 *    Validated (own pathname prefix, kind, name, rights) and answered
 *    with per-kind size caps; failures are plain bilingual sentences.
 *  - "blob.upload-completed": Vercel Blob's own callback after the
 *    upload lands (no session cookie on it — handleUpload verifies the
 *    callback). The media row is registered idempotently here too; the
 *    page's /api/media/register call is the second, confirming path.
 */
export const POST = handler(async (req: Request) => {
  const raw = await body(req);
  const uploadBody = raw as unknown as HandleUploadBody;
  const isCompleted =
    typeof raw === "object" && raw !== null && (raw as { type?: unknown }).type === "blob.upload-completed";

  if (isCompleted) {
    const jsonResponse = await handleUpload({
      body: uploadBody,
      request: req,
      token: blobToken(),
      onBeforeGenerateToken: async () => {
        throw new Error("Token generation is not part of the completion callback.");
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const tp = JSON.parse(tokenPayload ?? "{}") as {
            userId?: unknown;
            kind?: unknown;
            name?: unknown;
          };
          const userId = Number(tp.userId);
          const kind0 = typeof tp.kind === "string" ? tp.kind : "";
          if (!userId || !MEDIA_LIMITS[kind0]) return;
          if (!blob.pathname.startsWith(`media/u${userId}/`)) return;
          let contentType = blob.contentType ?? "";
          let size = 0;
          try {
            const h = await headBlob(blob.url);
            contentType = h.contentType || contentType;
            size = h.size;
          } catch {
            /* keep the blob result's own content type; size stays 0 */
          }
          const c = correctKind(kind0, contentType);
          if ("error" in c) return; // the register call surfaces this to the user
          if (size > MEDIA_LIMITS[c.kind] * 1024 * 1024) return; // register reports the cap
          const name = (typeof tp.name === "string" ? tp.name.trim().slice(0, 120) : "") || `${c.kind}-upload`;
          const { inserted } = await insertMediaRow({
            userId,
            kind: c.kind,
            name,
            url: blob.url,
            contentType,
            size,
          });
          if (inserted) await logActivity(userId, "media_upload", `${c.kind}:${name}`);
        } catch {
          /* The callback must never fail the upload itself — the page's
             register call is the second registration path. */
        }
      },
    });
    return NextResponse.json(jsonResponse);
  }

  // Token generation: a member action — signed-in only.
  const user = await requireUser();
  const payload = (raw as { payload?: { pathname?: unknown; clientPayload?: unknown } }).payload ?? {};
  const pathname = typeof payload.pathname === "string" ? payload.pathname : "";
  const clientPayload = typeof payload.clientPayload === "string" ? payload.clientPayload : null;
  try {
    validateUploadRequest(pathname, clientPayload, user.id);
  } catch (e) {
    if (e instanceof MediaValidationError) return bad(e.message, 400);
    throw e;
  }
  if (!blobReady()) {
    return bad(MSG_SETUP, 503);
  }
  try {
    const jsonResponse = await handleUpload({
      body: uploadBody,
      request: req,
      token: blobToken(),
      onBeforeGenerateToken: async (pn, cp) => {
        const v = validateUploadRequest(pn, cp, user.id);
        return {
          allowedContentTypes: ["image/*", "audio/*", "video/*"],
          maximumSizeInBytes: MEDIA_LIMITS[v.kind] * 1024 * 1024,
          tokenPayload: JSON.stringify({ userId: user.id, kind: v.kind, name: v.name }),
        };
      },
      onUploadCompleted: async () => {
        /* Completion on this request path is handled above. */
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (e) {
    if (e instanceof MediaValidationError) return bad(e.message, 400);
    throw e;
  }
});
