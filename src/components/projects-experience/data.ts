import type { Project } from "@/types";

export const CARD_W = 4.6;
export const CARD_H = (CARD_W * 9) / 16;

/** Vertical distance between carousel slots — the camera travels down the robot as you scroll. */
export const STEP = 3.4;

/** Cards zig-zag left/right of the robot (sideX 0 = stacked in the centre on narrow screens). */
export function slotPosition(slot: number, sideX: number) {
  const side = slot % 2 === 0 ? -1 : 1;
  return { x: side * sideX, y: -slot * STEP, side };
}

export function projectMedia(slug: string) {
  const base = `/videos/projects/${slug}`;
  return {
    poster: `${base}-poster.jpg`,
    card: `${base}-1080.mp4`,
    full4k: `${base}-2160.mp4`,
  };
}

export interface ProjectFilter {
  id: string;
  label: string;
  match: (project: Project) => boolean;
}

export const FILTERS: ProjectFilter[] = [
  { id: "all", label: "Semua", match: () => true },
  { id: "web", label: "Website", match: (p) => p.kind === "web" },
  { id: "ios", label: "Aplikasi iOS", match: (p) => /ios/i.test(p.category) },
  { id: "3d", label: "3D Interaktif", match: (p) => /3d/i.test(p.category) },
  { id: "landing", label: "Landing Page", match: (p) => /landing/i.test(p.category) },
  { id: "commerce", label: "E-commerce", match: (p) => /commerce/i.test(p.category) },
];

export function matchesQuery(project: Project, query: string) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [project.title, project.category, project.description, ...project.tech]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

/** Shared between DOM input handlers and the render loop without re-rendering React. */
export interface NavState {
  /** Slot the carousel is heading to (may be fractional while dragging). */
  target: number;
  /** Damped slot actually shown this frame. */
  current: number;
}

/** Deterministic PRNG so scene generation stays pure during render. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
