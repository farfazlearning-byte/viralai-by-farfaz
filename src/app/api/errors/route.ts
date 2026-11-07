import { handler, ok, body, str } from "@/lib/api";
import { logError } from "@/lib/db";

export const dynamic = "force-dynamic";

/** POST /api/errors — client failure reports land in the owner's Error Inbox. */
export const POST = handler(async (req: Request) => {
  const b = await body(req);
  await logError(str(b.source, 80) || "client", str(b.message, 500) || "unknown", str(b.detail, 1000));
  return ok({});
});
