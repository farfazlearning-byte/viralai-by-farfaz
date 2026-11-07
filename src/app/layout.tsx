import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralAI by FARFAZ — Ad Intelligence",
  description:
    "Ad intelligence for every business, in every city: designs, campaigns, stores and delivery — EN + தமிழ். Simulated figures are labelled SIMULATED; unconnected partners are REGISTERED.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "ViralAI", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#04060f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
