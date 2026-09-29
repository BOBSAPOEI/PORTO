"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PageNavProps {
  href: string;
  label: string;
}

export function PageNav({ href, label }: PageNavProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 mx-auto mt-14 flex w-full justify-center"
    >
      <Link
        href={href}
        className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        {label}
        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
