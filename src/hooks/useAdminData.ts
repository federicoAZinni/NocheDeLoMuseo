import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { hash, normalizarClave } from "../lib/utils";
import type { Ganador, ParticipanteFila, Stand, Usuario } from "../types";

interface DatosAdmin {
  stands: Stand[];
  usuarios: Map<string, Usuario>;
  progreso: Map<string, Set<string>>;
  ganadores: Ganador[];
  claves: Map<string, string>; // standId -> clave
}

export interface DatosCalculados {
  total: number;
  lista: ParticipanteFila[];
  enRuleta: ParticipanteFila[];
}

function calcular({ stands, usuarios, progreso, ganadores }: DatosAdmin): DatosCalculados {
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

export function useAdminData() {
  const [datos, setDatos] = useState<DatosAdmin>({
    stands: [],
    usuarios: new Map(),
    progreso: new Map(),
    ganadores: [],
    claves: new Map(),
  });

  useEffect(() => {
    const errorDatos = (e: unknown) => {
      console.error(e);
    };

    const unsubs = [
      onSnapshot(
        query(collection(db, "stands"), orderBy("orden")),
        (s) =>
          setDatos((d) => ({
            ...d,
            stands: s.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Stand, "id">) })),
          })),
        errorDatos
      ),
      onSnapshot(
        collection(db, "usuarios"),
        (s) =>
          setDatos((d) => ({
            ...d,
            usuarios: new Map(s.docs.map((doc) => [doc.id, { uid: doc.id, ...(doc.data() as Omit<Usuario, "uid">) }])),
          })),
        errorDatos
      ),
      onSnapshot(
        collectionGroup(db, "figuritas"),
        (s) => {
          const progreso = new Map<string, Set<string>>();
          s.docs.forEach((d) => {
            const uid = d.ref.parent.parent!.id;
            if (!progreso.has(uid)) progreso.set(uid, new Set());
            progreso.get(uid)!.add(d.id);
          });
          setDatos((d) => ({ ...d, progreso }));
        },
        errorDatos
      ),
      onSnapshot(
        query(collection(db, "ganadores"), orderBy("fecha")),
        (s) =>
          setDatos((d) => ({
            ...d,
            ganadores: s.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Ganador, "id">) })),
          })),
        errorDatos
      ),
      onSnapshot(
        collection(db, "claves"),
        (s) => {
          const claves = new Map<string, string>();
          s.docs.forEach((d) => claves.set(d.data().standId, d.data().clave));
          setDatos((d) => ({ ...d, claves }));
        },
        errorDatos
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  const calculado = useMemo(() => calcular(datos), [datos]);

  const registrarGanador = useCallback(async (item: Pick<Usuario, "uid" | "nombre" | "dni">) => {
    await addDoc(collection(db, "ganadores"), { ...item, fecha: serverTimestamp() });
  }, []);

  const devolverGanador = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "ganadores", id));
  }, []);

  const guardarStand = useCallback(
    async (input: { id: string; nombre: string; orden: number; imagen: string; clave: string }) => {
      const { id, nombre, orden, imagen, clave } = input;
      const ref = id ? doc(db, "stands", id) : doc(collection(db, "stands"));
      const batch = writeBatch(db);
      batch.set(ref, { nombre, orden, imagen });
      const claveId = `${ref.id}_${clave}`;
      const viejas = await getDocs(query(collection(db, "claves"), where("standId", "==", ref.id)));
      viejas.forEach((d) => {
        if (d.id !== claveId) batch.delete(d.ref);
      });
      batch.set(doc(db, "claves", claveId), { standId: ref.id, clave });
      await batch.commit();
    },
    []
  );

  const borrarStand = useCallback(async (stand: Stand) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "stands", stand.id));
    const cs = await getDocs(query(collection(db, "claves"), where("standId", "==", stand.id)));
    cs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }, []);

  const borrarRefs = useCallback(
    async (refs: ReturnType<typeof doc>[], alAvanzar: (hechos: number, total: number) => void = () => {}) => {
      for (let i = 0; i < refs.length; i += 450) {
        const batch = writeBatch(db);
        refs.slice(i, i + 450).forEach((r) => batch.delete(r));
        await batch.commit();
        alAvanzar(Math.min(i + 450, refs.length), refs.length);
      }
    },
    []
  );

  const borrarInscripto = useCallback(
    async (u: Usuario) => {
      const [figus, gans] = await Promise.all([
        getDocs(collection(db, "usuarios", u.uid, "figuritas")),
        getDocs(query(collection(db, "ganadores"), where("uid", "==", u.uid))),
      ]);
      await borrarRefs([...figus.docs.map((d) => d.ref), ...gans.docs.map((d) => d.ref), doc(db, "dnis", u.dni), doc(db, "usuarios", u.uid)]);
    },
    [borrarRefs]
  );

  const borrarTodosInscriptos = useCallback(
    async (alAvanzar: (hechos: number, total: number) => void) => {
      const [figus, users, dnis, gans] = await Promise.all([
        getDocs(collectionGroup(db, "figuritas")),
        getDocs(collection(db, "usuarios")),
        getDocs(collection(db, "dnis")),
        getDocs(collection(db, "ganadores")),
      ]);
      const refs = [...figus.docs, ...gans.docs, ...dnis.docs, ...users.docs].map((d) => d.ref);
      await borrarRefs(refs, alAvanzar);
    },
    [borrarRefs]
  );

  return {
    ...datos,
    ...calculado,
    registrarGanador,
    devolverGanador,
    guardarStand,
    borrarStand,
    borrarInscripto,
    borrarTodosInscriptos,
    normalizarClave,
  };
}
