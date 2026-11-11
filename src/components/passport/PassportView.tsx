import { useRef, useState } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import type { Figurita, Stand } from "../../types";
import { StampSlot } from "./StampSlot";
import { ClaveDialog } from "./ClaveDialog";
import { StampRevealOverlay } from "./StampRevealOverlay";
import { CompletionCelebration } from "./CompletionCelebration";
import { PassportTicket } from "./PassportTicket";
import { LightSurface } from "../LightSurface";

const NOTA_SORTEO =
  "El ganador se elige al azar entre todos los álbumes completos. Quedate cerca y atento al anuncio del sorteo.";

interface PassportViewProps {
  nombre: string;
  stands: Stand[];
  pegadas: Map<string, Figurita>;
  onPegarFigurita: (standId: string, claveNormalizada: string) => Promise<void>;
}

export function PassportView({ nombre, stands, pegadas, onPegarFigurita }: PassportViewProps) {
  const [claveDialogStand, setClaveDialogStand] = useState<{ stand: Stand; indice: number } | null>(null);
  const [reveal, setReveal] = useState<{ modo: "nueva" | "ver"; stand: Stand; indice: number; hechas: number } | null>(
    null
  );
  const [celebracion, setCelebracion] = useState<{ stand: Stand; indice: number } | null>(null);
  const [replay, setReplay] = useState<{ id: string; token: number } | null>(null);
  const [resalto, setResalto] = useState(false);
  const ultimaNuevaRef = useRef<string | null>(null);

  const total = stands.length;
  const hechas = stands.filter((s) => pegadas.has(s.id)).length;
  const completo = total > 0 && hechas === total;

  async function manejarPegar(standId: string, clave: string) {
    const stand = claveDialogStand?.stand;
    const indice = claveDialogStand?.indice ?? 0;
    await onPegarFigurita(standId, clave);
    if (!stand) return;
    setClaveDialogStand(null);
    const ahora = new Set([...pegadas.keys(), standId]);
    const hechasAhora = stands.filter((s) => ahora.has(s.id)).length;
    ultimaNuevaRef.current = standId;
    if (total > 0 && hechasAhora === total) {
      setCelebracion({ stand, indice });
    } else {
      setReveal({ modo: "nueva", stand, indice, hechas: hechasAhora });
    }
  }

  function cerrarReveal() {
    setReveal(null);
    const id = ultimaNuevaRef.current;
    ultimaNuevaRef.current = null;
    if (!id) return;
    setReplay({ id, token: Date.now() });
    requestAnimationFrame(() => {
      document.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  function cerrarCelebracion() {
    setCelebracion(null);
    ultimaNuevaRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setResalto(false);
    requestAnimationFrame(() => setResalto(true));
  }

  return (
    <Box component="section" sx={{ maxWidth: 980, mx: "auto", px: 1.75, pb: 6 }}>
      <Box sx={{ display: "grid", gap: 0.5, m: "4px 4px 16px" }}>
        <Typography sx={{ m: 0, color: "var(--lila)" }}>
          Álbum de{" "}
          <Box component="strong" sx={{ color: "#fff" }}>
            {nombre}
          </Box>
        </Typography>
        <Typography sx={{ m: 0, fontFamily: "var(--display)", fontSize: "1.25rem", color: "var(--oro)" }}>
          {!total
            ? "Todavía no hay stands cargados."
            : completo
              ? `${total} de ${total}: álbum completo`
              : `${hechas} de ${total} figuritas`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={total ? (hechas / total) * 100 : 0}
          aria-hidden="true"
          sx={{
            height: 14,
            mt: 0.75,
            borderRadius: 999,
            bgcolor: "var(--noche-2)",
            border: "2px solid var(--lila)",
            "& .MuiLinearProgress-bar": { bgcolor: "var(--oro)", transition: "transform .6s ease" },
          }}
        />
      </Box>

      <Box
        className={completo ? "album-completo" : undefined}
        sx={{
          bgcolor: "var(--pagina)",
          color: "var(--tinta)",
          borderRadius: 4.5,
          p: "22px 16px",
          boxShadow: completo ? "0 0 0 6px var(--oro)" : "0 0 0 6px var(--noche-2)",
        }}
      >
        <LightSurface>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px 14px",
              "@media (min-width: 560px)": { gridTemplateColumns: "repeat(3, 1fr)" },
              "@media (min-width: 820px)": { gridTemplateColumns: "repeat(4, 1fr)", gap: "26px 20px" },
            }}
          >
            {stands.map((s, i) => {
              const tiene = pegadas.has(s.id);
              const esReplay = replay?.id === s.id;
              return (
                <StampSlot
                  key={s.id}
                  stand={s}
                  indice={i}
                  conseguida={tiene}
                  estampar={esReplay}
                  animKey={esReplay ? replay!.token : undefined}
                  onClick={() =>
                    tiene
                      ? setReveal({ modo: "ver", stand: s, indice: i, hechas })
                      : setClaveDialogStand({ stand: s, indice: i })
                  }
                />
              );
            })}
          </Box>
        </LightSurface>
      </Box>

      {!completo && (
        <Typography sx={{ color: "var(--lila)", textAlign: "center", opacity: 1, fontSize: ".9rem", mt: 2 }}>
          Cuando termines de jugar, mostrale el álbum a la persona del stand para que te pegue la figurita.
        </Typography>
      )}

      {completo && (
        <Box className={resalto ? "boleto-album resalto" : "boleto-album"} sx={{ mt: 2, mb: 3 }}>
          <PassportTicket nombre={nombre} total={total} />
          <Typography sx={{ color: "var(--lila)", mt: "14px", mx: "4px", fontSize: ".95rem", textAlign: "center" }}>
            {NOTA_SORTEO}
          </Typography>
        </Box>
      )}

      <ClaveDialog
        key={claveDialogStand?.stand.id ?? "ninguno"}
        abierto={!!claveDialogStand}
        stand={claveDialogStand?.stand ?? null}
        indice={claveDialogStand?.indice ?? 0}
        onCancelar={() => setClaveDialogStand(null)}
        onPegar={manejarPegar}
      />

      <StampRevealOverlay
        abierto={!!reveal}
        modo={reveal?.modo ?? null}
        stand={reveal?.stand ?? null}
        indice={reveal?.indice ?? 0}
        hechas={reveal?.hechas ?? hechas}
        total={total}
        onCerrar={cerrarReveal}
      />

      <CompletionCelebration
        abierto={!!celebracion}
        stand={celebracion?.stand ?? null}
        indice={celebracion?.indice ?? 0}
        total={total}
        nombre={nombre}
        onCerrar={cerrarCelebracion}
      />
    </Box>
  );
}
