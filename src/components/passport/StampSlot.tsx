import { Box, ButtonBase, Typography } from "@mui/material";
import type { Stand } from "../../types";
import { Stamp } from "./Stamp";

interface StampSlotProps {
  stand: Stand;
  indice: number;
  conseguida: boolean;
  onClick: () => void;
  estampar?: boolean;
  animKey?: string | number;
}

const num2 = (i: number) => String(i + 1).padStart(2, "0");

export function StampSlot({
  stand,
  indice,
  conseguida,
  onClick,
  estampar = false,
  animKey,
}: StampSlotProps) {
  return (
    <ButtonBase
      data-id={stand.id}
      className="slot"
      onClick={onClick}
      aria-label={`Figurita ${num2(indice)}, ${stand.nombre}${conseguida ? ", conseguida" : ", pendiente"}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        alignItems: "stretch",
        borderRadius: 1.5,
        p: 0,
      }}
    >
      <Box
        className="marco"
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          ...(conseguida
            ? {}
            : {
                border: "2.5px dashed rgba(30,24,70,.32)",
                bgcolor: "rgba(30,24,70,.05)",
                "&:hover": {
                  bgcolor: "rgba(255,94,126,.08)",
                  borderColor: "var(--coral)",
                },
              }),
        }}
      >
        {conseguida ? (
          <Stamp
            stand={stand}
            indice={indice}
            estampar={estampar}
            animKey={animKey}
          />
        ) : (
          <Typography
            sx={{
              fontFamily: "var(--display)",
              fontSize: "2.8rem",
              color: "rgba(30,24,70,.22)",
            }}
          >
            {num2(indice)}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          alignItems: "baseline",
          fontSize: ".92rem",
          fontWeight: 600,
          lineHeight: 1.25,
        }}
      >
        {conseguida && (
          <Typography
            component="span"
            sx={{
              fontFamily: "var(--display)",
              fontSize: ".8rem",
              color: "var(--coral)",
            }}
          >
            {num2(indice)}
          </Typography>
        )}
        <Typography
          component="span"
          sx={{ fontSize: "inherit", fontWeight: "inherit" }}
        >
          {stand.nombre}
        </Typography>
      </Box>
    </ButtonBase>
  );
}
