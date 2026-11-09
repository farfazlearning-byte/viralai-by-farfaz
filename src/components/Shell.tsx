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
  { href: "/app/notifications", en: "Notifications", ta: "அறிவிப்புகள்" },
  { href: "/app/guide", en: "Guide", ta: "வழிகாட்டி" },
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

// ── Phase 3 usability: a "How this page works" strip for every main
// page. Three short steps per page, in the visitor's chosen language
// (the strip's title is always bilingual). Collapsed by default so it
// never blocks the page's main action. Keyed by pathname; rendered by
// AppShell so every page gets it from one place.
const PAGE_HELP: Record<string, Array<{ en: string; ta: string }>> = {
  "/app": [
    { en: "This is your home. Your real numbers are shown here.", ta: "இது உங்கள் முகப்பு. உங்கள் உண்மையான எண்ணிக்கைகள் இங்கே தெரியும்." },
    { en: "Tap any card to open that area.", ta: "எந்த அட்டையையும் அழுத்தினால் அந்தப் பகுதி திறக்கும்." },
    { en: "New here? Follow the 5 steps in “Start here”.", ta: "புதியவரா? “Start here”-இல் உள்ள 5 படிகளைப் பின்பற்றுங்கள்." },
  ],
  "/app/studio": [
    { en: "Pick a design, or start from one you saved.", ta: "ஒரு design-ஐத் தேர்ந்தெடுங்கள், அல்லது சேமித்ததிலிருந்து தொடங்குங்கள்." },
    { en: "Type your words and add your photo or video.", ta: "உங்கள் வார்த்தைகளை எழுதி, படம் அல்லது வீடியோவைச் சேருங்கள்." },
    { en: "Save it, then use Export & Share to download or share it.", ta: "சேமியுங்கள்; பிறகு Export & Share-ஆல் இறக்கவோ பகிரவோ செய்யுங்கள்." },
  ],
  "/app/campaigns": [
    { en: "Create a campaign with a name and a goal.", ta: "பெயரும் இலக்கும் வைத்து ஒரு பிரச்சாரத்தை உருவாக்குங்கள்." },
    { en: "Add your saved designs to the campaign.", ta: "சேமித்த designs-ஐப் பிரச்சாரத்தில் சேருங்கள்." },
    { en: "The figures here are SIMULATED guidance until real ad accounts are connected.", ta: "உண்மையான விளம்பரக் கணக்குகள் இணையும் வரை இங்குள்ள எண்கள் SIMULATED வழிகாட்டுதலே." },
  ],
  "/app/library": [
    { en: "Look through the designs — by family, size and style.", ta: "Designs-ஐப் பாருங்கள் — வகை, அளவு, பாணி வாரியாக." },
    { en: "Tap a design to see it big.", ta: "ஒரு design-ஐ அழுத்தினால் பெரிதாகத் தெரியும்." },
    { en: "“Use this design” opens it in the Studio with your words.", ta: "“Use this design” அழுத்தினால் அது Studio-வில் திறக்கும்." },
  ],
  "/app/showcase": [
    { en: "These are free house ads for the owner's own projects.", ta: "இவை உரிமையாளரின் சொந்தத் திட்டங்களுக்கான இலவச விளம்பரங்கள்." },
    { en: "Copy the share text — it carries YOUR OWN invite code.", ta: "பகிர்வு வாசகத்தை நகலெடுங்கள் — அதில் உங்கள் சொந்த அழைப்புக் குறியீடு இருக்கும்." },
    { en: "Paste it anywhere — WhatsApp, Instagram, YouTube.", ta: "எங்கும் ஒட்டுங்கள் — WhatsApp, Instagram, YouTube." },
  ],
  "/app/community": [
    { en: "Publish one of your own designs or videos, with a title.", ta: "உங்கள் சொந்த design அல்லது வீடியோவைத் தலைப்புடன் வெளியிடுங்கள்." },
    { en: "Like, comment, save and follow — every count is real.", ta: "Like, கருத்து, சேமிப்பு, பின்தொடர்தல் — ஒவ்வொரு எண்ணிக்கையும் உண்மையானது." },
    { en: "Stories last 24 hours. Reuse works only when the owner allowed it.", ta: "Stories 24 மணி நேரம் மட்டுமே. மீண்டும் பயன்படுத்துதல் உரிமையாளர் அனுமதித்தால் மட்டுமே." },
  ],
  "/app/notifications": [
    { en: "Likes, comments, shares and new followers on your posts appear here.", ta: "உங்கள் பதிவுகளின் like, கருத்து, பகிர்வு, புதிய பின்தொடர்பவர்கள் இங்கே தெரியும்." },
    { en: "Tap a notification to open it.", ta: "ஒரு அறிவிப்பை அழுத்தினால் அது திறக்கும்." },
    { en: "“Mark all as read” clears the bell. Notifications stay inside this app only.", ta: "“எல்லாவற்றையும் படித்ததாகக் குறி” மணியை அழிக்கும். அறிவிப்புகள் இந்த app-இன் உள்ளே மட்டுமே." },
  ],
  "/app/guide": [
    { en: "This guide explains every area in simple steps.", ta: "இந்த வழிகாட்டி ஒவ்வொரு பகுதியையும் எளிய படிகளில் விளக்குகிறது." },
    { en: "Tap a card's button to go straight to that area.", ta: "அட்டையின் பொத்தானை அழுத்தினால் நேரடியாக அந்தப் பகுதிக்குச் செல்லலாம்." },
    { en: "Come back any time — the Guide tab is always at the top.", ta: "எப்போது வேண்டுமானாலும் திரும்பி வாருங்கள் — Guide பொத்தான் எப்போதும் மேலே இருக்கும்." },
  ],
  "/app/explore": [
    { en: "See stores and activity around your place.", ta: "உங்கள் இடத்தைச் சுற்றியுள்ள கடைகளையும் நடவடிக்கைகளையும் பாருங்கள்." },
    { en: "Open anything you like to see more.", ta: "பிடித்ததைத் திறந்து மேலும் பாருங்கள்." },
    { en: "Your place comes from the city in your account — change it in Settings.", ta: "உங்கள் இடம் உங்கள் கணக்கில் உள்ள நகரத்திலிருந்து வரும் — Settings-இல் மாற்றலாம்." },
  ],
  "/app/stores": [
    { en: "Browse stores and their products.", ta: "கடைகளையும் அவற்றின் பொருட்களையும் பாருங்கள்." },
    { en: "Order what you want — you pay the store directly.", ta: "வேண்டியதை order செய்யுங்கள் — பணம் நேரடியாகக் கடைக்கே." },
    { en: "Your orders appear under My Orders.", ta: "உங்கள் orders My Orders-இன் கீழ் தெரியும்." },
  ],
  "/app/store-dashboard": [
    { en: "This is your own store's control page.", ta: "இது உங்கள் சொந்தக் கடையின் கட்டுப்பாட்டுப் பக்கம்." },
    { en: "Add your products and set your prices.", ta: "உங்கள் பொருட்களைச் சேர்த்து விலைகளை நிர்ணயுங்கள்." },
    { en: "Orders and deliveries for your store show here.", ta: "உங்கள் கடையின் orders மற்றும் deliveries இங்கே தெரியும்." },
  ],
  "/app/orders": [
    { en: "Your orders and their status are listed here.", ta: "உங்கள் orders-ம் அவற்றின் நிலையும் இங்கே பட்டியலிடப்படும்." },
    { en: "Pay the store directly, the way the store tells you.", ta: "கடை சொல்வது போல நேரடியாகக் கடைக்குச் செலுத்துங்கள்." },
    { en: "Selling? Orders from your store appear in the seller list.", ta: "விற்பவரா? உங்கள் கடையின் orders விற்பனையாளர் பட்டியலில் தெரியும்." },
  ],
  "/app/delivery": [
    { en: "See deliveries waiting near you.", ta: "உங்கள் அருகில் காத்திருக்கும் deliveries-ஐப் பாருங்கள்." },
    { en: "Claim one — the first claim wins.", ta: "ஒன்றை எடுங்கள் — முதலில் எடுப்பவருக்கே கிடைக்கும்." },
    { en: "Deliver it and mark it done to earn the store's fee.", ta: "கொண்டு சேர்த்து முடித்ததாகக் குறியுங்கள்; கடையின் கட்டணம் கிடைக்கும்." },
  ],
  "/app/teams": [
    { en: "Create a workspace for your team.", ta: "உங்கள் அணிக்கு ஒரு workspace உருவாக்குங்கள்." },
    { en: "Invite members and give each person a role.", ta: "உறுப்பினர்களை அழைத்து ஒவ்வொருவருக்கும் பங்கு தாருங்கள்." },
    { en: "Approvers say OK before work goes out.", ta: "வேலை வெளியே செல்லும் முன் Approver-கள் சரி சொல்வார்கள்." },
  ],
  "/app/partners": [
    { en: "These are tools and partner programmes. REGISTERED means not joined yet.", ta: "இவை கருவிகளும் கூட்டாளர் திட்டங்களும். REGISTERED என்றால் இன்னும் சேரவில்லை என்று பொருள்." },
    { en: "Join a programme on its own site when you are ready.", ta: "தயாரானதும் அதன் சொந்தத் தளத்தில் சேருங்கள்." },
    { en: "Earnings stay ₹0 until a programme actually pays.", ta: "ஒரு திட்டம் உண்மையில் செலுத்தும் வரை வருவாய் ₹0 தான்." },
  ],
  "/app/growth": [
    { en: "Your invite code and link are yours only.", ta: "உங்கள் அழைப்புக் குறியீடும் இணைப்பும் உங்களுக்கு மட்டுமே." },
    { en: "Share your link — when a friend joins and makes a first campaign, you earn free days.", ta: "உங்கள் இணைப்பைப் பகிருங்கள் — நண்பர் சேர்ந்து முதல் பிரச்சாரம் செய்தால் உங்களுக்கு இலவச நாட்கள்." },
    { en: "Your invites and free days are counted here, from real records.", ta: "உங்கள் அழைப்புகளும் இலவச நாட்களும் உண்மையான பதிவுகளிலிருந்து இங்கே எண்ணப்படும்." },
  ],
  "/app/plans": [
    { en: "Compare Free and Premium.", ta: "இலவசம் மற்றும் Premium-ஐ ஒப்பிடுங்கள்." },
    { en: "Pay with the QR shown for your country.", ta: "உங்கள் நாட்டுக்குக் காட்டப்படும் QR-ஆல் செலுத்துங்கள்." },
    { en: "The owner confirms your payment — only then does Premium start.", ta: "உரிமையாளர் உங்கள் பணத்தை உறுதிப்படுத்துவார் — அப்போதுதான் Premium தொடங்கும்." },
  ],
  "/app/media": [
    { en: "Upload your photos and videos here. They stay private.", ta: "உங்கள் படங்களையும் வீடியோக்களையும் இங்கே ஏற்றுங்கள். அவை தனிப்பட்டவை." },
    { en: "Use them in the Studio, Community posts and Stories.", ta: "அவற்றை Studio, சமூகப் பதிவுகள், Stories-இல் பயன்படுத்துங்கள்." },
    { en: "Delete anything you no longer want.", ta: "வேண்டாததை நீக்குங்கள்." },
  ],
  "/app/strategy": [
    { en: "Write your business goal in simple words.", ta: "உங்கள் தொழில் இலக்கை எளிய வார்த்தைகளில் எழுதுங்கள்." },
    { en: "Save it — your plan stays in your account.", ta: "சேமியுங்கள் — உங்கள் திட்டம் உங்கள் கணக்கில் இருக்கும்." },
    { en: "Read it again when you plan campaigns.", ta: "பிரச்சாரங்களைத் திட்டமிடும்போது மீண்டும் படியுங்கள்." },
  ],
  "/app/member": [
    { en: "This is a member's public profile — name, badge and posts only. No email or phone is ever shown.", ta: "இது ஒரு உறுப்பினரின் பொது விவரம் — பெயர், badge, பதிவுகள் மட்டுமே. Email அல்லது phone ஒருபோதும் காட்டப்படாது." },
    { en: "Follow them to see their posts in your Following feed.", ta: "அவர்களைப் பின்தொடர்ந்தால் அவர்களின் பதிவுகள் உங்கள் Following ஊட்டத்தில் தெரியும்." },
    { en: "Where reuse is allowed, open their design straight into the Studio.", ta: "மீண்டும் பயன்படுத்த அனுமதி இருந்தால், அவர்களின் design-ஐ நேரடியாக Studio-வில் திறக்கலாம்." },
  ],
  "/app/settings": [
    { en: "Update your name, city and other details here.", ta: "உங்கள் பெயர், நகரம் மற்றும் விவரங்களை இங்கே மாற்றுங்கள்." },
    { en: "Your invite code never changes.", ta: "உங்கள் அழைப்புக் குறியீடு ஒருபோதும் மாறாது." },
    { en: "Save before you leave the page.", ta: "பக்கத்தை விட்டுச் செல்லும் முன் சேமியுங்கள்." },
  ],
  "/app/categories": [
    { en: "Tick the kinds of business you run.", ta: "நீங்கள் நடத்தும் தொழில் வகைகளைத் தேர்ந்தெடுங்கள்." },
    { en: "Designs and ideas are matched to your choices.", ta: "Designs-ம் யோசனைகளும் உங்கள் தேர்வுகளுக்கு ஏற்ப வரும்." },
    { en: "Save — you can change them any time.", ta: "சேமியுங்கள் — எப்போது வேண்டுமானாலும் மாற்றலாம்." },
  ],
  "/owner": [
    { en: "Owner-only boards: members, payments, donations, reports and health.", ta: "உரிமையாளர்-மட்டும் பலகைகள்: உறுப்பினர்கள், பணம், நன்கொடைகள், புகார்கள், நிலை." },
    { en: "Approve payments and donations here — nothing confirms itself.", ta: "பணத்தையும் நன்கொடைகளையும் இங்கே ஒப்புங்கள் — எதுவும் தானாக உறுதியாகாது." },
    { en: "Community reports: dismiss them, or remove the post.", ta: "சமூகப் புகார்கள்: நிராகரியுங்கள், அல்லது பதிவை நீக்குங்கள்." },
  ],
  "/auth": [
    { en: "New here? Choose Sign up and fill the short form.", ta: "புதியவரா? Sign up-ஐத் தேர்ந்து சிறிய படிவத்தை நிரப்புங்கள்." },
    { en: "Already have an account? Choose Sign in with your email and password.", ta: "ஏற்கனவே கணக்கு உள்ளதா? உங்கள் email மற்றும் கடவுச்சொல்லால் உள்நுழையுங்கள்." },
    { en: "Your password is never shown to anyone — type it only on this page.", ta: "உங்கள் கடவுச்சொல் யாருக்கும் காட்டப்படாது — இந்தப் பக்கத்தில் மட்டுமே எழுதுங்கள்." },
  ],
};

