import { COLORES, reducido } from "./utils";

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  w: number;
  h: number;
  c: string;
  fase: number;
  vida: number;
  circulo: boolean;
}

interface Emisor {
  (t: number): void;
  fin?: boolean;
}

export class Confeti {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private paleta = [...COLORES, "#FFFFFF"];
  private ps: Particula[] = [];
  private emisores: Emisor[] = [];
  private corriendo = false;

  constructor(canvas: HTMLCanvasElement) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  private ajustar() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = innerWidth * dpr;
    this.cv.height = innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private particula(x: number, y: number, vx: number, vy: number): Particula {
    return {
      x,
      y,
      vx,
      vy,
      r: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.35,
      w: 6 + Math.random() * 7,
      h: 9 + Math.random() * 8,
      c: this.paleta[Math.floor(Math.random() * this.paleta.length)],
      fase: Math.random() * 6.28,
      vida: 0,
      circulo: Math.random() < 0.2,
    };
  }

  private cuadro = () => {
    const { ctx } = this;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const t = performance.now();
    this.emisores.forEach((e) => e(t));
    this.emisores = this.emisores.filter((e) => !e.fin);
    this.ps = this.ps.filter((p) => p.y < innerHeight + 40 && p.vida < 600);
    for (const p of this.ps) {
      p.vx *= 0.975;
      p.vy = p.vy * 0.975 + 0.14;
      p.x += p.vx + Math.sin(p.fase + p.vida * 0.08) * 0.7;
      p.y += p.vy;
      p.r += p.vr;
      p.vida++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      if (p.circulo) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2.4, 0, 6.28);
        ctx.fill();
      } else {
        ctx.scale(1, Math.cos(p.fase + p.vida * 0.15));
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (this.ps.length || this.emisores.length) requestAnimationFrame(this.cuadro);
    else {
      this.corriendo = false;
      this.cv.hidden = true;
    }
  };

  private arrancar() {
    if (this.corriendo) return;
    this.corriendo = true;
    this.cv.hidden = false;
    this.ajustar();
    requestAnimationFrame(this.cuadro);
  }

  explosion(x: number, y: number, n = 80) {
    if (reducido()) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28;
      const v = 4 + Math.random() * 10;
      this.ps.push(this.particula(x, y, Math.cos(a) * v, Math.sin(a) * v - 3));
    }
    this.arrancar();
  }

  canones() {
    if (reducido()) return;
    for (let i = 0; i < 130; i++) {
      const ang = ((-58 - Math.random() * 26) * Math.PI) / 180;
      const v = 13 + Math.random() * 12;
      this.ps.push(this.particula(-10, innerHeight + 10, Math.cos(ang) * v, Math.sin(ang) * v));
      this.ps.push(this.particula(innerWidth + 10, innerHeight + 10, -Math.cos(ang) * v, Math.sin(ang) * v));
    }
    this.arrancar();
  }

  lluvia(ms = 3000) {
    if (reducido()) return;
    const fin = performance.now() + ms;
    const e: Emisor = (t) => {
      if (t > fin) {
        e.fin = true;
        return;
      }
      for (let k = 0; k < 3; k++) {
        this.ps.push(this.particula(Math.random() * innerWidth, -20, (Math.random() - 0.5) * 2, 1 + Math.random() * 3));
      }
    };
    this.emisores.push(e);
    this.arrancar();
  }
}

export function centroDe(elemento: Element): [number, number] {
  const r = elemento.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}
