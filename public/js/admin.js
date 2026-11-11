import { auth, db, ADMIN_EMAIL } from "./firebase-init.js";
import { $, el, normalizarClave, hash, COLORES } from "./utils.js";
import { Ruleta } from "./ruleta.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, collectionGroup, query, orderBy, where, onSnapshot,
  doc, addDoc, deleteDoc, getDocs, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------- Estado ----------
let stands = [];
let usuarios = new Map();     // uid -> {uid, nombre, dni}
let progreso = new Map();     // uid -> Set(standId)
let ganadores = [];
let claves = new Map();       // standId -> clave
let subs = [];

// ---------- Sesión ----------
onAuthStateChanged(auth, (user) => {
  subs.forEach((u) => u()); subs = [];
  const esAdmin = !!user && user.email === ADMIN_EMAIL;
  $("#vista-login").hidden = esAdmin;
  $("#panel").hidden = !esAdmin;
  if (esAdmin) iniciar();
});

$("#form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = $("#error-login");
  const btn = $("#btn-login");
  error.textContent = "";
  btn.disabled = true;
  try {
    const cred = await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value);
    if (cred.user.email !== ADMIN_EMAIL) {
      await signOut(auth);
      error.textContent = "Esta cuenta no tiene permisos de administración.";
    }
  } catch (err) {
    console.error(err);
    error.textContent = "Email o contraseña incorrectos.";
  } finally {
    btn.disabled = false;
  }
});

$("#btn-salir").addEventListener("click", () => signOut(auth));

// ---------- Pestañas ----------
function abrirTab(nombre) {
  document.querySelectorAll(".tab").forEach((t) => (t.hidden = t.id !== `tab-${nombre}`));
  document.querySelectorAll("[data-tab]").forEach((b) =>
    b.dataset.tab === nombre ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
}
document.querySelectorAll("[data-tab]").forEach((b) =>
  b.addEventListener("click", () => abrirTab(b.dataset.tab)));

// ---------- Datos en vivo ----------
function errorDatos(e) {
  console.error(e);
  alert("No se pudieron leer los datos. Revisá que las reglas de Firestore estén publicadas y que el email del admin coincida.");
}

function iniciar() {
  subs.push(onSnapshot(query(collection(db, "stands"), orderBy("orden")), (s) => {
    stands = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    programar();
  }, errorDatos));

  subs.push(onSnapshot(collection(db, "usuarios"), (s) => {
    usuarios = new Map(s.docs.map((d) => [d.id, { uid: d.id, ...d.data() }]));
    programar();
  }, errorDatos));

  subs.push(onSnapshot(collectionGroup(db, "figuritas"), (s) => {
    progreso = new Map();
    s.docs.forEach((d) => {
      const uid = d.ref.parent.parent.id;
      if (!progreso.has(uid)) progreso.set(uid, new Set());
      progreso.get(uid).add(d.id);
    });
    programar();
  }, errorDatos));

  subs.push(onSnapshot(query(collection(db, "ganadores"), orderBy("fecha")), (s) => {
    ganadores = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    programar();
  }, errorDatos));

  subs.push(onSnapshot(collection(db, "claves"), (s) => {
    claves = new Map();
    s.docs.forEach((d) => claves.set(d.data().standId, d.data().clave));
    programar();
  }, errorDatos));
}

let pendiente = false;
function programar() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => { pendiente = false; renderTodo(); });
}

function calcular() {
  const ids = new Set(stands.map((s) => s.id));
  const total = ids.size;
  const lista = [...usuarios.values()].map((u) => {
    const hechas = [...(progreso.get(u.uid) || [])].filter((x) => ids.has(x)).length;
    return { ...u, hechas, completo: total > 0 && hechas === total };
  });
  const yaGanaron = new Set(ganadores.map((g) => g.uid));
  const enRuleta = lista
    .filter((u) => u.completo && !yaGanaron.has(u.uid))
    .sort((a, b) => hash(a.uid) - hash(b.uid)); // orden estable y mezclado
  return { total, lista, enRuleta };
}

