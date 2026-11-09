"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, useLang, useMe } from "@/components/Shell";
import { DesignScene, Field, ErrBox } from "@/components/ui";
import { api } from "@/lib/client";
import { allDesigns, designById } from "@/lib/designs";

interface Post {
  id: number;
  user_id: number;
  poster_name: string;
  poster_founder: number | null;
  title: string;
  caption: string;
  allow_reuse: boolean;
  created_at: string;
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
  liked_by_me: boolean;
  saved_by_me: boolean;
  following_poster: boolean;
  tags?: string[];
}
interface Story {
  id: number;
  user_id: number;
  poster_name: string;
  poster_founder: number | null;
  created_at: string;
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
  view_count: number;
  viewed_by_me: boolean;
}
interface Comment { id: number; post_id: number; user_id: number; author_name: string; author_founder: number | null; body: string; created_at: string }
interface MemberHit { id: number; name: string; founder_number: number | null }
interface Creative { id: number; title: string; headline: string; design_key: string }
interface MediaItem { id: number; kind: string; name: string; blob_url: string }

/** Never surface raw codes/JSON — map technical errors to a plain sentence. */
function friendly(raw: string, ta: boolean): string {
  if (/SETUP_PENDING|SERVER_ERROR|UNAUTHORIZED|OWNER_ONLY|HTTP \d|^\{|SyntaxError/i.test(raw)) {
    return ta
      ? "ஏதோ தடை ஏற்பட்டது — சிறிது நேரம் கழித்து மீண்டும் முயற்சியுங்கள்."
      : "Something interrupted that — please wait a moment and try again.";
  }
  return raw;
}

export default function CommunityPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const { me, loading } = useMe();
  const starter = useMemo(
    () => allDesigns().find((d) => d.familyKey === "clean-starter" && d.kind === "poster" && d.size === "1:1" && d.theme === "dark")!,
    [],
  );
  const [ready, setReady] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [source, setSource] = useState<"creative" | "video">("creative");
  const [creativeId, setCreativeId] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [allowReuse, setAllowReuse] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [shareBox, setShareBox] = useState<{ postId: number; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  // Social Pack state
  const [view, setView] = useState<"all" | "following" | "saved">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [members, setMembers] = useState<MemberHit[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [reportFor, setReportFor] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storySource, setStorySource] = useState<"creative" | "video">("creative");
  const [storyCreativeId, setStoryCreativeId] = useState("");
  const [storyMediaId, setStoryMediaId] = useState("");
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  async function loadFeed(v: string, s: string, t: string) {
    const qs = new URLSearchParams();
    if (v !== "all") qs.set("view", v);
    if (s) qs.set("search", s);
    if (t) qs.set("tag", t);
    const d = await api(`/api/community${qs.toString() ? `?${qs}` : ""}`);
    setReady(Boolean(d.ready));
    setPosts((d.posts as Post[]) ?? []);
    setStories((d.stories as Story[]) ?? []);
    setMembers((d.members as MemberHit[]) ?? []);
  }

  async function refresh() {
    try {
      await loadFeed(view, search, tag);
    } catch {
      setReady(false);
    }
    const cr = await api("/api/creatives").catch(() => ({ creatives: [] }));
    setCreatives((cr.creatives as Creative[]) ?? []);
    const m = await api("/api/media").catch(() => ({ media: [] }));
    setVideos(((m.media as MediaItem[]) ?? []).filter((x) => x.kind === "video"));
  }
  useEffect(() => {
    if (me) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    if (me) loadFeed(view, search, tag).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, search, tag]);

  async function publish() {
    setErr(""); setMsg(""); setBusy(true);
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({
          action: "publish",
          title,
          caption,
          allowReuse,
          creativeId: source === "creative" && creativeId ? Number(creativeId) : null,
          mediaId: source === "video" && mediaId ? Number(mediaId) : null,
        }),
      });
      setView("all"); setSearch(""); setSearchInput(""); setTag("");
      setPosts((d.posts as Post[]) ?? []);
      setTitle(""); setCaption(""); setAllowReuse(false);
      setMsg(ta ? "வெளியிடப்பட்டது — உங்கள் பதிவு ஊட்டத்தில் உள்ளது." : "Published — your post is in the feed below.");
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    } finally {
      setBusy(false);
    }
  }

  async function toggleLike(p: Post) {
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "like", postId: p.id }),
      });
      setPosts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, liked_by_me: Boolean(d.liked), like_count: Number(d.likeCount ?? x.like_count) } : x)),
      );
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function share(p: Post) {
    setErr(""); setCopied(false);
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "share", postId: p.id }),
      });
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, share_count: Number(d.shareCount ?? x.share_count) } : x)));
      setShareBox({ postId: p.id, text: String(ta ? d.ta : d.en) });
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function unpublish(p: Post) {
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "unpublish", postId: p.id }),
      });
      setPosts((d.posts as Post[]) ?? []);
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function toggleSave(p: Post) {
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "save", postId: p.id }),
      });
      const saved = Boolean(d.saved);
      setPosts((prev) =>
        view === "saved" && !saved
          ? prev.filter((x) => x.id !== p.id)
          : prev.map((x) => (x.id === p.id ? { ...x, saved_by_me: saved } : x)),
      );
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function toggleFollow(p: Post) {
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "follow", userId: p.user_id }),
      });
      const following = Boolean(d.following);
      setPosts((prev) =>
        view === "following" && !following
          ? prev.filter((x) => x.user_id !== p.user_id)
          : prev.map((x) => (x.user_id === p.user_id ? { ...x, following_poster: following } : x)),
      );
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function toggleComments(p: Post) {
    const open = !openComments[p.id];
    setOpenComments((prev) => ({ ...prev, [p.id]: open }));
    if (open && !comments[p.id]) {
      try {
        const d = await api(`/api/community?comments=${p.id}`);
        setComments((prev) => ({ ...prev, [p.id]: (d.comments as Comment[]) ?? [] }));
      } catch (e) {
        setErr(friendly(e instanceof Error ? e.message : "Error", ta));
      }
    }
  }

  async function addComment(p: Post) {
    const text = (drafts[p.id] ?? "").trim();
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "comment_add", postId: p.id, body: text }),
      });
      setComments((prev) => ({ ...prev, [p.id]: (d.comments as Comment[]) ?? [] }));
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, comment_count: Number(d.commentCount ?? x.comment_count) } : x)));
      setDrafts((prev) => ({ ...prev, [p.id]: "" }));
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function deleteComment(p: Post, c: Comment) {
    setErr("");
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "comment_delete", commentId: c.id }),
      });
      setComments((prev) => ({ ...prev, [p.id]: (d.comments as Comment[]) ?? [] }));
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, comment_count: Number(d.commentCount ?? x.comment_count) } : x)));
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function sendReport(p: Post) {
    setErr("");
    try {
      await api("/api/community", {
        method: "POST",
        body: JSON.stringify({ action: "report", postId: p.id, reason: reportReason }),
      });
      setReportFor(null);
      setReportReason("");
      setMsg(ta ? "புகார் அனுப்பப்பட்டது — உரிமையாளர் பார்ப்பார்." : "Reported — the owner will take a look.");
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    }
  }

  async function publishStory() {
    setErr(""); setMsg(""); setBusy(true);
    try {
      const d = await api("/api/community", {
        method: "POST",
        body: JSON.stringify({
          action: "story_publish",
          creativeId: storySource === "creative" && storyCreativeId ? Number(storyCreativeId) : null,
          mediaId: storySource === "video" && storyMediaId ? Number(storyMediaId) : null,
        }),
      });
      setStories((d.stories as Story[]) ?? []);
      setShowStoryForm(false);
      setMsg(ta ? "Story வெளியிடப்பட்டது — 24 மணி நேரம் மட்டுமே தெரியும்." : "Story published — it stays visible for 24 hours only.");
    } catch (e) {
      setErr(friendly(e instanceof Error ? e.message : "Error", ta));
    } finally {
      setBusy(false);
    }
  }

  async function openStory(s: Story) {
    setActiveStory(s);
    if (me && s.user_id !== me.id && !s.viewed_by_me) {
      try {
        const d = await api("/api/community", {
          method: "POST",
          body: JSON.stringify({ action: "story_view", storyId: s.id }),
        });
        const n = Number(d.viewCount ?? s.view_count);
        setStories((prev) => prev.map((x) => (x.id === s.id ? { ...x, view_count: n, viewed_by_me: true } : x)));
        setActiveStory((cur) => (cur && cur.id === s.id ? { ...cur, view_count: n, viewed_by_me: true } : cur));
      } catch { /* view counting is best-effort; the story still shows */ }
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

  function renderCaption(text: string) {
    const parts = text.split(/(#[\p{L}\p{N}_]+)/gu);
    return parts.map((part, i) =>
      part.startsWith("#") ? (
        <button
          key={i}
          onClick={() => { setTag(part.slice(1)); setSearch(""); }}
          style={{ background: "none", border: "none", color: "#7dd3fc", cursor: "pointer", padding: 0, font: "inherit" }}
        >
          {part}
        </button>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  }

  if (!loading && !me) {
    return (
      <AppShell>
        <h1>👥 {ta ? "சமூகம்" : "Community"}</h1>
        <div className="card">
          <p>{ta ? "சமூக ஊட்டத்தைப் பார்க்கவும் பதிவிடவும் உள்நுழையுங்கள்." : "Please sign in to see and post in the community feed."}</p>
          <Link className="btn primary" href="/auth">{ta ? "உள்நுழைக" : "Sign in"}</Link>
        </div>
      </AppShell>
    );
  }

  const storyDesign = activeStory ? (activeStory.design_key && designById(activeStory.design_key)) || starter : starter;

  return (
    <AppShell>
      <h1>👥 {ta ? "சமூகம்" : "Community"}</h1>
      <p className="muted">
        {ta
          ? "உறுப்பினர்கள் தங்கள் சொந்த designs மற்றும் வீடியோக்களை இங்கே பகிர்கிறார்கள். Like, comment, share, follow — எண்ணிக்கைகள் எல்லாம் உண்மையான பதிவுகளிலிருந்து மட்டுமே."
          : "Members share their own designs and videos here. Likes, comments, shares and follows — every count comes from real records only."}
      </p>
      <ErrBox msg={err} />
      {msg ? <p className="okbox">{msg}</p> : null}

      {ready === false ? (
        <div className="card">
          <p>{ta ? "சமூகப் பகுதி அமைக்கப்படுகிறது — சிறிது நேரத்தில் மீண்டும் பாருங்கள்." : "The community area is being set up — please look again in a little while."}</p>
        </div>
      ) : (
        <>
          {/* ── Stories: 24-hour only, expiry enforced by the server ── */}
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>⭕ {ta ? "Stories (24 மணி நேரம்)" : "Stories (24 hours)"}</h2>
              <button className="btn small" onClick={() => setShowStoryForm(!showStoryForm)}>
                {ta ? "＋ என் story" : "＋ Your story"}
              </button>
            </div>
            {stories.length === 0 && !showStoryForm ? (
              <p className="small muted" style={{ marginTop: 8 }}>
                {ta ? "இப்போது stories இல்லை. Story 24 மணி நேரம் மட்டுமே தெரியும், பிறகு தானாக மறையும்." : "No stories right now. A story stays visible for 24 hours, then disappears on its own."}
              </p>
            ) : (
              <div className="row" style={{ overflowX: "auto", flexWrap: "nowrap", paddingBottom: 6, marginTop: 8 }}>
                {stories.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openStory(s)}
                    style={{
                      background: "none", border: "none", cursor: "pointer", textAlign: "center",
                      minWidth: 74, color: "inherit",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 56, height: 56, borderRadius: "50%", fontSize: 22, fontWeight: 700,
                        border: `3px solid ${s.viewed_by_me ? "#5b6b7d" : "#e8b23a"}`,
                        background: "rgba(232,178,58,0.12)",
                      }}
                    >
                      {(s.poster_name || "?").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="small" style={{ display: "block", maxWidth: 74, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.poster_name}
                    </span>
                    <span className="small muted" style={{ display: "block" }}>👁 {s.view_count}</span>
                  </button>
                ))}
              </div>
            )}
            {showStoryForm ? (
              <div style={{ marginTop: 10 }}>
                <div className="row">
                  <button className={`btn small ${storySource === "creative" ? "primary" : ""}`} onClick={() => setStorySource("creative")}>
                    {ta ? "என் creative" : "My creative"}
                  </button>
                  <button className={`btn small ${storySource === "video" ? "primary" : ""}`} onClick={() => setStorySource("video")}>
                    {ta ? "என் வீடியோ" : "My video"}
                  </button>
                </div>
                {storySource === "creative" ? (
                  <Field label={ta ? "Creative-ஐத் தேர்ந்தெடு" : "Choose a creative"}>
                    <select value={storyCreativeId} onChange={(e) => setStoryCreativeId(e.target.value)}>
                      <option value="">{ta ? "— தேர்ந்தெடு —" : "— choose —"}</option>
                      {creatives.map((c) => (
                        <option key={c.id} value={c.id}>{c.title || c.headline || `#${c.id}`}</option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field label={ta ? "வீடியோவைத் தேர்ந்தெடு (My Media)" : "Choose a video (My Media)"}>
                    <select value={storyMediaId} onChange={(e) => setStoryMediaId(e.target.value)}>
                      <option value="">{ta ? "— தேர்ந்தெடு —" : "— choose —"}</option>
                      {videos.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <button className="btn primary" disabled={busy} onClick={publishStory}>
                  {ta ? "Story வெளியிடு" : "Publish story"}
                </button>
              </div>
            ) : null}
            {activeStory ? (
              <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="small">
                    <b>{activeStory.poster_name}</b>
                    {activeStory.poster_founder ? <span className="badge live">🏆 Founder #{activeStory.poster_founder}</span> : null}
                    <span className="muted"> · 👁 {activeStory.view_count}</span>
                  </span>
                  <button className="btn small" onClick={() => setActiveStory(null)}>{ta ? "மூடு" : "Close"}</button>
                </div>
                {activeStory.creative_id ? (
                  <DesignScene
                    design={storyDesign}
                    headline={activeStory.headline || activeStory.poster_name}
                    offer={activeStory.offer ?? ""}
                    business={activeStory.business ?? ""}
                    lang={lang}
                    mediaUrl={activeStory.creative_media_url ?? undefined}
                    mediaKind={activeStory.creative_media_kind ?? undefined}
                  />
                ) : activeStory.media_url ? (
                  <video
                    src={activeStory.media_url}
                    controls
                    playsInline
                    preload="metadata"
                    style={{ width: "100%", borderRadius: 10, display: "block" }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ── Publish a post ── */}
          <div className="card">
            <h2 style={{ marginTop: 0 }}>{ta ? "ஊட்டத்தில் வெளியிடு" : "Publish to the feed"}</h2>
            <div className="row">
              <button className={`btn small ${source === "creative" ? "primary" : ""}`} onClick={() => setSource("creative")}>
                {ta ? "என் creative" : "My creative"}
              </button>
              <button className={`btn small ${source === "video" ? "primary" : ""}`} onClick={() => setSource("video")}>
                {ta ? "என் வீடியோ" : "My video"}
              </button>
            </div>
            {source === "creative" ? (
              <Field label={ta ? "Creative-ஐத் தேர்ந்தெடு" : "Choose a creative"}>
                <select value={creativeId} onChange={(e) => setCreativeId(e.target.value)}>
                  <option value="">{ta ? "— தேர்ந்தெடு —" : "— choose —"}</option>
                  {creatives.map((c) => (
                    <option key={c.id} value={c.id}>{c.title || c.headline || `#${c.id}`}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label={ta ? "வீடியோவைத் தேர்ந்தெடு (My Media)" : "Choose a video (My Media)"}>
                <select value={mediaId} onChange={(e) => setMediaId(e.target.value)}>
                  <option value="">{ta ? "— தேர்ந்தெடு —" : "— choose —"}</option>
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={ta ? "தலைப்பு (தேவை)" : "Title (required)"}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </Field>
            <Field label={ta ? "விளக்கம் (விருப்பம்) — #hashtag போடலாம்" : "Caption (optional) — you can add #hashtags"}>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} maxLength={1000} />
            </Field>
            <label className="row" style={{ alignItems: "flex-start", gap: 8 }}>
              <input type="checkbox" checked={allowReuse} onChange={(e) => setAllowReuse(e.target.checked)} />
              <span className="small">
                {ta
                  ? "மற்றவர்கள் இந்த design-ஐப் பயன்படுத்த அனுமதி — அணைத்து (off) என்றால் யாரும் அதை மீண்டும் பயன்படுத்த முடியாது."
                  : "Allow others to reuse this design — when off, nobody can reuse it."}
              </span>
            </label>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary" disabled={busy} onClick={publish}>
                {ta ? "வெளியிடு" : "Publish"}
              </button>
            </div>
          </div>

          {/* ── Feed filters: view / search / hashtag ── */}
          <div className="card">
            <div className="row">
              <button className={`btn small ${view === "all" ? "primary" : ""}`} onClick={() => setView("all")}>{ta ? "எல்லாம்" : "All"}</button>
              <button className={`btn small ${view === "following" ? "primary" : ""}`} onClick={() => setView("following")}>{ta ? "பின்தொடர்பவை" : "Following"}</button>
              <button className={`btn small ${view === "saved" ? "primary" : ""}`} onClick={() => setView("saved")}>{ta ? "சேமித்தவை" : "Saved"}</button>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={ta ? "பதிவு அல்லது உறுப்பினர் பெயரைத் தேடு…" : "Search posts or member names…"}
                style={{ flex: 1, minWidth: 160 }}
              />
              <button className="btn small" onClick={() => { setSearch(searchInput.trim()); setTag(""); }}>{ta ? "தேடு" : "Search"}</button>
              {(search || tag) ? (
                <button className="btn small" onClick={() => { setSearch(""); setSearchInput(""); setTag(""); }}>{ta ? "அழி" : "Clear"}</button>
              ) : null}
            </div>
            {tag ? <p className="small" style={{ marginTop: 6 }}>#{tag} <span className="muted">— {ta ? "இந்த hashtag உள்ள பதிவுகள்" : "posts with this hashtag"}</span></p> : null}
            {search && members.length > 0 ? (
              <div style={{ marginTop: 8 }}>
                <p className="small muted" style={{ margin: 0 }}>{ta ? "உறுப்பினர்கள்:" : "Members:"}</p>
                {members.map((m) => (
                  <p key={m.id} style={{ margin: "4px 0" }}>
                    <Link href={`/app/member?u=${m.id}`}>👤 {m.name}</Link>
                    {m.founder_number ? <span className="badge live">🏆 Founder #{m.founder_number}</span> : null}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          {ready === null ? (
            <p className="muted">{ta ? "ஏற்றுகிறது…" : "Loading…"}</p>
          ) : posts.length === 0 ? (
            <div className="card">
              <p className="muted">
                {view === "following"
                  ? ta ? "நீங்கள் பின்தொடரும் உறுப்பினர்களிடமிருந்து இன்னும் பதிவுகள் இல்லை." : "No posts yet from members you follow."
                  : view === "saved"
                    ? ta ? "இன்னும் எதையும் சேமிக்கவில்லை — ஒரு பதிவில் 🔖 Save அழுத்துங்கள்." : "Nothing saved yet — tap 🔖 Save on a post."
                    : ta ? "இன்னும் பதிவுகள் இல்லை — முதலில் வெளியிடுங்கள்!" : "No posts yet — be the first to publish!"}
              </p>
              <p className="small">
                {view === "all"
                  ? ta ? "அடுத்த படி: முதலில் ஒரு design-ஐ உருவாக்குங்கள், பிறகு மேலே உள்ள “ஊட்டத்தில் வெளியிடு” பெட்டியில் அதைத் தேர்ந்தெடுங்கள்." : "Next step: create a design first, then choose it in the “Publish to the feed” box above."
                  : ta ? "அடுத்த படி: எல்லாப் பதிவுகளையும் பாருங்கள்." : "Next step: look at all posts."}
              </p>
              {view === "all" ? (
                <Link className="btn small primary" href="/app/library">{ta ? "Design-ஐத் தேர்ந்தெடு" : "Pick a design"}</Link>
              ) : (
                <button className="btn small primary" onClick={() => setView("all")}>{ta ? "எல்லாப் பதிவுகளையும் பார்" : "See all posts"}</button>
              )}
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
              {posts.map((p) => {
                const design = (p.design_key && designById(p.design_key)) || starter;
                // IDs arrive as strings (BIGSERIAL) — compare as strings,
                // Number(x) === me.id would never match.
                const isMine = me && String(p.user_id) === String(me.id);
                return (
                  <div className="card holo" key={p.id}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className="small">
                        <Link href={`/app/member?u=${p.user_id}`}><b>{p.poster_name}</b></Link>
                        {p.poster_founder ? <span className="badge live">🏆 Founder #{p.poster_founder}</span> : null}
                      </span>
                      {isMine ? <span className="badge">{ta ? "உங்கள் பதிவு" : "Your post"}</span> : null}
                    </div>
                    {!isMine ? (
                      <div className="row" style={{ marginTop: 4 }}>
                        <button className={`btn small ${p.following_poster ? "" : "primary"}`} onClick={() => toggleFollow(p)}>
                          {p.following_poster ? (ta ? "✓ பின்தொடர்கிறீர்கள்" : "✓ Following") : ta ? "＋ Follow" : "＋ Follow"}
                        </button>
                      </div>
                    ) : null}
                    <h3 style={{ margin: "8px 0 4px" }}>{p.title}</h3>
                    {p.caption ? <p className="small" style={{ whiteSpace: "pre-wrap" }}>{renderCaption(p.caption)}</p> : null}
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
                    <div className="row" style={{ marginTop: 10 }}>
                      <button className={`btn small ${p.liked_by_me ? "primary" : ""}`} onClick={() => toggleLike(p)}>
                        {p.liked_by_me ? "❤️" : "🤍"} {ta ? "Like" : "Like"} · {p.like_count}
                      </button>
                      <button className="btn small" onClick={() => toggleComments(p)}>
                        💬 {ta ? "கருத்துகள்" : "Comments"} · {p.comment_count}
                      </button>
                      <button className="btn small" onClick={() => share(p)}>
                        📤 {ta ? "பகிர்" : "Share"} · {p.share_count}
                      </button>
                      <button className={`btn small ${p.saved_by_me ? "primary" : ""}`} onClick={() => toggleSave(p)}>
                        🔖 {ta ? "சேமி" : "Save"}
                      </button>
                      {isMine ? (
                        <button className="btn small" onClick={() => unpublish(p)}>
                          {ta ? "நீக்கு" : "Remove"}
                        </button>
                      ) : (
                        <button className="btn small" onClick={() => { setReportFor(reportFor === p.id ? null : p.id); setReportReason(""); }}>
                          🚩 {ta ? "புகார்" : "Report"}
                        </button>
                      )}
                    </div>
                    {shareBox && shareBox.postId === p.id ? (
                      <div style={{ marginTop: 8 }}>
                        <textarea readOnly rows={3} value={shareBox.text} style={{ width: "100%" }} />
                        <div className="row">
                          <button
                            className="btn small"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(shareBox.text);
                                setCopied(true);
                              } catch { /* clipboard unavailable — text is selectable */ }
                            }}
                          >
                            {copied ? (ta ? "நகலெடுக்கப்பட்டது ✓" : "Copied ✓") : ta ? "நகலெடு" : "Copy"}
                          </button>
                          <span className="small muted">{ta ? "இந்த copy-இல் உங்கள் சொந்த அழைப்புக் குறியீடு உள்ளது." : "This copy carries your own invite code."}</span>
                        </div>
                      </div>
                    ) : null}
                    {reportFor === p.id ? (
                      <div style={{ marginTop: 8 }}>
                        <Field label={ta ? "காரணம் (விருப்பம்)" : "Reason (optional)"}>
                          <input value={reportReason} onChange={(e) => setReportReason(e.target.value)} maxLength={300} />
                        </Field>
                        <div className="row">
                          <button className="btn small danger" onClick={() => sendReport(p)}>{ta ? "புகாரை அனுப்பு" : "Send report"}</button>
                          <button className="btn small" onClick={() => setReportFor(null)}>{ta ? "ரத்து" : "Cancel"}</button>
                        </div>
                        <p className="small muted">{ta ? "புகார் உரிமையாளரிடம் செல்லும்; அவர் பதிவை நீக்கலாம்." : "The report goes to the owner, who can remove the post."}</p>
                      </div>
                    ) : null}
                    {openComments[p.id] ? (
                      <div style={{ marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 8 }}>
                        {(comments[p.id] ?? []).map((c) => (
                          <div key={c.id} className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                            <p className="small" style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>
                              <Link href={`/app/member?u=${c.user_id}`}><b>{c.author_name}</b></Link>
                              {c.author_founder ? <span className="badge live">🏆 #{c.author_founder}</span> : null}
                              {" — "}{c.body}
                            </p>
                            {(me && (c.user_id === me.id || p.user_id === me.id)) ? (
                              <button className="btn small" onClick={() => deleteComment(p, c)}>{ta ? "நீக்கு" : "Delete"}</button>
                            ) : null}
                          </div>
                        ))}
                        {(comments[p.id] ?? []).length === 0 ? (
                          <p className="small muted">{ta ? "இன்னும் கருத்துகள் இல்லை." : "No comments yet."}</p>
                        ) : null}
                        <div className="row" style={{ marginTop: 6 }}>
                          <input
                            value={drafts[p.id] ?? ""}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder={ta ? "கருத்து எழுதுங்கள்…" : "Write a comment…"}
                            maxLength={500}
                            style={{ flex: 1, minWidth: 140 }}
                          />
                          <button className="btn small primary" onClick={() => addComment(p)}>{ta ? "அனுப்பு" : "Send"}</button>
                        </div>
                      </div>
                    ) : null}
                    {p.creative_id ? (
                      p.allow_reuse ? (
                        <div className="row" style={{ marginTop: 8 }}>
                          <button className="btn small primary" onClick={() => reuseCreative(p)}>
                            {ta ? "இந்த design-ஐப் பயன்படுத்து" : "Use this design"}
                          </button>
                        </div>
                      ) : (
                        <p className="small muted" style={{ marginTop: 8 }}>
                          {ta ? "இந்த design-ஐ மீண்டும் பயன்படுத்த உரிமையாளர் அனுமதிக்கவில்லை." : "The owner hasn't allowed reuse of this design."}
                        </p>
                      )
                    ) : p.media_id ? (
                      p.allow_reuse ? (
                        <div className="row" style={{ marginTop: 8 }}>
                          <button className="btn small primary" onClick={() => reuseVideo(p)}>
                            {ta ? "இந்த வீடியோவைப் பயன்படுத்து" : "Use this video"}
                          </button>
                        </div>
                      ) : (
                        <p className="small muted" style={{ marginTop: 8 }}>
                          {ta ? "இந்த வீடியோவை மீண்டும் பயன்படுத்த உரிமையாளர் அனுமதிக்கவில்லை." : "The owner hasn't allowed reuse of this video."}
                        </p>
                      )
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
