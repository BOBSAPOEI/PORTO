import type { Metadata } from "next";
import { Share_Tech_Mono } from "next/font/google";
import { ProjectsExperience } from "@/components/projects-experience/ProjectsExperience";

const hudFont = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hud",
});

export const metadata: Metadata = {
  title: "Proyek — Muhammad Satriadji Mukti",
};

export default function ProjectsPage() {
  return <ProjectsExperience fontClassName={hudFont.variable} />;
}
