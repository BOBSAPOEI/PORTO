import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[9/19.5] w-full max-w-[280px] rounded-[3rem] border-[10px] border-[#1d1d1f] bg-[#1d1d1f] shadow-2xl shadow-black/30",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2.3rem] bg-[var(--surface)]">
        {children}
      </div>
      <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#1d1d1f]" />
    </div>
  );
}
