import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "2026 · 19 of 23 run",
  description:
    "Travel a real 2026 racing line. The season is placed along the lap. Unofficial fan site, unaffiliated with Formula 1.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${archivo.variable} ${plexMono.variable} antialiased`}
    >
      <body className="bg-[#1C2636] font-[family-name:var(--font-archivo)] text-[#F4EFE4]">
        {children}
      </body>
    </html>
  );
}
