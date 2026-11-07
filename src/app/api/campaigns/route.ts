import { handler, ok, bad, body, str, num } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, logActivity } from "@/lib/auth";
import { activationBlockReason } from "@/lib/guard";
import { maybeActivateReferral } from "@/lib/growth";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await q(
    `SELECT id, name, objective, category, status, budget_minor, currency, is_sample, self_created, workflow_status, assigned_to, workspace_id, created_at
       FROM campaigns WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200`,
    [user.id],
  );
  return ok({ campaigns: rows });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);

  if (action === "create") {
    const name = str(b.name, 160);
    if (!name) return bad("Campaign name is required. / பிரச்சாரப் பெயர் தேவை.", 400);
    const workspaceId = b.workspaceId ? Number(b.workspaceId) : null;
    const rows = await q<{ id: number }>(
      `INSERT INTO campaigns (user_id, workspace_id, name, objective, category, budget_minor, currency, self_created)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id`,
      [user.id, workspaceId, name, str(b.objective, 60), str(b.category, 60), Math.round(num(b.budgetMajor) * 100), str(b.currency, 8) || "INR"],
    );
    await logActivity(user.id, "campaign_create", name);
    // Referral activation counts ONLY a self-created, non-sample campaign.
    await maybeActivateReferral(user.id, rows[0].id);
    return ok({ id: rows[0].id });
  }

  const id = Number(b.id);
  const own = await q1<{ id: number; status: string }>(`SELECT id, status FROM campaigns WHERE id=$1 AND user_id=$2`, [id, user.id]);
  if (!own) return bad("Campaign not found. / பிரச்சாரம் கிடைக்கவில்லை.", 404);

  if (action === "status") {
    const status = str(b.status, 20);
    if (!["draft", "active", "paused", "archived"].includes(status)) return bad("Bad status", 400);
    if (status === "active") {
      const block = await activationBlockReason(user.id);
      if (block) return bad(block, 423);
    }
    await q(`UPDATE campaigns SET status=$3, updated_at=now() WHERE id=$1 AND user_id=$2`, [id, user.id, status]);
    await logActivity(user.id, "campaign_status", `${id}:${status}`);
    return ok({});
  }
  if (action === "delete") {
    await q(`DELETE FROM campaigns WHERE id=$1 AND user_id=$2`, [id, user.id]);
    return ok({});
  }
  if (action === "update") {
    await q(
      `UPDATE campaigns SET name=$3, objective=$4, category=$5, budget_minor=$6, updated_at=now() WHERE id=$1 AND user_id=$2`,
      [id, user.id, str(b.name, 160), str(b.objective, 60), str(b.category, 60), Math.round(num(b.budgetMajor) * 100)],
    );
    return ok({});
  }
  return bad("Unknown action", 400);
});
