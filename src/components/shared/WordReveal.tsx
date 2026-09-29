"use client";

import { motion, type Variants } from "framer-motion";
import { isValidElement, type ReactNode } from "react";

interface WordRevealProps {
  words: (string | ReactNode)[];
  delayStart?: number;
  className?: string;
  as?: "h1" | "h2" | "div";
}

const container: Variants = {
  hidden: {},
  visible: (delayStart: number) => ({
    transition: { staggerChildren: 0.09, delayChildren: delayStart },
  }),
};

const word: Variants = {
  hidden: { opacity: 0, y: 28, rotateX: -40 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export function WordReveal({ words, delayStart = 0, className, as = "h1" }: WordRevealProps) {
  const Component = motion[as];

  return (
    <Component
      initial="hidden"
      animate="visible"
      custom={delayStart}
      variants={container}
      style={{ perspective: 400 }}
      className={className}
    >
      {words.map((w, i) => {
        if (isValidElement(w) && w.type === "br") {
          return <br key={i} />;
        }
        return (
          <motion.span
            key={i}
            variants={word}
            className="inline-block"
            style={{ transformOrigin: "50% 100%" }}
          >
            {w}
          </motion.span>
        );
      })}
    </Component>
  );
}