function renderTodo() {
  const datos = calcular();
  renderSorteo(datos);
  renderParticipantes(datos);
  renderStands();
}

// ---------- Sorteo ----------
const ruleta = new Ruleta($("#ruleta"), {
  onTick: (item) => { $("#ticker").textContent = item.nombre; },
  onFin: (item) => mostrarGanador(item)
});

function renderSorteo({ enRuleta }) {
  ruleta.setItems(enRuleta);
  $("#cuenta-num").textContent = enRuleta.length;
  $("#cuenta-txt").textContent = enRuleta.length === 1
    ? "álbum completo en la ruleta" : "álbumes completos en la ruleta";
  $("#btn-girar").disabled = ruleta.bloqueada || enRuleta.length === 0;

  const ol = $("#lista-ganadores");
  ol.replaceChildren(...ganadores.map((g) => el("li", {},
    el("span", { class: "g-nombre" }, g.nombre),
    el("span", { class: "g-dni" }, `DNI …${g.dni.slice(-3)}`),
    el("button", {
      type: "button", class: "btn-texto solo-admin",
      onclick: async () => {
        if (confirm(`¿Devolver a ${g.nombre} a la ruleta?`)) await deleteDoc(doc(db, "ganadores", g.id));
      }
    }, "Devolver a la ruleta")
  )));
  $("#sin-ganadores").hidden = ganadores.length > 0;
}

$("#btn-girar").addEventListener("click", () => {
  if (ruleta.girar()) $("#btn-girar").disabled = true;
});

let ganadorActual = null;
function mostrarGanador(item) {
  ganadorActual = item;
  $("#ticker").textContent = item.nombre;
  $("#ganador-nombre").textContent = item.nombre;
  $("#ganador-dni").textContent = `DNI terminado en ${item.dni.slice(-3)}`;
  $("#ganador").hidden = false;
  $("#btn-registrar").focus();
  confeti();
}

function cerrarGanador() {
  $("#ganador").hidden = true;
  ganadorActual = null;
  ruleta.desbloquear();
  programar();
}

$("#btn-registrar").addEventListener("click", async () => {
  const g = ganadorActual;
  if (!g) return;
  const btn = $("#btn-registrar");
  btn.disabled = true;
  try {
    await addDoc(collection(db, "ganadores"), {
      uid: g.uid, nombre: g.nombre, dni: g.dni, fecha: serverTimestamp()
    });
    cerrarGanador();
  } catch (e) {
    console.error(e);
    alert("No se pudo registrar el ganador. Revisá la conexión.");
  } finally {
    btn.disabled = false;
  }
});
$("#btn-ausente").addEventListener("click", cerrarGanador);

// Pantalla completa para el proyector
$("#btn-full").addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else { abrirTab("sorteo"); document.documentElement.requestFullscreen?.(); }
});
document.addEventListener("fullscreenchange", () => {
  const full = !!document.fullscreenElement;
  document.body.classList.toggle("proyector", full);
  $("#btn-full").textContent = full ? "Salir de pantalla completa" : "Pantalla completa";
});

function confeti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("#confeti"), ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight; cv.hidden = false;
  const ps = Array.from({ length: 240 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.6,
    vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4,
    r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
    w: 7 + Math.random() * 9, h: 4 + Math.random() * 6,
    c: COLORES[Math.floor(Math.random() * COLORES.length)]
  }));
  const t0 = performance.now();
  const paso = (t) => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of ps) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t - t0 < 5500) requestAnimationFrame(paso);
    else { ctx.clearRect(0, 0, cv.width, cv.height); cv.hidden = true; }
  };
  requestAnimationFrame(paso);
}

// ---------- Participantes ----------
let ultimaLista = [];
function renderParticipantes({ total, lista }) {
  ultimaLista = lista;
  const completos = lista.filter((u) => u.completo).length;
  $("#resumen").replaceChildren(
    el("p", {}, el("strong", {}, lista.length), " registrados"),
    el("p", {}, el("strong", {}, completos), " con el álbum completo"),
    el("p", {}, el("strong", {}, total), " stands")
  );
  pintarTabla(total);
}

