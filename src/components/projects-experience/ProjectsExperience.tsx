"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { projects } from "@/data/projects";
import { usePinnedProjects } from "@/lib/usePinnedProjects";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";
import { FILTERS, matchesQuery, projectMedia } from "./data";
import type { NavState } from "./data";
import {
  closeProjectParam,
  getSearch,
  getServerSearch,
  notifyUrlChange,
  pushProjectParam,
  subscribeUrl,
} from "./url";
import { useScramble } from "./useScramble";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);
const pad = (n: number) => String(n).padStart(2, "0");

/** Forwards Next.js navigations (e.g. the navbar link) to the URL store; Suspense keeps the page prerenderable. */
function UrlWatcher() {
  const params = useSearchParams();
  useEffect(() => {
    notifyUrlChange();
  }, [params]);
  return null;
}

export function ProjectsExperience({
  fontClassName,
}: {
  fontClassName?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { pinned, togglePin } = usePinnedProjects();
  const [filterId, setFilterId] = useState("all");
  const [query, setQuery] = useState("");
  const [focusSlot, setFocusSlot] = useState(0);

  const search = useSyncExternalStore(subscribeUrl, getSearch, getServerSearch);
  const openParam = new URLSearchParams(search).get("p");
  const openProject = projects.find((p) => p.slug === openParam) ?? null;
  const openSlug = openProject?.slug ?? null;

  const nav = useRef<NavState>({ target: 0, current: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const titleAnchor = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(false);
  const wasOpen = useRef(false);
  const suppressClick = useRef(false);
  const wheel = useRef({ accum: 0, last: 0, lockUntil: 0 });
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    startTarget: number;
    lastX: number;
    lastY: number;
    lastT: number;
    velocity: number;
    moved: boolean;
  } | null>(null);

  const visible = useMemo(() => {
    const filter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];
    return projects
      .filter((p) => filter.match(p) && matchesQuery(p, query))
      .sort(
        (a, b) =>
          Number(pinned.includes(b.slug)) - Number(pinned.includes(a.slug)),
      );
  }, [filterId, query, pinned]);

  const slots = useMemo(
    () => Object.fromEntries(visible.map((p, i) => [p.slug, i])),
    [visible],
  );
  const maxSlot = visible.length - 1;
  const focusIndex = clamp(focusSlot, 0, Math.max(maxSlot, 0));
  const focused = visible[focusIndex] ?? null;

  const goTo = useCallback(
    (slot: number) => {
      nav.current.target = clamp(slot, 0, Math.max(maxSlot, 0));
    },
    [maxSlot],
  );

  const open = useCallback(
    (slug: string) => {
      const slot = slots[slug];
      if (slot !== undefined) nav.current.target = slot;
      pushProjectParam(slug);
    },
    [slots],
  );

  const close = closeProjectParam;

  // after a project closes, hand keyboard focus back to the gallery's "BUKA" button
  const bukaRef = useRef<HTMLButtonElement | null>(null);
  const setBukaRef = useCallback((el: HTMLButtonElement | null) => {
    bukaRef.current = el;
    if (el && returnFocus.current) {
      returnFocus.current = false;
      el.focus({ preventScroll: true });
    }
  }, []);
  useEffect(() => {
    if (wasOpen.current && !openSlug) {
      // closed before the gallery finished leaving: it is still mounted, so focus it right away
      if (bukaRef.current) bukaRef.current.focus({ preventScroll: true });
      else returnFocus.current = true;
    }
    wasOpen.current = openSlug !== null;
  }, [openSlug]);

  // keep the carousel parked on the opened project (deep links, re-ordering after pinning)
  useEffect(() => {
    if (openSlug && slots[openSlug] !== undefined)
      nav.current.target = slots[openSlug];
  }, [openSlug, slots]);

  const handleSelect = (slug: string, slot: number) => {
    if (suppressClick.current || openSlug) return;
    if (slot === Math.round(nav.current.target)) open(slug);
    else goTo(slot);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (openSlug) {
          e.preventDefault();
          close();
        }
        return;
      }
      const typing =
        e.target instanceof Element && e.target.closest("input, textarea");
      // leave browser shortcuts (Alt/Cmd + arrows = back/forward) alone
      if (
        openSlug ||
        typing ||
        e.altKey ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      )
        return;
      const current = Math.round(nav.current.target);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goTo(current - 1);
      } else if (
        e.key === "Enter" &&
        (e.target === document.body || e.target === window)
      ) {
        const project = visible[current];
        if (project) open(project.slug);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSlug, close, goTo, open, visible]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.hypot(dx, dy) > 6) {
        d.moved = true;
        suppressClick.current = true;
      }
      if (!d.moved) return;
      // swipe up/down like the reference; horizontal swipes still work as a fallback
      const vertical = Math.abs(dy) >= Math.abs(dx);
      const perSlot = vertical
        ? Math.min(window.innerHeight * 0.35, 420)
        : Math.min(window.innerWidth * 0.38, 520);
      let t = d.startTarget - (vertical ? dy : dx) / perSlot;
      if (t < 0) t *= 0.35;
      else if (t > maxSlot) t = maxSlot + (t - maxSlot) * 0.35;
      nav.current.target = t;
      const elapsed = Math.max(e.timeStamp - d.lastT, 1);
      const step = vertical ? e.clientY - d.lastY : e.clientX - d.lastX;
      d.velocity = (-step / perSlot / elapsed) * 1000;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
      d.lastT = e.timeStamp;
    };
    const up = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      drag.current = null;
      if (d.moved)
        goTo(Math.round(nav.current.target + clamp(d.velocity * 0.18, -1, 1)));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [goTo, maxSlot]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    returnFocus.current = false;
    // a second finger means pinch-zoom, not a carousel swipe
    if (drag.current && drag.current.id !== e.pointerId) {
      drag.current = null;
      return;
    }
    if (
      openSlug ||
      e.button !== 0 ||
      (e.target as HTMLElement).closest("button, a, input, [data-no-drag]")
    )
      return;
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTarget: nav.current.target,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocity: 0,
      moved: false,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (
      openSlug ||
      maxSlot < 1 ||
      (e.target as HTMLElement).closest("[data-scrollable]")
    )
      return;
    const w = wheel.current;
    const now = e.timeStamp;
    if (now - w.last > 220) w.accum = 0;
    w.last = now;
    if (now < w.lockUntil) {
      // trackpad momentum keeps streaming events; extend the lock until a short quiet gap
      w.lockUntil = Math.max(w.lockUntil, now + 150);
      return;
    }
    w.accum += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(w.accum) > 40) {
      goTo(Math.round(nav.current.target) + Math.sign(w.accum));
      w.accum = 0;
      w.lockUntil = now + 420;
    }
  };

  const chooseFilter = (id: string) => {
    setFilterId(id);
    setFocusSlot(0);
    nav.current.target = 0;
  };

  const changeQuery = (value: string) => {
    setQuery(value);
    setFocusSlot(0);
    nav.current.target = 0;
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-immersive-stage
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onWheel={onWheel}
        className={cn(
          fontClassName,
          "fixed inset-0 z-10 touch-pinch-zoom select-none overflow-hidden bg-[#f7f7fa] font-[family-name:var(--font-hud)] text-[var(--foreground)]",
        )}
      >
        <Suspense fallback={null}>
          <UrlWatcher />
        </Suspense>

        <div className="absolute inset-0">
          <Scene
            projects={projects}
            slots={slots}
            maxSlot={maxSlot}
            navRef={nav}
            pointerRef={pointer}
            openSlug={openSlug}
            reducedMotion={reducedMotion}
            titleAnchorRef={titleAnchor}
            onFocusChange={setFocusSlot}
            onSelect={handleSelect}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_85%,rgba(247,247,250,0.9),transparent_55%)]"
        />

        <div
          ref={titleAnchor}
          aria-hidden={openProject || !focused ? true : undefined}
          style={{
            transform: "translate3d(50vw, 50vh, 0) translate(-50%, -50%)",
          }}
          className={cn(
            "pointer-events-none absolute left-0 top-0 transition-opacity duration-300",
            openProject || !focused ? "opacity-0" : "opacity-100",
          )}
        >
          {focused && (
            <FocusTitle
              project={focused}
              pinned={pinned.includes(focused.slug)}
              reducedMotion={reducedMotion}
            />
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {focused && !openProject
            ? `Proyek ${focusIndex + 1} dari ${visible.length}: ${focused.title}`
            : ""}
        </p>

        <p className="pointer-events-none absolute left-10 top-28 hidden text-[11px] tracking-[0.32em] text-[var(--muted)] sm:block">
          ARSIP PROYEK — {pad(visible.length)} KARYA
        </p>

        <AnimatePresence mode="wait">
          {openProject ? (
            <DetailView
              key={openProject.slug}
              project={openProject}
              pinned={pinned.includes(openProject.slug)}
              onTogglePin={() => togglePin(openProject.slug)}
              onClose={close}
              reducedMotion={reducedMotion}
            />
          ) : (
            <motion.div
              key="gallery"
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.4, delay: reducedMotion ? 0 : 0.2 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              {/* on phones the panel sits above the floating music widget */}
              <div className="pointer-events-auto absolute bottom-24 left-5 right-5 sm:bottom-10 sm:left-10 sm:right-auto sm:w-[340px]">
                <p className="text-[13px] tracking-[0.14em] text-[var(--foreground)]">
                  APA YANG KAMU CARI?
                </p>
                <ul
                  data-no-drag
                  className="mt-4 flex gap-4 overflow-x-auto [scrollbar-width:none] sm:flex-col sm:gap-2.5 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
                >
                  {FILTERS.map((filter) => {
                    const count = projects.filter(filter.match).length;
                    if (count === 0) return null;
                    const active = filter.id === filterId;
                    return (
                      <li key={filter.id}>
                        <button
                          type="button"
                          onClick={() => chooseFilter(filter.id)}
                          aria-pressed={active}
                          className={cn(
                            "whitespace-nowrap text-[13px] uppercase tracking-[0.1em] transition-colors",
                            active
                              ? "text-[var(--accent-strong)]"
                              : "text-[var(--muted)] hover:text-[var(--foreground)]",
                          )}
                        >
                          <span aria-hidden="true">
                            {active ? "=> " : "-> "}
                          </span>
                          {filter.label}{" "}
                          <span className="text-black/55">({count})</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <label className="mt-6 flex items-center rounded-full border border-black/15 bg-white/70 px-5 py-3 backdrop-blur-sm transition-colors focus-within:border-[var(--accent)]">
                  <span className="sr-only">Cari proyek</span>
                  <input
                    value={query}
                    onChange={(e) => changeQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") changeQuery("");
                      if (e.key === "Enter" && visible[0])
                        open(visible[0].slug);
                    }}
                    onFocus={() => (returnFocus.current = false)}
                    placeholder="CARI PROYEK..."
                    className="w-full bg-transparent text-base uppercase sm:text-[13px] tracking-[0.12em] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                  />
                </label>
              </div>

              <div className="pointer-events-auto absolute right-5 top-24 flex items-center gap-4 text-[12px] tracking-[0.2em] sm:bottom-28 sm:right-10 sm:top-auto">
                <button
                  type="button"
                  onClick={() => goTo(Math.round(nav.current.target) - 1)}
                  aria-disabled={focusIndex <= 0}
                  aria-label="Proyek sebelumnya"
                  className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)] aria-disabled:opacity-30"
                >
                  ↑
                </button>
                <span className="tabular-nums">
                  {pad(visible.length ? focusIndex + 1 : 0)} /{" "}
                  {pad(visible.length)}
                </span>
                <button
                  type="button"
                  onClick={() => goTo(Math.round(nav.current.target) + 1)}
                  aria-disabled={focusIndex >= maxSlot}
                  aria-label="Proyek berikutnya"
                  className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)] aria-disabled:opacity-30"
                >
                  ↓
                </button>
                {focused && (
                  <button
                    type="button"
                    ref={setBukaRef}
                    onClick={() => open(focused.slug)}
                    aria-label={`Buka ${focused.title}`}
                    className="rounded-full border border-[var(--accent)]/50 px-4 py-1.5 text-[var(--accent-strong)] transition-colors hover:bg-[var(--accent)] hover:text-white"
                  >
                    BUKA
                  </button>
                )}
              </div>

              <p className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 text-[11px] tracking-[0.3em] text-black/60 lg:block">
                SCROLL · SWIPE ↑ ↓ · KLIK KARTU
              </p>

              {/* vertical progress rail, like the reference's scroll indicator */}
              <nav
                aria-label="Daftar proyek"
                data-no-drag
                className="pointer-events-auto absolute right-10 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3.5 sm:[@media(min-aspect-ratio:23/20)]:flex"
              >
                {visible.map((project, i) => (
                  <button
                    key={project.slug}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Ke proyek ${project.title}`}
                    aria-current={i === focusIndex}
                    className="group flex items-center gap-3 text-[11px] tracking-[0.2em]"
                  >
                    <span
                      className={cn(
                        "transition-opacity duration-300",
                        i === focusIndex
                          ? "text-[var(--foreground)] opacity-100"
                          : "text-[var(--muted)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                      )}
                    >
                      {pad(i + 1)} {project.title.toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        "block h-px transition-all duration-300",
                        i === focusIndex
                          ? "w-10 bg-[var(--accent)]"
                          : "w-5 bg-black/25 group-hover:bg-black/60",
                      )}
                    />
                  </button>
                ))}
              </nav>

              {visible.length === 0 && (
                <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-[13px] tracking-[0.2em] text-[var(--muted)]">
                  TIDAK ADA PROYEK YANG COCOK DENGAN &quot;{query.toUpperCase()}
                  &quot;
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function FocusTitle({
  project,
  pinned,
  reducedMotion,
}: {
  project: Project;
  pinned: boolean;
  reducedMotion: boolean;
}) {
  const title = useScramble(project.title.toUpperCase(), !reducedMotion);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="mb-3 rounded-full bg-black/45 px-3 py-1 text-[11px] tracking-[0.35em] text-white backdrop-blur-sm">
        {project.category.toUpperCase()}
      </p>
      <h2
        aria-label={project.title}
        className="whitespace-nowrap text-[clamp(2.2rem,6vw,6rem)] leading-none tracking-[0.04em] text-white [text-shadow:0_0_2px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.6),0_2px_28px_rgba(0,0,0,0.45)]"
      >
        <span aria-hidden="true">{title}</span>
      </h2>
      {pinned && (
        <p className="mt-4 rounded-full bg-black/45 px-3 py-1 text-[11px] tracking-[0.3em] text-white backdrop-blur-sm">
          ● DISEMATKAN
        </p>
      )}
    </div>
  );
}

function pickVideo(media: ReturnType<typeof projectMedia>) {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  const bigScreen = window.innerWidth * window.devicePixelRatio >= 2200;
  return bigScreen && !connection?.saveData ? media.full4k : media.card;
}

function DetailView({
  project,
  pinned,
  onTogglePin,
  onClose,
  reducedMotion,
}: {
  project: Project;
  pinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  reducedMotion: boolean;
}) {
  const media = projectMedia(project.slug);
  const [src, setSrc] = useState(() => pickVideo(media));
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(!reducedMotion);
  const title = project.title.toUpperCase();
  const scrambled = useScramble(title, !reducedMotion);
  const delay = reducedMotion ? 0 : 0.55;

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  // Stop the download of every element this view created (the 4K one, and the 1080p fallback that
  // replaces it via key={src}) once it is really detached; StrictMode's dev remount keeps it attached.
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      window.setTimeout(() => {
        if (!video || video.isConnected) return;
        video.pause();
        video.removeAttribute("src");
        video.load();
      }, 0);
    };
  }, [src]);

  // Browsers pause muted autoplay video while the tab is hidden and don't always resume it —
  // but never restart a video the visitor paused.
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible" && playing)
        videoRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, [playing]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <motion.section
      aria-label={`Detail proyek ${project.title}`}
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <motion.div
        className="pointer-events-auto absolute left-[4vw] right-[4vw] top-24 aspect-video [perspective:1400px] sm:left-auto sm:right-[5vw] sm:top-1/2 sm:w-[min(60vw,calc((100vh-220px)*16/9))] sm:-translate-y-1/2"
        initial={{
          opacity: 0,
          scaleY: 0.02,
          filter: "blur(12px) brightness(3)",
        }}
        animate={{
          opacity: 1,
          scaleY: 1,
          filter: "blur(0px) brightness(1)",
          transition: {
            delay,
            duration: reducedMotion ? 0.01 : 0.55,
            ease: [0.16, 1, 0.3, 1],
          },
        }}
        exit={{
          opacity: 0,
          scaleY: 0.02,
          filter: "blur(10px) brightness(2.5)",
          transition: { duration: 0.28 },
        }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[22px] border border-black/10 bg-black shadow-[0_40px_100px_-30px_rgba(15,23,42,0.45)] sm:[transform:rotateY(-5deg)]">
          <video
            ref={videoRef}
            key={src}
            src={src}
            poster={media.poster}
            autoPlay={playing}
            muted
            loop
            playsInline
            preload="auto"
            onError={() => src !== media.card && setSrc(media.card)}
            className="h-full w-full object-cover"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-[clamp(2.4rem,7vw,7.5rem)] leading-[0.9] tracking-[0.04em] text-white/70 mix-blend-overlay"
          >
            {title}
          </span>
          <span className="absolute right-4 top-4 rounded border border-white/30 bg-black/30 px-2 py-0.5 text-[10px] tracking-[0.2em] text-white/85 backdrop-blur-sm">
            {src === media.full4k ? "4K" : "HD"}
          </span>
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? "Jeda video" : "Putar video"}
            className="absolute bottom-4 right-4 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[11px] tracking-[0.2em] text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            {playing ? "JEDA" : "PUTAR"}
          </button>
        </div>
      </motion.div>

      <motion.div
        data-scrollable
        className="pointer-events-auto absolute bottom-24 left-5 right-5 top-[calc(6rem+51.75vw+1.5rem)] touch-auto overflow-y-auto pr-2 sm:bottom-10 sm:left-10 sm:right-auto sm:top-auto sm:max-h-[62vh] sm:w-[min(32vw,400px)]"
        initial={{ opacity: 0, x: -16 }}
        animate={{
          opacity: 1,
          x: 0,
          transition: { delay: delay + 0.15, duration: 0.5 },
        }}
        exit={{ opacity: 0, x: -12, transition: { duration: 0.2 } }}
      >
        <h2
          aria-label={project.title}
          className="text-[15px] tracking-[0.14em] text-[var(--foreground)]"
        >
          <span aria-hidden="true">{scrambled}</span>
        </h2>
        <p className="mt-4 text-[12px] tracking-[0.16em] text-[var(--accent-strong)]">
          {project.category.toUpperCase()} /{" "}
          {project.tech.slice(0, 3).join(" · ").toUpperCase()}
        </p>
        <p className="mt-5 text-[12.5px] uppercase leading-[1.75] tracking-[0.05em] text-[var(--muted)]">
          {project.description}
        </p>
        <div className="mt-6 flex flex-col items-start gap-3 text-[13px] tracking-[0.14em]">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-strong)] underline underline-offset-4 transition-colors hover:text-[var(--foreground)]"
            >
              LINK PROYEK ↗
            </a>
          )}
          <button
            type="button"
            onClick={onTogglePin}
            className="text-[var(--accent-strong)] transition-colors hover:text-[var(--foreground)]"
          >
            <span aria-hidden="true">{pinned ? "● " : "○ "}</span>
            {pinned ? "LEPAS SEMATAN" : "SEMATKAN DI ATAS"}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
          >
            &lt;- TUTUP
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
}
