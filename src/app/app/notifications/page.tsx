"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { ErrBox } from "@/components/ui";
import { api } from "@/lib/client";

interface Notif {
  id: number;
  kind: string;
  text_en: string;
  text_ta: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

const ICONS: Record<string, string> = { like: "❤️", comment: "💬", follow: "👥", share: "📤" };

export default function NotificationsPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const { me, loading } = useMe();
  const [rows, setRows] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    try {
      const d = await api("/api/notifications");
      setRows((d.notifications as Notif[]) ?? []);
      setUnread(Number(d.unread ?? 0));
    } catch {
      setErr(ta ? "அறிவிப்புகளை ஏற்ற முடியவில்லை — சிறிது நேரம் கழித்து மீண்டும் முயற்சியுங்கள்." : "Notifications could not be loaded — please try again in a little while.");
    } finally {
      setLoaded(true);
    }
  }
  useEffect(() => {
    if (me) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  async function readAll() {
    try {
      await api("/api/notifications", { method: "POST", body: JSON.stringify({ action: "readAll" }) });
      setRows((prev) => prev.map((r) => ({ ...r, is_read: true })));
      setUnread(0);
    } catch { /* the list stays as-is; the badge will re-check on navigation */ }
  }

  if (!loading && !me) {
    return (
      <AppShell>
        <h1>🔔 {ta ? "அறிவிப்புகள்" : "Notifications"}</h1>
        <div className="card">
          <p>{ta ? "உங்கள் அறிவிப்புகளைப் பார்க்க உள்நுழையுங்கள்." : "Please sign in to see your notifications."}</p>
          <Link className="btn primary" href="/auth">{ta ? "உள்நுழைக" : "Sign in"}</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1>🔔 {ta ? "அறிவிப்புகள்" : "Notifications"}{unread > 0 ? ` · ${unread}` : ""}</h1>
      <p className="muted">
        {ta
          ? "அறிவிப்புகள் இந்த app-இன் உள்ளே மட்டுமே வரும் — email அல்லது phone push அனுப்பப்படாது. யாராவது உங்கள் பதிவை விரும்பினால், கருத்து சொன்னால், பகிர்ந்தால் அல்லது உங்களைப் பின்தொடர்ந்தால் இங்கே தெரியும்."
          : "Notifications live inside this app only — no email or phone push is sent. When someone likes, comments on or shares your post, or starts following you, it appears here."}
      </p>
      <ErrBox msg={err} />
      {unread > 0 ? (
        <div className="row" style={{ marginBottom: 10 }}>
          <button className="btn small primary" onClick={readAll}>{ta ? "எல்லாவற்றையும் படித்ததாகக் குறி" : "Mark all as read"}</button>
        </div>
      ) : null}
      {!loaded ? (
        <p className="muted">{ta ? "ஏற்றுகிறது…" : "Loading…"}</p>
      ) : rows.length === 0 ? (
        <div className="card">
          <p className="muted">{ta ? "இன்னும் அறிவிப்புகள் இல்லை." : "No notifications yet."}</p>
          <p className="small">{ta ? "அடுத்த படி: சமூகத்தில் ஒரு பதிவை வெளியிடுங்கள் — யாராவது அதை விரும்பினாலோ கருத்து சொன்னாலோ இங்கே தெரியும்." : "Next step: publish a post in the Community — when someone likes or comments on it, it shows here."}</p>
          <Link className="btn small primary" href="/app/community">{ta ? "சமூகத்தைத் திற" : "Open Community"}</Link>
        </div>
      ) : (
        rows.map((n) => {
          const inner = (
            <>
              <span style={{ fontSize: 18 }}>{ICONS[n.kind] ?? "🔔"}</span>
              <span className="small" style={{ flex: 1 }}>
                {ta ? n.text_ta || n.text_en : n.text_en}
                <span className="muted" style={{ display: "block" }}>{new Date(n.created_at).toLocaleString()}</span>
              </span>
              {!n.is_read ? <span className="badge live">{ta ? "புதியது" : "new"}</span> : null}
            </>
          );
          const style: React.CSSProperties = {
            display: "flex", gap: 10, alignItems: "flex-start",
            opacity: n.is_read ? 0.75 : 1,
          };
          return n.link ? (
            <Link key={n.id} href={n.link} className="card" style={{ ...style, textDecoration: "none", color: "inherit", marginBottom: 10 }}>{inner}</Link>
          ) : (
            <div key={n.id} className="card" style={{ ...style, marginBottom: 10 }}>{inner}</div>
          );
        })
      )}
    </AppShell>
  );
}
