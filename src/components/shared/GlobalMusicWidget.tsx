"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { trackThumbnail, useMusicPlayer } from "@/lib/musicPlayer";

export function GlobalMusicWidget() {
  const { ready, playing, track, toggle, next, prev } = useMusicPlayer();

  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="group fixed bottom-5 right-5 z-40 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)]/90 py-2 pl-2 pr-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform hover:scale-[1.02] sm:bottom-6 sm:right-6"
        >
          <button
            type="button"
            onClick={prev}
            aria-label={`Lagu sebelumnya`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          >
            <SkipBack className="h-3.5 w-3.5 fill-current" />
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Jeda ${track.title}` : `Putar ${track.title} oleh ${track.artist}`}
            className="group/play relative h-9 w-9 shrink-0"
          >
            <img
              src={trackThumbnail(track)}
              alt=""
              aria-hidden="true"
              className={`h-full w-full rounded-full object-cover ring-2 ring-[var(--background)] ${
                playing ? "animate-[spin_8s_linear_infinite]" : ""
              }`}
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover/play:opacity-100">
              {playing ? (
                <Pause className="h-3 w-3 fill-white text-white" />
              ) : (
                <Play className="ml-0.5 h-3 w-3 fill-white text-white" />
              )}
            </span>
          </button>

          <span className="hidden max-w-[9rem] flex-col items-start text-left sm:flex">
            <span className="truncate text-xs font-semibold leading-tight text-[var(--foreground)]">
              {track.title}
            </span>
            <span className="truncate text-[11px] leading-tight text-[var(--muted)]">
              {track.artist}
            </span>
          </span>

          <button
            type="button"
            onClick={next}
            aria-label="Lagu berikutnya"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
          >
            <SkipForward className="h-3.5 w-3.5 fill-current" />
          </button>

          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              playing ? "bg-[var(--accent)]" : "bg-[var(--muted)]/40"
            }`}
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
