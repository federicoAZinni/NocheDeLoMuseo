import { $, COLORES } from "./utils.js";

const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function vibrar(patron) {
  try { navigator.vibrate?.(patron); } catch { /* sin vibración */ }
}

// ---------- Sonido (sintetizado, sin archivos) ----------
let audio = null;

function nota(freq, t, dur, { tipo = "triangle", vol = 0.12 } = {}) {
  if (!audio) return;
  const a = audio, t0 = a.currentTime + t;
  const o = a.createOscillator(), g = a.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function golpe(desde, hasta, dur, vol) {
  if (!audio) return;
  const a = audio, t0 = a.currentTime;
  const o = a.createOscillator(), g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(desde, t0);
  o.frequency.exponentialRampToValueAtTime(hasta, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.02);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

export const sonido = {
  preparar() {
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch { audio = null; }
  },
  // "Plop" de la figurita + destello
  pegar() {
    golpe(520, 110, 0.18, 0.35);
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => nota(f, 0.1 + i * 0.065, 0.28, { vol: 0.08 }));
  },
  // Tono que sube según el progreso del álbum
  subir(p) {
    const base = 440 * Math.pow(2, p);
    nota(base, 0, 0.18, { tipo: "square", vol: 0.05 });
    nota(base * 1.5, 0.09, 0.3, { tipo: "square", vol: 0.05 });
  },
  fanfarria() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(f, i * 0.12, 0.2, { tipo: "square", vol: 0.06 }));
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f) => nota(f, 0.55, 1.6, { vol: 0.07 }));
    [1568, 2093, 2637].forEach((f, i) => nota(f, 0.6 + i * 0.08, 0.5, { vol: 0.04 }));
  },
  sello() {
    golpe(180, 55, 0.25, 0.45);
    nota(1568, 0.05, 0.35, { vol: 0.06 });
  }
};

// ---------- Confeti ----------
export const confeti = (() => {
  const cv = $("#confeti");
  const ctx = cv.getContext("2d");
  const paleta = [...COLORES, "#FFFFFF"];
  let ps = [], emisores = [], corriendo = false;

  function ajustar() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function particula(x, y, vx, vy) {
    return {
      x, y, vx, vy,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.35,
      w: 6 + Math.random() * 7, h: 9 + Math.random() * 8,
      c: paleta[Math.floor(Math.random() * paleta.length)],
      fase: Math.random() * 6.28, vida: 0,
      circulo: Math.random() < 0.2
    };
  }

  function cuadro() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const t = performance.now();
    emisores.forEach((e) => e(t));
    emisores = emisores.filter((e) => !e.fin);
    ps = ps.filter((p) => p.y < innerHeight + 40 && p.vida < 600);
    for (const p of ps) {
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
        ctx.beginPath(); ctx.arc(0, 0, p.w / 2.4, 0, 6.28); ctx.fill();
      } else {
        ctx.scale(1, Math.cos(p.fase + p.vida * 0.15)); // efecto de papel que gira
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (ps.length || emisores.length) requestAnimationFrame(cuadro);
    else { corriendo = false; cv.hidden = true; }
  }

  function arrancar() {
    if (corriendo) return;
    corriendo = true;
    cv.hidden = false;
    ajustar();
    requestAnimationFrame(cuadro);
  }

  return {
    explosion(x, y, n = 80) {
      if (reducido()) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28, v = 4 + Math.random() * 10;
        ps.push(particula(x, y, Math.cos(a) * v, Math.sin(a) * v - 3));
      }
      arrancar();
    },
    canones() {
      if (reducido()) return;
      for (let i = 0; i < 130; i++) {
        const ang = (-58 - Math.random() * 26) * Math.PI / 180;
        const v = 13 + Math.random() * 12;
        ps.push(particula(-10, innerHeight + 10, Math.cos(ang) * v, Math.sin(ang) * v));
        ps.push(particula(innerWidth + 10, innerHeight + 10, -Math.cos(ang) * v, Math.sin(ang) * v));
      }
      arrancar();
    },
    lluvia(ms = 3000) {
      if (reducido()) return;
      const fin = performance.now() + ms;
      const e = (t) => {
        if (t > fin) { e.fin = true; return; }
        for (let k = 0; k < 3; k++) {
          ps.push(particula(Math.random() * innerWidth, -20, (Math.random() - 0.5) * 2, 1 + Math.random() * 3));
        }
      };
      emisores.push(e);
      arrancar();
    }
  };
})();
