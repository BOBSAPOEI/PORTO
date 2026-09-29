"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Lenis from "lenis";

type CalderAPI = {
  scrollToSection: (id: string) => void;
  openModal: () => void;
  closeModal: () => void;
  openNav: () => void;
  closeNav: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

declare global {
  interface Window {
    __calder?: CalderAPI;
  }
}

export function CalderExperience() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const $ = (id: string) => document.getElementById(id) as HTMLElement;

    window.scrollTo(0, 0);
    const lenis = new Lenis({ smoothWheel: true });
    function raf(t: number) {
      lenis.raf(t);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const scrollProgressEl = $("scrollProgress");
    function updateScrollProgress() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      scrollProgressEl.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    updateScrollProgress();

    function stopScroll() {
      lenis.stop();
      const h = document.documentElement;
      h.style.position = "relative";
      h.style.overflow = "hidden";
      h.style.height = "100%";
    }
    function startScroll() {
      lenis.start();
      const h = document.documentElement;
      h.style.removeProperty("position");
      h.style.removeProperty("overflow");
      h.style.removeProperty("height");
    }

    function scrollToSection(id: string) {
      const el = document.getElementById(id);
      if (!el) return;
      stopScroll();
      setTimeout(() => {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset, behavior: "smooth" });
      }, 50);
      setTimeout(startScroll, 100);
    }

    // ── Adaptive Grid ──
    function applyAdaptiveGrid() {
      const FONT_BASE = 16;
      const baseWidth = 1920;
      const coef = 0.6666;
      const w = window.innerWidth;
      const widthReduction = ((baseWidth - w) / baseWidth) * 100;
      const size = FONT_BASE - (FONT_BASE * (widthReduction * coef)) / 100;
      if (size > FONT_BASE) document.documentElement.style.fontSize = size + "px";
      else document.documentElement.style.removeProperty("font-size");
    }
    applyAdaptiveGrid();
    window.addEventListener("resize", applyAdaptiveGrid);

    // ── Clock ──
    function updateClock() {
      const d = new Date();
      let h = d.getHours();
      const m = d.getMinutes();
      const mer = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      const timeStr = h + ":" + String(m).padStart(2, "0") + mer;
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const dateStr = d.getDate() + " " + months[d.getMonth()] + ", " + d.getFullYear();
      $("clockTime").textContent = timeStr;
      $("clockDate").textContent = dateStr;
      const navTime = document.getElementById("navMenuTime");
      if (navTime) navTime.textContent = timeStr;
    }
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    void clockInterval;

    // ── Loader ──
    stopScroll();
    const FILL_MS = 1300;
    const loaderStart = performance.now();
    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    }

    function tickLoader(now: number) {
      const elapsed = now - loaderStart;
      const raw = Math.min(elapsed / FILL_MS, 1);
      const progress = Math.round(easeInOutCubic(raw) * 100);
      $("loaderFill").style.width = progress + "%";
      $("loaderCounter").textContent = String(progress).padStart(3, "0");
      if (progress < 100) {
        requestAnimationFrame(tickLoader);
      } else {
        setTimeout(exitLoader, 200);
      }
    }
    requestAnimationFrame(tickLoader);

    function exitLoader() {
      const loader = $("pageLoader");
      const center = loader.querySelector(".loader__center") as HTMLElement;
      center.style.opacity = "0";
      center.style.transform = "translateY(-12px)";
      loader.style.transition = "transform .7s cubic-bezier(.22,1,.36,1)";
      loader.style.transform = "translateY(-100%)";
      setTimeout(() => {
        loader.remove();
        startScroll();
        revealHero();
      }, 700);
    }

    // ── Hero reveals ──
    function revealHero() {
      setTimeout(() => $("siteHeader").classList.add("revealed"), 150);
      setTimeout(() => $("heroEyebrow").classList.add("revealed"), 200);
      setTimeout(() => {
        document.querySelectorAll("#heroH1 .line-inner").forEach((el, i) => {
          setTimeout(() => el.classList.add("revealed"), i * 120);
        });
      }, 250);
      setTimeout(() => $("heroWatermark").classList.add("revealed"), 300);
      setTimeout(() => $("heroCard").classList.add("revealed"), 400);
      setTimeout(() => $("heroPartners").classList.add("revealed"), 550);
      setTimeout(() => $("heroRating").classList.add("revealed"), 650);
      setTimeout(() => $("heroCtas").classList.add("revealed"), 750);
      setTimeout(() => $("heroStatus").classList.add("revealed"), 900);
    }

    // ── Intersection Observer reveals ──
    function setupRevealObserver() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              const delay = parseInt(el.dataset.delay || "0");
              setTimeout(() => el.classList.add("revealed"), delay);
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

      const lineObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              el.classList.add("revealed");
              lineObserver.unobserve(el);
            }
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll("[data-reveal-line]").forEach((el) => lineObserver.observe(el));
    }

    // ── About word reveal ──
    const aboutText = "We partner with ambitious teams to ship";
    const aboutMuted = "digital products, brand systems, and the strategy that holds them together.";
    function buildAboutH2() {
      const h2 = $("aboutH2");
      const allWords = aboutText.split(" ").filter(Boolean);
      const mutedWords = aboutMuted.split(" ").filter(Boolean);
      allWords.forEach((w, i) => {
        const span = document.createElement("span");
        span.className = "about__word";
        span.textContent = w;
        span.style.transitionDelay = i * 35 + "ms";
        h2.appendChild(span);
      });
      mutedWords.forEach((w, i) => {
        const span = document.createElement("span");
        span.className = "about__word muted";
        span.textContent = w;
        span.style.transitionDelay = (allWords.length + i) * 35 + "ms";
        h2.appendChild(span);
      });
      const wordObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              h2.querySelectorAll(".about__word").forEach((w) => w.classList.add("revealed"));
              wordObserver.unobserve(h2);
            }
          });
        },
        { threshold: 0.15 }
      );
      wordObserver.observe(h2);
    }

    // ── Hero Card carousel ──
    const cardItems = [
      { caption: "Conversion design", title: "Crafted to convert." },
      { caption: "Engineering", title: "Built to scale." },
      { caption: "Brand systems", title: "Designed to last." },
    ];
    let cardIdx = 0;
    function renderCard(dir: number) {
      const slot = $("heroCardSlot");
      const old = slot.querySelector(".hero-card__item") as HTMLElement | null;
      if (old) {
        old.style.opacity = "0";
        old.style.transform = `translateY(${dir > 0 ? -14 : 14}px)`;
        setTimeout(() => old.remove(), 300);
      }
      const item = document.createElement("div");
      item.className = "hero-card__item";
      item.style.opacity = "0";
      item.style.transform = `translateY(${dir > 0 ? 14 : -14}px)`;
      item.innerHTML = `<div class="hero-card__caption">${cardItems[cardIdx].caption}</div><div class="hero-card__title">${cardItems[cardIdx].title}</div>`;
      slot.appendChild(item);
      requestAnimationFrame(() => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      });
      renderDots();
    }
    function renderDots() {
      const dots = $("heroCardDots");
      dots.innerHTML = cardItems
        .map((_, i) => `<span class="hero-card__dot ${i === cardIdx ? "hero-card__dot--active" : "hero-card__dot--inactive"}"></span>`)
        .join("");
    }
    function nextCard() {
      cardIdx = (cardIdx + 1) % cardItems.length;
      renderCard(1);
    }
    function prevCard() {
      cardIdx = (cardIdx - 1 + cardItems.length) % cardItems.length;
      renderCard(-1);
    }
    $("heroCardNext").addEventListener("click", (e) => {
      e.stopPropagation();
      nextCard();
    });
    $("heroCardPrev").addEventListener("click", (e) => {
      e.stopPropagation();
      prevCard();
    });
    $("heroCardBody").addEventListener("click", nextCard);
    renderCard(1);

    // ── Partners ──
    const partners = ["Kaido", "Northpeak", "Vellum", "Orbit", "Brightline", "Cobalt", "Mesa"];
    function buildPartners() {
      const grid = $("partnersGrid");
      partners.forEach((name) => {
        const span = document.createElement("span");
        span.className = "partner-item";
        span.innerHTML = `<svg width=".875rem" height=".875rem" viewBox="0 0 24 24" fill="none" stroke="rgba(17,17,17,.4)" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2" fill="rgba(17,17,17,.4)"/></svg>${name}`;
        grid.appendChild(span);
      });
    }
    buildPartners();

    // ── Magnetic pill buttons ──
    function setupMagneticPills() {
      document.querySelectorAll<HTMLElement>(".pill").forEach((btn) => {
        btn.addEventListener("mousemove", (e) => {
          const r = btn.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.22;
          const y = (e.clientY - r.top - r.height / 2) * 0.35;
          btn.style.transform = `translate(${x}px, ${y}px) scale(1.04)`;
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.transform = "";
        });
      });
    }
    setupMagneticPills();

    // ── CreateBand reveals ──
    function setupCreateBand() {
      const items = document.querySelectorAll<HTMLElement>(".create-band__item");
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              items.forEach((el, i) => {
                setTimeout(() => el.classList.add("revealed"), i * 120);
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      if (items[0]) observer.observe(items[0]);
    }

    // ── Portfolio ──
    const portfolioItems = [
      { name: "Aster Labs", category: "Branding", year: "2025", desc: "A complete identity and go-to-market system for a fast-moving research startup.", tags: ["Branding", "Strategy", "Design"], glow: "rgba(255,145,66,.4), rgba(255,145,66,0)" },
      { name: "Nova Finance", category: "Product", year: "2024", desc: "A finance platform reimagined — clear data, calm interfaces, and effortless flows.", tags: ["Product Design", "Web App", "QA"], glow: "rgba(64,160,255,.4), rgba(64,160,255,0)" },
      { name: "Helio Studio", category: "Identity", year: "2023", desc: "A bold visual identity and art direction system built to scale across every surface.", tags: ["Brand Identity", "Art Direction"], glow: "rgba(200,90,255,.38), rgba(200,90,255,0)" },
      { name: "Pulse Health", category: "Mobile", year: "2023", desc: "A wellness app grounded in research, shipped end to end from concept to release.", tags: ["Mobile App", "UX Research", "Development"], glow: "rgba(60,220,170,.38), rgba(60,220,170,0)" },
    ];
    function buildPortfolio() {
      const grid = $("portfolioGrid");
      portfolioItems.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "portfolio__item";
        li.style.transitionDelay = idx * 90 + "ms";
        li.innerHTML = `<a href="#">
          <article class="portfolio__card" style="background:radial-gradient(120% 100% at 25% 15%, ${item.glow} 65%, transparent 100%), #0a0a0a">
            <div class="portfolio__meta">
              <span>${item.category} — ${item.year}</span>
              <div class="portfolio__badge">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>
              </div>
            </div>
            <div class="portfolio__center">
              <span class="portfolio__logo"><svg width="1em" height="1em" viewBox="0 0 48 48" fill="currentColor"><path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z"/></svg></span>
              <span class="portfolio__reg">&reg;</span>
            </div>
            <div class="portfolio__bottom">
              <h3>${item.name}</h3>
              <p class="portfolio__desc">${item.desc}</p>
              <div class="portfolio__tags">${item.tags.map((t) => `<span class="tag-chip">${t}</span>`).join("")}</div>
            </div>
          </article>
        </a>`;
        grid.appendChild(li);
      });
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      grid.querySelectorAll(".portfolio__item").forEach((el) => observer.observe(el));
    }

    // ── Services ──
    const servicesData = [
      { title: "Software Development", desc: "Scalable web & mobile products built to last." },
      { title: "Product Design", desc: "Interfaces that feel effortless and look sharp." },
      { title: "Quality Assurance", desc: "Rigorous testing for flawless, confident releases." },
      { title: "Consulting", desc: "Strategy and direction for ambitious teams." },
    ];
    function buildServices() {
      const list = $("servicesList");
      servicesData.forEach((s, i) => {
        const li = document.createElement("li");
        li.className = "services__item";
        li.style.transitionDelay = i * 80 + "ms";
        li.innerHTML = `<a href="#" class="services__link">
          <span class="services__idx">0${i + 1}</span>
          <h3 class="services__title">${s.title}</h3>
          <p class="services__desc">${s.desc}</p>
          <span class="services__arrow"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span>
        </a>`;
        list.appendChild(li);
      });
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      list.querySelectorAll(".services__item").forEach((el) => observer.observe(el));
    }

    // ── Stats ──
    const statsData = [
      { value: 150, suffix: "+", label: "Projects delivered" },
      { value: 98, suffix: "%", label: "Client retention" },
      { value: 12, suffix: "", label: "Years of craft" },
      { value: 40, suffix: "+", label: "Team members" },
    ];
    function buildStats() {
      const grid = $("statsGrid");
      statsData.forEach((s, i) => {
        const li = document.createElement("li");
        li.className = "stats__item";
        li.style.transitionDelay = i * 90 + "ms";
        li.innerHTML = `<div class="stats__number"><span class="stats__count" data-target="${s.value}">0</span>${s.suffix}</div><p class="stats__label">${s.label}</p>`;
        grid.appendChild(li);
      });
      const panelObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              panelObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll(".stats-panel, .stats__item").forEach((el) => panelObserver.observe(el));
      setupCountUp();
    }

    function setupCountUp() {
      let lastTick = 0;
      function tickCountUp() {
        const now = performance.now();
        if (now - lastTick < 30) {
          requestAnimationFrame(tickCountUp);
          return;
        }
        lastTick = now;
        document.querySelectorAll<HTMLElement>(".stats__count").forEach((el) => {
          const target = parseInt(el.dataset.target || "0");
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          const startY = vh;
          const endY = vh / 2;
          const progress = Math.max(0, Math.min(1, (startY - rect.top) / (startY - endY)));
          el.textContent = String(Math.round(progress * target));
        });
        requestAnimationFrame(tickCountUp);
      }
      requestAnimationFrame(tickCountUp);
    }

    // ── Nav Menu ──
    const navItems = [
      { label: "Home", target: "home" },
      { label: "Work", target: "works" },
      { label: "Services", target: "services" },
      { label: "Studio", target: "about" },
      { label: "Careers", target: "careers" },
      { label: "Contact", target: "contact" },
    ];
    function buildNavMenu() {
      const list = $("navMenuList");
      navItems.forEach((item, i) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "nav-menu__item";
        btn.style.transitionDelay = i * 45 + 80 + "ms";
        btn.innerHTML = `<span class="nav-menu__idx">0${i + 1}</span><span class="nav-menu__label">${item.label}</span>`;
        btn.addEventListener("click", () => {
          closeNav();
          if (item.target === "contact") {
            setTimeout(openModal, 300);
          } else {
            setTimeout(() => scrollToSection(item.target), 300);
          }
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
    }
    buildNavMenu();

    function navEscHandler(e: KeyboardEvent) {
      if (e.key === "Escape") closeNav();
    }
    function openNav() {
      const menu = $("navMenu");
      menu.classList.add("open");
      stopScroll();
      document.addEventListener("keydown", navEscHandler);
    }
    function closeNav() {
      const menu = $("navMenu");
      menu.classList.remove("open");
      startScroll();
      document.removeEventListener("keydown", navEscHandler);
    }

    // ── Request Modal ──
    function modalEscHandler(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    function openModal() {
      const modal = $("requestModal");
      modal.classList.add("open");
      stopScroll();
      document.addEventListener("keydown", modalEscHandler);
    }
    function closeModal() {
      const modal = $("requestModal");
      modal.classList.remove("open");
      startScroll();
      document.removeEventListener("keydown", modalEscHandler);
      setTimeout(() => {
        $("modalFormState").style.display = "";
        $("modalSuccessState").style.display = "none";
        ($("requestForm") as HTMLFormElement).reset();
        $("submitLabel").textContent = "Send request";
      }, 300);
    }
    $("requestModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      $("submitLabel").textContent = "Sending…";
      setTimeout(() => {
        $("modalFormState").style.display = "none";
        $("modalSuccessState").style.display = "";
      }, 600);
    }

    // ── Liquid Reveal ──
    function initLiquidReveal() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const container = $("liquidReveal");
      const canvas = $("heroCanvas") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d")!;
      const baseImg = $("heroBaseImg") as HTMLImageElement;
      void baseImg;

      const afterImg = new Image();
      afterImg.crossOrigin = "anonymous";
      afterImg.src = "/showcase/calder/hero.jpg";

      const BRUSH_RADIUS = 320;
      const DECAY = 0.006;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      let coverCanvas: HTMLCanvasElement | undefined;
      let brushCanvas: HTMLCanvasElement | undefined;
      let brushCtx: CanvasRenderingContext2D | undefined;
      let cw = 0;
      let ch = 0;
      let radius = 0;
      let diameter = 0;
      const points: { x: number; y: number }[] = [];
      let last: { x: number; y: number } | null = null;
      let idle = 0;
      let drawing = false;
      let ready = false;

      function resize() {
        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        cw = Math.round(rect.width * dpr);
        ch = Math.round(rect.height * dpr);
        canvas.width = cw;
        canvas.height = ch;
        canvas.style.width = rect.width + "px";
        canvas.style.height = rect.height + "px";
        radius = BRUSH_RADIUS * dpr;
        diameter = Math.ceil(radius * 2);

        brushCanvas = document.createElement("canvas");
        brushCanvas.width = diameter;
        brushCanvas.height = diameter;
        brushCtx = brushCanvas.getContext("2d")!;

        if (afterImg.complete && afterImg.naturalWidth > 0) buildCover();
      }

      function buildCover() {
        coverCanvas = document.createElement("canvas");
        coverCanvas.width = cw;
        coverCanvas.height = ch;
        const cctx = coverCanvas.getContext("2d")!;
        const iw = afterImg.naturalWidth;
        const ih = afterImg.naturalHeight;
        const scale = Math.max(cw / iw, ch / ih);
        const sw = iw * scale;
        const sh = ih * scale;
        const sx = (cw - sw) / 2;
        const sy = (ch - sh) / 2;
        cctx.drawImage(afterImg, sx, sy, sw, sh);
        ready = true;
      }

      afterImg.onload = () => {
        buildCover();
      };

      const ro = new ResizeObserver(() => resize());
      ro.observe(container);
      resize();

      window.addEventListener("pointermove", (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        if (x < -radius || y < -radius || x > cw + radius || y > ch + radius) {
          last = null;
          return;
        }
        if (!last) {
          last = { x, y };
          points.push({ x, y });
          return;
        }
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = Math.max(radius * 0.3, 1);
        const n = Math.min(Math.ceil(dist / step), 60);
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          points.push({ x: last.x + dx * t, y: last.y + dy * t });
        }
        last = { x, y };
        drawing = true;
      });

      function stamp(x: number, y: number) {
        if (!diameter || !brushCanvas || !brushCanvas.width || !brushCanvas.height || !brushCtx) return;
        const c = diameter / 2;
        brushCtx.clearRect(0, 0, diameter, diameter);
        brushCtx.globalCompositeOperation = "source-over";
        const grad = brushCtx.createRadialGradient(c, c, 0, c, c, c);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.8, "rgba(255,255,255,1)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        brushCtx.fillStyle = grad;
        brushCtx.fillRect(0, 0, diameter, diameter);

        brushCtx.globalCompositeOperation = "source-in";
        if (coverCanvas) {
          brushCtx.drawImage(coverCanvas, x - c, y - c, diameter, diameter, 0, 0, diameter, diameter);
        }

        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(brushCanvas, x - c, y - c);
      }

      function tick() {
        if (!ready) {
          requestAnimationFrame(tick);
          return;
        }
        if (points.length > 0) {
          idle = 0;
        } else {
          idle++;
          if (idle > 120) {
            ctx.clearRect(0, 0, cw, ch);
            requestAnimationFrame(tick);
            return;
          }
        }
        const fade = drawing && points.length > 0 ? DECAY : Math.min(DECAY + idle * 0.004, 0.5);
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${fade})`;
        ctx.fillRect(0, 0, cw, ch);

        if (points.length > 0) {
          const batch = points.splice(0);
          batch.forEach((p) => stamp(p.x, p.y));
          drawing = false;
        }

        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    initLiquidReveal();

    // ── Init ──
    buildAboutH2();
    buildPortfolio();
    buildServices();
    buildStats();
    setupCreateBand();
    setupRevealObserver();

    window.__calder = { scrollToSection, openModal, closeModal, openNav, closeNav, handleSubmit };
  }, []);

  return (
    <>
      <div className="scroll-progress" id="scrollProgress" aria-hidden="true" />

      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="loader" id="pageLoader" aria-live="polite">
        <div className="loader__center">
          <div className="loader__brand">
            <svg width="1.875rem" height="1.875rem" viewBox="0 0 48 48" fill="#cf8047" aria-hidden="true">
              <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
            </svg>
            Calder
          </div>
          <p className="loader__tagline">Bold ideas, shipped with quiet precision.</p>
        </div>
        <div className="loader__progress">
          <div className="loader__track">
            <div className="loader__fill" id="loaderFill" />
          </div>
          <div className="loader__meta">
            <span>Loading</span>
            <span className="loader__counter" id="loaderCounter">
              000
            </span>
          </div>
        </div>
      </div>

      <header className="header" id="siteHeader">
        <div className="shell header__inner">
          <button className="header__brand" onClick={() => window.__calder?.scrollToSection("home")} aria-label="Calder home">
            <svg width="1.25rem" height="1.25rem" viewBox="0 0 48 48" fill="#b15f2c" aria-hidden="true">
              <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
            </svg>
            Calder
          </button>
          <nav className="header__nav" aria-label="Primary navigation">
            <button onClick={() => window.__calder?.scrollToSection("home")} aria-current="page">
              Home
            </button>
            <button onClick={() => window.__calder?.scrollToSection("works")}>Work</button>
            <button onClick={() => window.__calder?.scrollToSection("services")}>
              Services<span className="caret">&#9662;</span>
            </button>
            <button onClick={() => window.__calder?.scrollToSection("about")}>Studio</button>
            <button onClick={() => window.__calder?.scrollToSection("careers")}>Careers</button>
            <button onClick={() => window.__calder?.openModal()}>Contact</button>
          </nav>
          <div className="header__right">
            <Link className="header__back" href="/" aria-label="Kembali ke portfolio">
              <svg width=".875rem" height=".875rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="header__back-label">Portfolio</span>
            </Link>
            <div className="header__clock">
              <span className="header__clock-label">Local time</span>
              <span className="header__clock-time" id="clockTime">
                9:41am
              </span>
              <span className="header__clock-sep">&bull;</span>
              <span className="header__clock-date" id="clockDate">
                12 March, 2025
              </span>
            </div>
            <button className="header__menu-btn" onClick={() => window.__calder?.openNav()} aria-label="Open navigation menu">
              <svg width=".875rem" height=".875rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="header__menu-label">Menu</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <section id="home" className="hero">
          <div className="hero__reveal" id="liquidReveal">
            <img src="/showcase/calder/hero-mono.jpg" alt="Calder studio workspace" id="heroBaseImg" />
            <canvas aria-hidden="true" id="heroCanvas" />
          </div>
          <div className="hero__vignette" />
          <div className="hero__watermark" id="heroWatermark">
            CALDER
          </div>
          <div className="shell hero__content">
            <div className="hero__left">
              <div className="hero__eyebrow" id="heroEyebrow">
                <span className="dot" />
                Independent Studio
              </div>
              <h1 className="hero__h1" id="heroH1">
                <span className="line-wrap">
                  <span className="line-inner" data-line="0">
                    Bold ideas,
                  </span>
                </span>
                <span className="line-wrap">
                  <span className="line-inner" data-line="1">
                    shipped with
                  </span>
                </span>
                <span className="line-wrap">
                  <span className="line-inner" data-line="2">
                    quiet precision
                  </span>
                </span>
              </h1>
              <div className="hero__rating" id="heroRating">
                <span className="hero__stars">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} width="1rem" height="1rem" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z" />
                    </svg>
                  ))}
                </span>
                <span className="hero__rating-text">200+ brands shipped</span>
              </div>
              <div className="hero__ctas" id="heroCtas">
                <button className="pill pill--dark pill--arrow" onClick={() => window.__calder?.openModal()}>
                  <span className="pill__inner">
                    Let&apos;s Talk
                    <span className="pill__badge">
                      <svg className="arrow-right" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </span>
                </button>
                <button className="pill pill--outline pill--arrow" onClick={() => window.__calder?.scrollToSection("works")}>
                  <span className="pill__inner">
                    View Work
                    <span className="pill__badge">
                      <svg className="arrow-right" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </span>
                </button>
              </div>
            </div>
            <div className="hero__right">
              <div className="hero-card" id="heroCard">
                <div className="hero-card__body" id="heroCardBody">
                  <div className="hero-card__tile">
                    <svg width="1.875rem" height="1.875rem" viewBox="0 0 48 48" fill="#cf8047" aria-hidden="true">
                      <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
                    </svg>
                  </div>
                  <div className="hero-card__panel">
                    <div className="hero-card__slot" id="heroCardSlot" />
                    <div className="hero-card__footer">
                      <div className="hero-card__dots" id="heroCardDots" />
                      <div className="hero-card__btns">
                        <button className="hero-card__btn hero-card__btn--prev" id="heroCardPrev" aria-label="Previous">
                          <svg width=".75rem" height=".75rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </button>
                        <button className="hero-card__btn" id="heroCardNext" aria-label="Next">
                          <svg width=".75rem" height=".75rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hero__partners" id="heroPartners">
                <div className="hero__partners-label">Trusted by</div>
                <div className="hero__partners-grid" id="partnersGrid" />
              </div>
            </div>
          </div>
          <div className="shell hero__status" id="heroStatus">
            <span>Working since 2014</span>
            <span className="hero__status-center">Remote-first, worldwide</span>
            <span className="hero__status-right">
              Scroll to explore <span>&darr;</span>
            </span>
          </div>
        </section>

        <section id="about" className="about">
          <div className="shell about__inner">
            <div className="about__globe-block">
              <div className="about__globe-icon" aria-hidden="true">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="12" cy="12" r="9.25" />
                  <path d="M12 2.75c2.6 2.3 4 5.8 4 9.25s-1.4 6.95-4 9.25c-2.6-2.3-4-5.8-4-9.25s1.4-6.95 4-9.25zM2.75 12h18.5" />
                </svg>
              </div>
              <div className="eyebrow eyebrow--dark about__eyebrow" data-reveal>
                <span className="dot" />
                The Studio
              </div>
              <div className="about__distributed" data-reveal style={{ position: "absolute", bottom: 0, left: 0 }}>
                <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.4" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="9.25" />
                  <path d="M12 2.75c2.6 2.3 4 5.8 4 9.25s-1.4 6.95-4 9.25c-2.6-2.3-4-5.8-4-9.25s1.4-6.95 4-9.25zM2.75 12h18.5" />
                </svg>
                <span>A distributed team building across every time zone.</span>
              </div>
            </div>
            <div className="about__right">
              <h2 className="about__h2" id="aboutH2" />
              <div className="about__footer" data-reveal data-delay="200">
                <div>
                  <div className="about__social-label">Find us online</div>
                  <div className="about__social-row">
                    <a href="#" className="about__social-chip about__social-chip--accent" aria-label="X / Twitter">
                      <svg width=".875rem" height=".875rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4l16 16M20 4 4 20" />
                      </svg>
                    </a>
                    <a href="#" className="about__social-chip about__social-chip--muted" aria-label="Behance">
                      <svg width=".875rem" height=".875rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                      </svg>
                    </a>
                    <a href="#" className="about__social-chip about__social-chip--muted" aria-label="Dribbble">
                      <svg width=".875rem" height=".875rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                      </svg>
                    </a>
                  </div>
                </div>
                <a href="#about" className="pill pill--outline pill--arrow">
                  <span className="pill__inner">
                    About Us
                    <span className="pill__badge">
                      <svg className="arrow-right" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="create-band">
          <ul className="shell create-band__list" id="createBand">
            <li className="create-band__item">
              <div className="create-band__tile create-band__tile--light">We</div>
            </li>
            <li className="create-band__item">
              <div className="create-band__tile create-band__tile--accent">Build</div>
            </li>
            <li className="create-band__item">
              <div className="create-band__tile create-band__tile--dark">
                <span className="create-band__arrow">
                  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </li>
            <li className="create-band__item">
              <div className="create-band__tile create-band__tile--ghost">Better</div>
            </li>
          </ul>
        </section>

        <section id="works" className="portfolio">
          <div className="shell portfolio__inner">
            <div className="portfolio__header">
              <div className="eyebrow eyebrow--dark eyebrow--bordered" data-reveal>
                <span className="dot" />
                Portfolio
              </div>
              <h2 className="portfolio__h2">
                <span className="line-wrap">
                  <span className="line-inner" data-reveal-line="true">
                    Selected Work
                  </span>
                </span>
              </h2>
            </div>
            <ul className="portfolio__grid" id="portfolioGrid" />
          </div>
        </section>

        <section id="services" className="services">
          <div className="shell services__inner">
            <div className="eyebrow eyebrow--dark" data-reveal>
              <span className="dot" />
              Services
            </div>
            <h2 className="services__h2">
              <span className="line-wrap">
                <span className="line-inner" data-reveal-line="true">
                  What we do best
                </span>
              </span>
            </h2>
            <ul id="servicesList" />
          </div>
        </section>

        <section className="stats-section">
          <div className="shell stats-section__inner">
            <div className="stats-panel" data-reveal>
              <div className="eyebrow eyebrow--light" data-reveal>
                <span className="dot" />
                By the numbers
              </div>
              <h2 className="stats__h2">
                <span className="line-wrap">
                  <span className="line-inner" data-reveal-line="true">
                    Proof in the work, not the words.
                  </span>
                </span>
              </h2>
              <ul className="stats__grid" id="statsGrid" />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell footer__inner">
          <div className="footer__cta">
            <h2 className="footer__cta-h2" id="footerH2">
              <span className="line-wrap">
                <span className="line-inner" data-reveal-line="true">
                  Have a project in mind?
                </span>
              </span>
              <span className="line-wrap">
                <span className="line-inner" data-reveal-line="true">
                  Let&apos;s get to work.
                </span>
              </span>
            </h2>
            <button className="pill pill--light pill--arrow" onClick={() => window.__calder?.openModal()}>
              <span className="pill__inner">
                Start a project
                <span className="pill__badge">
                  <svg className="arrow-up-right" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </span>
              </span>
            </button>
          </div>
          <div className="footer__cols">
            <div>
              <div className="footer__brand">
                <svg width="1.25rem" height="1.25rem" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
                  <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
                </svg>
                Calder
              </div>
              <p className="footer__tagline">An independent studio crafting brands, products, and the systems that connect them.</p>
            </div>
            <div>
              <div className="footer__col-title">Company</div>
              <a href="#about" className="footer__link">
                <span>About</span>
              </a>
              <a href="#careers" className="footer__link">
                <span>Careers</span>
              </a>
              <a href="#partners" className="footer__link">
                <span>Partners</span>
              </a>
              <a
                href="#contact"
                className="footer__link"
                onClick={(e) => {
                  e.preventDefault();
                  window.__calder?.openModal();
                }}
              >
                <span>Contact</span>
              </a>
            </div>
            <div>
              <div className="footer__col-title">Services</div>
              <a href="#development" className="footer__link">
                <span>Development</span>
              </a>
              <a href="#design" className="footer__link">
                <span>Design</span>
              </a>
              <a href="#qa" className="footer__link">
                <span>Quality Assurance</span>
              </a>
              <a href="#consulting" className="footer__link">
                <span>Consulting</span>
              </a>
            </div>
            <div>
              <div className="footer__col-title">Social</div>
              <a href="#" className="footer__link">
                <span>X / Twitter</span>
              </a>
              <a href="#" className="footer__link">
                <span>Behance</span>
              </a>
              <a href="#" className="footer__link">
                <span>Dribbble</span>
              </a>
              <a href="#" className="footer__link">
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
          <div className="footer__legal">
            <span>&copy; 2025 Calder Studio. All rights reserved.</span>
            <div className="footer__legal-links">
              <a href="#privacy" className="footer__legal-link">
                <span>Privacy</span>
              </a>
              <a href="#terms" className="footer__legal-link">
                <span>Terms</span>
              </a>
            </div>
          </div>
        </div>
        <div className="footer__watermark" aria-hidden="true">
          CALDER
        </div>
      </footer>

      <div className="nav-menu" id="navMenu" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div className="shell nav-menu__top">
          <div className="nav-menu__brand">
            <svg width="1.25rem" height="1.25rem" viewBox="0 0 48 48" fill="#cf8047" aria-hidden="true">
              <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
            </svg>
            Calder
          </div>
          <button className="nav-menu__close" onClick={() => window.__calder?.closeNav()} aria-label="Close navigation menu">
            <svg width=".875rem" height=".875rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4l16 16M20 4 4 20" />
            </svg>
            Close
          </button>
        </div>
        <nav className="nav-menu__nav" aria-label="Main navigation">
          <ul className="nav-menu__list" id="navMenuList" />
        </nav>
        <div className="nav-menu__bottom">
          <span>
            Local time — <span id="navMenuTime">9:41am</span>
          </span>
          <button
            className="nav-menu__project-btn"
            onClick={() => {
              window.__calder?.closeNav();
              setTimeout(() => window.__calder?.openModal(), 300);
            }}
          >
            Start a project &rarr;
          </button>
        </div>
      </div>

      <div className="modal-backdrop" id="requestModal" role="dialog" aria-modal="true" aria-label="Start a project">
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <button className="modal__close" onClick={() => window.__calder?.closeModal()} aria-label="Close modal">
            <svg width=".875rem" height=".875rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4l16 16M20 4 4 20" />
            </svg>
          </button>
          <div id="modalFormState">
            <div className="modal__header">
              <div className="modal__eyebrow">
                <span className="dot" /> Start a project
              </div>
              <h2 className="modal__title">Tell us what you&apos;re building.</h2>
            </div>
            <form className="modal__form" id="requestForm" onSubmit={(e) => window.__calder?.handleSubmit(e)}>
              <label className="modal__label">
                Name
                <input className="modal__input" type="text" required placeholder="Your name" />
              </label>
              <label className="modal__label">
                Email
                <input className="modal__input" type="email" required placeholder="you@company.com" />
              </label>
              <label className="modal__label">
                Project
                <textarea className="modal__textarea" rows={4} required placeholder="A few words about your project, timeline, and budget." />
              </label>
              <div className="modal__footer">
                <span className="modal__note">We reply within one business day.</span>
                <button className="pill pill--dark pill--arrow" type="submit" id="submitBtn">
                  <span className="pill__inner">
                    <span id="submitLabel">Send request</span>
                    <span className="pill__badge">
                      <svg className="arrow-up-right" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7M8 7h9v9" />
                      </svg>
                    </span>
                  </span>
                </button>
              </div>
            </form>
          </div>
          <div id="modalSuccessState" style={{ display: "none" }}>
            <div className="modal__success">
              <div className="modal__success-badge">
                <svg width="1.5rem" height="1.5rem" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
                </svg>
              </div>
              <h2>Request received</h2>
              <p>Thanks for reaching out — we&apos;ll get back to you within one business day.</p>
              <button className="pill pill--dark pill--no-arrow" onClick={() => window.__calder?.closeModal()}>
                <span className="pill__inner">Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
