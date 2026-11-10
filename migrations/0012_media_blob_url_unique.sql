-- 0012_media_blob_url_unique.sql — unique blob_url for My Media rows.
-- Client direct-to-Blob uploads register one file through two paths —
-- the Blob upload-completed callback and the page's register call — so
-- media.blob_url must be unique and both inserts run with
-- ON CONFLICT DO NOTHING (see src/lib/media.ts). Idempotent: safe to
-- run more than once. The app also self-initialises this index on
-- first media insert, so applying this file by hand is optional.

CREATE UNIQUE INDEX IF NOT EXISTS uq_media_blob_url ON media(blob_url);
