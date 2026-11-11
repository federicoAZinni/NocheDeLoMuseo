export function normalizarClave(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const COLORES = ["#F2B33D", "#FF5E7E", "#5BC0EB", "#9B7BFF", "#3DD6A3", "#FF8A3D"];

export function azar(n: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return Math.floor((a[0] / 4294967296) * n);
}

export function vibrar(patron: number | number[]): void {
  try {
    navigator.vibrate?.(patron);
  } catch {
    /* sin vibración */
  }
}

export function reducido(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function resolverImagen(ruta: string): string {
  if (/^(https?:)?\/\//.test(ruta) || ruta.startsWith("/")) return ruta;
  return `/${ruta}`;
}
