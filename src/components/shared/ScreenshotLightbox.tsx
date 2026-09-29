"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export interface LightboxImage {
  src: string;
  alt: string;
  label?: string;
}

interface ScreenshotLightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
}

export function ScreenshotLightbox({
  images,
  index,
  onClose,
  onChange,
}: ScreenshotLightboxProps) {
  const open = index !== null;
  const active = open ? images[index] : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index !== null) {
        onChange((index + 1) % images.length);
      }
      if (e.key === "ArrowLeft" && index !== null) {
        onChange((index - 1 + images.length) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, index, images.length, onClose, onChange]);

  return (
    <AnimatePresence>
      {open && active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-black/85 p-6 backdrop-blur-md"
        >
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-5 top-5 text-white/70 transition-colors hover:text-white"
          >
            <X size={24} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange((index! - 1 + images.length) % images.length);
                }}
                aria-label="Sebelumnya"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white sm:left-6"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange((index! + 1) % images.length);
                }}
                aria-label="Berikutnya"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white sm:right-6"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <motion.div
            key={active.src}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-[9/19.5] w-full max-w-[320px] overflow-hidden rounded-[2.5rem] border-[8px] border-[#1d1d1f] bg-[#1d1d1f] shadow-2xl shadow-black/50"
          >
            <Image
              src={active.src}
              alt={active.alt}
              fill
              sizes="320px"
              className="rounded-[2rem] object-cover"
              priority
            />
          </motion.div>

          {active.label && (
            <p className="text-sm text-white/70">{active.label}</p>
          )}

          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(i);
                  }}
                  aria-label={`Lihat gambar ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
