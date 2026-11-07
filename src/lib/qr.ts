import QRCode from "qrcode";

/** Build the UPI payment payload exactly as the hosted build does. */
export function upiPayload(pa: string, pn: string, amount?: number, note = ""): string {
  const params = new URLSearchParams({ pa, pn, cu: "INR" });
  if (amount && amount > 0) params.set("am", amount.toFixed(2));
  if (note) params.set("tn", note.slice(0, 60));
  return `upi://pay?${params.toString()}`;
}

/** Render a QR code as an inline SVG string (server-side, no external service). */
export async function qrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, { type: "svg", margin: 1, width: 216 });
}
