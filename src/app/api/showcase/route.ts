import { handler, ok, bad, body, str } from "@/lib/api";
import { q } from "@/lib/db";
import { requireUser, requireOwner } from "@/lib/auth";
import { ensureSeeds } from "@/lib/seed";
import { HOUSE_ADS } from "@/lib/houseAds";
import { shareTexts } from "@/lib/client";
import { requestOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/showcase — the 17 house-ad cards (DB-managed), each with its
 *  honesty label from the content definitions + exportable share copy. */
export const GET = handler(async () => {
  const user = await requireUser();
  await ensureSeeds();
  const rows = await q(`SELECT * FROM house_ads WHERE enabled=true ORDER BY sort`);
  const origin = await requestOrigin();
  const texts = shareTexts(origin, user.invite_code);
  const bySlug = new Map(HOUSE_ADS.map((a) => [a.key, a]));
  const ads = rows.map((r) => {
    const row = r as { slug: string };
    const def = bySlug.get(row.slug);
    return { ...r, labelEn: def?.labelEn ?? "House ad — free", labelTa: def?.labelTa ?? "வீட்டு விளம்பரம் — இலவசம்", icon: def?.icon ?? "📣" };
  });
  return ok({ ads, shareEn: texts.en, shareTa: texts.ta });
});

/** POST {action: setEnabled | setSort | setDesignState} — owner only. */
export const POST = handler(async (req: Request) => {
  await requireOwner();
  const b = await body(req);
  const action = str(b.action, 30);
  if (action === "setEnabled") {
    await q(`UPDATE house_ads SET enabled=$2 WHERE id=$1`, [Number(b.id), b.enabled === true]);
    return ok({});
  }
  if (action === "setSort") {
    await q(`UPDATE house_ads SET sort=$2 WHERE id=$1`, [Number(b.id), Math.round(Number(b.sort) || 0)]);
    return ok({});
  }
  if (action === "setDesignState") {
    await q(
      `INSERT INTO showcase_design_state (design_key, enabled, sort) VALUES ($1,$2,$3)
       ON CONFLICT (design_key) DO UPDATE SET enabled=EXCLUDED.enabled, sort=EXCLUDED.sort, updated_at=now()`,
      [str(b.designKey, 80), b.enabled !== false, Math.round(Number(b.sort) || 0)],
    );
    return ok({});
  }
  return bad("Unknown action", 400);
});
