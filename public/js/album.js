import { auth, db } from "./firebase-init.js";
import { $, el, normalizarClave, hash, COLORES } from "./utils.js";
import { confeti, sonido, vibrar } from "./festejo.js";
import {
  onAuthStateChanged, signInAnonymously, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, writeBatch, serverTimestamp,
  collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const NOTA_SORTEO = "El ganador se elige al azar entre todos los álbumes completos. Quedate cerca y atento al anuncio del sorteo.";

const vistas = ["cargando", "registro", "album", "aviso"];
function mostrar(nombre) {
  for (const v of vistas) $(`#vista-${v}`).hidden = v !== nombre;
}

let usuario = null;
let stands = [];
let pegadas = new Map();      // standId -> datos (solo las confirmadas por el servidor)
let subs = [];
let registrando = false;

// ---------- Sesión ----------
onAuthStateChanged(auth, async (user) => {
  subs.forEach((u) => u()); subs = [];
  if (registrando) return;
  if (!user) { mostrar("registro"); return; }
  if (!user.isAnonymous) { mostrar("aviso"); return; }
  try {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (snap.exists()) abrirAlbum(user.uid, snap.data());
    else mostrar("registro");
  } catch (e) {
    console.error(e);
    mostrar("registro");
    $("#error-registro").textContent = "No se pudo conectar. Revisá la conexión a internet y volvé a intentar.";
  }
});

$("#btn-salir-admin").addEventListener("click", () => signOut(auth));

// ---------- Registro ----------
$("#form-registro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = $("#error-registro");
  const nombre = $("#nombre").value.trim().replace(/\s+/g, " ");
  const dni = $("#dni").value.replace(/\D/g, "");
  error.textContent = "";

  if (nombre.length < 2) { error.textContent = "Escribí tu nombre y apellido."; return; }
  if (!/^[0-9]{7,8}$/.test(dni)) { error.textContent = "El DNI tiene que tener 7 u 8 números, sin puntos."; return; }

  const btn = $("#btn-registro");
  btn.disabled = true; btn.textContent = "Abriendo…";
  registrando = true;
  try {
    const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
    const dniRef = doc(db, "dnis", dni);
    const dniSnap = await getDoc(dniRef);
    if (dniSnap.exists() && dniSnap.data().uid !== user.uid) {
      error.textContent = "Ese DNI ya tiene un álbum en otro celular. Si es tuyo, acercate a la organización.";
      return;
    }
    const batch = writeBatch(db);
    if (!dniSnap.exists()) batch.set(dniRef, { uid: user.uid });
    batch.set(doc(db, "usuarios", user.uid), { nombre, dni, creado: serverTimestamp() });
    await batch.commit();
    abrirAlbum(user.uid, { nombre, dni });
  } catch (err) {
    console.error(err);
    error.textContent = err.code === "auth/operation-not-allowed"
      ? "El acceso anónimo no está activado en Firebase."
      : "No se pudo crear el álbum. Revisá la conexión y volvé a intentar.";
  } finally {
    registrando = false;
    btn.disabled = false; btn.textContent = "Abrir mi álbum";
  }
});

// ---------- Álbum ----------
function abrirAlbum(uid, datos) {
  usuario = { uid, ...datos };
  $("#saludo-nombre").textContent = datos.nombre;
  mostrar("album");

  // Si el admin borra a este inscripto, el álbum vuelve a la pantalla de registro
  subs.push(onSnapshot(doc(db, "usuarios", uid), (s) => {
    if (!s.exists() && !s.metadata.fromCache) reiniciarAlbum();
  }, (e) => console.error(e)));

  subs.push(onSnapshot(
    query(collection(db, "stands"), orderBy("orden")),
    (s) => { stands = s.docs.map((d) => ({ id: d.id, ...d.data() })); render(); },
    (e) => console.error(e)
  ));

  // Ignoramos escrituras pendientes para no mostrar una figurita
  // que el servidor todavía puede rechazar por clave incorrecta.
  subs.push(onSnapshot(
    collection(db, "usuarios", uid, "figuritas"),
    { includeMetadataChanges: true },
    (s) => {
      pegadas = new Map(
        s.docs.filter((d) => !d.metadata.hasPendingWrites).map((d) => [d.id, d.data()])
      );
      render();
    },
    (e) => console.error(e)
  ));
}

function reiniciarAlbum() {
  subs.forEach((u) => u()); subs = [];
  usuario = null; stands = []; pegadas = new Map();
  if (dlgClave.open) dlgClave.close();
  for (const capa of [capaFigu, festejo]) if (!capa.hidden) cerrarCapa(capa);
  $("#grilla").replaceChildren();
  $("#boleto-album").replaceChildren();
  delete $("#boleto-album").dataset.total;
  document.body.classList.remove("album-completo");
  $("#form-registro").reset();
  mostrar("registro");
}

