import { handler, ok, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth";
import { getPosition } from "@/lib/position";
import { platformSettings } from "@/lib/guard";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

/** GET /api/account — own profile, position, chosen categories, counts. */
export const GET = handler(async () => {
  const user = await requireUser();
  const position = await getPosition(user);
  const counts = await q1<{ campaigns: string; creatives: string; stores: string }>(
    `SELECT (SELECT COUNT(*)::text FROM campaigns WHERE user_id=$1) AS campaigns,
            (SELECT COUNT(*)::text FROM creatives WHERE user_id=$1) AS creatives,
            (SELECT COUNT(*)::text FROM stores WHERE user_id=$1) AS stores`,
    [user.id],
  );
  const full = await q1<{ chosen_categories: string[]; created_at: string }>(
    `SELECT chosen_categories, created_at FROM users WHERE id=$1`, [user.id]);
  const platform = await platformSettings();
  return ok({
    user,
    position,
    counts: { campaigns: Number(counts?.campaigns ?? 0), creatives: Number(counts?.creatives ?? 0), stores: Number(counts?.stores ?? 0) },
    chosenCategories: full?.chosen_categories ?? [],
    joinedAt: full?.created_at ?? null,
    killSwitchPlatform: Boolean(platform.killSwitch),
    categories: CATEGORIES,
  });
});

/** POST /api/account {action: profile|categories|language} */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);
  if (action === "profile") {
    const name = str(b.name, 120) || user.name;
    const country = str(b.country, 80);
    const city = str(b.city, 80);
    await q(`UPDATE users SET name=$2, country=$3, city=$4 WHERE id=$1`, [user.id, name, country, city]);
    await logActivity(user.id, "profile_update", "");
    return ok({});
  }
  if (action === "categories") {
    const picked = Array.isArray(b.categories) ? b.categories.map((c) => str(c, 60)).filter((c) => CATEGORIES.some((x) => x.key === c)).slice(0, 3) : [];
    await q(`UPDATE users SET chosen_categories=$2, categories_chosen_at=now() WHERE id=$1`, [user.id, picked]);
    return ok({ chosenCategories: picked });
  }
  return ok({});
});
