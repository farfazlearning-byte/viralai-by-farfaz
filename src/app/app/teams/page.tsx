"use client";
import React, { useEffect, useState } from "react";
import { AppShell, useLang } from "@/components/Shell";
import { Field, ErrBox } from "@/components/ui";
import { api } from "@/lib/client";

interface Ws { id: number; name: string; kind: string; myRole: string | null }
interface Member { id: number; user_id: number; name: string; email: string; role: string; department: string }
interface Invite { id: number; workspace_name: string; inviter_name: string; role: string; department: string }
interface Item { id: number; kind: string; name: string; title?: string; headline?: string; workflow_status: string | null }

export default function Teams() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [workspaces, setWorkspaces] = useState<Ws[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", kind: "ads-team" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "editor", department: "" });
  const [workflow, setWorkflow] = useState<{ itemKind: string; itemId: string; comment: string }>({ itemKind: "campaign", itemId: "", comment: "" });
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Array<{ comment: string; author_name: string; created_at: string }>>([]);

  async function refresh() {
    const d = await api("/api/teams").catch(() => ({ workspaces: [], myInvites: [] }));
    setWorkspaces((d.workspaces as Ws[]) ?? []);
    setInvites((d.myInvites as Invite[]) ?? []);
    if (d.workspaces && (d.workspaces as Ws[]).length && selected === null) setSelected((d.workspaces as Ws[])[0].id);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (!selected) return;
    api(`/api/teams?workspaceId=${selected}`).then((d) => { setMembers((d.members as Member[]) ?? []); setItems((d.items as Item[]) ?? []); }).catch(() => {});
  }, [selected]);

  async function post(body: Record<string, unknown>) {
    setErr("");
    try { await api("/api/teams", { method: "POST", body: JSON.stringify(body) }); }
    catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    refresh();
    if (selected) {
      const d = await api(`/api/teams?workspaceId=${selected}`).catch(() => ({}) as Record<string, unknown>);
      setMembers((d.members as Member[]) ?? []); setItems((d.items as Item[]) ?? []);
    }
  }

  return (
    <AppShell>
      <h1>👥 {ta ? "குழு பணியிடங்கள்" : "Team Workspaces"}</h1>
      <p className="muted">{ta ? "பாத்திரங்கள் சர்வரில் கட்டாயப்படுத்தப்படுகின்றன: Admin · Editor · Approver · Viewer." : "Roles are enforced on the server: Admin · Editor · Approver · Viewer."}</p>
      <ErrBox msg={err} />

      {invites.length > 0 && (
        <div className="card" style={{ borderColor: "var(--gold)" }}>
          <h3>✉️ {ta ? "அழைப்புகள்" : "Invitations"}</h3>
          {invites.map((inv) => (
            <div key={inv.id} className="row">
              <span>{inv.workspace_name} — {inv.role}{inv.department ? ` · ${inv.department}` : ""} ({ta ? "அழைத்தவர்" : "by"} {inv.inviter_name})</span>
              <button className="btn small primary" onClick={() => post({ action: "respondInvite", inviteId: inv.id, accept: true })}>{ta ? "ஏற்கிறேன்" : "Accept"}</button>
              <button className="btn small" onClick={() => post({ action: "respondInvite", inviteId: inv.id, accept: false })}>{ta ? "மறுக்கிறேன்" : "Decline"}</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>{ta ? "புதிய பணியிடம்" : "New workspace"}</h3>
        <p className="small muted">{ta ? "Basic அல்லது High நிலை தேவை." : "Requires a Basic or High position."}</p>
        <div className="row">
          <input style={{ width: 220 }} placeholder={ta ? "பெயர்" : "Name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select style={{ width: "auto" }} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="ads-team">Ads team</option><option value="shop-team">Shop team</option><option value="delivery-hub">Delivery hub</option><option value="agency">Agency</option>
          </select>
          <button className="btn primary" onClick={() => post({ action: "create", name: form.name, kind: form.kind })}>{ta ? "உருவாக்கு" : "Create"}</button>
        </div>
      </div>

      <div className="row">
        {workspaces.map((w) => (
          <button key={w.id} className={`btn small ${selected === w.id ? "primary" : ""}`} onClick={() => setSelected(w.id)}>{w.name} <span className="badge">{w.myRole ?? ""}</span></button>
        ))}
      </div>

      {selected && (
        <div className="grid">
          <div className="card">
            <h3>{ta ? "உறுப்பினர்கள்" : "Members"}</h3>
            {members.map((m) => (
              <div key={m.id} className="row"><span>{m.name} <span className="muted small">{m.email}</span></span><span className="badge">{m.role}</span><span className="small muted">{m.department}</span></div>
            ))}
            <h4>{ta ? "உறுப்பினரை அழை" : "Invite a member"}</h4>
            <p className="small muted">{ta ? "அழைக்கப்படுபவரிடம் ஏற்கனவே கணக்கு இருக்க வேண்டும்." : "The person must already have an account."}</p>
            <Field label="Email"><input value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} /></Field>
            <div className="row">
              <select style={{ width: "auto" }} value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
                <option value="editor">Editor</option><option value="approver">Approver</option><option value="viewer">Viewer</option><option value="admin">Admin</option>
              </select>
              <input style={{ width: 140 }} placeholder={ta ? "துறை" : "Department"} value={inviteForm.department} onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })} />
              <button className="btn small primary" onClick={() => post({ action: "invite", workspaceId: selected, ...inviteForm })}>{ta ? "அழைப்பு அனுப்பு" : "Send invite"}</button>
            </div>
          </div>
          <div className="card">
            <h3>{ta ? "ஒப்புதல் ஓட்டம்" : "Approval workflow"}</h3>
            <Field label={ta ? "பொருள்" : "Item"}>
              <select value={`${workflow.itemKind}:${workflow.itemId}`} onChange={(e) => { const [k, id] = e.target.value.split(":"); setWorkflow({ ...workflow, itemKind: k, itemId: id }); }}>
                <option value="campaign:">—</option>
                {items.map((it) => <option key={`${it.kind}-${it.id}`} value={`${it.kind}:${it.id}`}>{it.kind}: {it.name ?? it.title ?? it.headline} [{it.workflow_status ?? "draft"}]</option>)}
              </select>
            </Field>
            <Field label={ta ? "கருத்து (ஒப்புதலுக்கு கட்டாயம்)" : "Comment (mandatory for approvals)"}>
              <input value={workflow.comment} onChange={(e) => setWorkflow({ ...workflow, comment: e.target.value })} />
            </Field>
            <div className="row">
              <button className="btn small" onClick={() => post({ action: "workflow", workspaceId: selected, itemKind: workflow.itemKind, itemId: Number(workflow.itemId), step: "submit", comment: workflow.comment })}>{ta ? "சமர்ப்பி" : "Submit"}</button>
              <button className="btn small primary" onClick={() => post({ action: "workflow", workspaceId: selected, itemKind: workflow.itemKind, itemId: Number(workflow.itemId), step: "approve", comment: workflow.comment })}>{ta ? "ஒப்புதல்" : "Approve"}</button>
              <button className="btn small" onClick={() => post({ action: "workflow", workspaceId: selected, itemKind: workflow.itemKind, itemId: Number(workflow.itemId), step: "request_changes", comment: workflow.comment })}>{ta ? "மாற்றம் கேள்" : "Request changes"}</button>
            </div>
            <h4>{ta ? "கருத்துகள்" : "Comments"}</h4>
            <div className="row">
              <input style={{ width: 200 }} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={ta ? "கருத்து எழுதுங்கள்" : "Write a comment"} />
              <button className="btn small" onClick={async () => {
                await post({ action: "comment", workspaceId: selected, itemKind: workflow.itemKind, itemId: Number(workflow.itemId), comment: commentText });
                const d = await api(`/api/teams?workspaceId=${selected}&commentsFor=${workflow.itemKind}:${workflow.itemId}`).catch(() => ({}) as Record<string, unknown>);
                setComments((d.comments as typeof comments) ?? []);
              }}>{ta ? "பதிவிடு" : "Post"}</button>
            </div>
            {comments.map((c, i) => <p key={i} className="small"><b>{c.author_name}:</b> {c.comment}</p>)}
          </div>
        </div>
      )}
    </AppShell>
  );
}
