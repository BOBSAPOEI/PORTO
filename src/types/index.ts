export interface Project {
  slug: string;
  title: string;
  description: string;
  tech: string[];
  screenshot?: string;
  /** Optional demo video shown in the project card preview instead of the screenshot. */
  video?: string;
  /** Mockup frame used in the detail modal. @default "mobile" */
  kind?: "mobile" | "web";
  /** Short category label shown as a badge on the project card, e.g. "iOS App". */
  category: string;
  liveUrl?: string;
  repoUrl?: string;
}

export interface ExperienceItem {
  role: string;
  organization: string;
  period: string;
  description: string;
  type: "work" | "organization";
}

export interface SocialLink {
  label: string;
  href: string;
  icon: "mail" | "linkedin" | "github" | "instagram" | "whatsapp";
}
