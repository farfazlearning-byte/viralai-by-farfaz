"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, loadLang, saveLang, type Lang } from "@/lib/client";

export interface MeInfo {
  id: number;
  name: string;
  email: string;
  is_owner: boolean;
  founder_number: number | null;
  country?: string;
  city?: string;
  position?: { tier: string; viaFreeDays: boolean; sourceLabel: string };
}

const TABS: Array<{ href: string; en: string; ta: string; ownerOnly?: boolean }> = [
  { href: "/app", en: "Dashboard", ta: "டாஷ்போர்டு" },
  { href: "/app/studio", en: "Ad Studio", ta: "Studio" },
  { href: "/app/campaigns", en: "Campaigns", ta: "பிரச்சாரங்கள்" },
  { href: "/app/library", en: "Design Library", ta: "Design நூலகம்" },
  { href: "/app/showcase", en: "Our Showcase", ta: "நம்முடைய விளம்பரங்கள்" },
  { href: "/app/community", en: "Community", ta: "சமூகம்" },
  { href: "/app/explore", en: "Explore", ta: "ஆராய்க" },
  { href: "/app/stores", en: "Stores", ta: "கடைகள்" },
  { href: "/app/store-dashboard", en: "My Store", ta: "என் கடை" },
  { href: "/app/orders", en: "My Orders", ta: "என் Order-கள்" },
  { href: "/app/delivery", en: "Delivery", ta: "Delivery" },
  { href: "/app/teams", en: "Teams", ta: "அணிகள்" },
  { href: "/app/partners", en: "Tools & Partners", ta: "கூட்டாளர்கள்" },
  { href: "/app/growth", en: "Growth", ta: "வளர்ச்சி" },
  { href: "/app/plans", en: "Plans", ta: "திட்டங்கள்" },
  { href: "/app/media", en: "My Media", ta: "என் Media" },
  { href: "/app/strategy", en: "Strategy", ta: "உத்தி" },
  { href: "/owner", en: "Owner Control", ta: "உரிமையாளர்", ownerOnly: true },
];

export function useMe(): { me: MeInfo | null; loading: boolean } {
  const [me, setMe] = useState<MeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api("/api/auth")
      .then((d) => setMe((d.user as MeInfo) ?? null))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);
  return { me, loading };
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(loadLang()), []);
  const set = (l: Lang) => {
    setLang(l);
    saveLang(l);
  };
  return [lang, set];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useMe();
  const [lang, setLang] = useLang();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (me) {
      api("/api/notifications")
        .then((d) => setUnread(Number(d.unread ?? 0)))
        .catch(() => {});
    }
  }, [me, pathname]);
  return (
    <div>
      <header className="topbar">
        <Link className="logo" href={me ? "/app" : "/"}>
          ViralAI <b>by FARFAZ</b>
        </Link>
        <span style={{ flex: 1 }} />
        {unread > 0 && <span className="badge live">🔔 {unread}</span>}
        <button className="btn small" onClick={() => setLang(lang === "en" ? "ta" : "en")}>
          {lang === "en" ? "தமிழ்" : "English"}
        </button>
        {loading ? null : me ? (
          <>
            <span className="small muted">{me.name}{me.is_owner ? " · Owner" : ""}{me.founder_number ? ` · 🏆 Founder #${me.founder_number}` : ""}</span>
            <button
              className="btn small"
              onClick={async () => {
                await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "signout" }) }).catch(() => {});
                window.location.href = "/";
              }}
            >
              {lang === "ta" ? "வெளியேறுக" : "Sign out"}
            </button>
          </>
        ) : (
          <Link className="btn small primary" href="/auth">{lang === "ta" ? "உள்நுழைக" : "Sign in"}</Link>
        )}
      </header>
      {me && (
        <nav className="tabs">
          {TABS.filter((t) => !t.ownerOnly || me.is_owner).map((t) => (
            <Link key={t.href} href={t.href} className={pathname === t.href ? "on" : ""}>
              {lang === "ta" ? t.ta : t.en}
            </Link>
          ))}
        </nav>
      )}
      <main className="wrap">{children}</main>
      <footer className="foot wrap">
        ViralAI by FARFAZ · {lang === "ta" ? "நேர்மைப் பெயர்கள்: உருவகப்படுத்திய புள்ளிவிவரங்கள் SIMULATED எனக் குறிக்கப்படும்; இணைக்கப்படாத கூட்டாளர்கள் REGISTERED." : "Honesty labels: simulated figures are marked SIMULATED; unconnected partners are REGISTERED."}
      </footer>
    </div>
  );
}
