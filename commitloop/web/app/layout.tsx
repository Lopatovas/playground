import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CommitLoop",
  description:
    "Accountability-first engineering apprenticeship. One loop. One project. Every day.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${ibmPlexMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
