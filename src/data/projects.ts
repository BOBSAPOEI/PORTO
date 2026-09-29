import type { Project } from "@/types";

// Tambahkan liveUrl / repoUrl begitu tersedia (App Store, TestFlight, atau GitHub).
export const projects: Project[] = [
  {
    slug: "skkm-app",
    title: "SKKM App",
    description:
      "Aplikasi iOS untuk mengelola Satuan Kredit Kegiatan Mahasiswa. Ada fitur scan sertifikat pakai OCR, verifikasi dosen & blockchain, dashboard progres bergaya activity ring, sistem gamifikasi (medali, leaderboard, challenge), prediksi kelulusan, sampai Widget dan Live Activity di lock screen.",
    tech: ["Swift", "SwiftUI", "Core Data", "Supabase", "WidgetKit", "ActivityKit"],
    category: "iOS App",
    screenshot: "/images/projects/skkm-dashboard.png",
    video: "/videos/skkm-demo.mp4",
  },
  {
    slug: "calder",
    title: "Calder",
    description:
      "Landing page untuk studio desain & engineering fiktif, lengkap dengan hero efek liquid reveal, marquee klien, studi kasus, dan daftar layanan. Dibangun pakai HTML, CSS, JavaScript murni tanpa framework — fokusnya di animasi scroll yang halus.",
    tech: ["HTML", "CSS", "JavaScript"],
    kind: "web",
    category: "Web — Landing Page",
    screenshot: "/images/projects/calder-cover.jpg",
    liveUrl: "/showcase/calder",
  },
  {
    slug: "calders",
    title: "Calders",
    description:
      "Landing page lain untuk studio desain fiktif, kali ini dibangun ulang pakai Next.js — hero dengan hanging-mobile SVG yang goyang, marquee dua arah, filter studi kasus, accordion FAQ, dan form kontak dengan chip layanan & budget, semuanya jadi komponen React dengan scroll-reveal via IntersectionObserver.",
    tech: ["Next.js", "React", "TypeScript", "CSS"],
    kind: "web",
    category: "Web — Landing Page",
    liveUrl: "https://calders.vercel.app/",
  },
  {
    slug: "calder-jewels",
    title: "Calder Jewels",
    description:
      "Toko online untuk bengkel perhiasan handmade di Surabaya, lengkap dengan hero 3D cincin yang bisa diputar manual pakai kursor, penjelajahan produk per kategori (cincin, kalung, gelang, anting), kartu produk dengan harga & status stok, sampai testimonial asli dari chat WhatsApp pelanggan. Dibangun pakai Next.js dan Three.js untuk render 3D-nya, dengan desain yang tenang dan personal — sesuai brand bengkel kecil yang masih dikerjakan dua pengrajin tetap.",
    tech: ["Next.js", "Three.js", "React Three Fiber", "Tailwind CSS"],
    kind: "web",
    category: "Web — E-commerce 3D",
    liveUrl: "https://calder-jewels.vercel.app/",
  },
  {
    slug: "dukun",
    title: "Dukun",
    description:
      "Proyek kolaborasi bareng teman: konsep studio ritual online bergaya Gen Z, lengkap dengan karakter 3D yang dirender pakai shader depth-map custom supaya kepalanya terasa punya kedalaman waktu digeser. Kamera dolly-zoom mengikuti scroll sampai masuk ke telapak tangan karakter, tempat properti mistis (keris, jenglot, tarot, boneka santet) melayang berputar pelan — dan sekarang bisa ditarik langsung pakai kursor untuk diputar manual. Model GLTF-nya dikompresi Draco + KTX2 biar tetap ringan meski detail, semua diorkestrasi lewat GSAP ScrollTrigger dan Lenis untuk smooth-scroll.",
    tech: ["React", "Three.js", "React Three Fiber", "GSAP", "Draco", "KTX2", "Vite"],
    kind: "web",
    category: "Web — 3D Interaktif",
    screenshot: "/images/projects/dukun-cover.jpg",
    liveUrl: "/showcase/dukun/index.html",
  },
];
