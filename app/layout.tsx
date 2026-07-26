import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korvesa — Low Altitude Economy",
  description: "Persistent drone informatics for the low altitude economy.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