function pintarTabla(total) {
  const q = $("#buscar").value.trim().toLowerCase();
  const filas = ultimaLista
    .filter((u) => !q || u.nombre.toLowerCase().includes(q) || u.dni.includes(q))
    .sort((a, b) => b.hechas - a.hechas || a.nombre.localeCompare(b.nombre));
  $("#tabla-participantes").replaceChildren(...filas.map((u) => el("tr", {},
    el("td", {}, u.nombre),
    el("td", {}, u.dni),
    el("td", {}, `${u.hechas} / ${total}`),
    el("td", {}, u.completo ? el("span", { class: "chip chip-ok" }, "Completo") : el("span", { class: "chip" }, "En curso")),
    el("td", { class: "td-acciones" },
      el("button", { type: "button", class: "btn-texto peligro", onclick: () => borrarInscripto(u) }, "Eliminar"))
  )));
}
$("#buscar").addEventListener("input", () => pintarTabla(stands.length));

$("#btn-csv").addEventListener("click", () => {
  const total = stands.length;
  const filas = [["nombre", "dni", "figuritas", "total", "completo"],
    ...ultimaLista.map((u) => [u.nombre, u.dni, u.hechas, total, u.completo ? "si" : "no"])];
  const csv = filas.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = el("a", { href: url, download: "participantes.csv" });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ---------- Stands ----------
function renderStands() {
  const entregadas = new Map();
  for (const set of progreso.values()) for (const id of set) entregadas.set(id, (entregadas.get(id) || 0) + 1);

  $("#tabla-stands").replaceChildren(...stands.map((s) => el("tr", {},
    el("td", {}, s.orden),
    el("td", {}, s.nombre),
    el("td", {}, el("code", {}, claves.get(s.id) || "sin clave")),
    el("td", {}, entregadas.get(s.id) || 0),
    el("td", { class: "td-acciones" },
      el("button", { type: "button", class: "btn-texto", onclick: () => editarStand(s) }, "Editar"),
      el("button", { type: "button", class: "btn-texto peligro", onclick: () => borrarStand(s) }, "Eliminar")
    )
  )));
}

function editarStand(s) {
  $("#stand-id").value = s.id;
  $("#stand-nombre").value = s.nombre;
  $("#stand-orden").value = s.orden;
  $("#stand-imagen").value = s.imagen || "";
  $("#stand-clave").value = claves.get(s.id) || "";
  $("#form-stand-titulo").textContent = `Editar: ${s.nombre}`;
  $("#btn-cancelar-stand").hidden = false;
  $("#error-stand").textContent = "";
  $("#form-stand").scrollIntoView({ behavior: "smooth" });
  $("#stand-nombre").focus();
}

function limpiarForm() {
  $("#form-stand").reset();
  $("#stand-id").value = "";
  $("#form-stand-titulo").textContent = "Agregar stand";
  $("#btn-cancelar-stand").hidden = true;
  $("#error-stand").textContent = "";
}
$("#btn-cancelar-stand").addEventListener("click", limpiarForm);

$("#form-stand").addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = $("#error-stand");
  const id = $("#stand-id").value;
  const nombre = $("#stand-nombre").value.trim();
  const orden = parseInt($("#stand-orden").value, 10);
  const imagen = $("#stand-imagen").value.trim();
  const clave = normalizarClave($("#stand-clave").value);
  error.textContent = "";

  if (!nombre) { error.textContent = "Escribí el nombre del juego."; return; }
  if (!Number.isInteger(orden) || orden < 1) { error.textContent = "El número en el álbum tiene que ser 1 o más."; return; }
  if (clave.length < 3 || clave.length > 30) { error.textContent = "La clave tiene que tener entre 3 y 30 letras o números."; return; }

  const btn = $("#btn-guardar-stand");
  btn.disabled = true;
  try {
    const ref = id ? doc(db, "stands", id) : doc(collection(db, "stands"));
    const batch = writeBatch(db);
    batch.set(ref, { nombre, orden, imagen });
    const claveId = `${ref.id}_${clave}`;
    const viejas = await getDocs(query(collection(db, "claves"), where("standId", "==", ref.id)));
    viejas.forEach((d) => { if (d.id !== claveId) batch.delete(d.ref); });
    batch.set(doc(db, "claves", claveId), { standId: ref.id, clave });
    await batch.commit();
    limpiarForm();
  } catch (err) {
    console.error(err);
    error.textContent = "No se pudo guardar el stand. Revisá la conexión y los permisos.";
  } finally {
    btn.disabled = false;
  }
});

