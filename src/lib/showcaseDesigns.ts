// The 11 rich showcase designs — templates that render TRUE house-ad content.
// Each is a design recipe (scene type + size + motion), never a media file:
// captions in the UI say honestly "animated scene — not a video file".
export interface ShowcaseDesign {
  key: string;
  sort: number;
  en: string;
  ta: string;
  scene: "karaoke" | "flashcard" | "carousel" | "banner" | "story-ring" | "quote-poster";
  size: "9:16" | "16:9" | "1:1";
  blurbEn: string;
  blurbTa: string;
}

export const SHOWCASE_DESIGNS: ShowcaseDesign[] = [
  { key: "karaoke-story-916", sort: 1, en: "Karaoke Word-Reveal — Story", ta: "கரோக்கி வார்த்தை வெளிப்பாடு — ஸ்டோரி", scene: "karaoke", size: "9:16", blurbEn: "Words light up one by one as if read aloud, with a play bar.", blurbTa: "வாசிப்பது போல வார்த்தைகள் ஒவ்வொன்றாக ஒளிரும், play பட்டியுடன்." },
  { key: "karaoke-wide-169", sort: 2, en: "Karaoke Word-Reveal — Wide", ta: "கரோக்கி வார்த்தை வெளிப்பாடு — அகலம்", scene: "karaoke", size: "16:9", blurbEn: "The word-reveal scene in cinema width.", blurbTa: "சினிமா அகலத்தில் வார்த்தை வெளிப்பாட்டுக் காட்சி." },
  { key: "karaoke-square-11", sort: 3, en: "Karaoke Word-Reveal — Square", ta: "கரோக்கி வார்த்தை வெளிப்பாடு — சதுரம்", scene: "karaoke", size: "1:1", blurbEn: "The word-reveal scene for feed posts.", blurbTa: "Feed பதிவுகளுக்கான வார்த்தை வெளிப்பாட்டுக் காட்சி." },
  { key: "flashcard-flip-916", sort: 4, en: "Tap-to-Flip Flashcard", ta: "தட்டினால் புரளும் Flashcard", scene: "flashcard", size: "9:16", blurbEn: "Hook on the front; tap to flip to the feature and brand line.", blurbTa: "முன்புறம் கவர்ச்சி; தட்டினால் அம்சமும் பிராண்ட் வரியும்." },
  { key: "flashcard-flip-11", sort: 5, en: "Tap-to-Flip Flashcard — Square", ta: "தட்டினால் புரளும் Flashcard — சதுரம்", scene: "flashcard", size: "1:1", blurbEn: "The flip card in square feed size.", blurbTa: "சதுர feed அளவில் புரளும் அட்டை." },
  { key: "carousel-chapters-45", sort: 6, en: "Chapter Carousel", ta: "அத்தியாயச் சுழல்", scene: "carousel", size: "1:1", blurbEn: "Swipe through one idea per card.", blurbTa: "ஒவ்வொரு அட்டையிலும் ஒரு கருத்து — தடவிச் செல்லுங்கள்." },
  { key: "banner-burst-169", sort: 7, en: "Offer Burst Banner", ta: "சலுகை வெடிப்பு பேனர்", scene: "banner", size: "16:9", blurbEn: "A wide banner with a starburst offer call-out.", blurbTa: "நட்சத்திர வடிவ சலுகை அழைப்புடன் அகல பேனர்." },
  { key: "story-ring-916", sort: 8, en: "Story Ring", ta: "ஸ்டோரி வளையம்", scene: "story-ring", size: "9:16", blurbEn: "A glowing ring frame like a story avatar, full-screen scene inside.", blurbTa: "ஸ்டோரி அவதார் போன்ற ஒளிரும் வளையச் சட்டம், உள்ளே முழுத் திரைக் காட்சி." },
  { key: "quote-poster-11", sort: 9, en: "Quote Poster", ta: "மேற்கோள் சுவரொட்டி", scene: "quote-poster", size: "1:1", blurbEn: "One strong line, poster-large, over a gradient scene.", blurbTa: "சாய்வுக் காட்சியில் சுவரொட்டி அளவில் ஒரு வலுவான வரி." },
  { key: "quote-poster-916", sort: 10, en: "Quote Poster — Story", ta: "மேற்கோள் சுவரொட்டி — ஸ்டோரி", scene: "quote-poster", size: "9:16", blurbEn: "The quote poster in story height.", blurbTa: "ஸ்டோரி உயரத்தில் மேற்கோள் சுவரொட்டி." },
  { key: "banner-clean-169", sort: 11, en: "Clean Announcement Banner", ta: "சுத்தமான அறிவிப்பு பேனர்", scene: "banner", size: "16:9", blurbEn: "A calm, news-style wide banner.", blurbTa: "அமைதியான, செய்தி பாணி அகல பேனர்." },
];

export function showcaseDesignByKey(key: string): ShowcaseDesign | undefined {
  return SHOWCASE_DESIGNS.find((d) => d.key === key);
}
