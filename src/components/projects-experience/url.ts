"use client";

// `?p=<slug>` is the source of truth for the opened project, read through useSyncExternalStore.
// Next.js patches history.pushState/replaceState (keeping extra keys in `state`), so these entries
// stay router-aware; Next's own navigations are forwarded here via notifyUrlChange().
const listeners = new Set<() => void>();
const OWN_ENTRY = "__projectsGallery";
// unique per page load: an entry marked by a previous document (before a reload) must not be treated
// as ours, or closing would history.back() into a full page load
const DOCUMENT_TOKEN = Math.random().toString(36).slice(2);

export function notifyUrlChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeUrl(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

export const getSearch = () => window.location.search;
export const getServerSearch = () => "";

export function pushProjectParam(slug: string) {
  // idempotent: a double click / double Enter must not stack two entries for the same project
  if (new URLSearchParams(window.location.search).get("p") === slug) return;
  window.history.pushState(
    { [OWN_ENTRY]: DOCUMENT_TOKEN },
    "",
    `${window.location.pathname}?p=${encodeURIComponent(slug)}`,
  );
  notifyUrlChange();
}

/** Closes the project: steps back if the gallery created this history entry, otherwise rewrites it. */
export function closeProjectParam() {
  const state = window.history.state as Record<string, unknown> | null;
  if (state?.[OWN_ENTRY] === DOCUMENT_TOKEN) {
    window.history.back();
  } else {
    window.history.replaceState(null, "", window.location.pathname);
    notifyUrlChange();
  }
}
