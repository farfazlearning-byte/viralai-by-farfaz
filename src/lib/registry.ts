// Country registry. Phase 1 countries are active; further waves switch on later.
// Currency symbols are display-only — plan prices are always owner-set per country
// and are NEVER auto-converted as final prices.
export interface Country {
  code: string;
  en: string;
  ta: string;
  currency: string;
  currencySymbol: string;
  active: boolean;
}

export const COUNTRIES: Country[] = [
  { code: "IN", en: "India", ta: "இந்தியா", currency: "INR", currencySymbol: "₹", active: true },
  { code: "CA", en: "Canada", ta: "கனடா", currency: "CAD", currencySymbol: "$", active: true },
  { code: "US", en: "United States", ta: "அமெரிக்கா", currency: "USD", currencySymbol: "$", active: false },
  { code: "GB", en: "United Kingdom", ta: "இங்கிலாந்து", currency: "GBP", currencySymbol: "£", active: false },
  { code: "AU", en: "Australia", ta: "ஆஸ்திரேலியா", currency: "AUD", currencySymbol: "$", active: false },
  { code: "AE", en: "UAE", ta: "ஐக்கிய அரபு எமிரேட்ஸ்", currency: "AED", currencySymbol: "د.إ", active: false },
  { code: "SG", en: "Singapore", ta: "சிங்கப்பூர்", currency: "SGD", currencySymbol: "$", active: false },
  { code: "LK", en: "Sri Lanka", ta: "இலங்கை", currency: "LKR", currencySymbol: "Rs", active: false },
  { code: "MY", en: "Malaysia", ta: "மலேசியா", currency: "MYR", currencySymbol: "RM", active: false },
  { code: "QA", en: "Qatar", ta: "கத்தார்", currency: "QAR", currencySymbol: "ر.ق", active: false },
  { code: "SA", en: "Saudi Arabia", ta: "சவுதி அரேபியா", currency: "SAR", currencySymbol: "ر.س", active: false },
  { code: "KW", en: "Kuwait", ta: "குவைத்", currency: "KWD", currencySymbol: "د.ك", active: false },
  { code: "OM", en: "Oman", ta: "ஓமன்", currency: "OMR", currencySymbol: "ر.ع.", active: false },
  { code: "BD", en: "Bangladesh", ta: "வங்காளதேசம்", currency: "BDT", currencySymbol: "৳", active: false },
  { code: "NP", en: "Nepal", ta: "நேபாளம்", currency: "NPR", currencySymbol: "रू", active: false },
  { code: "PK", en: "Pakistan", ta: "பாகிஸ்தான்", currency: "PKR", currencySymbol: "Rs", active: false },
  { code: "ZA", en: "South Africa", ta: "தென் ஆப்பிரிக்கா", currency: "ZAR", currencySymbol: "R", active: false },
  { code: "NG", en: "Nigeria", ta: "நைஜீரியா", currency: "NGN", currencySymbol: "₦", active: false },
  { code: "KE", en: "Kenya", ta: "கென்யா", currency: "KES", currencySymbol: "KSh", active: false },
  { code: "DE", en: "Germany", ta: "ஜெர்மனி", currency: "EUR", currencySymbol: "€", active: false },
  { code: "FR", en: "France", ta: "பிரான்ஸ்", currency: "EUR", currencySymbol: "€", active: false },
  { code: "JP", en: "Japan", ta: "ஜப்பான்", currency: "JPY", currencySymbol: "¥", active: false },
  { code: "NZ", en: "New Zealand", ta: "நியூசிலாந்து", currency: "NZD", currencySymbol: "$", active: false },
  { code: "BR", en: "Brazil", ta: "பிரேசில்", currency: "BRL", currencySymbol: "R$", active: false },
];

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
