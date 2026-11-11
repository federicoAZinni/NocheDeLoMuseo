import { useState, type FormEvent } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { ErrorAmigable } from "../../hooks/useAlbumSesion";
import { LightSurface } from "../LightSurface";

interface RegistrationFormProps {
  onRegistrar: (nombre: string, dni: string) => Promise<void>;
}

export function RegistrationForm({ onRegistrar }: RegistrationFormProps) {
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await onRegistrar(nombre, dni);
    } catch (err) {
      setError(err instanceof ErrorAmigable ? err.message : "No se pudo abrir el álbum. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LightSurface>
      <Paper
        component="form"
        onSubmit={manejarEnvio}
        noValidate
        sx={{
          maxWidth: 480,
          mx: "auto",
          mt: 1,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          bgcolor: "var(--pagina)",
          color: "var(--tinta)",
          boxShadow: "0 0 0 6px var(--noche-2)",
        }}
      >
        <Typography variant="h2" sx={{ fontSize: "1.35rem", fontWeight: 800, mb: 1 }}>
          Completá el álbum y entrá al sorteo
        </Typography>
        <Typography sx={{ mb: 1 }}>
          Jugá en cada stand. Cuando termines, la persona del stand te pega la figurita en el álbum. Con
          todas las figuritas participás del sorteo de premios.
        </Typography>
        <TextField
          id="nombre"
          label="Nombre y apellido"
          autoComplete="name"
          required
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 60 }}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <TextField
          id="dni"
          label="DNI"
          inputMode="numeric"
          autoComplete="off"
          required
          fullWidth
          margin="normal"
          placeholder="Sin puntos"
          inputProps={{ maxLength: 10 }}
          value={dni}
          onChange={(e) => setDni(e.target.value)}
        />
        {error && (
          <Typography role="alert" color="error" sx={{ fontWeight: 600, mt: 1 }}>
            {error}
          </Typography>
        )}
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={enviando} sx={{ mt: 2, py: 1.2 }}>
          {enviando ? "Abriendo…" : "Abrir mi álbum"}
        </Button>
        <Typography sx={{ fontSize: ".9rem", opacity: 0.8, mt: 2, mb: 0 }}>
          Tu álbum queda guardado en este celular y en este navegador. Volvé a entrar siempre desde acá.
        </Typography>
      </Paper>
    </LightSurface>
  );
}

export function AdminSessionNotice({ onSalir }: { onSalir: () => void }) {
  const [saliendo, setSaliendo] = useState(false);
  return (
    <LightSurface>
      <Paper
        sx={{
          maxWidth: 480,
          mx: "auto",
          mt: 1,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          bgcolor: "var(--pagina)",
          color: "var(--tinta)",
          boxShadow: "0 0 0 6px var(--noche-2)",
          textAlign: "center",
        }}
      >
        <Typography variant="h2" sx={{ fontSize: "1.35rem", fontWeight: 800, mb: 1 }}>
          Este navegador tiene la sesión de administración abierta
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Para usar el álbum como participante, cerrá la sesión de administración o abrí la página en otro
          navegador.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={saliendo}
          onClick={async () => {
            setSaliendo(true);
            await onSalir();
          }}
        >
          Cerrar sesión de administración
        </Button>
      </Paper>
    </LightSurface>
  );
}

export function PassportHeader() {
  return (
    <Box component="header" sx={{ textAlign: "center", pt: { xs: 3.5, sm: 4 }, pb: 2.5, px: 2.5 }}>
      <Typography sx={{ m: 0, color: "var(--lila)", fontSize: ".9rem" }}>Desarrollo de Videojuegos UTN</Typography>
      <Typography
        variant="h1"
        sx={{
          fontFamily: "var(--display)",
          fontWeight: 400,
          fontSize: "clamp(2.1rem, 10vw, 3.6rem)",
          lineHeight: 1,
          m: "0.2em 0 0.15em",
          color: "var(--oro)",
          textShadow: "3px 3px 0 var(--coral)",
        }}
      >
        Álbum de juegos
      </Typography>
      <Typography sx={{ m: 0, fontWeight: 600 }}>Noche de los Museos</Typography>
    </Box>
  );
}
