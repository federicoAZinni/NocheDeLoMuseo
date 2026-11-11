import { useEffect, useRef, useState } from "react";
import { Box, Button, Modal, Typography } from "@mui/material";
import { useConfeti } from "../ConfettiLayer";
import type { RuletaItem } from "../../types";

interface WinnerDialogProps {
  item: RuletaItem | null;
  modoProyector: boolean;
  onAusente: () => void;
  onRegistrar: () => Promise<void>;
}

export function WinnerDialog({ item, modoProyector, onAusente, onRegistrar }: WinnerDialogProps) {
  const [enviando, setEnviando] = useState(false);
  const confeti = useConfeti();
  const yaExploto = useRef<string | null>(null);

  useEffect(() => {
    if (item && yaExploto.current !== item.uid) {
      yaExploto.current = item.uid;
      confeti?.canones();
    }
    if (!item) yaExploto.current = null;
  }, [item, confeti]);

  async function registrar() {
    setEnviando(true);
    try {
      await onRegistrar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal open={!!item} sx={{ zIndex: (t) => t.zIndex.modal + 20 }}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: "rgba(20,16,50,.88)",
          p: 3,
          outline: "none",
        }}
      >
        <Box sx={{ textAlign: "center", maxWidth: 1100, animation: "aparecer .5s cubic-bezier(.2,.9,.3,1.2)" }}>
          <Typography sx={{ color: "var(--lila)", fontSize: "clamp(1.1rem, 2.4vw, 1.8rem)", m: 0 }}>
            Ganador del sorteo
          </Typography>
          <Typography
            sx={{
              fontFamily: "var(--display)",
              color: "var(--oro)",
              m: "0.15em 0",
              fontSize: "clamp(2.6rem, 9vw, 7rem)",
              lineHeight: 1.02,
              textShadow: "5px 5px 0 var(--coral)",
              overflowWrap: "anywhere",
            }}
          >
            {item?.nombre}
          </Typography>
          <Typography sx={{ fontSize: "clamp(1.1rem, 2.4vw, 1.8rem)", m: "0 0 24px" }}>
            DNI terminado en {item?.dni.slice(-3)}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
            {!modoProyector && (
              <Button variant="outlined" sx={{ color: "#fff", borderColor: "var(--lila)" }} onClick={onAusente}>
                No está presente, cerrar
              </Button>
            )}
            <Button variant="contained" color="primary" onClick={registrar} disabled={enviando} autoFocus>
              Registrar ganador
            </Button>
          </Box>
          {!modoProyector && (
            <Typography sx={{ color: "var(--lila)", fontSize: ".9rem", mt: 1.75 }}>
              Al registrarlo sale de la ruleta para el próximo premio.
            </Typography>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
