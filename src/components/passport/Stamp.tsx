import { Box } from "@mui/material";
import type { CSSProperties } from "react";
import { hash } from "../../lib/utils";
import type { Stand } from "../../types";
import { StampArt } from "./StampArt";

interface StampProps {
  stand: Stand;
  indice: number;
  estampar?: boolean;
  animKey?: string | number;
}

export function Stamp({
  stand,
  indice,
  estampar = false,
  animKey,
}: StampProps) {
  const giro = ((hash(stand.id) % 7) - 3) * 0.9;
  const clases = ["figu", estampar ? "estampar" : "", stand.imagen ? "" : "con-tarjeta"]
    .filter(Boolean)
    .join(" ");
  return (
    <Box
      key={animKey}
      component="span"
      className={clases}
      style={{ "--giro": `${giro}deg` } as CSSProperties}
    >
      <StampArt stand={stand} indice={indice} />
    </Box>
  );
}
