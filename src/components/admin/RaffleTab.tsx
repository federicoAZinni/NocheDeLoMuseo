import { useEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { RaffleWheel } from "./RaffleWheel";
import { WinnerDialog } from "./WinnerDialog";
import type { Ruleta } from "../../lib/ruleta";
import type { DatosCalculados } from "../../hooks/useAdminData";
import type { Ganador, RuletaItem } from "../../types";

interface RaffleTabProps {
  enRuleta: DatosCalculados["enRuleta"];
  ganadores: Ganador[];
  registrarGanador: (item: Pick<RuletaItem, "uid" | "nombre" | "dni">) => Promise<void>;
  devolverGanador: (id: string) => Promise<void>;
}

export function RaffleTab({ enRuleta, ganadores, registrarGanador, devolverGanador }: RaffleTabProps) {
  const ruletaRef = useRef<Ruleta | null>(null);
  const [ticker, setTicker] = useState("");
  const [ganadorActual, setGanadorActual] = useState<RuletaItem | null>(null);
  const [girando, setGirando] = useState(false);
  const [modoProyector, setModoProyector] = useState(false);

  useEffect(() => {
    function sincronizar() {
      setModoProyector(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", sincronizar);
    return () => document.removeEventListener("fullscreenchange", sincronizar);
  }, []);

  function girar() {
    if (ruletaRef.current?.girar()) setGirando(true);
  }

  function cerrarGanador() {
    setGanadorActual(null);
    setGirando(false);
    ruletaRef.current?.desbloquear();
  }

  async function registrar() {
    if (!ganadorActual) return;
    await registrarGanador(ganadorActual);
    cerrarGanador();
  }

  function alternarPantallaCompleta() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  const botonDeshabilitado = girando || enRuleta.length === 0;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(280px, 380px)" },
        gap: 4,
        p: { xs: 2, md: 4 },
        minHeight: "calc(100vh - 60px)",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <RaffleWheel
          items={enRuleta}
          ruletaRef={ruletaRef}
          onTick={(item) => setTicker(item.nombre)}
          onFin={(item) => {
            setTicker(item.nombre);
            setGanadorActual(item);
          }}
        />
        <Typography
          sx={{
            fontFamily: "var(--display)",
            fontSize: "clamp(1.4rem, 3.4vw, 2.6rem)",
            color: "#fff",
            m: 0,
            textAlign: "center",
            minHeight: "1.3em",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          aria-live="off"
        >
          {ticker || "\u00a0"}
        </Typography>
      </Box>

      <Box component="aside">
        <Typography
          variant="h1"
          sx={{
            fontFamily: "var(--display)",
            fontWeight: 400,
            color: "var(--oro)",
            fontSize: "clamp(2rem, 4vw, 3.4rem)",
            lineHeight: 1,
            textShadow: "3px 3px 0 var(--coral)",
          }}
        >
          Gran sorteo
        </Typography>
        <Typography sx={{ fontSize: "1.2rem", m: "0 0 20px", color: "var(--lila)" }}>
          <Box
            component="span"
            sx={{ fontFamily: "var(--display)", fontSize: "2.4rem", color: "#fff", display: "block", lineHeight: 1.1 }}
          >
            {enRuleta.length}
          </Box>
          {enRuleta.length === 1 ? "álbum completo en la ruleta" : "álbumes completos en la ruleta"}
        </Typography>
        <Button
          fullWidth
          onClick={girar}
          disabled={botonDeshabilitado}
          sx={{
            fontFamily: "var(--display)",
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            bgcolor: "var(--oro)",
            color: "var(--tinta)",
            borderRadius: "20px",
            py: 0.6,
            boxShadow: "0 7px 0 var(--oro-osc)",
            "&:hover": { bgcolor: "var(--oro)" },
            "&:active:not(:disabled)": { transform: "translateY(5px)", boxShadow: "0 2px 0 var(--oro-osc)" },
            "&.Mui-disabled": { opacity: 0.45, color: "var(--tinta)" },
          }}
        >
          Girar
        </Button>
        {!modoProyector && (
          <Button
            startIcon={<FullscreenIcon />}
            onClick={alternarPantallaCompleta}
            sx={{ mt: 2, mb: 3.5, bgcolor: "var(--noche-3)", color: "#fff", px: 2, py: 0.75 }}
          >
            Pantalla completa
          </Button>
        )}
        <Typography variant="h2" sx={{ fontSize: "1.1rem", color: "var(--lila)" }}>
          Ganadores
        </Typography>
        {ganadores.length === 0 ? (
          <Typography sx={{ color: "var(--lila)", opacity: 0.8, m: 0 }}>Todavía no hay ganadores.</Typography>
        ) : (
          <Box component="ol" sx={{ m: 0, pl: "1.4em", display: "grid", gap: 1 }}>
            {ganadores.map((g) => (
              <Box
                component="li"
                key={g.id}
                sx={{ fontSize: "1.15rem", "&::marker": { fontFamily: "var(--display)", color: "var(--oro)" } }}
              >
                <Box component="span" sx={{ fontWeight: 800, mr: 1 }}>
                  {g.nombre}
                </Box>
                <Box component="span" sx={{ color: "var(--lila)", fontSize: ".9rem", mr: 1 }}>
                  DNI …{g.dni.slice(-3)}
                </Box>
                {!modoProyector && (
                  <Button
                    size="small"
                    sx={{ textDecoration: "underline", color: "inherit", minWidth: 0, p: "2px 4px" }}
                    onClick={() => {
                      if (confirm(`¿Devolver a ${g.nombre} a la ruleta?`)) devolverGanador(g.id);
                    }}
                  >
                    Devolver a la ruleta
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {modoProyector && (
        <Button
          size="small"
          startIcon={<FullscreenExitIcon />}
          onClick={alternarPantallaCompleta}
          sx={{ position: "fixed", bottom: 16, right: 16, bgcolor: "var(--noche-3)", color: "#fff" }}
        >
          Salir de pantalla completa
        </Button>
      )}

      <WinnerDialog item={ganadorActual} modoProyector={modoProyector} onAusente={cerrarGanador} onRegistrar={registrar} />
    </Box>
  );
}