function HelpStrip({ lang, steps }: { lang: Lang; steps: Array<{ en: string; ta: string }> }) {
  const [open, setOpen] = useState(false);
  const ta = lang === "ta";
  return (
    <div className="card" style={{ padding: "10px 14px" }}>
      <button
        className="btn small"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{ whiteSpace: "normal", textAlign: "left" }}
      >
        ❓ How this page works · இந்தப் பக்கம் எப்படி வேலை செய்கிறது {open ? "▴" : "▾"}
      </button>
      {open ? (
        <ol style={{ margin: "10px 0 2px", paddingLeft: 22 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ margin: "5px 0" }}>{ta ? s.ta : s.en}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
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
        {unread > 0 && <Link href="/app/notifications" className="badge live" style={{ textDecoration: "none" }}>🔔 {unread}</Link>}
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
      <main className="wrap">
        {PAGE_HELP[pathname] ? <HelpStrip lang={lang} steps={PAGE_HELP[pathname]} /> : null}
        {children}
      </main>
      <footer className="foot wrap">
        ViralAI by FARFAZ · {lang === "ta" ? "நேர்மைப் பெயர்கள்: உருவகப்படுத்திய புள்ளிவிவரங்கள் SIMULATED எனக் குறிக்கப்படும்; இணைக்கப்படாத கூட்டாளர்கள் REGISTERED." : "Honesty labels: simulated figures are marked SIMULATED; unconnected partners are REGISTERED."}
      </footer>
    </div>
  );
}
