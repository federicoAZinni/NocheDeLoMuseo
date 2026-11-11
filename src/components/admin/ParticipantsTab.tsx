import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { ParticipanteFila, Usuario } from "../../types";
import { LightSurface } from "../LightSurface";

interface ParticipantsTabProps {
  total: number;
  lista: ParticipanteFila[];
  onEliminar: (u: Usuario) => Promise<void>;
  onBorrarTodos: (alAvanzar: (hechos: number, total: number) => void) => Promise<void>;
}

function descargarCsv(lista: ParticipanteFila[], total: number) {
  const filas = [
    ["nombre", "dni", "figuritas", "total", "completo"],
    ...lista.map((u) => [u.nombre, u.dni, u.hechas, total, u.completo ? "si" : "no"]),
  ];
  const csv = filas.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "participantes.csv";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ParticipantsTab({ total, lista, onEliminar, onBorrarTodos }: ParticipantsTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoBorrado, setEstadoBorrado] = useState("");
  const [borrando, setBorrando] = useState(false);
  const completos = lista.filter((u) => u.completo).length;

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lista
      .filter((u) => !q || u.nombre.toLowerCase().includes(q) || u.dni.includes(q))
      .sort((a, b) => b.hechas - a.hechas || a.nombre.localeCompare(b.nombre));
  }, [lista, busqueda]);

  async function manejarBorrarTodos() {
    const texto = prompt(
      `Esto borra a los ${lista.length} inscriptos, todas sus figuritas y la lista de ganadores. Los stands y sus claves se mantienen.\n\nNo se puede deshacer. Para confirmar, escribí BORRAR:`
    );
    if (texto === null) return;
    if (texto.trim().toUpperCase() !== "BORRAR") {
      alert("No se borró nada: el texto no coincide.");
      return;
    }
    setBorrando(true);
    setEstadoBorrado("Buscando datos para borrar…");
    try {
      await onBorrarTodos((hechos, totalRefs) => setEstadoBorrado(`Borrando… ${hechos} de ${totalRefs} registros`));
      setEstadoBorrado("Listo: se borraron todos los inscriptos. Los stands siguen cargados.");
    } catch (e) {
      console.error(e);
      setEstadoBorrado("");
      alert("Se cortó el borrado. Volvé a tocar el botón para terminar de borrar lo que quedó.");
    } finally {
      setBorrando(false);
    }
  }

  async function manejarEliminar(u: ParticipanteFila) {
    if (!confirm(`¿Eliminar a ${u.nombre} (DNI ${u.dni})?\n\nSe borran su álbum y sus figuritas, y si ganó un premio, también sale de la lista de ganadores. Su DNI queda libre para registrarse de nuevo.`))
      return;
    setEstadoBorrado(`Eliminando a ${u.nombre}…`);
    try {
      await onEliminar(u);
      setEstadoBorrado(`${u.nombre} fue eliminado.`);
    } catch (e) {
      console.error(e);
      setEstadoBorrado("");
      alert("No se pudo eliminar al inscripto. Revisá la conexión.");
    }
  }

  return (
    <LightSurface>
      <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2.5, sm: 3 }, pb: 6 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          {[
            [lista.length, "registrados"],
            [completos, "con el álbum completo"],
            [total, "stands"],
          ].map(([n, label]) => (
            <Box key={label as string} sx={{ bgcolor: "var(--noche-2)", borderRadius: 1.5, px: 2, py: 1.25, color: "var(--lila)" }}>
              <Box component="strong" sx={{ color: "#fff", fontSize: "1.3rem" }}>
                {n}
              </Box>{" "}
              {label}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", gap: 1.25, mb: 1.75, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            type="search"
            placeholder="Buscar por nombre o DNI"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 220, bgcolor: "var(--pagina)", borderRadius: 1 }}
          />
          <Button variant="contained" sx={{ bgcolor: "var(--noche-3)" }} onClick={() => descargarCsv(lista, total)}>
            Descargar CSV
          </Button>
          <Button variant="contained" color="error" onClick={manejarBorrarTodos} disabled={borrando}>
            Borrar todos los inscriptos
          </Button>
        </Box>
        {estadoBorrado && (
          <Typography role="status" sx={{ color: "var(--oro)", fontWeight: 600, mb: 1.25 }}>
            {estadoBorrado}
          </Typography>
        )}

        <TableContainer sx={{ bgcolor: "var(--pagina)", borderRadius: 3.5 }}>
          <Table sx={{ color: "var(--tinta)" }}>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>DNI</TableCell>
                <TableCell>Figuritas</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell>{u.nombre}</TableCell>
                  <TableCell>{u.dni}</TableCell>
                  <TableCell>
                    {u.hechas} / {total}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.completo ? "Completo" : "En curso"}
                      size="small"
                      sx={{ bgcolor: u.completo ? "var(--oro)" : "rgba(30,24,70,.1)" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" onClick={() => manejarEliminar(u)}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LightSurface>
  );
}
