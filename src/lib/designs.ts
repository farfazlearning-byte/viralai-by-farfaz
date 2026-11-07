// Design Library definitions. The Library is DATA generated programmatically from
// family × kind × size × theme — exactly like the hosted build — so the counts
// shown in the app are COMPUTED from these generators (never a printed claim).

export interface DesignFamily {
  key: string;
  en: string;
  ta: string;
  premium: boolean;
  palette: [string, string, string]; // bg gradient a, bg gradient b, accent
  vibeEn: string;
  vibeTa: string;
}

export const FAMILIES: DesignFamily[] = [
  // ---- 20 premium design families ----
  { key: "cinematic-film-poster", en: "Cinematic Film Poster", ta: "சினிமா திரைப்பட சுவரொட்டி", premium: true, palette: ["#0b0b1e", "#3b0764", "#f5c542"], vibeEn: "Movie-poster drama, bold title", vibeTa: "திரைப்பட சுவரொட்டி பாணி, தடித்த தலைப்பு" },
  { key: "luxury-gold", en: "Luxury Gold", ta: "ஆடம்பர தங்கம்", premium: true, palette: ["#111111", "#3a2c00", "#e8b23a"], vibeEn: "Black and gold premium finish", vibeTa: "கருப்பு-தங்க ஆடம்பர நிறைவு" },
  { key: "neon-cyber", en: "Neon Cyber", ta: "நியான் சைபர்", premium: true, palette: ["#020617", "#0e7490", "#00f2fe"], vibeEn: "Glowing neon on deep navy", vibeTa: "ஆழ்ந்த நீலத்தில் ஒளிரும் நியான்" },
  { key: "swiss-editorial", en: "Swiss Editorial", ta: "சுவிஸ் தலையங்கம்", premium: true, palette: ["#ffffff", "#e5e5e5", "#dc2626"], vibeEn: "Clean grid, editorial type", vibeTa: "சுத்தமான கட்டம், தலையங்க எழுத்து" },
  { key: "gradient-mesh", en: "Gradient Mesh", ta: "சாய்வு வலை", premium: true, palette: ["#312e81", "#db2777", "#f59e0b"], vibeEn: "Flowing multi-colour mesh", vibeTa: "பாயும் பல-வண்ண சாய்வு" },
  { key: "product-hero", en: "Product Hero", ta: "பொருள் நாயகன்", premium: true, palette: ["#0f172a", "#1e40af", "#38bdf8"], vibeEn: "One product, centre stage", vibeTa: "ஒரு பொருள், மைய மேடை" },
  { key: "launch-countdown", en: "Launch Countdown", ta: "தொடக்க எண்ணிக்கை", premium: true, palette: ["#1c1917", "#7c2d12", "#fb923c"], vibeEn: "Countdown energy for launches", vibeTa: "தொடக்கத்துக்கான எண்ணிக்கை ஆற்றல்" },
  { key: "offer-burst", en: "Offer Burst", ta: "சலுகை வெடிப்பு", premium: true, palette: ["#7f1d1d", "#dc2626", "#fde047"], vibeEn: "Starburst offer call-outs", vibeTa: "நட்சத்திர வடிவ சலுகை அழைப்புகள்" },
  { key: "before-after", en: "Before–After", ta: "முன்–பின்", premium: true, palette: ["#334155", "#0f766e", "#5eead4"], vibeEn: "Split before/after story", vibeTa: "பிரிந்த முன்/பின் கதை" },
  { key: "testimonial-spotlight", en: "Testimonial Spotlight", ta: "பாராட்டு மையம்", premium: true, palette: ["#1e293b", "#475569", "#facc15"], vibeEn: "Customer words in the spotlight", vibeTa: "வாடிக்கையாளர் வார்த்தைகள் மையத்தில்" },
  { key: "festival-grand", en: "Festival Grand", ta: "பண்டிகை பிரம்மாண்டம்", premium: true, palette: ["#4a044e", "#9d174d", "#fbbf24"], vibeEn: "Grand festival celebration", vibeTa: "பிரம்மாண்ட பண்டிகை கொண்டாட்டம்" },
  { key: "kids-playful", en: "Kids Playful", ta: "குழந்தைகள் விளையாட்டு", premium: true, palette: ["#fef9c3", "#fda4af", "#38bdf8"], vibeEn: "Bright, round, friendly shapes", vibeTa: "பிரகாசமான, வட்டமான, நட்பு வடிவங்கள்" },
  { key: "corporate-clean", en: "Corporate Clean", ta: "நிறுவன சுத்தம்", premium: true, palette: ["#f8fafc", "#cbd5e1", "#1d4ed8"], vibeEn: "Boardroom-clean and calm", vibeTa: "அமைதியான நிறுவனத் தோற்றம்" },
  { key: "retro-pop", en: "Retro Pop", ta: "ரெட்ரோ பாப்", premium: true, palette: ["#fef3c7", "#f97316", "#db2777"], vibeEn: "70s pop colour and type", vibeTa: "70களின் பாப் வண்ணமும் எழுத்தும்" },
  { key: "nature-fresh", en: "Nature Fresh", ta: "இயற்கை புதுமை", premium: true, palette: ["#052e16", "#166534", "#a3e635"], vibeEn: "Leafy greens, fresh air", vibeTa: "பசுமையான இலைகள், புதிய காற்று" },
  { key: "food-feast", en: "Food Feast", ta: "உணவு விருந்து", premium: true, palette: ["#431407", "#9a3412", "#fbbf24"], vibeEn: "Warm, rich, appetising", vibeTa: "சூடான, செழிப்பான, பசியைத் தூண்டும்" },
  { key: "fashion-lookbook", en: "Fashion Lookbook", ta: "ஃபேஷன் லுக்புக்", premium: true, palette: ["#18181b", "#71717a", "#f5f5f4"], vibeEn: "Editorial fashion frames", vibeTa: "தலையங்க ஃபேஷன் சட்டங்கள்" },
  { key: "tech-launch", en: "Tech Launch", ta: "தொழில்நுட்ப தொடக்கம்", premium: true, palette: ["#020617", "#1e3a8a", "#22d3ee"], vibeEn: "Keynote-stage tech energy", vibeTa: "மேடை பாணி தொழில்நுட்ப ஆற்றல்" },
  { key: "realestate-showcase", en: "Real-Estate Showcase", ta: "சொத்து காட்சி", premium: true, palette: ["#0c4a6e", "#075985", "#fde68a"], vibeEn: "Property hero with trust tones", vibeTa: "நம்பிக்கை தொனியில் சொத்து காட்சி" },
  { key: "wedding-royal", en: "Wedding Royal", ta: "திருமண அரச", premium: true, palette: ["#3b0764", "#86198f", "#f9a8d4"], vibeEn: "Royal wedding elegance", vibeTa: "அரச திருமண நேர்த்தி" },
  // ---- Free starter set (owner-facing basics) ----
  { key: "clean-starter", en: "Clean Starter", ta: "சுத்தமான தொடக்கம்", premium: false, palette: ["#0f172a", "#334155", "#38bdf8"], vibeEn: "Simple, clear, works for any trade", vibeTa: "எளிமை, தெளிவு, எந்தத் தொழிலுக்கும்" },
  { key: "bold-banner", en: "Bold Banner", ta: "தடித்த பேனர்", premium: false, palette: ["#111827", "#b91c1c", "#f59e0b"], vibeEn: "Big words, strong contrast", vibeTa: "பெரிய வார்த்தைகள், வலுவான மாறுபாடு" },
  { key: "soft-pastel", en: "Soft Pastel", ta: "மென்மையான பாஸ்டல்", premium: false, palette: ["#fdf4ff", "#f0abfc", "#7c3aed"], vibeEn: "Gentle pastel calm", vibeTa: "மென்மையான பாஸ்டல் அமைதி" },
  { key: "shop-window", en: "Shop Window", ta: "கடை ஜன்னல்", premium: false, palette: ["#052e2b", "#0f766e", "#facc15"], vibeEn: "Like a bright shop window", vibeTa: "பிரகாசமான கடை ஜன்னல் போல" },
  { key: "announcement", en: "Announcement", ta: "அறிவிப்பு", premium: false, palette: ["#1e293b", "#0ea5e9", "#e0f2fe"], vibeEn: "Straight news-style notice", vibeTa: "நேரடியான செய்தி பாணி அறிவிப்பு" },
  { key: "photo-frame", en: "Photo Frame", ta: "புகைப்பட சட்டம்", premium: false, palette: ["#292524", "#78716c", "#e7e5e4"], vibeEn: "A frame for your own photo", vibeTa: "உங்கள் புகைப்படத்துக்கான சட்டம்" },
];

