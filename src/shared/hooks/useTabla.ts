import { useState } from "react";

export type Direccion = "asc" | "desc";
export type Valor = string | number | boolean | null | undefined;

export const TAMANOS_PAGINA = [50, 100, 200] as const;
export type TamanoPagina = (typeof TAMANOS_PAGINA)[number];

const comparar = (a: Valor, b: Valor) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });

/**
 * Orden por columna y paginación en el navegador (50/100/200 filas).
 * `columnas` dice cómo leer el valor de cada columna ordenable. Sin columna elegida, las filas
 * quedan en el orden en que llegan. Los vacíos van siempre al final.
 */
export function useTabla<T, K extends string>(filas: T[], columnas: Record<K, (fila: T) => Valor>) {
  const [orden, setOrden] = useState<{ columna: K; direccion: Direccion } | null>(null);
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamanoState] = useState<TamanoPagina>(50);

  let ordenadas = filas;
  if (orden) {
    const leer = columnas[orden.columna];
    const signo = orden.direccion === "asc" ? 1 : -1;
    ordenadas = [...filas].sort((x, y) => {
      const a = leer(x);
      const b = leer(y);
      const vacioA = a === null || a === undefined || a === "";
      const vacioB = b === null || b === undefined || b === "";
      if (vacioA || vacioB) return vacioA === vacioB ? 0 : vacioA ? 1 : -1;
      return comparar(a, b) * signo;
    });
  }

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / tamano));
  const actual = Math.min(pagina, totalPaginas); // si un filtro reduce las filas, no quedar en una página vacía
  const visibles = ordenadas.slice((actual - 1) * tamano, actual * tamano);

  /** asc → desc → sin orden. */
  const alternar = (columna: K) => {
    setOrden((o) => (o?.columna !== columna ? { columna, direccion: "asc" } : o.direccion === "asc" ? { columna, direccion: "desc" } : null));
    setPagina(1);
  };

  return {
    visibles,
    orden,
    alternar,
    pagina: actual,
    totalPaginas,
    setPagina,
    tamano,
    setTamano: (t: TamanoPagina) => {
      setTamanoState(t);
      setPagina(1);
    },
    total: ordenadas.length,
  };
}
