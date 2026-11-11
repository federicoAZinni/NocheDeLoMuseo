import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { normalizarClave, vibrar } from "../../lib/utils";
import { sonido } from "../../lib/sonido";
import { ErrorAmigable } from "../../hooks/useAlbumSesion";
import type { Stand } from "../../types";
import { LightSurface } from "../LightSurface";

const num2 = (i: number) => String(i + 1).padStart(2, "0");

interface ClaveDialogProps {
  abierto: boolean;
  stand: Stand | null;
  indice: number;
  onCancelar: () => void;
  onPegar: (standId: string, claveNormalizada: string) => Promise<void>;
}

export function ClaveDialog({
  abierto,
  stand,
  indice,
  onCancelar,
  onPegar,
}: ClaveDialogProps) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 0);
  }, [abierto]);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (!stand) return;
    sonido.preparar();
    const normalizada = normalizarClave(clave);
    setError("");
    setEnviando(true);
    try {
      await onPegar(stand.id, normalizada);
    } catch (err) {
      setError(
        err instanceof ErrorAmigable
          ? err.message
          : "No se pudo verificar la clave.",
      );
      vibrar([20, 60, 20]);
      inputRef.current?.select();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onClose={onCancelar} fullWidth maxWidth="xs">
      <LightSurface>
        <DialogTitle sx={{ pb: 0 }}>
          {stand && (
            <Typography
              sx={{
                fontFamily: "var(--display)",
                color: "var(--coral)",
                fontSize: "1rem",
                mb: 0.5,
              }}
            >
              Figurita {num2(indice)}: {stand?.nombre}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} color="primary">
            ingresá la clave para pegar la figurita.
          </Typography>
          <form id="form-clave" onSubmit={manejarEnvio}>
            <TextField
              inputRef={inputRef}
              label="Clave del stand"
              type="password"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              fullWidth
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              inputProps={{
                style: { letterSpacing: ".08em", fontSize: "1.2rem" },
              }}
            />
            {error && (
              <Typography
                role="alert"
                color="error"
                sx={{ fontWeight: 600, mt: 1 }}
              >
                {error}
              </Typography>
            )}
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onCancelar} color="primary">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-clave"
            variant="contained"
            color="primary"
            disabled={enviando}
          >
            {enviando ? "Verificando…" : "Pegar figurita"}
          </Button>
        </DialogActions>
      </LightSurface>
    </Dialog>
  );
}
