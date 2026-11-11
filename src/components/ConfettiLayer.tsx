import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Confeti } from "../lib/confetti";

const ConfettiContext = createContext<Confeti | null>(null);

export function ConfettiProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [confeti, setConfeti] = useState<Confeti | null>(null);

  useEffect(() => {
    if (canvasRef.current) setConfeti(new Confeti(canvasRef.current));
  }, []);

  return (
    <ConfettiContext.Provider value={confeti}>
      {children}
      <canvas
        ref={canvasRef}
        className="confeti-canvas"
        hidden
        aria-hidden="true"
      />
    </ConfettiContext.Provider>
  );
}

export function useConfeti(): Confeti | null {
  return useContext(ConfettiContext);
}
