"use client";

import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01ABCDEFXZ";

/** Terminal-style decode: returns the text to display, scrambling for ~0.6s whenever `text` changes. */
export function useScramble(text: string, enabled: boolean) {
  const [frame, setFrame] = useState<{ source: string; value: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const duration = 620;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      if (t >= 1) {
        setFrame(null);
        return;
      }
      const revealed = Math.floor(t * text.length);
      let value = "";
      for (let i = 0; i < text.length; i++) {
        value += i < revealed || text[i] === " " ? text[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setFrame({ source: text, value });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, enabled]);

  return enabled && frame?.source === text ? frame.value : text;
}
