import { handler, ok } from "@/lib/api";
import { requireUser, requestOrigin } from "@/lib/auth";
import { growthStats } from "@/lib/growth";
import { getPosition } from "@/lib/position";
import { shareTexts } from "@/lib/share";

export const dynamic = "force-dynamic";

/** GET /api/growth — invite code, live invite link built from the request
 *  origin, share texts, referral counters, free-day position. */
export const GET = handler(async () => {
  const user = await requireUser();
  const stats = await growthStats(user.id);
  const origin = await requestOrigin();
  const texts = shareTexts(origin, stats.inviteCode);
  const position = await getPosition(user);
  return ok({ ...stats, ...texts, position });
});
