"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LOGOS = [
  "openai",
  "claude",
  "googlegemini",
  "perplexity",
  "meta",
  "mistralai",
  "huggingface",
  "deepseek",
  "elevenlabs",
  "githubcopilot",
  "deepmind",
  "nvidia",
  "ollama",
  "suno",
];

const SPAWN_THROTTLE_MS = 90;
const MIN_DISTANCE_PX = 42;
const MAX_ITEMS = 12;
const LIFETIME_MS = 950;

interface TrailItem {
  id: number;
  x: number;
  y: number;
  logo: string;
  rotate: number;
  size: number;
}

let idCounter = 0;

export function AILogoCursorTrail() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TrailItem[]>([]);
  const lastSpawnAt = useRef(0);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const section = overlayRef.current?.closest("section");
    if (!section) return;

    function handleMove(e: PointerEvent) {
      const now = performance.now();
      if (now - lastSpawnAt.current < SPAWN_THROTTLE_MS) return;

      const rect = section!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE_PX) return;
      }
      lastPos.current = { x, y };
      lastSpawnAt.current = now;

      const id = idCounter++;
      const logo = LOGOS[Math.floor(Math.random() * LOGOS.length)];
      const rotate = Math.random() * 28 - 14;
      const size = 32 + Math.random() * 16;

      setItems((prev) => [...prev.slice(-(MAX_ITEMS - 1)), { id, x, y, logo, rotate, size }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((it) => it.id !== id));
      }, LIFETIME_MS);
    }

    section.addEventListener("pointermove", handleMove);
    return () => section.removeEventListener("pointermove", handleMove);
  }, []);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence>
        {items.map((it) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, scale: 0.4, rotate: it.rotate }}
            animate={{ opacity: 1, scale: 1, rotate: it.rotate }}
            exit={{ opacity: 0, scale: 0.55 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: it.x - it.size / 2,
              top: it.y - it.size / 2,
              width: it.size,
              height: it.size,
            }}
            className="flex items-center justify-center rounded-lg bg-white/95 p-1.5 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/ai-logos/${it.logo}.svg`}
              alt=""
              className="h-full w-full object-contain"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
