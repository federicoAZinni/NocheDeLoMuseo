import { Box, CircularProgress, Typography } from "@mui/material";
import { useAlbumSesion } from "../hooks/useAlbumSesion";
import { PassportHeader, RegistrationForm, AdminSessionNotice } from "../components/passport/RegistrationForms";
import { PassportView } from "../components/passport/PassportView";

export function PassportPage() {
  const { estado, usuario, stands, pegadas, registrar, pegarFigurita, salirAdmin } = useAlbumSesion();

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <PassportHeader />
      <Box component="main">
        {estado === "cargando" && (
          <Box sx={{ display: "grid", placeItems: "center", mt: 5, gap: 2 }}>
            <CircularProgress sx={{ color: "var(--lila)" }} />
            <Typography sx={{ color: "var(--lila)" }}>Abriendo tu álbum…</Typography>
          </Box>
        )}
        {estado === "registro" && <RegistrationForm onRegistrar={registrar} />}
        {estado === "aviso" && <AdminSessionNotice onSalir={salirAdmin} />}
        {estado === "pasaporte" && usuario && (
          <PassportView nombre={usuario.nombre} stands={stands} pegadas={pegadas} onPegarFigurita={pegarFigurita} />
        )}
      </Box>
    </Box>
  );
}
