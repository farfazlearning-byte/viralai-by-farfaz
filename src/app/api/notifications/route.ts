import { handler, ok, body, str } from "@/lib/api";
import { q } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await q(`SELECT id, kind, text_en, text_ta, link, is_read, created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [user.id]);
  const unread = rows.filter((r) => !(r as { is_read: boolean }).is_read).length;
  return ok({ notifications: rows, unread });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  if (str(b.action, 20) === "readAll") {
    await q(`UPDATE notifications SET is_read=true WHERE user_id=$1`, [user.id]);
  }
  return ok({});
});