function arte(stand, i) {
  if (stand.imagen) return el("img", { src: stand.imagen, alt: "", loading: "lazy" });
  const iniciales = stand.nombre.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join("").toUpperCase();
  return el("div", { class: "figu-auto", style: `--c:${COLORES[i % COLORES.length]}` },
    el("span", { class: "figu-ini" }, iniciales),
    el("span", { class: "figu-tit" }, stand.nombre)
  );
}

function figu(stand, i, clase = "") {
  const giro = ((hash(stand.id) % 7) - 3) * 0.9;
  return el("span", { class: `figu ${clase}`.trim(), style: `--giro:${giro}deg` }, arte(stand, i));
}

function boleto(total, conSello = false) {
  return el("div", { class: "boleto-wrap" },
    el("div", { class: "boleto-sombra" },
      el("div", { class: "boleto" },
        el("div", { class: "boleto-cuerpo" },
          el("p", { class: "boleto-sobre" }, "Sorteo de premios"),
          el("p", { class: "boleto-titulo" }, "Ya estás participando"),
          el("p", { class: "boleto-nombre" }, usuario.nombre)
        ),
        el("div", { class: "boleto-talon" },
          el("span", { class: "boleto-num" }, `${total}/${total}`),
          el("span", { class: "boleto-talon-txt" }, "figuritas")
        )
      )
    ),
    conSello ? el("span", { class: "sello", "aria-hidden": "true" }, "Adentro") : null
  );
}

const num2 = (i) => String(i + 1).padStart(2, "0");

function render() {
  const grilla = $("#grilla");
  grilla.replaceChildren();

  stands.forEach((s, i) => {
    const tiene = pegadas.has(s.id);
    grilla.append(el("button", {
      type: "button",
      class: `slot ${tiene ? "lleno" : "vacio"}`,
      "data-id": s.id,
      "aria-label": `Figurita ${num2(i)}, ${s.nombre}${tiene ? ", conseguida" : ", pendiente"}`,
      onclick: () => (tiene ? verFigu(s, i) : pedirClave(s, i))
    },
      el("span", { class: "marco" },
        tiene ? figu(s, i) : el("span", { class: "slot-num" }, num2(i))
      ),
      el("span", { class: "slot-pie" },
        tiene ? el("span", { class: "slot-n" }, num2(i)) : null,
        el("span", { class: "slot-nombre" }, s.nombre)
      )
    ));
  });

  const total = stands.length;
  const hechas = stands.filter((s) => pegadas.has(s.id)).length;
  const completo = total > 0 && hechas === total;

  $("#progreso-texto").textContent = !total ? "Todavía no hay stands cargados."
    : completo ? `${total} de ${total}: álbum completo`
    : `${hechas} de ${total} figuritas`;
  $("#progreso-barra").style.setProperty("--p", total ? hechas / total : 0);
  document.body.classList.toggle("album-completo", completo);
  $("#nota-album").hidden = completo;

  const cont = $("#boleto-album");
  if (completo && cont.dataset.total !== String(total)) {
    cont.replaceChildren(boleto(total), el("p", { class: "boleto-nota" }, NOTA_SORTEO));
    cont.dataset.total = String(total);
  } else if (!completo) {
    cont.replaceChildren();
    delete cont.dataset.total;
  }
  cont.hidden = !completo;
}

// ---------- Pegar figurita (lo hace la persona del stand) ----------
const dlgClave = $("#dlg-clave");
let standActual = null;

function pedirClave(stand, i) {
  standActual = { stand, i };
  $("#clave-num").textContent = `Figurita ${num2(i)}`;
  $("#clave-titulo").textContent = stand.nombre;
  $("#clave").value = "";
  $("#error-clave").textContent = "";
  dlgClave.showModal();
  $("#clave").focus();
}

$("#btn-cancelar-clave").addEventListener("click", () => dlgClave.close());

$("#form-clave").addEventListener("submit", async (e) => {
  e.preventDefault();
  sonido.preparar(); // el navegador solo deja activar el audio durante un toque
  const error = $("#error-clave");
  const clave = normalizarClave($("#clave").value);
  error.textContent = "";
  if (clave.length < 3) { error.textContent = "La clave tiene al menos 3 caracteres."; return; }

  const btn = $("#btn-pegar");
  btn.disabled = true; btn.textContent = "Verificando…";
  const { stand, i } = standActual;
  try {
    await setDoc(doc(db, "usuarios", usuario.uid, "figuritas", stand.id), {
      clave, fecha: serverTimestamp()
    });
    const ahora = new Set([...pegadas.keys(), stand.id]);
    const total = stands.length;
    const hechas = stands.filter((s) => ahora.has(s.id)).length;
    dlgClave.close();
    if (total > 0 && hechas === total) festejarAlbum(stand, i, total);
    else festejarFigu(stand, i, hechas, total);
  } catch (err) {
    console.error(err);
    error.textContent = err.code === "permission-denied"
      ? "Clave incorrecta. Probá de nuevo."
      : "No se pudo verificar la clave. Revisá la conexión y volvé a intentar.";
    vibrar([20, 60, 20]);
    $("#clave").select();
  } finally {
    btn.disabled = false; btn.textContent = "Pegar figurita";
  }
});

