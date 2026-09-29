"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "portoo:pinned-projects";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();

let cache: string[] = EMPTY;
let cacheRaw: string | null | undefined;

function readStoredPins(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cacheRaw) return cache;
    cacheRaw = raw;
    if (!raw) {
      cache = EMPTY;
      return cache;
    }
    const parsed = JSON.parse(raw);
    cache = Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : EMPTY;
    return cache;
  } catch {
    cache = EMPTY;
    return cache;
  }
}

function writePins(next: string[]) {
  cache = next;
  try {
    cacheRaw = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, cacheRaw);
  } catch {
    // localStorage unavailable (private mode, disabled storage) — pin still works for this session
  }
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerSnapshot() {
  return EMPTY;
}

export function usePinnedProjects() {
  const pinned = useSyncExternalStore(subscribe, readStoredPins, getServerSnapshot);

  const togglePin = useCallback((slug: string) => {
    const current = readStoredPins();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    writePins(next);
  }, []);

  return { pinned, togglePin };
}
