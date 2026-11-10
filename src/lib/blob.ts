import { put } from "@vercel/blob";

// Media storage layer — Vercel Blob.
// Documented fallback: if no Blob token is configured (e.g. local dev),
// uploads are refused with an honest setup message instead of failing silently.
// Swap this module for Cloudinary or Cloudflare R2 if the owner outgrows Blob.

/** The Blob read-write token for the PUBLIC media store. Production has
 *  two stores connected: the original private one (BLOB_READ_WRITE_TOKEN)
 *  and the public media store connected later under the MEDIA_ prefix
 *  (MEDIA_BLOB_READ_WRITE_TOKEN). Media always uses the public store, so
 *  the MEDIA_ token wins; the plain token is only a fallback. Every Blob
 *  call in the app must resolve its token through here. */
export function blobToken(): string | undefined {
  return process.env.MEDIA_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
}

export function blobReady(): boolean {
  return Boolean(blobToken());
}

export async function storeMedia(
  userId: number,
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<{ url: string; pathname: string }> {
  if (!blobReady()) {
    throw new Error("MEDIA_SETUP_PENDING");
  }
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const pathname = `media/u${userId}/${Date.now()}-${safe}`;
  const blob = await put(pathname, data, {
    access: "public",
    contentType,
    token: blobToken(),
  });
  return { url: blob.url, pathname: blob.pathname };
}
