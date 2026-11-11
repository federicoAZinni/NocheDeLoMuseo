import { useEffect, useRef, useState } from "react";
import { Backdrop, Box, Button, LinearProgress, Typography } from "@mui/material";
import type { Stand } from "../../types";
import { Stamp } from "./Stamp";
import { useTimers } from "../../hooks/useTimers";
import { useConfeti } from "../ConfettiLayer";
import { centroDe } from "../../lib/confetti";
import { sonido } from "../../lib/sonido";
import { vibrar } from "../../lib/utils";
import { LightSurface } from "../LightSurface";

const num2 = (i: number) => String(i + 1).padStart(2, "0");

interface StampRevealOverlayProps {
  abierto: boolean;
  modo: "nueva" | "ver" | null;
  stand: Stand | null;
  indice: number;
  hechas: number;
  total: number;
  onCerrar: () => void;
}

// La capa de "¡figurita nueva!" o de ver una figurita ya pegada (capa-figu en el original).
export function StampRevealOverlay({ abierto, modo, stand, indice, hechas, total, onCerrar }: StampRevealOverlayProps) {
  const escenaRef = useRef<HTMLDivElement>(null);
  const [progreso, setProgreso] = useState(0);
  const { despues, limpiar } = useTimers();
  const confeti = useConfeti();

  useEffect(() => {
    if (!abierto || modo !== "nueva" || !total) return;
    setProgreso((hechas - 1) / total);
    despues(330, () => {
      sonido.pegar();
      vibrar(40);
      if (escenaRef.current) confeti?.explosion(...centroDe(escenaRef.current), 90);
    });
    despues(750, () => {
      setProgreso(hechas / total);
      sonido.subir(hechas / total);
    });
    return limpiar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, modo, stand?.id]);

  if (!stand) return null;
  const esNueva = modo === "nueva";
  const faltan = total - hechas;

  return (
    <Backdrop
      open={abierto}
      onClick={onCerrar}
      className={`capa ${esNueva ? "modo-nueva" : "modo-ver"}`}
      sx={{ zIndex: (t) => t.zIndex.modal, bgcolor: "rgba(20,16,50,.86)", p: 2.5 }}
    >
      <Box
        className="capa-caja"
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "relative",
          overflow: "hidden",
          width: "min(420px, 100%)",
          bgcolor: "var(--pagina)",
          color: "var(--tinta)",
          borderRadius: 4.5,
          p: "24px 20px 22px",
          textAlign: "center",
        }}
      >
        <LightSurface>
          <Box className="escena" ref={escenaRef}>
            <Box className="rayos" aria-hidden="true" />
            <Box
              className="figu-grande"
              sx={{ position: "relative", width: "min(230px, 62vw)", aspectRatio: "3 / 4", m: "6px auto 18px" }}
            >
              <Stamp stand={stand} indice={indice} estampar={esNueva} animKey={esNueva ? stand.id : undefined} />
            </Box>
          </Box>
          <Typography
            component="h2"
            className={esNueva ? "figu-titulo-grande" : undefined}
            sx={
              esNueva
                ? { fontFamily: "var(--display)", fontWeight: 400, color: "var(--coral)", fontSize: "clamp(1.6rem, 8vw, 2.1rem)", m: "0 0 4px" }
                : { m: "0 0 4px", fontSize: "1.35rem", fontWeight: 800 }
            }
          >
            {esNueva ? "¡Figurita nueva!" : stand.nombre}
          </Typography>
          <Typography sx={{ m: 0, fontWeight: 600, fontSize: esNueva ? "1.1rem" : "1rem" }}>
            {esNueva ? stand.nombre : `Figurita ${num2(indice)} de tu álbum.`}
          </Typography>
          {esNueva && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, progreso * 100))}
                sx={{
                  height: 16,
                  borderRadius: 999,
                  bgcolor: "rgba(30,24,70,.1)",
                  "& .MuiLinearProgress-bar": { bgcolor: "var(--oro)", transition: "transform .8s cubic-bezier(.3,1.5,.5,1)" },
                }}
              />
              <Typography sx={{ mt: 1, fontWeight: 600 }}>
                {faltan === 1
                  ? `${hechas} de ${total}. ¡Te falta una sola para entrar al sorteo!`
                  : `${hechas} de ${total}. Te faltan ${faltan} para entrar al sorteo.`}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2.25 }}>
            <Button variant="contained" color="primary" onClick={onCerrar} autoFocus>
              Volver al álbum
            </Button>
          </Box>
        </LightSurface>
      </Box>
    </Backdrop>
  );
}
