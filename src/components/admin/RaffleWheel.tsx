import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { Ruleta } from "../../lib/ruleta";
import type { RuletaItem } from "../../types";

interface RaffleWheelProps {
  items: RuletaItem[];
  onTick: (item: RuletaItem) => void;
  onFin: (item: RuletaItem) => void;
  ruletaRef: React.MutableRefObject<Ruleta | null>;
}

export function RaffleWheel({
  items,
  onTick,
  onFin,
  ruletaRef,
}: RaffleWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacksRef = useRef({ onTick, onFin });
  callbacksRef.current = { onTick, onFin };

  useEffect(() => {
    if (!canvasRef.current) return;
    const ruleta = new Ruleta(canvasRef.current, {
      onTick: (item) => callbacksRef.current.onTick(item),
      onFin: (item) => callbacksRef.current.onFin(item),
    });
    ruletaRef.current = ruleta;
    return () => {
      ruleta.destruir();
      ruletaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ruletaRef.current?.setItems(items);
  }, [items, ruletaRef]);

  return (
    <Box
      sx={{
        width: "min(100%, calc(100vh - 170px))",
        aspectRatio: "1",
        display: "grid",
        placeItems: "center",
      }}
    >
      <canvas ref={canvasRef} aria-label="Ruleta del sorteo" />
    </Box>
  );
}
