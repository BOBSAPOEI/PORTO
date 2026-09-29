interface FlowParticle {
  angle: number;
  speed: number;
  dist: number;
  maxDist: number;
  size: number;
  group: "ray" | "wave";
  wobble: number;
}

const RAY_COUNT = 70;
const WAVE_COUNT = 460;

export class WaveField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: FlowParticle[] = [];
  private animationId: number | null = null;
  private width = 0;
  private height = 0;
  private focal = { x: 0, y: 0 };
  private pointer = { x: 0, y: 0 };
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    this.seed();
    this.pointer = { ...this.focal };
  }

  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.focal = { x: this.width / 2, y: this.height * 0.4 };
  }

  setPointer(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  private seed() {
    this.particles = [];

    for (let i = 0; i < RAY_COUNT; i++) {
      this.particles.push({
        angle: (Math.random() - 0.5) * 0.9,
        speed: 30 + Math.random() * 40,
        dist: Math.random() * 240,
        maxDist: 220 + Math.random() * 160,
        size: 0.6 + Math.random() * 0.9,
        group: "ray",
        wobble: Math.random() * Math.PI * 2,
      });
    }

    for (let i = 0; i < WAVE_COUNT; i++) {
      this.particles.push({
        angle: (Math.random() - 0.5) * 2.6,
        speed: 40 + Math.random() * 60,
        dist: Math.random() * 520,
        maxDist: 380 + Math.random() * 460,
        size: 0.8 + Math.random() * 2,
        group: "wave",
        wobble: Math.random() * Math.PI * 2,
      });
    }
  }

  private drawRings(fx: number, fy: number) {
    const { ctx } = this;
    const radii = [90, 160, 240, 330, 430, 540];
    ctx.save();
    ctx.translate(fx, fy);
    radii.forEach((r, i) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.36, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(230,205,170,${0.09 - i * 0.012})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
  }

  private animate = (time: number) => {
    const { ctx, width, height, focal, pointer } = this;
    const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.05);
    this.lastTime = time;

    ctx.fillStyle = "rgba(3,3,5,0.16)";
    ctx.fillRect(0, 0, width, height);

    const fx = focal.x + (pointer.x - focal.x) * 0.06;
    const fy = focal.y + (pointer.y - focal.y) * 0.05;

    this.drawRings(fx, fy);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const p of this.particles) {
      p.dist += p.speed * dt;

      let x: number;
      let y: number;

      if (p.group === "ray") {
        x = fx + Math.sin(p.angle) * p.dist;
        y = fy - Math.cos(p.angle) * p.dist * 0.9;
      } else {
        const spread = Math.sin(p.angle) * p.dist;
        const ripple =
          Math.sin(p.dist * 0.02 + p.wobble + time * 0.0012) * 10 +
          Math.sin(p.dist * 0.008 - time * 0.0008) * 18;
        x = fx + spread;
        y = fy + p.dist * 0.42 + ripple;
      }

      const offscreen =
        y > height + 20 || y < -40 || x < -40 || x > width + 40;

      if (p.dist > p.maxDist || offscreen) {
        p.dist = 0;
        continue;
      }

      const lifeT = p.dist / p.maxDist;
      const alpha = Math.max(0, 1 - lifeT) * (p.group === "ray" ? 0.5 : 0.85);
      const warm = Math.max(0, 1 - lifeT * 1.3);

      const g = Math.floor(120 + warm * 100);
      const b = Math.floor(40 + warm * 40);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,${g},${b},${alpha})`;
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    this.animationId = requestAnimationFrame(this.animate);
  };

  start() {
    this.lastTime = 0;
    this.animationId = requestAnimationFrame(this.animate);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
