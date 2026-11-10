import { handler, ok } from "@/lib/api";
import { q } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { blobReady, blobToken } from "@/lib/blob";
import { MEDIA_LIMITS } from "@/lib/media";
import { del } from "@vercel/blob";

export const dynamic = "force-dynamic";

// Uploads no longer pass through this route: the browser sends the file
// straight to Blob storage (see /api/media/upload-token) and registers it
// afterwards (/api/media/register). The old whole-file base64 POST sent a
// ~12 MB video as one ~16 MB JSON body, which the serverless payload
// limit killed before it ever reached storage.

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await q(
    `SELECT id, kind, name, blob_url, content_type, size_bytes, created_at FROM media WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200`,
    [user.id],
  );
  return ok({ media: rows, blobReady: blobReady(), limitsMb: MEDIA_LIMITS });
});

export const DELETE = handler(async (req: Request) => {
  const user = await requireUser();
  const id = Number(new URL(req.url).searchParams.get("id"));
  const rows = await q<{ blob_url: string }>(
    `SELECT blob_url FROM media WHERE id=$1 AND user_id=$2`,
    [id, user.id],
  );
  await q(`DELETE FROM media WHERE id=$1 AND user_id=$2`, [id, user.id]);
  // Best-effort: remove the stored file too. The shelf row is already
  // gone, so a storage failure here is ignored, never shown to the user.
  const url = rows[0]?.blob_url;
  if (url && blobReady()) {
    await del(url, { token: blobToken() }).catch(() => {});
  }
  return ok({});
});
