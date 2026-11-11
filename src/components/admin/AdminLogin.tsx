import { useState, type FormEvent } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, ADMIN_EMAIL } from "../../firebase";
import { LightSurface } from "../LightSurface";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setError("Esta cuenta no tiene permisos de administración.");
      }
    } catch (err) {
      console.error(err);
      setError("Email o contraseña incorrectos.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2.5 }}>
      <LightSurface>
        <Paper
          component="form"
          onSubmit={manejarEnvio}
          noValidate
          sx={{ width: "min(400px, 100%)", bgcolor: "var(--pagina)", color: "var(--tinta)", borderRadius: 4, p: 3.5 }}
        >
          <Typography variant="h1" sx={{ fontFamily: "var(--display)", fontWeight: 400, fontSize: "1.6rem", mb: 1 }}>
            Panel del sorteo
          </Typography>
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            required
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography role="alert" color="error" sx={{ fontWeight: 600, mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={enviando} sx={{ mt: 2, py: 1.1 }}>
            Entrar
          </Button>
        </Paper>
      </LightSurface>
    </Box>
  );
}
