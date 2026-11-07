import { handler, ok, bad, body, str } from "@/lib/api";
import { q, q1 } from "@/lib/db";
import { requireUser, notify } from "@/lib/auth";
import { getPosition } from "@/lib/position";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "editor", "approver", "viewer"];

async function myRole(workspaceId: number, userId: number): Promise<string | null> {
  const r = await q1<{ role: string }>(`SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2`, [workspaceId, userId]);
  return r?.role ?? null;
}
const canEdit = (r: string | null) => r === "admin" || r === "editor";
const canApprove = (r: string | null) => r === "admin" || r === "approver";
const isAdmin = (r: string | null) => r === "admin";

/** GET /api/teams — my workspaces, members, departments, invites, feed. */
export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const wsId = Number(url.searchParams.get("workspaceId") ?? 0);
  const memberships = await q(
    `SELECT w.id, w.name, w.created_by, wm.role, wm.department FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id=w.id WHERE wm.user_id=$1 ORDER BY w.created_at`, [user.id]);
  const invites = await q(
    `SELECT wi.id, wi.workspace_id, w.name AS workspace_name, wi.role FROM workspace_invites wi
       JOIN workspaces w ON w.id=wi.workspace_id WHERE wi.invited_user_id=$1 AND wi.status='pending'`, [user.id]);
  let detail: Record<string, unknown> | null = null;
  if (wsId && memberships.some((m) => (m as { id: number }).id === wsId)) {
    const members = await q(
      `SELECT wm.user_id, u.name, u.email, wm.role, wm.department FROM workspace_members wm JOIN users u ON u.id=wm.user_id WHERE wm.workspace_id=$1`, [wsId]);
    const departments = await q(`SELECT id, name FROM departments WHERE workspace_id=$1 ORDER BY name`, [wsId]);
    const items = await q(
      `SELECT id, name, status, workflow_status, assigned_to, 'campaign' AS kind FROM campaigns WHERE workspace_id=$1
       UNION ALL SELECT id, title AS name, 'creative' AS status, workflow_status, assigned_to, 'creative' AS kind FROM creatives WHERE workspace_id=$1
       ORDER BY kind, id DESC LIMIT 100`, [wsId]);
    const events = await q(
      `SELECT ae.*, u.name AS actor_name FROM approval_events ae JOIN users u ON u.id=ae.actor_id WHERE ae.workspace_id=$1 ORDER BY ae.created_at DESC LIMIT 50`, [wsId]);
    const comments = await q(
      `SELECT ic.*, u.name AS user_name FROM item_comments ic JOIN users u ON u.id=ic.user_id WHERE ic.workspace_id=$1 ORDER BY ic.created_at DESC LIMIT 50`, [wsId]);
    detail = { members, departments, items, events, comments, myRole: await myRole(wsId, user.id) };
  }
  return ok({ workspaces: memberships, invites, detail });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const b = await body(req);
  const action = str(b.action, 30);

  if (action === "create") {
    // Workspace creation requires Basic+ position (server-enforced).
    const pos = await getPosition(user);
    if (pos.tier === "free") return bad("Creating a team workspace needs a Basic or High position. / அணி உருவாக்க Basic அல்லது High நிலை தேவை.", 402);
    const name = str(b.name, 120);
    if (!name) return bad("Workspace name is required", 400);
    const rows = await q<{ id: number }>(`INSERT INTO workspaces (name, created_by) VALUES ($1,$2) RETURNING id`, [name, user.id]);
    await q(`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1,$2,'admin')`, [rows[0].id, user.id]);
    return ok({ id: rows[0].id });
  }

  const wsId = Number(b.workspaceId);
  const role = await myRole(wsId, user.id);

  if (action === "respondInvite") {
    const inv = await q1<{ id: number; workspace_id: number; role: string }>(
      `SELECT id, workspace_id, role FROM workspace_invites WHERE id=$1 AND invited_user_id=$2 AND status='pending'`, [Number(b.inviteId), user.id]);
    if (!inv) return bad("Invite not found", 404);
    const accept = b.accept === true;
    await q(`UPDATE workspace_invites SET status=$2 WHERE id=$1`, [inv.id, accept ? "accepted" : "declined"]);
    if (accept) {
      await q(`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [inv.workspace_id, user.id, inv.role]);
    }
    return ok({});
  }

  if (!role) return bad("You are not a member of this workspace.", 403);

  if (action === "invite") {
    if (!isAdmin(role)) return bad("Only workspace Admins can invite.", 403);
    const email = str(b.email, 200).toLowerCase();
    const target = await q1<{ id: number; name: string }>(`SELECT id, name FROM users WHERE email=$1`, [email]);
    if (!target) return bad("No ViralAI account with that email yet — ask them to sign up first. / அந்த மின்னஞ்சலில் கணக்கு இல்லை — முதலில் பதிவு செய்யச் சொல்லுங்கள்.", 404);
    const r = ROLES.includes(str(b.role, 20)) ? str(b.role, 20) : "viewer";
    await q(
      `INSERT INTO workspace_invites (workspace_id, invited_user_id, invited_by, role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (workspace_id, invited_user_id) DO UPDATE SET status='pending', role=EXCLUDED.role`,
      [wsId, target.id, user.id, r]);
    await notify(target.id, "team_invite", "You have a team workspace invitation.", "உங்களுக்கு ஒரு அணி அழைப்பு உள்ளது.", "/app/teams");
    return ok({});
  }

  if (action === "setRole") {
    if (!isAdmin(role)) return bad("Only workspace Admins can change roles.", 403);
    const r = str(b.role, 20);
    if (!ROLES.includes(r)) return bad("Bad role", 400);
    await q(`UPDATE workspace_members SET role=$3, department=$4 WHERE workspace_id=$1 AND user_id=$2`,
      [wsId, Number(b.userId), r, str(b.department, 80)]);
    return ok({});
  }

  if (action === "addDepartment") {
    if (!isAdmin(role)) return bad("Only workspace Admins can add departments.", 403);
    await q(`INSERT INTO departments (workspace_id, name) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [wsId, str(b.name, 80)]);
    return ok({});
  }

  if (action === "workflow") {
    const kind = str(b.itemKind, 20);
    const itemId = Number(b.itemId);
    const act = str(b.workflowAction, 30);
    const comment = str(b.comment, 500);
    const table = kind === "creative" ? "creatives" : "campaigns";
    if (act === "submit") {
      if (!canEdit(role)) return bad("Editors and Admins submit work for review.", 403);
      await q(`UPDATE ${table} SET workflow_status='in_review' WHERE id=$1 AND workspace_id=$2`, [itemId, wsId]);
    } else if (act === "approve" || act === "request_changes") {
      if (!canApprove(role)) return bad("Approvers and Admins decide approvals.", 403);
      if (!comment) return bad("A comment is required for an approval decision. / ஒப்புதல் முடிவுக்குக் கருத்து கட்டாயம்.", 400);
      await q(`UPDATE ${table} SET workflow_status=$3 WHERE id=$1 AND workspace_id=$2`,
        [itemId, wsId, act === "approve" ? "approved" : "changes_requested"]);
    } else if (act === "assign") {
      if (!canEdit(role) && !canApprove(role)) return bad("No permission to hand over work.", 403);
      await q(`UPDATE ${table} SET assigned_to=$3 WHERE id=$1 AND workspace_id=$2`, [itemId, wsId, Number(b.assigneeId) || null]);
      if (b.assigneeId) await notify(Number(b.assigneeId), "team_assign", "Work was handed over to you in a team workspace.", "ஒரு அணியில் வேலை உங்களிடம் ஒப்படைக்கப்பட்டது.", "/app/teams");
    } else return bad("Bad workflow action", 400);
    await q(`INSERT INTO approval_events (workspace_id, item_kind, item_id, actor_id, action, comment, assignee_id) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [wsId, kind, itemId, user.id, act, comment, b.assigneeId ? Number(b.assigneeId) : null]);
    return ok({});
  }

  if (action === "comment") {
    const bodyText = str(b.body, 800);
    if (!bodyText) return bad("Comment is empty", 400);
    await q(`INSERT INTO item_comments (workspace_id, item_kind, item_id, user_id, body) VALUES ($1,$2,$3,$4,$5)`,
      [wsId, str(b.itemKind, 20), Number(b.itemId), user.id, bodyText]);
    return ok({});
  }
  return bad("Unknown action", 400);
});
