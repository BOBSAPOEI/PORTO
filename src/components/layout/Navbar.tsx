"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const links = [
  { label: "Tentang", href: "/about" },
  { label: "Pengalaman", href: "/experience" },
  { label: "Proyek", href: "/projects" },
  { label: "Kontak", href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const background = useTransform(
    scrollY,
    [0, 120],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.75)"],
  );
  const borderOpacity = useTransform(scrollY, [0, 120], [0, 1]);

  return (
    <motion.header
      style={{ background }}
      className="fixed inset-x-0 top-0 z-50 isolate backdrop-blur-md"
    >
      <motion.div
        style={{ opacity: borderOpacity }}
        className="absolute inset-x-0 bottom-0 h-px bg-[var(--border)]"
      />
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--foreground)]"
        >
          Satriadji<span className="text-[var(--accent)]">.</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative inline-block pb-1 text-sm transition-[color,transform] duration-150 ease-out hover:-translate-y-px motion-reduce:hover:translate-y-0 ${
                  isActive
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-line"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-x-0 -bottom-0.5 h-[2px] rounded-full bg-[var(--accent)]"
                  />
                )}
              </Link>
            );
          })}
          <Button href="/contact" variant="solid" className="!px-5 !py-2 !text-xs">
            Hubungi Saya
          </Button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[var(--foreground)] md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-[var(--border)] bg-[var(--background)] px-6 py-6 md:hidden"
        >
          <div className="flex flex-col gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={
                  pathname === link.href
                    ? "text-base text-[var(--foreground)]"
                    : "text-base text-[var(--muted)] hover:text-[var(--foreground)]"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
