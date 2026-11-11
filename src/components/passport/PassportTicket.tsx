import { Box, Typography } from "@mui/material";
import { nochePalette } from "../../theme";
import { LightSurface } from "../LightSurface";

interface PassportTicketProps {
  nombre: string;
  total: number;
  conSello?: boolean;
  className?: string;
}

export function PassportTicket({
  nombre,
  total,
  conSello = false,
  className,
}: PassportTicketProps) {
  return (
    <LightSurface>
      <Box className={`boleto-wrap ${className ?? ""}`.trim()}>
      <Box className="boleto-sombra">
        <Box className="boleto">
          <Box className="boleto-cuerpo">
            <Typography sx={{ m: 0, fontSize: "0.85rem", fontWeight: 600 }}>
              Sorteo de premios
            </Typography>
            <Typography
              sx={{
                m: "2px 0 6px",
                fontFamily: "var(--display)",
                fontSize: "clamp(1.3rem, 6vw, 1.7rem)",
                lineHeight: 1.05,
              }}
            >
              Ya estás participando
            </Typography>
            <Typography sx={{ m: 0, fontWeight: 800, fontSize: "1.05rem" }}>
              {nombre}
            </Typography>
          </Box>
          <Box className="boleto-talon">
            <Typography
              component="span"
              sx={{
                fontFamily: "var(--display)",
                fontSize: "1.5rem",
                lineHeight: 1,
              }}
            >
              {total}/{total}
            </Typography>
            <Typography
              component="span"
              sx={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              figuritas
            </Typography>
          </Box>
        </Box>
      </Box>
      {conSello && (
        <Typography
          component="span"
          className="sello"
          aria-hidden="true"
          sx={{ color: nochePalette.coral }}
        >
          Adentro
        </Typography>
      )}
    </Box>
    </LightSurface>
  );
}
