"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MouseEvent } from "react";
import { Pin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

const IFRAME_SCALE = 0.42;

interface ProjectPreviewCardProps {
  project: Project;
  onClick?: () => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}

export function ProjectPreviewCard({
  project,
  onClick,
  pinned = false,
  onTogglePin,
}: ProjectPreviewCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const isLiveWeb = project.kind === "web" && !!project.liveUrl;
  const hasVideo = !!project.video;

  useEffect(() => {
    if (!isLiveWeb && !hasVideo) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLiveWeb, hasVideo]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 250,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 250,
    damping: 20,
  });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border p-5 shadow-sm transition-shadow duration-500 hover:shadow-2xl hover:shadow-black/10 sm:p-7",
        pinned
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.04] ring-1 ring-[var(--accent)]/25"
          : "border-[var(--border)] bg-[var(--surface)]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {project.title}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3.5 py-2 text-xs font-medium text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" />
            {project.category}
          </span>
          {onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
              aria-label={pinned ? `Lepas sematan ${project.title}` : `Sematkan ${project.title} di atas`}
              aria-pressed={pinned}
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
                pinned
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              )}
            >
              <Pin className={cn("h-4 w-4", pinned && "fill-current")} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mt-5 aspect-[11/10] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]"
      >
        {hasVideo ? (
          inView ? (
            <video
              src={project.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={project.screenshot}
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-[var(--border)]/40" />
          )
        ) : isLiveWeb ? (
          inView ? (
            <iframe
              src={project.liveUrl}
              title={`Live preview ${project.title}`}
              loading="lazy"
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
              style={{
                width: `${100 / IFRAME_SCALE}%`,
                height: `${100 / IFRAME_SCALE}%`,
                transform: `scale(${IFRAME_SCALE})`,
              }}
            />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-[var(--border)]/40" />
          )
        ) : project.screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.screenshot}
            alt={`Tampilan ${project.title}`}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : null}
      </div>
    </motion.div>
  );
}
