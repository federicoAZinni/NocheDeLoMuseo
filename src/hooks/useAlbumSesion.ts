import { useCallback, useEffect, useRef, useState } from "react";
import {
  signInAnonymously,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Figurita, Stand, Usuario } from "../types";

export type EstadoPasaporte = "cargando" | "registro" | "pasaporte" | "aviso";

export class ErrorAmigable extends Error {}

export function useAlbumSesion() {
  const { user, cargando: cargandoAuth } = useAuth();
  const [estado, setEstado] = useState<EstadoPasaporte>("cargando");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [stands, setStands] = useState<Stand[]>([]);
  const [pegadas, setPegadas] = useState<Map<string, Figurita>>(new Map());
  const registrandoRef = useRef(false);

  const abrirAlbum = useCallback((uid: string, datos: { nombre: string; dni: string }) => {
    setUsuario({ uid, ...datos });
    setEstado("pasaporte");
  }, []);

  const reiniciarAlbum = useCallback(() => {
    setUsuario(null);
    setStands([]);
    setPegadas(new Map());
    setEstado("registro");
  }, []);

  // ---------- Sesión ----------
  useEffect(() => {
    if (cargandoAuth || registrandoRef.current) return;
    if (!user) {
      reiniciarAlbum();
      return;
    }
    if (!user.isAnonymous) {
      setEstado("aviso");
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (cancelado) return;
        if (snap.exists()) abrirAlbum(user.uid, snap.data() as { nombre: string; dni: string });
        else setEstado("registro");
      } catch (e) {
        console.error(e);
        if (!cancelado) setEstado("registro");
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cargandoAuth]);

  // ---------- Suscripciones del álbum abierto ----------
  useEffect(() => {
    if (estado !== "pasaporte" || !usuario) return;
    const { uid } = usuario;

    // Si el admin borra a este inscripto, el álbum vuelve a la pantalla de registro
    const unsubUsuario = onSnapshot(
      doc(db, "usuarios", uid),
      (s) => {
        if (!s.exists() && !s.metadata.fromCache) reiniciarAlbum();
      },
      (e) => console.error(e)
    );

    const unsubStands = onSnapshot(
      query(collection(db, "stands"), orderBy("orden")),
      (s) => setStands(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Stand, "id">) }))),
      (e) => console.error(e)
    );

    // Ignoramos escrituras pendientes para no mostrar una figurita
    // que el servidor todavía puede rechazar por clave incorrecta.
    const unsubFiguritas = onSnapshot(
      collection(db, "usuarios", uid, "figuritas"),
      { includeMetadataChanges: true },
      (s) => {
        setPegadas(
          new Map(
            s.docs
              .filter((d) => !d.metadata.hasPendingWrites)
              .map((d) => [d.id, d.data() as Figurita])
          )
        );
      },
      (e) => console.error(e)
    );

    return () => {
      unsubUsuario();
      unsubStands();
      unsubFiguritas();
    };
  }, [estado, usuario, reiniciarAlbum]);

  const registrar = useCallback(async (nombreCrudo: string, dniCrudo: string) => {
    const nombre = nombreCrudo.trim().replace(/\s+/g, " ");
    const dni = dniCrudo.replace(/\D/g, "");
    if (nombre.length < 2) throw new ErrorAmigable("Escribí tu nombre y apellido.");
    if (!/^[0-9]{7,8}$/.test(dni)) throw new ErrorAmigable("El DNI tiene que tener 7 u 8 números, sin puntos.");

    registrandoRef.current = true;
    try {
      const credUser: User = auth.currentUser ?? (await signInAnonymously(auth)).user;
      const dniRef = doc(db, "dnis", dni);
      const dniSnap = await getDoc(dniRef);
      if (dniSnap.exists() && dniSnap.data().uid !== credUser.uid) {
        throw new ErrorAmigable("Ese DNI ya tiene un álbum en otro celular. Si es tuyo, acercate a la organización.");
      }
      const batch = writeBatch(db);
      if (!dniSnap.exists()) batch.set(dniRef, { uid: credUser.uid });
      batch.set(doc(db, "usuarios", credUser.uid), { nombre, dni, creado: serverTimestamp() });
      await batch.commit();
      abrirAlbum(credUser.uid, { nombre, dni });
    } catch (err) {
      if (err instanceof ErrorAmigable) throw err;
      console.error(err);
      const code = (err as { code?: string })?.code;
      throw new ErrorAmigable(
        code === "auth/operation-not-allowed"
          ? "El acceso anónimo no está activado en Firebase."
          : "No se pudo crear el álbum. Revisá la conexión y volvé a intentar."
      );
    } finally {
      registrandoRef.current = false;
    }
  }, [abrirAlbum]);

  const pegarFigurita = useCallback(
    async (standId: string, claveNormalizada: string) => {
      if (!usuario) throw new ErrorAmigable("Tu álbum no está abierto.");
      if (claveNormalizada.length < 3) throw new ErrorAmigable("La clave tiene al menos 3 caracteres.");
      try {
        await setDoc(doc(db, "usuarios", usuario.uid, "figuritas", standId), {
          clave: claveNormalizada,
          fecha: serverTimestamp(),
        });
      } catch (err) {
        const code = (err as { code?: string })?.code;
        throw new ErrorAmigable(
          code === "permission-denied"
            ? "Clave incorrecta. Probá de nuevo."
            : "No se pudo verificar la clave. Revisá la conexión y volvé a intentar."
        );
      }
    },
    [usuario]
  );

  const salirAdmin = useCallback(() => signOut(auth), []);

  return { estado, usuario, stands, pegadas, registrar, pegarFigurita, salirAdmin };
}
