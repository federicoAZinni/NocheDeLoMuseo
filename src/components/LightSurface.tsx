import { ThemeProvider, createTheme, type Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { nochePalette } from "../theme";

interface LightSurfaceProps {
  children: ReactNode;
}

// Las tarjetas, diálogos y tablas de esta app usan un fondo claro ("var(--pagina)" o el dorado
// del boleto) aunque el tema general es oscuro. Sin esto, MUI pinta el texto con el color por
// defecto del tema (blanco) y queda invisible sobre esos fondos claros. Envolver ese contenido
// con <LightSurface> anida un tema "claro" que resuelve bien los colores de texto, inputs,
// tablas, etc. para cualquier componente de MUI que haya adentro.
export function LightSurface({ children }: LightSurfaceProps) {
  return (
    <ThemeProvider
      theme={(outer: Theme) =>
        createTheme(outer, {
          palette: {
            mode: "light",
            text: { primary: nochePalette.tinta, secondary: "#4B4578" },
            background: { default: nochePalette.pagina, paper: nochePalette.pagina },
          },
        })
      }
    >
      {children}
    </ThemeProvider>
  );
}
