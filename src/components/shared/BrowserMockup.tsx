import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BrowserMockupProps {
  children: ReactNode;
  url?: string;
  className?: string;
}

export function BrowserMockup({ children, url, className }: BrowserMockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[#1d1d1f] shadow-2xl shadow-black/30",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#1d1d1f] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        {url && (
          <div className="mx-auto flex max-w-[70%] items-center gap-1.5 rounded-md bg-white/10 px-3 py-1 text-[11px] text-white/50">
            {url}
          </div>
        )}
      </div>
      <div className="relative h-[calc(100%-2.75rem)] w-full overflow-hidden bg-[var(--surface)]">
        {children}
      </div>
    </div>
  );
}
