interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
}

export class AmbientParticles {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dots: Dot[] = [];
  private animationId: number | null = null;
  private width = 0;
  private height = 0;
  private pointer = { x: -9999, y: -9999 };
  private reduced = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    this.seed();
  }

  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.seed();
  }

  setPointer(x: number, y: number) {
    this.pointer = { x, y };
  }

  private seed() {
    const count = Math.min(90, Math.floor((this.width * this.height) / 13000));
    this.dots = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 2,
      hue: Math.random() < 0.55 ? 214 : 268,
    }));
  }

  private animate = () => {
    const { ctx, width, height, dots, pointer } = this;
    ctx.clearRect(0, 0, width, height);

    for (const d of dots) {
      const dx = pointer.x - d.x;
      const dy = pointer.y - d.y;
      const dist = Math.hypot(dx, dy);
      if (!this.reduced && dist < 150) {
        d.x -= dx * 0.0012;
        d.y -= dy * 0.0012;
      }

      if (!this.reduced) {
        d.x += d.vx;
        d.y += d.vy;
      }

      if (d.x < -10) d.x = width + 10;
      if (d.x > width + 10) d.x = -10;
      if (d.y < -10) d.y = height + 10;
      if (d.y > height + 10) d.y = -10;

      ctx.beginPath();
      ctx.fillStyle = `hsla(${d.hue}, 85%, 55%, 0.55)`;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i];
        const b = dots[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 120) {
          ctx.strokeStyle = `rgba(90,110,255,${0.16 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (!this.reduced) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  };

  start(reduced = false) {
    this.reduced = reduced;
    this.animationId = requestAnimationFrame(this.animate);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
