export const $ = (s, r = document) => r.querySelector(s);

// Crea elementos sin usar innerHTML (los nombres los escribe la gente)
export function el(tag, props = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "style") n.style.cssText = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const h of hijos.flat()) {
    if (h === null || h === undefined || h === false) continue;
    n.append(h instanceof Node ? h : document.createTextNode(String(h)));
  }
  return n;
}

// "Clave Súper 1" -> "clavesuper1". Las claves no distinguen mayúsculas, espacios ni acentos.
export function normalizarClave(s) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const COLORES = ["#F2B33D", "#FF5E7E", "#5BC0EB", "#9B7BFF", "#3DD6A3", "#FF8A3D"];
