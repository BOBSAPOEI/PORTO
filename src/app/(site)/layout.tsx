import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CustomCursor } from "@/components/shared/CustomCursor";
import { GlobalMusicWidget } from "@/components/shared/GlobalMusicWidget";
import { Preloader } from "@/components/shared/Preloader";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MusicPlayerProvider } from "@/lib/musicPlayer";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Muhammad Satriadji Mukti — Fullstack Developer",
  description:
    "Portofolio Muhammad Satriadji Mukti, Fullstack Developer & Ketua Himpunan Mahasiswa Institut Teknologi Indonesia (ITI).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <MusicPlayerProvider>
          <Preloader />
          <CustomCursor />
          <ScrollProgress />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <GlobalMusicWidget />
        </MusicPlayerProvider>
      </body>
    </html>
  );
}
