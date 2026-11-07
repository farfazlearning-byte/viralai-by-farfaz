import { handler, ok } from "@/lib/api";
import { ensureSeeds } from "@/lib/seed";
import { dbReady } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public bootstrap: reports whether the database is configured and ensures
 *  reference seeds exist. Safe to call signed-out. */
export const GET = handler(async () => {
  if (dbReady()) await ensureSeeds();
  return ok({ dbConfigured: dbReady() });
});
