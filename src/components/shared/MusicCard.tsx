"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { PLAYLIST, formatTime, trackThumbnail, useMusicPlayer } from "@/lib/musicPlayer";
import { cn } from "@/lib/utils";

export function MusicCard() {
  const { ready, playing, currentTime, duration, track, trackIndex, toggle, next, prev, selectTrack } =
    useMusicPlayer();

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
        Sedang Didengar
      </p>

      <div className="mt-5 flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={prev}
            disabled={!ready}
            aria-label="Lagu sebelumnya"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--accent)] disabled:opacity-40"
          >
            <SkipBack className="h-4 w-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={toggle}
            disabled={!ready}
            aria-label={playing ? `Jeda ${track.title}` : `Putar ${track.title} oleh ${track.artist}`}
            className="group relative h-24 w-24 shrink-0 rounded-full sm:h-28 sm:w-28"
          >
            <img
              src={trackThumbnail(track)}
              alt=""
              aria-hidden="true"
              className={`h-full w-full rounded-full object-cover shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ring-4 ring-[var(--background)] transition-transform duration-500 ${
                playing ? "animate-[spin_8s_linear_infinite]" : ""
              }`}
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-black shadow-md">
                {playing ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4 fill-current" />
                )}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={next}
            disabled={!ready}
            aria-label="Lagu berikutnya"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--accent)] disabled:opacity-40"
          >
            <SkipForward className="h-4 w-4 fill-current" />
          </button>
        </div>

        <p className="mt-4 text-sm font-semibold text-[var(--foreground)] sm:text-base">
          {track.title}
        </p>
        <p className="text-xs text-[var(--muted)] sm:text-sm">{track.artist}</p>

        <div className="mt-4 w-full max-w-[220px]">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-[var(--muted)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {PLAYLIST.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTrack(i)}
              disabled={!ready}
              aria-label={`Putar ${t.title} oleh ${t.artist}`}
              aria-current={i === trackIndex}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === trackIndex
                  ? "w-5 bg-[var(--accent)]"
                  : "w-1.5 bg-[var(--border)] hover:bg-[var(--muted)]"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
