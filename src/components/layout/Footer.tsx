"use client";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-[var(--muted)] sm:flex-row">
        <p>© {new Date().getFullYear()} Muhammad Satriadji Mukti.</p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="hover:text-[var(--foreground)]"
        >
          Kembali ke atas ↑
        </button>
      </div>
    </footer>
  );
}
