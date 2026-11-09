"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { DesignScene, ErrBox } from "@/components/ui";
import { api } from "@/lib/client";
import { allDesigns, designById } from "@/lib/designs";

interface MemberInfo {
  id: number;
  name: string;
  founder_number: number | null;
  followers: number;
  following: number;
  is_following: boolean;
  is_me: boolean;
}
interface Post {
  id: number;
  user_id: number;
  title: string;
  caption: string;
  allow_reuse: boolean;
  creative_id: number | null;
  design_key: string | null;
  headline: string | null;
  business: string | null;
  offer: string | null;
  creative_media_url: string | null;
  creative_media_kind: string | null;
  media_id: number | null;
  media_url: string | null;
  media_kind: string | null;
  like_count: number;
  share_count: number;
  comment_count: number;
}

/** Never surface raw codes/JSON — map technical errors to a plain sentence. */
function friendly(raw: string, ta: boolean): string {
  if (/SETUP_PENDING|SERVER_ERROR|UNAUTHORIZED|OWNER_ONLY|HTTP \d|^\{|SyntaxError/i.test(raw)) {
    return ta
      ? "ஏதோ தடை ஏற்பட்டது — சிறிது நேரம் கழித்து மீண்டும் முயற்சியுங்கள்."
      : "Something interrupted that — please wait a moment and try again.";
  }
  return raw;
}

export default function MemberPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const { me, loading } = useMe();
  const starter = useMemo(
    () => allDesigns().find((d) => d.familyKey === "clean-starter" && d.kind === "poster" && d.size === "1:1" && d.theme === "dark")!,
    [],
  );
  const [memberId, setMemberId] = useState<number | null>(null);
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const u = Number(new URLSearchParams(window.location.search).get("u") ?? 0);
    setMemberId(u || null);
  }, []);

  useEffect(() => {
    if (!me || !memberId) return;
    api(`/api/community?profile=${memberId}`)
      .then((d) => {
        setMember(d.member as MemberInfo);
        setPosts((d.posts as Post[]) ?? []);
      })
      .catch((e) => setErr(friendly(e instanceof Error ? e.message : "Error", ta)))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, memberId]);

  async function toggleFollow() {
    if (!member) return;
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "follow", userId: member.id }),
      });
      setMember({ ...member, is_following: Boolean(d.following), followers: Number(d.followerCount ?? member.followers) });
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  function reuseCreative(p: Post) {
    if (p.design_key) {
      try { sessionStorage.setItem("viralai_template", p.design_key); } catch { /* private mode */ }
      window.location.href = "/app/studio";
    }
  }

  function reuseVideo(p: Post) {
    try {
      sessionStorage.setItem("viralai_template", "clean-starter:video-style:9:16:dark");
      if (p.media_id) sessionStorage.setItem("viralai_media", String(p.media_id));
    } catch { /* private mode */ }
    window.location.href = "/app/studio";
  }

  if (!loading && !me) {
    return (
      <AppShell>
        <h1>👤 {ta ? "உறுப்பினர்" : "Member"}</h1>
        <div className="card">
          <p>{ta ? "உறுப்பினர் விவரங்களைப் பார்க்க உள்நுழையுங்கள்." : "Please sign in to see member profiles."}</p>
          <Link className="btn primary" href="/auth">{ta ? "உள்நுழைக" : "Sign in"}</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <p><Link href="/app/community">← {ta ? "சமூகத்துக்குத் திரும்பு" : "Back to Community"}</Link></p>
      <ErrBox msg={err} />
      {!loaded ? (
        <p className="muted">{ta ? "ஏற்றுகிறது…" : "Loading…"}</p>
      ) : !member ? (
        <div className="card">
          <p className="muted">{ta ? "அந்த உறுப்பினர் கிடைக்கவில்லை." : "That member was not found."}</p>
        </div>
      ) : (
        <>
          <div className="card holo">
            <h1 style={{ marginTop: 0 }}>
              👤 {member.name}
              {member.founder_number ? <span className="badge live">🏆 Founder #{member.founder_number}</span> : null}
              {member.is_me ? <span className="badge">{ta ? "நீங்கள்" : "You"}</span> : null}
            </h1>
            <div className="row">
              <span className="badge">👥 {member.followers} {ta ? "பின்தொடர்பவர்கள்" : "followers"}</span>
              <span className="badge">{member.following} {ta ? "பின்தொடர்கிறார்" : "following"}</span>
              <span className="badge">📝 {posts.length} {ta ? "பதிவுகள்" : "posts"}</span>
            </div>
            {!member.is_me ? (
              <div className="row" style={{ marginTop: 10 }}>
                <button className={`btn ${member.is_following ? "" : "primary"}`} onClick={toggleFollow}>
                  {member.is_following ? (ta ? "✓ பின்தொடர்கிறீர்கள்" : "✓ Following") : ta ? "＋ Follow" : "＋ Follow"}
                </button>
              </div>
            ) : null}
            <p className="small muted" style={{ marginTop: 10 }}>
              {ta
                ? "பொது விவரம் — பெயர், Founder badge மற்றும் சமூகப் பதிவுகள் மட்டுமே காட்டப்படும். Email அல்லது phone ஒருபோதும் காட்டப்படாது."
                : "Public profile — only the name, Founder badge and community posts are shown. Email and phone are never shown."}
            </p>
          </div>

          <h2>{ta ? "பதிவுகள்" : "Posts"}</h2>
          {posts.length === 0 ? (
            <div className="card">
              <p className="muted">{ta ? "இந்த உறுப்பினர் இன்னும் எதையும் வெளியிடவில்லை." : "This member hasn't published anything yet."}</p>
              <p className="small">{ta ? "அடுத்த படி: சமூகத்துக்குத் திரும்பி மற்ற உறுப்பினர்களின் பதிவுகளைப் பாருங்கள்." : "Next step: go back to the Community and see other members' posts."}</p>
              <Link className="btn small" href="/app/community">{ta ? "சமூகத்தைத் திற" : "Open Community"}</Link>
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
              {posts.map((p) => {
                const design = (p.design_key && designById(p.design_key)) || starter;
                return (
                  <div className="card holo" key={p.id}>
                    <h3 style={{ margin: "4px 0" }}>{p.title}</h3>
                    {p.caption ? <p className="small" style={{ whiteSpace: "pre-wrap" }}>{p.caption}</p> : null}
                    {p.creative_id ? (
                      <DesignScene
                        design={design}
                        headline={p.headline || p.title}
                        offer={p.offer ?? ""}
                        business={p.business ?? ""}
                        lang={lang}
                        mediaUrl={p.creative_media_url ?? undefined}
                        mediaKind={p.creative_media_kind ?? undefined}
                      />
                    ) : p.media_url ? (
                      <video
                        src={p.media_url}
                        controls
                        playsInline
                        preload="metadata"
                        style={{ width: "100%", borderRadius: 10, display: "block" }}
                      />
                    ) : null}
                    <p className="small muted" style={{ marginTop: 8 }}>
                      ❤️ {p.like_count} · 💬 {p.comment_count} · 📤 {p.share_count}
                    </p>
                    {p.creative_id ? (
                      p.allow_reuse ? (
                        <button className="btn small primary" onClick={() => reuseCreative(p)}>
                          {ta ? "இந்த design-ஐப் பயன்படுத்து" : "Use this design"}
                        </button>
                      ) : (
                        <p className="small muted">{ta ? "மீண்டும் பயன்படுத்த உரிமையாளர் அனுமதிக்கவில்லை." : "The owner hasn't allowed reuse."}</p>
                      )
                    ) : p.media_id && p.allow_reuse ? (
                      <button className="btn small primary" onClick={() => reuseVideo(p)}>
                        {ta ? "இந்த வீடியோவைப் பயன்படுத்து" : "Use this video"}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
