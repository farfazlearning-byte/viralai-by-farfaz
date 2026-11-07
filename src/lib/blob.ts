import { put } from "@vercel/blob";

// Media storage layer — Vercel Blob.
// Documented fallback: if BLOB_READ_WRITE_TOKEN is absent (e.g. local dev),
// uploads are refused with an honest setup message instead of failing silently.
// Swap this module for Cloudinary or Cloudflare R2 if the owner outgrows Blob.

export function blobReady(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
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
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: blob.url, pathname: blob.pathname };
}
