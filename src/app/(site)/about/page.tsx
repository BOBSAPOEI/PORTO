import type { Metadata } from "next";
import { About } from "@/components/sections/About";

export const metadata: Metadata = {
  title: "Tentang — Muhammad Satriadji Mukti",
};

export default function AboutPage() {
  return <About />;
}
