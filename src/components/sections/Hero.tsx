"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlowOrb } from "@/components/shared/GlowOrb";
import { WordReveal } from "@/components/shared/WordReveal";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

const Scene3D = dynamic(
  () => import("@/components/shared/Scene3D").then((m) => m.Scene3D),
  { ssr: false },
);

const stats = [
  { value: "Swift", label: "Spesialisasi Utama" },
  { value: "Fullstack", label: "Web & Backend" },
  { value: "Ketua", label: "Himpunan Mahasiswa ITI" },
];

function LiveClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        }),
      );
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="tabular-nums">Indonesia · {time ?? "--:--:--"} WIB</span>;
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const orbYSlow = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const orbYFast = useTransform(scrollYProgress, [0, 1], [0, 140]);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-28 sm:px-10"
    >
      <motion.div style={{ y: orbYSlow }}>
        <GlowOrb
          className="left-[10%] top-[10%] h-[520px] w-[520px] opacity-80"
          color="rgba(0,113,227,0.5)"
        />
      </motion.div>
      <motion.div style={{ y: orbYFast }}>
        <GlowOrb
          className="right-[5%] top-[14%] h-[560px] w-[560px] opacity-85"
          color="rgba(191,90,242,0.4)"
        />
      </motion.div>
      <motion.div style={{ y: orbYSlow }}>
        <GlowOrb
          className="bottom-[6%] left-1/2 h-[440px] w-[440px] -translate-x-1/2 opacity-60"
          color="rgba(255,105,97,0.3)"
        />
      </motion.div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <motion.div
          style={{ scale, opacity, y }}
          className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]"
          >
            Fullstack Developer · iOS / Swift
          </motion.p>

          <WordReveal
            delayStart={0.1}
            className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-6xl md:text-7xl"
            words={[
              "Muhammad ",
              "Satriadji",
              <br key="br" />,
              <span key="mukti" className="text-gradient-animate">
                Mukti
              </span>,
            ]}
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl text-balance text-base leading-relaxed text-[var(--muted)] sm:text-lg"
          >
            Membangun produk digital dari ujung ke ujung: web, backend, sampai
            aplikasi iOS. Di luar itu, saya juga memimpin Himpunan Mahasiswa
            di Institut Teknologi Indonesia (ITI).
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 flex flex-col gap-4 sm:flex-row"
          >
            <span className="relative inline-block">
              <span className="pulse-ring pointer-events-none absolute inset-0 rounded-full bg-[var(--accent)]" />
              <Button href="/projects" variant="solid" className="relative">
                Lihat Proyek
              </Button>
            </span>
            <Button href="/contact" variant="ghost">
              Hubungi Saya →
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[480px]"
        >
          <Scene3D reducedMotion={reducedMotion} className="h-full w-full" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]"
          >
            Geser untuk putar
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto mt-14 flex w-full max-w-6xl flex-col items-center gap-8 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between"
      >
        <LiveClock />
        <div className="flex gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--foreground)]">
                {stat.value}
              </p>
              <p className="mt-0.5 whitespace-nowrap">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <Link
        href="/about"
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Jelajahi</span>
        <motion.span
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={18} />
        </motion.span>
      </Link>
    </section>
  );
}
