// Bilingual UI strings (English + தமிழ்). The UI picks per-user language in Settings;
// components use the LangContext or the `t()` helper with the current language.
export type Lang = "en" | "ta";

export const STR = {
  brand: { en: "ViralAI by FARFAZ", ta: "ViralAI by FARFAZ" },
  tagline: {
    en: "Ad intelligence for every business, in every city",
    ta: "ஒவ்வொரு நகரத்திலும், ஒவ்வொரு தொழிலுக்கும் விளம்பர அறிவு",
  },
  signIn: { en: "Sign in", ta: "உள்நுழைக" },
  createAccount: { en: "Create account", ta: "கணக்கு உருவாக்குக" },
  signOut: { en: "Sign out", ta: "வெளியேறுக" },
  googleSoon: {
    en: "Google sign-in — being connected. The app never asks for a Google password; real Google sign-in happens on Google's own page.",
    ta: "Google உள்நுழைவு — இணைக்கப்படுகிறது. இந்த app உங்கள் Google password-ஐ ஒருபோதும் கேட்காது; உண்மையான Google உள்நுழைவு Google-இன் சொந்தப் பக்கத்தில் நடக்கும்.",
  },
  dashboard: { en: "Dashboard", ta: "டாஷ்போர்டு" },
  studio: { en: "Ad Studio", ta: "விளம்பர Studio" },
  campaigns: { en: "Campaigns", ta: "பிரச்சாரங்கள்" },
  library: { en: "Design Library", ta: "Design நூலகம்" },
  showcase: { en: "Our Showcase", ta: "நம்முடைய விளம்பரங்கள்" },
  explore: { en: "Explore", ta: "ஆராய்க" },
  stores: { en: "Stores", ta: "கடைகள்" },
  myOrders: { en: "My Orders", ta: "என் Order-கள்" },
  delivery: { en: "Delivery Partner", ta: "Delivery கூட்டாளர்" },
  teams: { en: "Teams", ta: "அணிகள்" },
  partners: { en: "Tools & Partners", ta: "கருவிகள் & கூட்டாளர்கள்" },
  growth: { en: "Growth", ta: "வளர்ச்சி" },
  plans: { en: "Plans & Premium", ta: "திட்டங்கள் & Premium" },
  media: { en: "My Media", ta: "என் Media" },
  strategy: { en: "My Strategy", ta: "என் உத்தி" },
  ownerControl: { en: "Owner Control", ta: "உரிமையாளர் கட்டுப்பாடு" },
  settings: { en: "Settings", ta: "அமைப்புகள்" },
  simulated: { en: "SIMULATED", ta: "போலி (SIMULATED)" },
  registered: { en: "REGISTERED", ta: "பதிவு (REGISTERED)" },
  live: { en: "LIVE", ta: "நேரடி (LIVE)" },
  premium: { en: "PREMIUM", ta: "PREMIUM" },
  free: { en: "FREE", ta: "இலவசம்" },
  save: { en: "Save", ta: "சேமி" },
  cancel: { en: "Cancel", ta: "ரத்து" },
  delete: { en: "Delete", ta: "நீக்கு" },
  loading: { en: "Loading…", ta: "ஏற்றுகிறது…" },
  setupPending: {
    en: "The platform database is being set up. Please check back shortly.",
    ta: "Platform database அமைக்கப்படுகிறது. சிறிது நேரத்தில் மீண்டும் வாருங்கள்.",
  },
} as const;

export type StrKey = keyof typeof STR;

export function s(key: StrKey, lang: Lang): string {
  return STR[key][lang];
}
