// Share-copy builder shared by client components AND server routes.
// It must NOT live in a "use client" module: Next forbids calling a
// client-module function from a route handler (that call throws
// "Attempted to call shareTexts() from the server…" and the route 500s —
// this broke GET /api/growth and GET /api/showcase for signed-in users).
// The copy always carries the given member's OWN invite code.
export function shareTexts(origin: string, code: string): { en: string; ta: string; link: string } {
  const link = `${origin}/?ref=${encodeURIComponent(code)}`;
  return {
    link,
    en: `I use ViralAI by FARFAZ for my business ads — designs, campaigns and my own store in one place. Join free with my invite link: ${link}`,
    ta: `என் தொழில் விளம்பரங்களுக்கு நான் ViralAI by FARFAZ பயன்படுத்துகிறேன் — designs, பிரச்சாரங்கள், என் சொந்தக் கடை, எல்லாம் ஒரே இடத்தில். என் அழைப்பு இணைப்பில் இலவசமாகச் சேருங்கள்: ${link}`,
  };
}
