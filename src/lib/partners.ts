// The 14 registered partners across four categories. Every status starts
// REGISTERED — a partner only becomes "joined" when the owner applies through
// the partner's own programme and records it. Money wording is typical-terms
// guidance, never a promise.

export interface PartnerDef {
  key: string;
  sort: number;
  name: string;
  category: "platforms" | "networks" | "affiliates" | "sponsorship";
  howEn: string;
  howTa: string;
  ownerStepEn: string;
  ownerStepTa: string;
  termsEn: string;
  termsTa: string;
}

export const PARTNER_CATEGORIES = [
  { key: "platforms", en: "Ad platforms (owner's own accounts)", ta: "விளம்பரத் தளங்கள் (உரிமையாளரின் சொந்தக் கணக்குகள்)" },
  { key: "networks", en: "Publisher ad networks", ta: "வெளியீட்டாளர் விளம்பர வலையமைப்புகள்" },
  { key: "affiliates", en: "Affiliate programmes", ta: "Affiliate திட்டங்கள்" },
  { key: "sponsorship", en: "Sponsorship slots", ta: "நிதியுதவி இடங்கள்" },
] as const;

export const PARTNERS: PartnerDef[] = [
  { key: "meta", sort: 1, name: "Meta (Facebook & Instagram Ads)", category: "platforms",
    howEn: "Members run ads from their own Meta ad accounts; ViralAI prepares campaigns and, once the owner connects his own Meta account, can publish with the member's approval.", howTa: "உறுப்பினர்கள் தங்கள் சொந்த Meta விளம்பரக் கணக்குகளிலிருந்து விளம்பரங்கள் இயக்குகிறார்கள்; ViralAI பிரச்சாரங்களைத் தயாரிக்கிறது, உரிமையாளர் தன் Meta கணக்கை இணைத்த பிறகு உறுப்பினரின் ஒப்புதலுடன் வெளியிடலாம்.",
    ownerStepEn: "Owner: create/verify the business's own Meta ad account and apply to the Meta partner programme.", ownerStepTa: "உரிமையாளர்: தொழிலின் சொந்த Meta விளம்பரக் கணக்கை உருவாக்கி/சரிபார்த்து Meta கூட்டாளர் திட்டத்துக்கு விண்ணப்பியுங்கள்.",
    termsEn: "Programme terms vary; no commission is guaranteed.", termsTa: "திட்ட விதிமுறைகள் மாறுபடும்; கமிஷன் உறுதியளிக்கப்படவில்லை." },
  { key: "google-partners", sort: 2, name: "Google Partners (Google Ads)", category: "platforms",
    howEn: "Members advertise on Google Search/YouTube from their own Google Ads accounts; ViralAI drafts ads and budgets.", howTa: "உறுப்பினர்கள் தங்கள் சொந்த Google Ads கணக்குகளிலிருந்து Google Search/YouTube-இல் விளம்பரம் செய்கிறார்கள்; ViralAI விளம்பரங்களையும் பட்ஜெட்டுகளையும் வரைகிறது.",
    ownerStepEn: "Owner: sign the business up for Google Partners with its own Google Ads manager account.", ownerStepTa: "உரிமையாளர்: தொழிலின் சொந்த Google Ads manager கணக்குடன் Google Partners-இல் பதிவு செய்யுங்கள்.",
    termsEn: "Partner status depends on Google's own requirements.", termsTa: "கூட்டாளர் நிலை Google-இன் சொந்தத் தேவைகளைப் பொறுத்தது." },
  { key: "tiktok-partners", sort: 3, name: "TikTok Marketing Partners", category: "platforms",
    howEn: "Short-video ad preparation for members who advertise on TikTok with their own accounts.", howTa: "தங்கள் சொந்தக் கணக்குகளுடன் TikTok-இல் விளம்பரம் செய்யும் உறுப்பினர்களுக்குக் குறும் வீடியோ விளம்பரத் தயாரிப்பு.",
    ownerStepEn: "Owner: apply through TikTok's marketing partner directory.", ownerStepTa: "உரிமையாளர்: TikTok-இன் சந்தைப்படுத்தல் கூட்டாளர் அடைவு மூலம் விண்ணப்பியுங்கள்.",
    termsEn: "Availability differs by country.", termsTa: "கிடைக்கும் தன்மை நாட்டுக்கு நாடு மாறுபடும்." },
  { key: "adsense", sort: 4, name: "Google AdSense", category: "networks",
    howEn: "Clearly labelled ad placements inside ViralAI's public pages can earn revenue share once Google approves the site.", howTa: "Google தளத்தை ஒப்புக் கொண்ட பிறகு, ViralAI-இன் பொதுப் பக்கங்களில் தெளிவாகப் பெயரிடப்பட்ட விளம்பர இடங்கள் வருவாய்ப் பங்கை ஈட்டலாம்.",
    ownerStepEn: "Owner: apply for AdSense with the public domain after launch.", ownerStepTa: "உரிமையாளர்: தொடக்கத்துக்குப் பிறகு பொது டொமைனுடன் AdSense-க்கு விண்ணப்பியுங்கள்.",
    termsEn: "Pays only when real ads are shown to real users, after Google's approval and thresholds.", termsTa: "Google-இன் ஒப்புதல் மற்றும் வரம்புகளுக்குப் பிறகு, உண்மையான விளம்பரங்கள் உண்மையான பயனர்களுக்குக் காட்டப்படும்போது மட்டுமே பணம்." },
  { key: "audience-network", sort: 5, name: "Meta Audience Network", category: "networks",
    howEn: "In-app placements monetised through Meta's network after approval.", howTa: "ஒப்புதலுக்குப் பிறகு Meta வலையமைப்பு மூலம் பணமாக்கப்படும் in-app இடங்கள்.",
    ownerStepEn: "Owner: apply from the business's Meta account.", ownerStepTa: "உரிமையாளர்: தொழிலின் Meta கணக்கிலிருந்து விண்ணப்பியுங்கள்.",
    termsEn: "Approval and payouts follow Meta's policies.", termsTa: "ஒப்புதலும் பணமும் Meta-இன் கொள்கைகளின்படி." },
  { key: "admob", sort: 6, name: "Google AdMob", category: "networks",
    howEn: "Reserved for a future native app edition; the web app does not run AdMob.", howTa: "எதிர்கால native app பதிப்புக்கு ஒதுக்கப்பட்டது; இணையச் செயலி AdMob-ஐ இயக்காது.",
    ownerStepEn: "Owner: no action until a native app exists.", ownerStepTa: "உரிமையாளர்: native app வரும் வரை எந்த நடவடிக்கையும் இல்லை.",
    termsEn: "Not applicable yet.", termsTa: "இன்னும் பொருந்தாது." },
  { key: "youtube-partner", sort: 7, name: "YouTube Partner Program", category: "networks",
    howEn: "The FARFAZ Learning YouTube channel can earn from its own videos once the channel meets YouTube's requirements.", howTa: "சேனல் YouTube-இன் தேவைகளைப் பூர்த்தி செய்த பிறகு FARFAZ Learning YouTube சேனல் தன் சொந்த வீடியோக்களிலிருந்து ஈட்டலாம்.",
    ownerStepEn: "Owner: grow the channel to YouTube's thresholds, then apply inside YouTube Studio.", ownerStepTa: "உரிமையாளர்: சேனலை YouTube வரம்புகளுக்கு வளர்த்து, YouTube Studio-வில் விண்ணப்பியுங்கள்.",
    termsEn: "Requires YouTube's subscriber/watch-hour thresholds and review.", termsTa: "YouTube-இன் சந்தாதாரர்/பார்வை-மணி வரம்புகளும் மதிப்பாய்வும் தேவை." },
  { key: "canva", sort: 8, name: "Canva Affiliate Program", category: "affiliates",
    howEn: "Members who sign up for Canva through our tracked link earn us a commission at no extra cost to them.", howTa: "எங்கள் கண்காணிப்பு இணைப்பு மூலம் Canva-வில் பதிவு செய்யும் உறுப்பினர்கள், அவர்களுக்குக் கூடுதல் செலவின்றி எங்களுக்குக் கமிஷன் ஈட்டுகிறார்கள்.",
    ownerStepEn: "Owner: join Canva's affiliate programme, then paste the tracked link in Owner Control.", ownerStepTa: "உரிமையாளர்: Canva affiliate திட்டத்தில் இணைந்து, கண்காணிப்பு இணைப்பை Owner Control-இல் ஒட்டுங்கள்.",
    termsEn: "Typical affiliate commissions vary by plan and region — not a promise.", termsTa: "வழக்கமான affiliate கமிஷன்கள் திட்டம் மற்றும் பகுதியைப் பொறுத்து மாறுபடும் — வாக்குறுதி அல்ல." },
  { key: "jasper", sort: 9, name: "Jasper Affiliate Program", category: "affiliates",
    howEn: "AI writing tool referrals through our tracked link.", howTa: "எங்கள் கண்காணிப்பு இணைப்பு மூலம் AI எழுத்துக் கருவி பரிந்துரைகள்.",
    ownerStepEn: "Owner: join Jasper's affiliate programme and paste the tracked link.", ownerStepTa: "உரிமையாளர்: Jasper affiliate திட்டத்தில் இணைந்து இணைப்பை ஒட்டுங்கள்.",
    termsEn: "Commission terms are set by Jasper.", termsTa: "கமிஷன் விதிமுறைகள் Jasper ஆல் நிர்ணயிக்கப்படுகின்றன." },
  { key: "adcreative", sort: 10, name: "AdCreative.ai Affiliate Program", category: "affiliates",
    howEn: "AI ad-creative tool referrals through our tracked link — shown honestly as a partner tool, not part of ViralAI.", howTa: "எங்கள் கண்காணிப்பு இணைப்பு மூலம் AI விளம்பர-உருவாக்கக் கருவி பரிந்துரைகள் — ViralAI-இன் பகுதியாக அல்ல, கூட்டாளர் கருவியாக நேர்மையாகக் காட்டப்படுகிறது.",
    ownerStepEn: "Owner: join the AdCreative.ai affiliate programme and paste the tracked link.", ownerStepTa: "உரிமையாளர்: AdCreative.ai affiliate திட்டத்தில் இணைந்து இணைப்பை ஒட்டுங்கள்.",
    termsEn: "Commission terms are set by AdCreative.ai.", termsTa: "கமிஷன் விதிமுறைகள் AdCreative.ai ஆல் நிர்ணயிக்கப்படுகின்றன." },
  { key: "semrush", sort: 11, name: "Semrush Affiliate Program", category: "affiliates",
    howEn: "SEO/marketing-tool referrals through our tracked link.", howTa: "எங்கள் கண்காணிப்பு இணைப்பு மூலம் SEO/சந்தைப்படுத்தல் கருவி பரிந்துரைகள்.",
    ownerStepEn: "Owner: join Semrush's affiliate programme and paste the tracked link.", ownerStepTa: "உரிமையாளர்: Semrush affiliate திட்டத்தில் இணைந்து இணைப்பை ஒட்டுங்கள்.",
    termsEn: "Commission terms are set by Semrush.", termsTa: "கமிஷன் விதிமுறைகள் Semrush ஆல் நிர்ணயிக்கப்படுகின்றன." },
  { key: "hubspot", sort: 12, name: "HubSpot Affiliate Program", category: "affiliates",
    howEn: "CRM/marketing-platform referrals through our tracked link.", howTa: "எங்கள் கண்காணிப்பு இணைப்பு மூலம் CRM/சந்தைப்படுத்தல் தளப் பரிந்துரைகள்.",
    ownerStepEn: "Owner: join HubSpot's affiliate programme and paste the tracked link.", ownerStepTa: "உரிமையாளர்: HubSpot affiliate திட்டத்தில் இணைந்து இணைப்பை ஒட்டுங்கள்.",
    termsEn: "Commission terms are set by HubSpot.", termsTa: "கமிஷன் விதிமுறைகள் HubSpot ஆல் நிர்ணயிக்கப்படுகின்றன." },
  { key: "directory-sponsor", sort: 13, name: "Featured Skills Directory placement", category: "sponsorship",
    howEn: "Businesses can sponsor a clearly labelled featured placement in the public Skills Directory — agreed in writing, owner-approved.", howTa: "தொழில்கள் பொது Skills அடைவில் தெளிவாகப் பெயரிடப்பட்ட சிறப்பு இடத்துக்கு நிதியுதவி செய்யலாம் — எழுத்தில் ஒப்புக் கொள்ளப்பட்டு, உரிமையாளர் ஒப்புதலுடன்.",
    ownerStepEn: "Owner: agree price and period in writing before switching a slot on.", ownerStepTa: "உரிமையாளர்: இடத்தை இயக்கும் முன் விலையையும் காலத்தையும் எழுத்தில் ஒப்புக் கொள்ளுங்கள்.",
    termsEn: "Sponsorship never changes honesty labels.", termsTa: "நிதியுதவி நேர்மைப் பெயர்களை ஒருபோதும் மாற்றாது." },
  { key: "showcase-sponsor", sort: 14, name: "Sponsored Showcase card", category: "sponsorship",
    howEn: "A clearly labelled sponsored card in Our Showcase, next to the free house ads.", howTa: "இலவச வீட்டு விளம்பரங்களுக்கு அருகில், Our Showcase-இல் தெளிவாகப் பெயரிடப்பட்ட நிதியுதவி அட்டை.",
    ownerStepEn: "Owner: approve each sponsor and card personally.", ownerStepTa: "உரிமையாளர்: ஒவ்வொரு நிதியுதவியாளரையும் அட்டையையும் தனிப்பட்ட முறையில் ஒப்புக் கொள்ளுங்கள்.",
    termsEn: "Sponsored cards are always labelled SPONSORED.", termsTa: "நிதியுதவி அட்டைகள் எப்போதும் SPONSORED எனப் பெயரிடப்படும்." },
];
