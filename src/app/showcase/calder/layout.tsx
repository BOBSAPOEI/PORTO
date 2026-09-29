import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import "./calder.css";

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
});

export const metadata: Metadata = {
  title: "Calder — Independent Design & Engineering Studio",
  description:
    "Calder is an independent studio crafting brands, products, and the systems that connect them — bold ideas, shipped with quiet precision.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function CalderLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={onest.variable}>
      <body>{children}</body>
    </html>
  );
}
