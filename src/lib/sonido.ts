let audio: AudioContext | null = null;

function nota(
  freq: number,
  t: number,
  dur: number,
  { tipo = "triangle" as OscillatorType, vol = 0.12 } = {}
) {
  if (!audio) return;
  const a = audio;
  const t0 = a.currentTime + t;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function golpe(desde: number, hasta: number, dur: number, vol: number) {
  if (!audio) return;
  const a = audio;
  const t0 = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(desde, t0);
  o.frequency.exponentialRampToValueAtTime(hasta, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.02);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sonido = {
  // El navegador solo deja activar el audio durante un toque: llamar en el handler de un click/submit.
  preparar() {
    try {
      audio ??= new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch {
      audio = null;
    }
  },
  pegar() {
    golpe(520, 110, 0.18, 0.35);
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => nota(f, 0.1 + i * 0.065, 0.28, { vol: 0.08 }));
  },
  subir(p: number) {
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
  },
};
