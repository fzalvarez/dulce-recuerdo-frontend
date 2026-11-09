import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/shared/lib/http-error";

export interface Recurso<T> {
  data: T | undefined;
  cargando: boolean;
  error: string | null;
  /** Vuelve a pedir los datos (después de crear, editar o borrar). */
  recargar: () => void;
}

/**
 * Carga datos de la API y los vuelve a pedir cuando cambian `deps` o se llama a `recargar`.
 * El estado solo se actualiza en la respuesta, nunca de forma síncrona dentro del efecto.
 */
export function useRecurso<T>(cargar: () => Promise<T>, deps: unknown[] = []): Recurso<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargarMemo = useCallback(cargar, deps);

  useEffect(() => {
    let vigente = true;
    cargarMemo()
      .then((d) => {
        if (!vigente) return;
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (vigente) setError(getApiErrorMessage(e, "No se pudieron cargar los datos."));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [cargarMemo, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { data, cargando: cargando && data === undefined, error, recargar };
}
