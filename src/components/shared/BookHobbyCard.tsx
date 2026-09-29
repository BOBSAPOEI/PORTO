"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CYCLE_MS = 4500;

const books = [
  {
    key: "subtle-art",
    title: "Seni dalam Bersikap “Bodoh Amat”",
    author: "Mark Manson",
    cover: "/images/books/subtle-art.jpg",
  },
  {
    key: "happy-life",
    title: "A Happy Life",
    author: "Seneca",
    cover: "/images/books/seneca-happy-life.jpg",
  },
];

export function BookHobbyCard() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % books.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const book = books[index];

  return (
    <div
      className="relative h-full min-h-[360px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:min-h-[420px] sm:p-6"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <motion.span
        className="absolute left-5 top-5 text-xs uppercase tracking-[0.25em] text-[var(--muted)] sm:left-6 sm:top-6"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        Hobi &middot; Buku
      </motion.span>

      <motion.div
        className="pointer-events-none absolute right-6 top-20 h-44 w-32 sm:right-9 sm:top-24 sm:h-56 sm:w-40"
        style={{ perspective: 900 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={book.key}
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, rotateY: -70, x: 26, scale: 0.92 }}
            animate={{ opacity: 1, rotateY: 6, x: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: 70, x: -26, scale: 0.92 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={book.cover}
              alt={`Sampul buku ${book.title}`}
              className="absolute inset-0 h-full w-full rounded-lg object-cover shadow-[0_25px_45px_-15px_rgba(0,0,0,0.5)] ring-1 ring-black/10"
            />
            <motion.div
              className="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/60 to-transparent"
              style={{ mixBlendMode: "overlay" }}
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: "120%", opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.25, ease: "easeInOut" }}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="absolute bottom-10 left-5 z-10 max-w-[54%] sm:bottom-14 sm:left-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={book.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-block rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
              Membaca
            </span>
            <p className="mt-2.5 text-base font-semibold leading-snug text-[var(--foreground)] sm:text-lg">
              {book.title}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)] sm:text-sm">{book.author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