// ---------- Capas ----------
const timers = [];
const despues = (ms, fn) => timers.push(setTimeout(fn, ms));
const limpiarTimers = () => timers.splice(0).forEach(clearTimeout);

function abrirCapa(capa, foco) {
  capa.hidden = false;
  document.body.classList.add("sin-scroll");
  foco.focus({ preventScroll: true });
}
function cerrarCapa(capa) {
  limpiarTimers();
  capa.hidden = true;
  document.body.classList.remove("sin-scroll");
}

function centroDe(elemento) {
  const r = elemento.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

// Figurita nueva
const capaFigu = $("#capa-figu");
let ultimaNueva = null;

function festejarFigu(stand, i, hechas, total) {
  ultimaNueva = stand.id;
  capaFigu.className = "capa modo-nueva";
  $("#figu-grande").replaceChildren(figu(stand, i, "estampar"));
  $("#figu-titulo").textContent = "¡Figurita nueva!";
  $("#figu-texto").textContent = stand.nombre;

  const faltan = total - hechas;
  const barra = $("#figu-progreso .progreso");
  barra.style.setProperty("--p", (hechas - 1) / total);
  $("#figu-faltan").textContent = faltan === 1
    ? `${hechas} de ${total}. ¡Te falta una sola para entrar al sorteo!`
    : `${hechas} de ${total}. Te faltan ${faltan} para entrar al sorteo.`;
  $("#figu-progreso").hidden = false;

  abrirCapa(capaFigu, $("#btn-cerrar-figu"));
  despues(330, () => {
    sonido.pegar();
    vibrar(40);
    confeti.explosion(...centroDe($("#figu-grande")), 90);
  });
  despues(750, () => {
    barra.style.setProperty("--p", hechas / total);
    sonido.subir(hechas / total);
  });
}

function verFigu(stand, i) {
  ultimaNueva = null;
  capaFigu.className = "capa modo-ver";
  $("#figu-grande").replaceChildren(figu(stand, i));
  $("#figu-titulo").textContent = stand.nombre;
  $("#figu-texto").textContent = `Figurita ${num2(i)} de tu álbum.`;
  $("#figu-progreso").hidden = true;
  abrirCapa(capaFigu, $("#btn-cerrar-figu"));
}

function cerrarFigu() {
  cerrarCapa(capaFigu);
  if (!ultimaNueva) return;
  const slot = document.querySelector(`.slot[data-id="${CSS.escape(ultimaNueva)}"]`);
  ultimaNueva = null;
  if (!slot) return;
  slot.scrollIntoView({ block: "center", behavior: "smooth" });
  const f = slot.querySelector(".figu");
  if (f) { f.classList.remove("estampar"); void f.offsetWidth; f.classList.add("estampar"); }
}
$("#btn-cerrar-figu").addEventListener("click", cerrarFigu);

// Álbum completo
const festejo = $("#festejo");

(function armarTitulo() {
  let n = 0;
  const palabras = "¡Álbum completo!".split(" ").map((p) =>
    el("span", { class: "palabra", "aria-hidden": "true" },
      [...p].map((letra) => el("span", { class: "letra", style: `--i:${n++}` }, letra))));
  $("#festejo-titulo").replaceChildren(palabras[0], " ", palabras[1]);
})();

function festejarAlbum(stand, i, total) {
  ultimaNueva = stand.id;
  $("#festejo-figu").replaceChildren(figu(stand, i, "estampar"));
  $("#festejo-boleto").replaceChildren(boleto(total, true), el("p", { class: "boleto-nota" }, NOTA_SORTEO));
  festejo.className = "festejo paso-1";
  abrirCapa(festejo, $("#btn-cerrar-festejo"));

  // 1. La última figurita se pega
  despues(330, () => {
    sonido.pegar();
    vibrar(40);
    confeti.explosion(...centroDe($("#festejo-figu")), 70);
  });
  // 2. Explota el festejo
  despues(1500, () => {
    festejo.classList.add("paso-2");
    sonido.fanfarria();
    vibrar([80, 50, 80, 50, 300]);
    confeti.canones();
    confeti.lluvia(4500);
  });
  // 3. Llega el boleto del sorteo y se sella
  despues(2900, () => festejo.classList.add("paso-3"));
  despues(3350, () => { sonido.sello(); vibrar(60); });
  // 4. Botón para volver
  despues(4000, () => {
    festejo.classList.add("paso-4");
    $("#btn-cerrar-festejo").focus({ preventScroll: true });
  });
}

function cerrarFestejo() {
  cerrarCapa(festejo);
  festejo.className = "festejo";
  window.scrollTo({ top: 0, behavior: "smooth" });
  const cont = $("#boleto-album");
  cont.classList.remove("resalto"); void cont.offsetWidth; cont.classList.add("resalto");
  ultimaNueva = null;
}
$("#btn-cerrar-festejo").addEventListener("click", cerrarFestejo);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!capaFigu.hidden) cerrarFigu();
  else if (!festejo.hidden && festejo.classList.contains("paso-4")) cerrarFestejo();
});
