import { COLORES } from "./utils.js";

const TAU = Math.PI * 2;
const TINTA = "#1E1846";

// Número al azar criptográficamente seguro entre 0 y n-1
export function azar(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return Math.floor((a[0] / 4294967296) * n);
}

export class Ruleta {
  constructor(canvas, { onTick = () => {}, onFin = () => {} } = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d");
    this.items = [];
    this.rot = 0;
    this.girando = false;
    this.bloqueada = false;   // queda bloqueada desde que gira hasta que se cierra el cartel del ganador
    this.pendientes = null;
    this.onTick = onTick;
    this.onFin = onFin;
    this.audio = null;
    new ResizeObserver(() => this.ajustar()).observe(canvas.parentElement);
    document.fonts?.ready.then(() => this.dibujar());
    this.ajustar();
  }

  ajustar() {
    const r = this.c.parentElement.getBoundingClientRect();
    const lado = Math.max(220, Math.floor(Math.min(r.width, r.height || r.width)));
    const dpr = window.devicePixelRatio || 1;
    this.lado = lado;
    this.c.width = lado * dpr;
    this.c.height = lado * dpr;
    this.c.style.width = this.c.style.height = `${lado}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dibujar();
  }

  setItems(items) {
    if (this.girando || this.bloqueada) { this.pendientes = items; return; }
    this.items = items;
    this.dibujar();
  }

  desbloquear() {
    this.bloqueada = false;
    if (this.pendientes) {
      const p = this.pendientes;
      this.pendientes = null;
      this.setItems(p);
    }
  }

  color(i) {
    const n = this.items.length;
    if (n > 1 && i === n - 1 && i % COLORES.length === 0) return COLORES[2];
    return COLORES[i % COLORES.length];
  }

  indiceEnPuntero() {
    const n = this.items.length;
    if (!n) return -1;
    const a = (((-Math.PI / 2 - this.rot) % TAU) + TAU) % TAU;
    return Math.min(n - 1, Math.floor(a / (TAU / n)));
  }

  recortar(txt, max) {
    const ctx = this.ctx;
    if (ctx.measureText(txt).width <= max) return txt;
    let t = txt;
    while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
    return t + "…";
  }

  dibujar() {
    const ctx = this.ctx, L = this.lado;
    if (!L) return;
    const cx = L / 2, cy = L / 2, R = L / 2 - 16;
    const n = this.items.length;
    ctx.clearRect(0, 0, L, L);

    // aro dorado
    ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, TAU);
    ctx.fillStyle = "#F2B33D"; ctx.fill();

    if (!n) {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU);
      ctx.fillStyle = "#2A2260"; ctx.fill();
      ctx.fillStyle = "#C9C3F5";
      ctx.font = `600 ${Math.round(L / 24)}px "Bricolage Grotesque", sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Todavía no hay álbumes completos", cx, cy);
      this.puntero();
      return;
    }

    const seg = TAU / n;
    for (let i = 0; i < n; i++) {
      const a0 = this.rot + i * seg;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a0 + seg); ctx.closePath();
      ctx.fillStyle = this.color(i); ctx.fill();
      if (n > 1) { ctx.strokeStyle = "rgba(30,24,70,.35)"; ctx.lineWidth = 1; ctx.stroke(); }
    }

    // Con muchos participantes los nombres no entran: se ven abajo, en el ticker
    if (n <= 80) {
      const fs = Math.max(9, Math.min(28, seg * R * 0.42));
      ctx.font = `800 ${fs}px "Bricolage Grotesque", sans-serif`;
      ctx.fillStyle = TINTA; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      const maxW = R * 0.66;
      for (let i = 0; i < n; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rot + (i + 0.5) * seg);
        ctx.fillText(this.recortar(this.items[i].nombre, maxW), R - 18, 0);
        ctx.restore();
      }
    }

    // centro
    const h = R * 0.17;
    ctx.beginPath(); ctx.arc(cx, cy, h, 0, TAU);
    ctx.fillStyle = TINTA; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = "#F2B33D"; ctx.stroke();
    ctx.fillStyle = "#F2B33D";
    ctx.font = `${Math.round(h * 0.55)}px Bungee, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("UTN", cx, cy + 2);

    this.puntero();
  }

  puntero() {
    const ctx = this.ctx, cx = this.lado / 2, s = Math.max(16, this.lado / 28);
    ctx.beginPath();
    ctx.moveTo(cx - s, 2); ctx.lineTo(cx + s, 2); ctx.lineTo(cx, 2 + s * 2.3);
    ctx.closePath();
    ctx.fillStyle = "#FF5E7E"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
  }

  iniciarSonido() {
    try {
      this.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      this.audio.resume();
    } catch { this.audio = null; }
  }

  tick() {
    const a = this.audio;
    if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = "square"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.06, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.04);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + 0.05);
  }

  girar() {
    const n = this.items.length;
    if (this.girando || this.bloqueada || !n) return false;
    this.girando = true;
    this.bloqueada = true;
    this.iniciarSonido();

    const ganador = azar(n);
    const seg = TAU / n;
    const desvio = (azar(1000) / 1000 - 0.5) * 0.7; // para que no frene siempre en el centro del gajo
    const objetivo = -Math.PI / 2 - (ganador + 0.5 + desvio) * seg;
    let delta = (((objetivo - this.rot) % TAU) + TAU) % TAU;
    delta += TAU * (7 + azar(3));

    const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reducido ? 2500 : 9000 + azar(2000);
    const ini = this.rot, t0 = performance.now();
    let ultimo = this.indiceEnPuntero();

    const paso = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      this.rot = ini + delta * e;
      this.dibujar();
      const k = this.indiceEnPuntero();
      if (k !== ultimo) { ultimo = k; this.tick(); this.onTick(this.items[k]); }
      if (p < 1) requestAnimationFrame(paso);
      else {
        this.rot %= TAU;
        this.girando = false;
        this.onFin(this.items[ganador]);
      }
    };
    requestAnimationFrame(paso);
    return true;
  }
}
