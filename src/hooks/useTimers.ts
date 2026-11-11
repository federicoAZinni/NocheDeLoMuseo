import { useCallback, useEffect, useRef } from "react";

export function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const limpiar = useCallback(() => {
    timers.current.splice(0).forEach(clearTimeout);
  }, []);

  const despues = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => limpiar, [limpiar]);

  return { despues, limpiar };
}
