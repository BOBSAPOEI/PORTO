"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CYCLE_MS = 5000;

const frames = [
  {
    key: "portrait",
    src: "/images/profile-portrait.jpg",
    alt: "Muhammad Satriadji Mukti",
    caption: "Muhammad Satriadji Mukti",
  },
  {
    key: "monalisa",
    src: "/images/mona-lisa.jpg",
    alt: "Mona Lisa, lukisan Leonardo da Vinci",
    caption: "Mona Lisa — Leonardo da Vinci",
  },
];

export function PortraitReveal() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % frames.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const current = frames[index];

  return (
    <div
      className="relative mx-auto w-full max-w-[220px] select-none sm:max-w-[260px]"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="relative rounded-sm border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] sm:p-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[1px] bg-[var(--background)] ring-1 ring-black/5">
          <AnimatePresence>
            <motion.img
              key={current.key}
              src={current.src}
              alt={current.alt}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              exit={{ clipPath: "inset(0 0 0 100%)" }}
              transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
            />
          </AnimatePresence>
        </div>
        <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-[var(--accent)]" />
        <span className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-[var(--accent)]" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[var(--accent)]" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[var(--accent)]" />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={current.caption}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4 }}
          className="mt-3 text-center text-[11px] uppercase tracking-[0.25em] text-[var(--muted)]"
        >
          {current.caption}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
