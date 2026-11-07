// The 17 house-ad cards of Our Showcase. Free in-platform advertising for the
// owner's own projects, each carrying its honesty label. Content is the same as
// the verified hosted build; owners manage enable/reorder via the DB table.

export interface HouseAdDef {
  key: string;
  sort: number;
  titleEn: string;
  titleTa: string;
  bodyEn: string;
  bodyTa: string;
  labelEn: string;
  labelTa: string;
  icon: string;
  madeHowEn: string;
  madeHowTa: string;
}

const wes = {
  labelEn: "House ad — free · World Education System",
  labelTa: "வீட்டு விளம்பரம் — இலவசம் · World Education System",
};

export const HOUSE_ADS: HouseAdDef[] = [
  { key: "wes-main", sort: 1, titleEn: "FARFAZ — One World — Education System For Ever", titleTa: "FARFAZ — ஒரு உலகம் — என்றும் கல்வி அமைப்பு", bodyEn: "One education system for every country: LKG to Class 12 and beyond, taught by voice in the learner's own language.", bodyTa: "ஒவ்வொரு நாட்டுக்கும் ஒரே கல்வி அமைப்பு: LKG முதல் Class 12 வரை, கற்பவரின் சொந்த மொழியில் குரலால் கற்பிக்கப்படுகிறது.", ...wes, icon: "🌍", madeHowEn: "Made with the Design Library: Festival Grand family, karaoke word-reveal scene.", madeHowTa: "Design நூலகத்தில் உருவாக்கப்பட்டது: Festival Grand குடும்பம், கரோக்கி வார்த்தை வெளிப்பாடு." },
  { key: "wes-karaoke", sort: 2, titleEn: "Read along, word by word", titleTa: "வார்த்தை வார்த்தையாக வாசியுங்கள்", bodyEn: "Every lesson highlights each word as the voice reads it — children follow along and learn to read.", bodyTa: "ஒவ்வொரு பாடமும் குரல் வாசிக்கும்போது ஒவ்வொரு வார்த்தையையும் ஒளியூட்டுகிறது — குழந்தைகள் பின்தொடர்ந்து வாசிக்கக் கற்கிறார்கள்.", ...wes, icon: "🎤", madeHowEn: "Made with the flashcard template: hook on the front, feature on the back.", madeHowTa: "Flashcard வார்ப்புருவில்: முன்புறம் கவர்ச்சி, பின்புறம் அம்சம்." },
  { key: "wes-voices", sort: 3, titleEn: "Two house voices: Nisa & Arshed", titleTa: "இரண்டு வீட்டுக் குரல்கள்: Nisa & Arshed", bodyEn: "Learners choose their voice once; it carries every lesson, in every language.", bodyTa: "கற்பவர்கள் ஒருமுறை குரலைத் தேர்ந்தெடுக்கிறார்கள்; அது ஒவ்வொரு பாடத்தையும், ஒவ்வொரு மொழியிலும் கொண்டு செல்கிறது.", ...wes, icon: "🔊", madeHowEn: "Made with the quote-poster template over a gradient scene.", madeHowTa: "சாய்வுக் காட்சியில் மேற்கோள் சுவரொட்டி வார்ப்புருவில்." },
  { key: "wes-cinematic", sort: 4, titleEn: "Cinematic story lessons", titleTa: "சினிமா பாணி கதைப் பாடங்கள்", bodyEn: "Lessons told as animated stories with the text below — children absorb fast, and parents can listen too.", bodyTa: "கீழே உரையுடன் அனிமேஷன் கதைகளாகப் பாடங்கள் — குழந்தைகள் விரைவாக உள்வாங்குகிறார்கள், பெற்றோரும் கேட்கலாம்.", ...wes, icon: "🎬", madeHowEn: "Made with the Cinematic family in 16:9 with a progress bar (not a video file).", madeHowTa: "16:9 Cinematic குடும்பத்தில், முன்னேற்றப் பட்டியுடன் (வீடியோ கோப்பு அல்ல)." },
  { key: "wes-inclusive", sort: 5, titleEn: "Free forever for learners with disabilities", titleTa: "இயலாமை கொண்ட கற்பவர்களுக்கு என்றும் இலவசம்", bodyEn: "Hear / See / Read / Easy modes for every lesson — the full system, free forever, for learners with disabilities.", bodyTa: "ஒவ்வொரு பாடத்துக்கும் கேள் / பார் / வாசி / எளிது முறைகள் — முழு அமைப்பும், இயலாமை கொண்ட கற்பவர்களுக்கு என்றும் இலவசம்.", ...wes, icon: "♿", madeHowEn: "Made with the banner template and the inclusion icon set.", madeHowTa: "பேனர் வார்ப்புரு மற்றும் உள்ளடக்க ஐகான் தொகுப்பில்." },
  { key: "wes-ask-teacher", sort: 6, titleEn: "Ask Teacher — answers from the lessons", titleTa: "ஆசிரியரிடம் கேளுங்கள் — பாடங்களிலிருந்தே பதில்கள்", bodyEn: "A voice helper that answers only from the lessons and guides learners instead of handing over answers.", bodyTa: "பாடங்களிலிருந்து மட்டுமே பதிலளித்து, பதில்களை கொடுக்காமல் வழிகாட்டும் குரல் உதவியாளர்.", ...wes, icon: "🧑‍🏫", madeHowEn: "Made with the story-ring template.", madeHowTa: "ஸ்டோரி வளைய வார்ப்புருவில்." },
  { key: "wes-books", sort: 7, titleEn: "Real school books, inside the system", titleTa: "உண்மையான பள்ளிப் புத்தகங்கள், அமைப்புக்குள்", bodyEn: "Official NCERT books chapter by chapter, with a page-flip reader and Book Words cards for exams.", bodyTa: "அதிகாரப்பூர்வ NCERT புத்தகங்கள் அத்தியாயம் வாரியாக, பக்கம் புரட்டும் வாசகரும் தேர்வுக்கான Book Words அட்டைகளும்.", ...wes, icon: "📖", madeHowEn: "Made with the carousel template: one card per chapter idea.", madeHowTa: "சுழல் வார்ப்புருவில்: ஒவ்வொரு அத்தியாயக் கருத்துக்கும் ஒரு அட்டை." },
  { key: "wes-money", sort: 8, titleEn: "Money & Wealth, taught for life", titleTa: "பணம் & செல்வம், வாழ்க்கைக்குக் கற்பிக்கப்படுகிறது", bodyEn: "Earn, save, invest and grow — taught by age, principles only, practice money for children.", bodyTa: "சம்பாதி, சேமி, முதலீடு, வளர் — வயதுக்கு ஏற்ப, கொள்கைகள் மட்டும், குழந்தைகளுக்குப் பயிற்சிப் பணம்.", ...wes, icon: "💰", madeHowEn: "Made with the Luxury Gold family, poster size.", madeHowTa: "Luxury Gold குடும்பத்தில், சுவரொட்டி அளவில்." },
  { key: "wes-culture", sort: 9, titleEn: "Culture & Humanity, for every child", titleTa: "ஒவ்வொரு குழந்தைக்கும் கலாச்சாரம் & மனிதநேயம்", bodyEn: "Every learner studies their own culture, other cultures, and humanity above all — taught factually and respectfully.", bodyTa: "ஒவ்வொரு கற்பவரும் தன் கலாச்சாரம், பிற கலாச்சாரங்கள், எல்லாவற்றுக்கும் மேலாக மனிதநேயம் படிக்கிறார்கள் — உண்மையாகவும் மரியாதையாகவும்.", ...wes, icon: "🕊️", madeHowEn: "Made with the Nature Fresh family.", madeHowTa: "Nature Fresh குடும்பத்தில்." },
  { key: "wes-tools", sort: 10, titleEn: "Student tools, built in", titleTa: "மாணவர் கருவிகள், உள்ளமைக்கப்பட்டவை", bodyEn: "Calculator, converters, graph drawing and daily study tools — inside the same app.", bodyTa: "கணிப்பான், மாற்றிகள், வரைபடம் மற்றும் தினசரி படிப்புக் கருவிகள் — அதே செயலியில்.", ...wes, icon: "🧮", madeHowEn: "Made with the Tech Launch family.", madeHowTa: "Tech Launch குடும்பத்தில்." },
  { key: "wes-careers", sort: 11, titleEn: "From classroom to career", titleTa: "வகுப்பறையிலிருந்து தொழிலுக்கு", bodyEn: "Colleges, careers, internships and lifelong skills — the system stays with the learner for life.", bodyTa: "கல்லூரிகள், தொழில்கள், பயிற்சிகள் மற்றும் வாழ்நாள் திறன்கள் — அமைப்பு கற்பவருடன் வாழ்நாள் முழுவதும் இருக்கும்.", ...wes, icon: "🧭", madeHowEn: "Made with the gradient-mesh template.", madeHowTa: "சாய்வு வலை வார்ப்புருவில்." },
  { key: "wes-parents", sort: 12, titleEn: "Parents see progress, weekly", titleTa: "பெற்றோர் முன்னேற்றத்தை வாரந்தோறும் பார்க்கிறார்கள்", bodyEn: "A gentle weekly voice summary for parents, kind streaks that never break, and certificates at 7, 30 and 100 days.", bodyTa: "பெற்றோருக்கு மென்மையான வாராந்திர குரல் சுருக்கம், ஒருபோதும் உடையாத நல் தொடர்கள், 7, 30, 100 நாட்களில் சான்றிதழ்கள்.", ...wes, icon: "🌸", madeHowEn: "Made with the Soft Pastel starter template.", madeHowTa: "Soft Pastel தொடக்க வார்ப்புருவில்." },
  { key: "wes-founders", sort: 13, titleEn: "Founders: first 10,000 families, 50% off for life", titleTa: "நிறுவனர்கள்: முதல் 10,000 குடும்பங்கள், வாழ்நாள் 50% தள்ளுபடி", bodyEn: "The launch offer for the first 10,000 family accounts — proposal, to be confirmed at launch.", bodyTa: "முதல் 10,000 குடும்பக் கணக்குகளுக்கான தொடக்க சலுகை — முன்மொழிவு, தொடக்கத்தில் உறுதி செய்யப்படும்.", labelEn: "House ad — free · PROPOSAL", labelTa: "வீட்டு விளம்பரம் — இலவசம் · முன்மொழிவு", icon: "🏆", madeHowEn: "Made with the Offer Burst family.", madeHowTa: "Offer Burst குடும்பத்தில்." },
  { key: "farfaz-pay", sort: 14, titleEn: "FARFAZ Pay — Canada ↔ India QR wallet", titleTa: "FARFAZ Pay — கனடா ↔ இந்தியா QR பணப்பை", bodyEn: "Scan-and-pay in Canada, send CAD↔INR between the two countries — currently a demo with demo money only.", bodyTa: "கனடாவில் ஸ்கேன் செய்து செலுத்துங்கள், இரு நாடுகளுக்கும் இடையே CAD↔INR அனுப்புங்கள் — தற்போது டெமோ பணத்துடன் டெமோ மட்டுமே.", labelEn: "House ad — free · DEMO", labelTa: "வீட்டு விளம்பரம் — இலவசம் · டெமோ", icon: "💳", madeHowEn: "Made with the Product Hero family.", madeHowTa: "Product Hero குடும்பத்தில்." },
  { key: "jarvis", sort: 15, titleEn: "Jarvis — your personal assistant", titleTa: "Jarvis — உங்கள் தனிப்பட்ட உதவியாளர்", bodyEn: "A voice-first personal assistant with a Projects control centre — your whole world, one place.", bodyTa: "Projects கட்டுப்பாட்டு மையத்துடன் குரல்-முதன்மை தனிப்பட்ட உதவியாளர் — உங்கள் முழு உலகம், ஒரே இடம்.", labelEn: "House ad — free · Jarvis", labelTa: "வீட்டு விளம்பரம் — இலவசம் · Jarvis", icon: "🤖", madeHowEn: "Made with the Neon Cyber family.", madeHowTa: "Neon Cyber குடும்பத்தில்." },
  { key: "channels", sort: 16, titleEn: "Follow FARFAZ Learning", titleTa: "FARFAZ Learning-ஐப் பின்தொடருங்கள்", bodyEn: "Lessons, launches and updates on the FARFAZ Learning channels — YouTube and Instagram.", bodyTa: "FARFAZ Learning சேனல்களில் பாடங்கள், தொடக்கங்கள் மற்றும் புதுப்பிப்புகள் — YouTube மற்றும் Instagram.", labelEn: "House ad — free · Channels", labelTa: "வீட்டு விளம்பரம் — இலவசம் · சேனல்கள்", icon: "📣", madeHowEn: "Made with the Announcement starter template.", madeHowTa: "Announcement தொடக்க வார்ப்புருவில்." },
  { key: "agent-workshop", sort: 17, titleEn: "Agent Workshop Tamil", titleTa: "ஏஜெண்ட் வொர்க்ஷாப் தமிழ்", bodyEn: "Build useful agents. Show the work. Earn honestly. — the owner's own AI-agents learning site under FARFAZ Learning.", bodyTa: "பயனுள்ள ஏஜெண்டுகளை உருவாக்குங்கள். வேலையைக் காட்டுங்கள். நேர்மையாகச் சம்பாதியுங்கள். — FARFAZ Learning-இன் கீழ் உரிமையாளரின் AI-ஏஜெண்ட் கற்றல் தளம்.", labelEn: "House ad — free · Owner's site", labelTa: "வீட்டு விளம்பரம் — இலவசம் · உரிமையாளரின் தளம்", icon: "🛠️", madeHowEn: "Made with the Corporate Clean family.", madeHowTa: "Corporate Clean குடும்பத்தில்." },
];

