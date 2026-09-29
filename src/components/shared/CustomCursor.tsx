"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40 });
  const springY = useSpring(y, { stiffness: 500, damping: 40 });
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setHovering(!!target.closest("a, button, [data-cursor-hover]"));
    };
    const leave = () => setVisible(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [x, y]);

  return (
    <motion.div
      style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }}
      className="pointer-events-none fixed left-0 top-0 z-[200] hidden md:block"
    >
      <motion.div
        animate={{
          scale: hovering ? 2.6 : 1,
          backgroundColor: hovering
            ? "rgba(0,113,227,0.15)"
            : "rgba(0,113,227,1)",
          borderColor: hovering ? "rgba(0,113,227,0.6)" : "rgba(0,113,227,0)",
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border"
      />
    </motion.div>
  );
}