async function borrarStand(s) {
  if (!confirm(`¿Eliminar "${s.nombre}"? Deja de contar para completar el álbum.`)) return;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, "stands", s.id));
    const cs = await getDocs(query(collection(db, "claves"), where("standId", "==", s.id)));
    cs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if ($("#stand-id").value === s.id) limpiarForm();
  } catch (err) {
    console.error(err);
    alert("No se pudo eliminar el stand.");
  }
}

// ---------- Borrar inscriptos ----------
// Borra en tandas de hasta 450 operaciones (Firestore permite 500 por lote)
async function borrarRefs(refs, alAvanzar = () => {}) {
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((r) => batch.delete(r));
    await batch.commit();
    alAvanzar(Math.min(i + 450, refs.length), refs.length);
  }
}

async function borrarInscripto(u) {
  if (!confirm(`¿Eliminar a ${u.nombre} (DNI ${u.dni})?\n\nSe borran su álbum y sus figuritas, y si ganó un premio, también sale de la lista de ganadores. Su DNI queda libre para registrarse de nuevo.`)) return;
  const estado = $("#estado-borrado");
  estado.textContent = `Eliminando a ${u.nombre}…`;
  try {
    const [figus, gans] = await Promise.all([
      getDocs(collection(db, "usuarios", u.uid, "figuritas")),
      getDocs(query(collection(db, "ganadores"), where("uid", "==", u.uid)))
    ]);
    await borrarRefs([
      ...figus.docs.map((d) => d.ref),
      ...gans.docs.map((d) => d.ref),
      doc(db, "dnis", u.dni),
      doc(db, "usuarios", u.uid)
    ]);
    estado.textContent = `${u.nombre} fue eliminado.`;
  } catch (e) {
    console.error(e);
    estado.textContent = "";
    alert("No se pudo eliminar al inscripto. Revisá la conexión.");
  }
}

$("#btn-borrar-todo").addEventListener("click", async () => {
  const cantidad = usuarios.size;
  const texto = prompt(
    `Esto borra a los ${cantidad} inscriptos, todas sus figuritas y la lista de ganadores. Los stands y sus claves se mantienen.\n\nNo se puede deshacer. Para confirmar, escribí BORRAR:`
  );
  if (texto === null) return;
  if (texto.trim().toUpperCase() !== "BORRAR") { alert("No se borró nada: el texto no coincide."); return; }

  const btn = $("#btn-borrar-todo");
  const estado = $("#estado-borrado");
  btn.disabled = true;
  estado.textContent = "Buscando datos para borrar…";
  try {
    const [figus, users, dnis, gans] = await Promise.all([
      getDocs(collectionGroup(db, "figuritas")),
      getDocs(collection(db, "usuarios")),
      getDocs(collection(db, "dnis")),
      getDocs(collection(db, "ganadores"))
    ]);
    // Primero las figuritas y ganadores, al final los usuarios
    const refs = [...figus.docs, ...gans.docs, ...dnis.docs, ...users.docs].map((d) => d.ref);
    await borrarRefs(refs, (hechos, total) => {
      estado.textContent = `Borrando… ${hechos} de ${total} registros`;
    });
    estado.textContent = "Listo: se borraron todos los inscriptos. Los stands siguen cargados.";
  } catch (e) {
    console.error(e);
    estado.textContent = "";
    alert("Se cortó el borrado. Volvé a tocar el botón para terminar de borrar lo que quedó.");
  } finally {
    btn.disabled = false;
  }
});
