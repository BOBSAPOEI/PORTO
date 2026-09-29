"use client";

import { motion } from "framer-motion";
import type { TargetAndTransition, Transition } from "framer-motion";
import { AILogoCursorTrail } from "@/components/shared/AILogoCursorTrail";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { BookHobbyCard } from "@/components/shared/BookHobbyCard";
import { GlowOrb } from "@/components/shared/GlowOrb";
import { MusicCard } from "@/components/shared/MusicCard";
import { PageNav } from "@/components/shared/PageNav";
import { PortraitReveal } from "@/components/shared/PortraitReveal";
import { ScrollRevealText } from "@/components/shared/ScrollRevealText";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

interface Skill {
  name: string;
  logo: string;
  animate: TargetAndTransition;
  transition: Transition;
  origin?: string;
}

const EIGHTHS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

const skills: Skill[] = [
  {
    // Swift bird diving toward its beak, then climbing back
    name: "Swift",
    logo: "swift",
    animate: { x: [0, 5, 3, -3, 0], y: [0, 7, -4, -6, 0], rotate: [0, 12, -12, -4, 0] },
    transition: { times: [0, 0.3, 0.55, 0.8, 1], duration: 2.8, repeatDelay: 0.4, ease: "easeInOut" },
  },
  {
    // SwiftUI .spring() scale + opacity transition
    name: "SwiftUI",
    logo: "swiftui",
    animate: { scale: [1, 0.84, 1.18, 0.95, 1.05, 0.99, 1], opacity: [1, 0.6, 1, 1, 1, 1, 1] },
    transition: { times: [0, 0.14, 0.34, 0.52, 0.7, 0.86, 1], duration: 1.8, repeatDelay: 2.1, ease: "easeInOut" },
  },
  {
    // drifts loose like `any`, then the type checker snaps it straight
    name: "TypeScript",
    logo: "typescript",
    animate: { rotate: [0, -10, 3, 0, 0], x: [0, -4, 1, 0, 0], scale: [1, 0.96, 1.08, 1, 1] },
    transition: { times: [0, 0.4, 0.47, 0.56, 1], duration: 2.6, repeatDelay: 0.9, ease: "circOut" },
  },
  {
    // loosely typed jelly wobble
    name: "JavaScript",
    logo: "javascript",
    animate: {
      scaleX: [1, 1.22, 0.82, 1.14, 0.95, 1.05, 1],
      scaleY: [1, 0.82, 1.2, 0.87, 1.05, 0.96, 1],
      skewX: [0, -12, 8, -5, 3, -1, 0],
    },
    transition: { times: [0, 0.3, 0.4, 0.5, 0.65, 0.75, 1], duration: 1.6, repeatDelay: 2.1, ease: "easeOut" },
    origin: "50% 100%",
  },
  {
    // spinning atom with a little "re-render" pop halfway
    name: "React",
    logo: "react",
    animate: { rotate: [0, 162, 180, 198, 360], scale: [1, 1, 1.12, 1, 1] },
    transition: { times: [0, 0.45, 0.5, 0.55, 1], duration: 8, ease: "linear" },
  },
  {
    // route transition: slides out right, re-enters from the left
    name: "Next.js",
    logo: "nextdotjs",
    animate: { x: [0, 6, -6, 0, 0], opacity: [1, 0.5, 0.5, 1, 1], skewX: [0, -12, -12, 0, 0] },
    transition: { times: [0, 0.4, 0.42, 0.75, 1], duration: 2.4, repeatDelay: 1.9, ease: "circInOut" },
  },
  {
    // traces a hexagon — one corner per event-loop phase
    name: "Node.js",
    logo: "nodedotjs",
    animate: { x: [0, 4.3, 4.3, 0, -4.3, -4.3, 0], y: [-5, -2.5, 2.5, 5, 2.5, -2.5, -5] },
    transition: { times: [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1], duration: 4.8, ease: "easeInOut" },
  },
  {
    // snake slither
    name: "Python",
    logo: "python",
    animate: {
      x: [0, 2.8, 4, 2.8, 0, -2.8, -4, -2.8, 0],
      skewX: [-10, -7, 0, 7, 10, 7, 0, -7, -10],
    },
    transition: { times: EIGHTHS, duration: 3.4, ease: "linear" },
  },
  {
    // coffee cup lifted for a sip, brief GC pause, set back down
    name: "Java",
    logo: "java",
    animate: { y: [0, -7, -6, -2, -2, 0], rotate: [0, -16, -22, -6, -6, 0] },
    transition: { times: [0, 0.22, 0.5, 0.66, 0.8, 1], duration: 3.6, repeatDelay: 0.9, ease: "easeInOut" },
    origin: "50% 100%",
  },
  {
    // coroutine: launch, suspend (dimmed), resume
    name: "Kotlin",
    logo: "kotlin",
    animate: {
      x: [0, 5, 5, 0, 0],
      y: [0, -5, -5, 0, 0],
      scale: [1, 0.9, 0.9, 1, 1],
      opacity: [1, 0.55, 0.55, 1, 1],
    },
    transition: { times: [0, 0.18, 0.5, 0.68, 1], duration: 2.8, repeatDelay: 1.3, ease: "anticipate" },
  },
  {
    // Slonik the elephant rears up and stomps
    name: "PostgreSQL",
    logo: "postgresql",
    animate: {
      y: [0, -5, -6, 1, -1, 0, 0],
      rotate: [0, -6, -7, 1, 0, 0, 0],
      scaleY: [1, 1.04, 1.05, 0.88, 1.03, 1, 1],
      scaleX: [1, 0.98, 0.97, 1.1, 0.98, 1, 1],
    },
    transition: { times: [0, 0.34, 0.5, 0.57, 0.68, 0.78, 1], duration: 2.6, repeatDelay: 2, ease: "easeIn" },
    origin: "50% 100%",
  },
  {
    // surfing the wave, leaning into the tail wind
    name: "Tailwind CSS",
    logo: "tailwindcss",
    animate: {
      y: [0, -2.8, -4, -2.8, 0, 2.8, 4, 2.8, 0],
      rotate: [-8, -5.6, 0, 5.6, 8, 5.6, 0, -5.6, -8],
      skewX: [0, -5, -9, -5, 0, -5, -9, -5, 0],
    },
    transition: { times: EIGHTHS, duration: 3.6, ease: "linear" },
  },
  {
    // branch off, two commits, merge back, merge-conflict shake
    name: "Git",
    logo: "git",
    animate: {
      x: [0, 5, 5, 5, 5, 5, 0, -3, 3, 0, 0],
      y: [0, -5, -5, -5, -5, -5, 0, 0, 0, 0, 0],
      scale: [1, 1, 1.15, 1, 1.15, 1, 1, 1, 1, 1, 1],
      rotate: [0, 0, 0, 0, 0, 0, 0, -8, 8, 0, 0],
    },
    transition: {
      times: [0, 0.15, 0.25, 0.33, 0.43, 0.51, 0.68, 0.74, 0.8, 0.86, 1],
      duration: 4.2,
      repeatDelay: 0.8,
      ease: "easeInOut",
    },
  },
];

