"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "solid" | "outline" | "ghost";
  children: ReactNode;
  target?: string;
  rel?: string;
}

export function Button({
  href,
  variant = "solid",
  className,
  children,
  target,
  rel,
  ...props
}: ButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-14, Math.min(14, v));
    x.set(clamp((e.clientX - rect.left - rect.width / 2) * 0.35));
    y.set(clamp((e.clientY - rect.top - rect.height / 2) * 0.35));
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const styles = cn(
    "relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium tracking-wide transition-colors duration-300",
    variant === "solid" &&
      "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]",
    variant === "outline" &&
      "border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
    variant === "ghost" &&
      "text-[var(--accent)] hover:text-[var(--accent-strong)]",
    className,
  );

  const content = (
    <motion.span
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={styles}
    >
      {children}
    </motion.span>
  );

  if (href) {
    const isInternal = href.startsWith("/") || href.startsWith("#");
    if (isInternal && !target) {
      return (
        <Link href={href} className="inline-block">
          {content}
        </Link>
      );
    }
    return (
      <a href={href} target={target} rel={rel} className="inline-block">
        {content}
      </a>
    );
  }

  return (
    <button {...props} className="inline-block bg-transparent p-0">
      {content}
    </button>
  );
}