export const OUTREACH_TEMPLATES: Array<{ key: string; titleEn: string; titleTa: string; bodyEn: string; bodyTa: string }> = [
  {
    key: "join-email",
    titleEn: "Join-request email (partner programmes)",
    titleTa: "இணைப்புக் கோரிக்கை மின்னஞ்சல் (கூட்டாளர் திட்டங்கள்)",
    bodyEn: "Hello,\n\nI run ViralAI by FARFAZ, an ad-intelligence platform for local businesses worldwide. We would like to join your partner programme and recommend your tools to our members, using your official tracked links.\n\nPlease share the joining steps and terms.\n\nThank you,\nFARFAZ Learning",
    bodyTa: "வணக்கம்,\n\nநான் ViralAI by FARFAZ-ஐ நடத்துகிறேன் — உலகம் முழுவதும் உள்ளூர் தொழில்களுக்கான விளம்பர அறிவுத் தளம். உங்கள் கூட்டாளர் திட்டத்தில் இணைந்து, உங்கள் அதிகாரப்பூர்வ கண்காணிப்பு இணைப்புகள் மூலம் எங்கள் உறுப்பினர்களுக்கு உங்கள் கருவிகளைப் பரிந்துரைக்க விரும்புகிறோம்.\n\nஇணையும் படிகளையும் விதிமுறைகளையும் பகிருங்கள்.\n\nநன்றி,\nFARFAZ Learning",
  },
  {
    key: "short-dm",
    titleEn: "Short DM (social)",
    titleTa: "குறுகிய DM (சமூக ஊடகம்)",
    bodyEn: "Hi! We run ViralAI by FARFAZ (ad intelligence for local businesses). We'd love to feature your tool for our members via your affiliate/partner programme. Could you share the join link and terms? Thank you!",
    bodyTa: "வணக்கம்! நாங்கள் ViralAI by FARFAZ (உள்ளூர் தொழில்களுக்கான விளம்பர அறிவு) நடத்துகிறோம். உங்கள் affiliate/partner திட்டம் மூலம் எங்கள் உறுப்பினர்களுக்கு உங்கள் கருவியை அறிமுகப்படுத்த விரும்புகிறோம். இணைப்பு இணைப்பையும் விதிமுறைகளையும் பகிர முடியுமா? நன்றி!",
  },
  {
    key: "publisher-email",
    titleEn: "Publisher application email (ad networks)",
    titleTa: "வெளியீட்டாளர் விண்ணப்ப மின்னஞ்சல் (விளம்பர வலையமைப்புகள்)",
    bodyEn: "Hello,\n\nWe operate ViralAI by FARFAZ, a web platform used by local businesses and shoppers. We would like to apply as a publisher so ads from your network can appear in clearly labelled placements inside our platform.\n\nOur traffic is real users only; we never click our own ads or ask users to click ads. Please confirm eligibility and the application steps.\n\nThank you,\nFARFAZ Learning",
    bodyTa: "வணக்கம்,\n\nநாங்கள் ViralAI by FARFAZ-ஐ இயக்குகிறோம் — உள்ளூர் தொழில்களும் வாடிக்கையாளர்களும் பயன்படுத்தும் இணையத் தளம். எங்கள் தளத்தில் தெளிவாகப் பெயரிடப்பட்ட இடங்களில் உங்கள் வலையமைப்பின் விளம்பரங்கள் தோன்ற, வெளியீட்டாளராக விண்ணப்பிக்க விரும்புகிறோம்.\n\nஎங்கள் போக்குவரத்து உண்மையான பயனர்கள் மட்டுமே; நாங்கள் எங்கள் விளம்பரங்களை நாங்களே கிளிக் செய்வதில்லை, கிளிக் செய்யச் சொல்வதுமில்லை. தகுதியையும் விண்ணப்பப் படிகளையும் உறுதிப்படுத்துங்கள்.\n\nநன்றி,\nFARFAZ Learning",
  },
  {
    key: "sponsorship-offer",
    titleEn: "Sponsorship offer (directory / showcase slots)",
    titleTa: "நிதியுதவி சலுகை (அடைவு / காட்சி இடங்கள்)",
    bodyEn: "Hello,\n\nViralAI by FARFAZ offers clearly labelled sponsored placements in our Skills Directory and Showcase, seen by local businesses in many cities. Sponsorship never changes our honest labels, and amounts and periods are agreed in writing before anything goes live.\n\nIf you would like the current rate card, please reply to this message.\n\nThank you,\nFARFAZ Learning",
    bodyTa: "வணக்கம்,\n\nViralAI by FARFAZ எங்கள் Skills அடைவிலும் Showcase-இலும் தெளிவாகப் பெயரிடப்பட்ட நிதியுதவி இடங்களை வழங்குகிறது — பல நகரங்களில் உள்ளூர் தொழில்கள் பார்க்கின்றன. நிதியுதவி எங்கள் நேர்மைப் பெயர்களை ஒருபோதும் மாற்றாது; தொகைகளும் காலங்களும் எதுவும் நேரடியாகும் முன் எழுத்தில் ஒப்புக் கொள்ளப்படும்.\n\nதற்போதைய விலை அட்டையை விரும்பினால், இந்தச் செய்திக்குப் பதிலளியுங்கள்.\n\nநன்றி,\nFARFAZ Learning",
  },
];
