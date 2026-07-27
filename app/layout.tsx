import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: true,
  fallback: ["Geist Fallback"],
  adjustFontFallback: false,
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: true,
  fallback: ["Geist Mono Fallback"],
  adjustFontFallback: false,
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Korvesa — Low Altitude Economy",
  description: "Persistent drone informatics for the low altitude economy.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
