"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import Image from "next/image";
import { BrowserMockup } from "@/components/shared/BrowserMockup";
import { PhoneMockup } from "@/components/shared/PhoneMockup";
import type { Project } from "@/types";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const isWeb = project?.kind === "web";

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={
              isWeb
                ? "relative flex max-h-[85vh] w-full max-w-2xl flex-col gap-6 overflow-y-auto rounded-3xl border border-[var(--border)] bg-white p-8 sm:p-10"
                : "relative grid max-h-[85vh] w-full max-w-3xl grid-cols-1 gap-8 overflow-y-auto rounded-3xl border border-[var(--border)] bg-white p-8 sm:grid-cols-[240px_1fr] sm:p-10"
            }
          >
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="absolute right-5 top-5 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <X size={20} />
            </button>

            {isWeb ? (
              <BrowserMockup url={project.liveUrl?.replace(/^https?:\/\//, "")}>
                {project.screenshot ? (
                  <Image
                    src={project.screenshot}
                    alt={project.title}
                    fill
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-xs text-[var(--muted)]">
                    Screenshot segera hadir
                  </div>
                )}
              </BrowserMockup>
            ) : (
              <PhoneMockup>
                {project.screenshot ? (
                  <Image
                    src={project.screenshot}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-xs text-[var(--muted)]">
                    Screenshot segera hadir
                  </div>
                )}
              </PhoneMockup>
            )}

            <div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--foreground)]">
                {project.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {project.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {(project.liveUrl || project.repoUrl) && (
                <div className="mt-6 flex gap-4 text-sm text-[var(--accent)]">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      Live <ArrowUpRight size={14} />
                    </a>
                  )}
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      Repo <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
