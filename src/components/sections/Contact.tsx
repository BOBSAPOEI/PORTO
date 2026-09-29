import { Mail, MessageCircle } from "lucide-react";
import type { ComponentType } from "react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { PageNav } from "@/components/shared/PageNav";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "@/components/ui/icons";

const channels: {
  label: string;
  value: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    label: "Email",
    value: "satriadjimukti@gmail.com",
    href: "mailto:satriadjimukti@gmail.com",
    icon: Mail,
  },
  {
    label: "WhatsApp",
    value: "+62 821-1291-1285",
    href: "https://wa.me/6282112911285",
    icon: MessageCircle,
  },
  {
    label: "LinkedIn",
    value: "muhammad-satriadji-mukti",
    href: "https://www.linkedin.com/in/muhammad-satriadji-mukti-4ab667422/",
    icon: LinkedinIcon,
  },
  {
    label: "GitHub",
    value: "BOBSAPOEI",
    href: "https://github.com/BOBSAPOEI",
    icon: GithubIcon,
  },
  {
    label: "Instagram",
    value: "@satriadjii",
    href: "https://instagram.com/satriadjii",
    icon: InstagramIcon,
  },
];

export function Contact() {
  return (
    <section
      id="contact"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden py-16 sm:py-20"
    >
      <div className="relative mx-auto max-w-4xl px-6 sm:px-10">
        <AnimatedSection>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--accent)]">
            Kontak
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-6">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            Punya proyek atau ide?{" "}
            <span className="text-[var(--accent)]">Mari bicara.</span>
          </h2>
        </AnimatedSection>

        <div className="mt-10 flex flex-col">
          {channels.map((channel, i) => {
            const Icon = channel.icon;
            return (
              <AnimatedSection key={channel.label} delay={0.15 + i * 0.08}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between border-t border-[var(--border)] py-6 transition-colors last:border-b hover:bg-black/[0.02]"
                >
                  <span className="flex items-center gap-4">
                    <Icon
                      size={18}
                      className="text-[var(--accent)] transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                      {channel.label}
                    </span>
                  </span>
                  <span className="text-sm text-[var(--muted)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--foreground)]">
                    {channel.value}
                  </span>
                </a>
              </AnimatedSection>
            );
          })}
        </div>

        <PageNav href="/" label="Kembali ke Beranda" />
      </div>
    </section>
  );
}