export const KINDS = [
  { key: "animated", en: "Animated", ta: "அசையும்" },
  { key: "video-style", en: "Video-style", ta: "வீடியோ பாணி" },
  { key: "cinematic", en: "Cinematic", ta: "சினிமா பாணி" },
  { key: "poster", en: "Image / Poster", ta: "படம் / சுவரொட்டி" },
  { key: "flashcard", en: "Flashcard", ta: "ஃபிளாஷ் அட்டை" },
  { key: "carousel", en: "Carousel", ta: "சுழல் அட்டைகள்" },
  { key: "story-ring", en: "Story Ring", ta: "ஸ்டோரி வளையம்" },
  { key: "banner", en: "Banner", ta: "பேனர்" },
  { key: "quote", en: "Quote / Poster", ta: "மேற்கோள் / சுவரொட்டி" },
  { key: "festival", en: "Festival", ta: "பண்டிகை" },
] as const;
export type KindKey = (typeof KINDS)[number]["key"];

export const SIZES = [
  { key: "9:16", en: "Story 9:16", ta: "ஸ்டோரி 9:16" },
  { key: "16:9", en: "Wide 16:9", ta: "அகலம் 16:9" },
  { key: "1:1", en: "Square 1:1", ta: "சதுரம் 1:1" },
  { key: "4:5", en: "Portrait 4:5", ta: "நெடுவரிசை 4:5" },
] as const;
export type SizeKey = (typeof SIZES)[number]["key"];

