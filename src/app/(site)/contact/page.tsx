import type { Metadata } from "next";
import { Contact } from "@/components/sections/Contact";

export const metadata: Metadata = {
  title: "Kontak — Muhammad Satriadji Mukti",
};

export default function ContactPage() {
  return <Contact />;
}
