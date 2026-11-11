import { useRef, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { normalizarClave } from "../../lib/utils";
import type { Stand } from "../../types";
import { LightSurface } from "../LightSurface";

interface StandsTabProps {
  stands: Stand[];
  claves: Map<string, string>;
  progreso: Map<string, Set<string>>;
  onGuardar: (input: { id: string; nombre: string; orden: number; imagen: string; clave: string }) => Promise<void>;
  onBorrar: (stand: Stand) => Promise<void>;
}

interface FormState {
  id: string;
  nombre: string;
  orden: string;
  imagen: string;
  clave: string;
}

const FORM_VACIO: FormState = { id: "", nombre: "", orden: "", imagen: "", clave: "" };

export function StandsTab({ stands, claves, progreso, onGuardar, onBorrar }: StandsTabProps) {
  const [form, setForm] = useState<FormState>(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  const entregadas = new Map<string, number>();
  for (const set of progreso.values()) for (const id of set) entregadas.set(id, (entregadas.get(id) || 0) + 1);

  function editar(s: Stand) {
    setForm({
      id: s.id,
      nombre: s.nombre,
      orden: String(s.orden),
      imagen: s.imagen || "",
      clave: claves.get(s.id) || "",
    });
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => nombreRef.current?.focus(), 0);
  }

  function limpiarForm() {
    setForm(FORM_VACIO);
    setError("");
  }

  async function manejarEnvio() {
    const nombre = form.nombre.trim();
    const orden = parseInt(form.orden, 10);
    const imagen = form.imagen.trim();
    const clave = normalizarClave(form.clave);
    setError("");

    if (!nombre) return setError("Escribí el nombre del juego.");
    if (!Number.isInteger(orden) || orden < 1) return setError("El número en el álbum tiene que ser 1 o más.");
    if (clave.length < 3 || clave.length > 30) return setError("La clave tiene que tener entre 3 y 30 letras o números.");

    setGuardando(true);
    try {
      await onGuardar({ id: form.id, nombre, orden, imagen, clave });
      limpiarForm();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el stand. Revisá la conexión y los permisos.");
    } finally {
      setGuardando(false);
    }
  }

  async function manejarBorrar(s: Stand) {
    if (!confirm(`¿Eliminar "${s.nombre}"? Deja de contar para completar el álbum.`)) return;
    try {
      await onBorrar(s);
      if (form.id === s.id) limpiarForm();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el stand.");
    }
  }

  return (
    <LightSurface>
      <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2.5, sm: 3 }, pb: 6 }}>
        <Paper
          ref={formRef}
          component="form"
        onSubmit={(e) => {
          e.preventDefault();
          manejarEnvio();
        }}
        noValidate
        sx={{ bgcolor: "var(--pagina)", color: "var(--tinta)", borderRadius: 4, p: 2.75, mb: 2.5 }}
      >
        <Typography variant="h2" sx={{ fontSize: "1.2rem", fontWeight: 800, mb: 1 }}>
          {form.id ? `Editar: ${form.nombre}` : "Agregar stand"}
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2.5 }}>
          <TextField
            inputRef={nombreRef}
            label="Nombre del juego"
            required
            fullWidth
            margin="normal"
            inputProps={{ maxLength: 60 }}
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
          <TextField
            label="Número en el álbum"
            type="number"
            required
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: 999 }}
            value={form.orden}
            onChange={(e) => setForm((f) => ({ ...f, orden: e.target.value }))}
          />
          <TextField
            label="Clave del stand"
            required
            fullWidth
            margin="normal"
            autoComplete="off"
            inputProps={{ maxLength: 30 }}
            helperText="Solo letras y números. No distingue mayúsculas."
            value={form.clave}
            onChange={(e) => setForm((f) => ({ ...f, clave: e.target.value }))}
          />
          <TextField
            label="Imagen de la figurita (opcional)"
            placeholder="figuritas/mi-juego.png"
            fullWidth
            margin="normal"
            inputProps={{ maxLength: 500 }}
            helperText="Ruta dentro de /public o URL. Sin imagen se genera una figurita con las iniciales."
            value={form.imagen}
            onChange={(e) => setForm((f) => ({ ...f, imagen: e.target.value }))}
          />
        </Box>
        {error && (
          <Typography role="alert" color="error" sx={{ fontWeight: 600, mt: 1 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1.25, justifyContent: "flex-end", flexWrap: "wrap", mt: 1.5 }}>
          {form.id && (
            <Button onClick={limpiarForm} color="inherit">
              Cancelar edición
            </Button>
          )}
          <Button type="submit" variant="contained" color="primary" disabled={guardando}>
            Guardar stand
          </Button>
        </Box>
      </Paper>

      <TableContainer sx={{ bgcolor: "var(--pagina)", borderRadius: 3.5 }}>
        <Table sx={{ color: "var(--tinta)" }}>
          <TableHead>
            <TableRow>
              <TableCell>N.º</TableCell>
              <TableCell>Juego</TableCell>
              <TableCell>Clave</TableCell>
              <TableCell>Figuritas entregadas</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {stands.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.orden}</TableCell>
                <TableCell>{s.nombre}</TableCell>
                <TableCell>
                  <Box component="code" sx={{ bgcolor: "rgba(30,24,70,.08)", px: 0.75, py: 0.25, borderRadius: 1 }}>
                    {claves.get(s.id) || "sin clave"}
                  </Box>
                </TableCell>
                <TableCell>{entregadas.get(s.id) || 0}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => editar(s)}>
                    Editar
                  </Button>
                  <Button size="small" color="error" onClick={() => manejarBorrar(s)}>
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