export interface DesignDef {
  id: string; // family:kind:size:theme
  familyKey: string;
  familyEn: string;
  familyTa: string;
  premium: boolean;
  kind: KindKey;
  kindEn: string;
  kindTa: string;
  size: SizeKey;
  theme: "dark" | "light";
  palette: [string, string, string];
  vibeEn: string;
  vibeTa: string;
}

const THEMES: Array<"dark" | "light"> = ["dark", "light"];

let cache: DesignDef[] | null = null;

/** All library designs, generated from family × kind × size × theme. */
export function allDesigns(): DesignDef[] {
  if (cache) return cache;
  const out: DesignDef[] = [];
  for (const fam of FAMILIES) {
    for (const kind of KINDS) {
      for (const size of SIZES) {
        for (const theme of THEMES) {
          out.push({
            id: `${fam.key}:${kind.key}:${size.key}:${theme}`,
            familyKey: fam.key,
            familyEn: fam.en,
            familyTa: fam.ta,
            premium: fam.premium,
            kind: kind.key,
            kindEn: kind.en,
            kindTa: kind.ta,
            size: size.key,
            theme,
            palette: fam.palette,
            vibeEn: fam.vibeEn,
            vibeTa: fam.vibeTa,
          });
        }
      }
    }
  }
  cache = out;
  return out;
}

export function designById(id: string): DesignDef | undefined {
  return allDesigns().find((d) => d.id === id);
}