export function About() {
  const reducedMotion = usePrefersReducedMotion();
  const loop = [...skills, ...skills];

  return (
    <section
      id="about"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden py-16 sm:py-20"
    >
      <GlowOrb
        className="-left-32 -top-32 h-[420px] w-[420px] opacity-40"
        color="rgba(191,90,242,0.3)"
      />
      <AILogoCursorTrail />
      <div className="relative mx-auto max-w-4xl px-6 sm:px-10">
        <div className="flex flex-col-reverse items-center gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="w-full lg:max-w-2xl">
            <AnimatedSection>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--accent)]">
                Tentang Saya
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.1} className="mt-6">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-snug tracking-tight text-[var(--foreground)] sm:text-4xl">
                Saya adalah{" "}
                <span className="text-[var(--accent)]">
                  Swift &amp; Fullstack Developer
                </span>{" "}
                yang nyaman gonta-ganti bahasa dan lapisan sistem, dari
                antarmuka, server, sampai database.
              </h2>
            </AnimatedSection>

            <ScrollRevealText
              className="mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
              text="Fokus utama saya ada di pengembangan iOS dengan Swift, namun saya terbiasa bekerja lintas bahasa pemrograman sesuai kebutuhan proyek. Di luar coding, saya menjabat sebagai Ketua Himpunan Mahasiswa di Institut Teknologi Indonesia (ITI), tempat saya mengasah kepemimpinan, koordinasi tim, dan pengelolaan proyek nyata di luar layar komputer."
            />
          </div>

          <AnimatedSection delay={0.15} className="shrink-0">
            <PortraitReveal />
          </AnimatedSection>
        </div>
      </div>

      {/* overflow-x-clip (not overflow-hidden) so the logos' vertical motion isn't cropped */}
      <AnimatedSection delay={0.3} className="mt-10 overflow-x-clip">
        <div
          className={
            reducedMotion
              ? "flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6"
              : "flex w-max items-center animate-marquee"
          }
        >
          {(reducedMotion ? skills : loop).map((skill, i) => (
            <motion.span
              key={`${skill.name}-${i}`}
              aria-hidden={i >= skills.length || undefined}
              // spacing lives on each item (not flex gap) so translateX(-50%) lands exactly on the second copy
              className={cn("group flex items-center gap-3 whitespace-nowrap", !reducedMotion && "mr-10")}
              whileHover={{ scale: 1.12 }}
            >
              <motion.img
                // remount on preference change: removing `animate` would freeze the logo mid-pose
                key={reducedMotion ? "still" : "live"}
                src={`/images/tech-logos/${skill.logo}.svg`}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 shrink-0 sm:h-9 sm:w-9"
                style={{ transformOrigin: skill.origin ?? "50% 50%" }}
                animate={reducedMotion ? undefined : skill.animate}
                transition={{ ...skill.transition, repeat: Infinity }}
              />
              <span className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--foreground)]/70 transition-colors duration-300 group-hover:text-[var(--foreground)] sm:text-4xl">
                {skill.name}
              </span>
            </motion.span>
          ))}
        </div>
      </AnimatedSection>

      <div className="relative mx-auto mt-10 w-full max-w-4xl px-6 sm:px-10">
        <div className="grid gap-5 sm:grid-cols-2">
          <AnimatedSection delay={0.1}>
            <BookHobbyCard />
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <MusicCard />
          </AnimatedSection>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-4xl px-6 sm:px-10">
        <PageNav href="/experience" label="Pengalaman" />
      </div>
    </section>
  );
}
