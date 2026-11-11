import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Box, Button, Modal } from "@mui/material";
import type { Stand } from "../../types";
import { Stamp } from "./Stamp";
import { PassportTicket } from "./PassportTicket";
import { useTimers } from "../../hooks/useTimers";
import { useConfeti } from "../ConfettiLayer";
import { centroDe } from "../../lib/confetti";
import { sonido } from "../../lib/sonido";
import { vibrar } from "../../lib/utils";

const NOTA_SORTEO =
  "El ganador se elige al azar entre todos los álbumes completos. Quedate cerca y atento al anuncio del sorteo.";

interface CompletionCelebrationProps {
  abierto: boolean;
  stand: Stand | null;
  indice: number;
  total: number;
  nombre: string;
  onCerrar: () => void;
}

export function CompletionCelebration({
  abierto,
  stand,
  indice,
  total,
  nombre,
  onCerrar,
}: CompletionCelebrationProps) {
  const [paso, setPaso] = useState(0);
  const [puedeCerrar, setPuedeCerrar] = useState(false);
  const figuraRef = useRef<HTMLDivElement>(null);
  const cerrarBtnRef = useRef<HTMLButtonElement>(null);
  const { despues, limpiar } = useTimers();
  const confeti = useConfeti();

  const palabras = useMemo(() => {
    let n = 0;
    return "¡Álbum completo!".split(" ").map((palabra) => ({
      palabra,
      letras: [...palabra].map((letra) => ({ letra, i: n++ })),
    }));
  }, []);

  useEffect(() => {
    if (!abierto || !stand) return;
    setPaso(1);
    setPuedeCerrar(false);
    despues(330, () => {
      sonido.pegar();
      vibrar(40);
      if (figuraRef.current)
        confeti?.explosion(...centroDe(figuraRef.current), 70);
    });
    despues(1500, () => {
      setPaso(2);
      sonido.fanfarria();
      vibrar([80, 50, 80, 50, 300]);
      confeti?.canones();
      confeti?.lluvia(4500);
    });
    despues(2900, () => setPaso(3));
    despues(3350, () => {
      sonido.sello();
      vibrar(60);
    });
    despues(4000, () => {
      setPaso(4);
      setPuedeCerrar(true);
      cerrarBtnRef.current?.focus({ preventScroll: true });
    });
    return limpiar;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, stand?.id]);

  function manejarCerrar() {
    if (!puedeCerrar) return;
    onCerrar();
  }

  if (!stand) return null;
  const clasesPaso = Array.from(
    { length: paso },
    (_, i) => `paso-${i + 1}`,
  ).join(" ");

  return (
    <Modal
      open={abierto}
      onClose={manejarCerrar}
      closeAfterTransition
      sx={{ zIndex: (t) => t.zIndex.modal + 10 }}
    >
      <Box
        className={`festejo ${clasesPaso}`.trim()}
        sx={{
          position: "fixed",
          inset: 0,
          overflow: "hidden auto",
          display: "grid",
          placeItems: "center",
          padding: "24px 18px calc(24px + env(safe-area-inset-bottom, 0px))",
          background:
            "radial-gradient(circle at 50% 40%, #3A3180 0%, var(--noche) 65%)",
          outline: "none",
        }}
      >
        <Box className="rayos-grandes" aria-hidden="true" />
        <Box className="festejo-flash" aria-hidden="true" />
        <Box
          className="festejo-contenido"
          sx={{
            position: "relative",
            width: "min(460px, 100%)",
            minHeight: 440,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2.75,
            textAlign: "center",
          }}
        >
          <Box className="escena escena-festejo" ref={figuraRef}>
            <Box className="rayos" aria-hidden="true" />
            <Box
              className="figu-grande"
              sx={{
                position: "relative",
                width: "min(230px, 62vw)",
                aspectRatio: "3 / 4",
              }}
            >
              <Stamp
                stand={stand}
                indice={indice}
                estampar
                animKey={stand.id}
              />
            </Box>
          </Box>

          <Box
            component="h2"
            className="festejo-titulo"
            aria-label="¡Álbum completo!"
            sx={{ display: "block" }}
          >
            {palabras.map(({ palabra, letras }, i) => (
              <span key={palabra + i}>
                <span className="palabra" aria-hidden="true">
                  {letras.map(({ letra, i: li }) => (
                    <span
                      key={li}
                      className="letra"
                      style={{ "--i": li } as CSSProperties}
                    >
                      {letra}
                    </span>
                  ))}
                </span>
                {i === 0 ? " " : ""}
              </span>
            ))}
          </Box>

          <Box className="festejo-boleto" sx={{ width: "100%" }}>
            <PassportTicket nombre={nombre} total={total} conSello />
            <Box
              sx={{
                color: "var(--lila)",
                mt: "14px",
                mx: "4px",
                fontSize: ".95rem",
                textAlign: "center",
              }}
            >
              {NOTA_SORTEO}
            </Box>
          </Box>

          <Button
            ref={cerrarBtnRef}
            className="boton-cerrar-festejo"
            variant="contained"
            color="primary"
            onClick={manejarCerrar}
          >
            Ver mi álbum
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
