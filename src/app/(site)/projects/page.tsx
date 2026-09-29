import type { Metadata } from "next";
import { Projects } from "@/components/sections/Projects";

export const metadata: Metadata = {
  title: "Proyek — Muhammad Satriadji Mukti",
};

export default function ProjectsPage() {
  return <Projects />;
}
