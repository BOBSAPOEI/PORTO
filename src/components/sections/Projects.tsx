"use client";

import { useMemo, useState } from "react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { GlowOrb } from "@/components/shared/GlowOrb";
import { PageNav } from "@/components/shared/PageNav";
import { ParticleBackground } from "@/components/shared/ParticleBackground";
import { ProjectModal } from "@/components/shared/ProjectModal";
import { ScreenshotLightbox } from "@/components/shared/ScreenshotLightbox";
import { Card } from "@/components/ui/Card";
import { GithubIcon } from "@/components/ui/icons";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { ProjectPreviewCard } from "@/components/shared/ProjectPreviewCard";
import { usePinnedProjects } from "@/lib/usePinnedProjects";
import { projects } from "@/data/projects";
import type { Project } from "@/types";

const streamImages = [
  {
    src: "/images/projects/skkm-dashboard.png",
    alt: "Dashboard SKKM App",
    label: "Dashboard — progres & poin SKKM",
  },
  {
    src: "/images/projects/skkm-explore.png",
    alt: "Halaman Jelajahi SKKM App",
    label: "Jelajahi — katalog sertifikat & provider",
  },
  {
    src: "/images/projects/skkm-add-certificate.png",
    alt: "Form tambah sertifikat SKKM App",
    label: "Tambah Sertifikat — voice, OCR & scan",
  },
  {
    src: "/images/projects/skkm-activity.png",
    alt: "Riwayat aktivitas SKKM App",
    label: "Aktivitas — riwayat sertifikat",
  },
  {
    src: "/images/projects/skkm-profile.png",
    alt: "Profil atlet SKKM App",
    label: "Profil — target & statistik",
  },
  {
    src: "/images/projects/skkm-qr-profile.png",
    alt: "QR profil SKKM App",
    label: "QR Profil — bagikan pencapaian",
  },
];

export function Projects() {
  const [selected, setSelected] = useState<Project | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { pinned, togglePin } = usePinnedProjects();

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aPinned = pinned.includes(a.slug) ? 1 : 0;
      const bPinned = pinned.includes(b.slug) ? 1 : 0;
      return bPinned - aPinned;
    });
  }, [pinned]);

  return (
    <section
      id="projects"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden py-16 sm:py-20"
    >
      <ParticleBackground className="opacity-30" interactive={false} />
      <GlowOrb
        className="-right-40 top-1/4 h-[440px] w-[440px] opacity-40"
        color="rgba(0,113,227,0.32)"
      />
      <div className="relative mx-auto max-w-[96rem] px-6 sm:px-10">
        <AnimatedSection>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--accent)]">
            Proyek
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {projects.length > 0 ? "Karya yang saya bangun." : "Karya yang sedang disiapkan."}
          </h2>
        </AnimatedSection>

        {projects.length > 0 && (
          <AnimatedSection delay={0.15} className="mt-6">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              aria-label="Perbesar tampilan aplikasi"
              className="group relative block w-full text-left"
            >
              <ImageStreamHero
                images={streamImages}
                cards={9}
                speed={16}
                className="h-[280px] w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] transition-colors group-hover:border-[var(--accent)]/50 sm:h-[380px]"
              >
                <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-8 text-center">
                  <p className="max-w-sm text-balance text-sm text-[var(--muted)]">
                    Beberapa layar asli dari SKKM App: dashboard, sertifikat, sampai profil
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)]/80 px-4 py-1.5 text-xs font-medium text-[var(--foreground)] opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                    Klik untuk perbesar ⤢
                  </span>
                </div>
              </ImageStreamHero>
            </button>
          </AnimatedSection>
        )}

        {projects.length > 0 ? (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 [&:has(>:only-child)]:sm:max-w-md [&:has(>:only-child)]:sm:mx-auto">
            {sortedProjects.map((project, i) => {
              const isLiveWeb = project.kind === "web" && project.liveUrl;
              return (
                <AnimatedSection key={project.slug} delay={0.15 + i * 0.1}>
                  <ProjectPreviewCard
                    project={project}
                    pinned={pinned.includes(project.slug)}
                    onTogglePin={() => togglePin(project.slug)}
                    onClick={() =>
                      isLiveWeb
                        ? window.open(project.liveUrl, "_blank", "noopener,noreferrer")
                        : setSelected(project)
                    }
                  />
                </AnimatedSection>
              );
            })}
          </div>
        ) : (
          <AnimatedSection delay={0.15} className="mt-8">
            <Card className="flex flex-col items-start gap-4 py-10 text-left sm:items-center sm:text-center">
              <p className="max-w-md text-base leading-relaxed text-[var(--muted)]">
                Proyek-proyek pilihan sedang dirapikan untuk ditampilkan di
                sini. Sementara itu, lihat karya lain saya langsung di
                GitHub.
              </p>
              <a
                href="https://github.com/BOBSAPOEI"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <GithubIcon size={16} />
                Kunjungi GitHub
              </a>
            </Card>
          </AnimatedSection>
        )}

        <PageNav href="/contact" label="Kontak" />
      </div>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
      <ScreenshotLightbox
        images={streamImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </section>
  );
}
