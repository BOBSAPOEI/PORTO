import { cn } from "@/lib/utils";

interface GlowOrbProps {
  className?: string;
  color?: string;
}

export function GlowOrb({ className, color = "rgba(0,113,227,0.35)" }: GlowOrbProps) {
  return (
    <div
      className={cn("glow-orb", className)}
      style={{
        background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`,
      }}
    />
  );
}
