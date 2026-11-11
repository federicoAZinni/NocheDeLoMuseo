import { Box } from "@mui/material";
import type { CSSProperties } from "react";
import { COLORES, resolverImagen } from "../../lib/utils";
import type { Stand } from "../../types";

interface StampArtProps {
  stand: Stand;
  indice: number;
}

export function StampArt({ stand, indice }: StampArtProps) {
  if (stand.imagen) {
    return <img src={resolverImagen(stand.imagen)} alt="" loading="lazy" />;
  }
  const iniciales = stand.nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <Box
      className="figu-auto"
      style={{ "--c": COLORES[indice % COLORES.length] } as CSSProperties}
    >
      <span className="figu-ini">{iniciales}</span>
      <span className="figu-tit">{stand.nombre}</span>
    </Box>
  );
}
