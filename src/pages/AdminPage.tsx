import { useState } from "react";
import { AppBar, Box, Button, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { signOut } from "firebase/auth";
import { auth, ADMIN_EMAIL } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useAdminData } from "../hooks/useAdminData";
import { AdminLogin } from "../components/admin/AdminLogin";
import { RaffleTab } from "../components/admin/RaffleTab";
import { ParticipantsTab } from "../components/admin/ParticipantsTab";
import { StandsTab } from "../components/admin/StandsTab";

type TabId = "sorteo" | "participantes" | "stands";

export function AdminPage() {
  const { user, cargando } = useAuth();
  const [tab, setTab] = useState<TabId>("sorteo");
  const esAdmin = !!user && user.email === ADMIN_EMAIL;
  const datos = useAdminData();

  if (cargando) return null;
  if (!esAdmin) return <AdminLogin />;

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="static" sx={{ bgcolor: "rgba(20,16,50,.7)", borderBottom: "2px solid var(--noche-3)" }} elevation={0}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
          <Typography sx={{ fontFamily: "var(--display)", color: "var(--oro)", fontWeight: 400 }}>
            Noche de los Museos UTN
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              mr: "auto",
              minHeight: 0,
              "& .MuiTab-root": { color: "var(--lila)", minHeight: 0, fontWeight: 600, borderRadius: 999 },
              "& .Mui-selected": { color: "var(--tinta) !important", bgcolor: "var(--lila)" },
              "& .MuiTabs-indicator": { display: "none" },
            }}
          >
            <Tab label="Sorteo" value="sorteo" />
            <Tab label="Participantes" value="participantes" />
            <Tab label="Stands" value="stands" />
          </Tabs>
          <Button size="small" sx={{ bgcolor: "var(--noche-3)", color: "#fff" }} onClick={() => signOut(auth)}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      {tab === "sorteo" && (
        <RaffleTab
          enRuleta={datos.enRuleta}
          ganadores={datos.ganadores}
          registrarGanador={datos.registrarGanador}
          devolverGanador={datos.devolverGanador}
        />
      )}
      {tab === "participantes" && (
        <ParticipantsTab
          total={datos.total}
          lista={datos.lista}
          onEliminar={datos.borrarInscripto}
          onBorrarTodos={datos.borrarTodosInscriptos}
        />
      )}
      {tab === "stands" && (
        <StandsTab
          stands={datos.stands}
          claves={datos.claves}
          progreso={datos.progreso}
          onGuardar={datos.guardarStand}
          onBorrar={datos.borrarStand}
        />
      )}
    </Box>
  );
}
