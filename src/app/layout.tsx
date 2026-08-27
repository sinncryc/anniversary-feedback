import type { Metadata, Viewport } from "next";
import { eventConfig } from "@/lib/event-config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${eventConfig.name} — Share Your Voice`,
  description:
    "Kirim satu masukan Anda untuk perusahaan. Anonim, tanpa login, langsung tampil di layar utama.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#04060d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
