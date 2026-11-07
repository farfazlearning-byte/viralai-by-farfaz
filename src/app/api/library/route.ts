import { handler, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { allDesigns, designById } from "@/lib/designs";
import { SHOWCASE_DESIGNS } from "@/lib/showcaseDesigns";
import { getPosition } from "@/lib/position";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/library — the full generated design set + computed counts +
 *  the 11 showcase designs with owner-managed state. Counts are COMPUTED. */
export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "";
  const size = url.searchParams.get("size") ?? "";
  const cat = url.searchParams.get("category") ?? "";
  const all = allDesigns();
  let designs = all;
  if (kind) designs = designs.filter((d) => d.kind === kind);
  if (size) designs = designs.filter((d) => d.size === size);
  // Category shelf: designs whose family fits the member's chosen categories
  // are computed client-side from the full set; `category` narrows by family vibe.
  void cat;
  const pos = await getPosition(user);
  const stateRows = await q<{ design_key: string; enabled: boolean; sort: number }>(
    `SELECT design_key, enabled, sort FROM showcase_design_state`,
  );
  const state = new Map(stateRows.map((r) => [r.design_key, r]));
  const showcase = SHOWCASE_DESIGNS.map((d) => ({ ...d, enabled: state.get(d.key)?.enabled ?? true, sort: state.get(d.key)?.sort ?? d.sort }))
    .sort((a, b) => a.sort - b.sort);
  return ok({
    designs,
    counts: {
      library: all.length,
      free: all.filter((d) => !d.premium).length,
      premium: all.filter((d) => d.premium).length,
      showcase: showcase.length,
      total: all.length + showcase.length,
    },
    showcase,
    canUsePremium: pos.tier !== "free",
    position: pos,
  });
});

/** GET single design by id is folded into the list response; helper export. */
export const POST = handler(async (req: Request) => {
  await requireUser();
  const b = (await req.json().catch(() => ({}))) as { id?: string };
  const d = b.id ? designById(b.id) : undefined;
  return ok({ design: d ?? null });
});
