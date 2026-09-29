"use client";

import { useEffect, useRef } from "react";
import { AmbientParticles } from "@/lib/ambientParticles";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

interface ParticleBackgroundProps {
  className?: string;
  interactive?: boolean;
}

export function ParticleBackground({
  className,
  interactive = true,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const particles = new AmbientParticles(canvas);
    particles.start(reduced);

    const onResize = () => particles.resize();
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      particles.setPointer(e.clientX - rect.left, e.clientY - rect.top);
    };
    const onPointerLeave = () => particles.setPointer(-9999, -9999);

    window.addEventListener("resize", onResize);
    if (interactive) {
      parent.addEventListener("pointermove", onPointerMove);
      parent.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (interactive) {
        parent.removeEventListener("pointermove", onPointerMove);
        parent.removeEventListener("pointerleave", onPointerLeave);
      }
      particles.stop();
    };
  }, [interactive, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
