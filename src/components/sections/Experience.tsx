"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GlowOrb } from "@/components/shared/GlowOrb";
import { PageNav } from "@/components/shared/PageNav";
import { experience } from "@/data/experience";

export function Experience() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 0.8", "end 0.5"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      id="experience"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden py-16 sm:py-20"
    >
      <GlowOrb
        className="-right-32 top-1/3 h-[380px] w-[380px] opacity-35"
        color="rgba(0,113,227,0.3)"
      />
      <div className="relative mx-auto max-w-4xl px-6 sm:px-10">
        <AnimatedSection>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--accent)]">
            Pengalaman
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Perjalanan singkat.
          </h2>
        </AnimatedSection>

        <div ref={timelineRef} className="relative mt-8 flex flex-col">
          <motion.div
            style={{ scaleY }}
            className="absolute left-0 top-0 hidden h-full w-px origin-top bg-gradient-to-b from-[var(--accent)] via-[#bf5af2] to-transparent sm:block"
          />
          {experience.map((item, i) => (
            <AnimatedSection
              key={`${item.role}-${i}`}
              delay={0.15 + i * 0.1}
              className="group relative grid grid-cols-1 gap-2 border-t border-[var(--border)] py-6 sm:grid-cols-[160px_1fr] sm:pl-6"
            >
              <span className="text-sm text-[var(--muted)]">
                {item.period}
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                  {item.role}
                </h3>
                <p className="mt-1 text-sm uppercase tracking-wide text-[var(--accent)]">
                  {item.organization}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  {item.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <PageNav href="/projects" label="Proyek" />
      </div>
    </section>
  );
}
