import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Filas por página en las listas del servidor. */
export const POR_PAGINA = 100;

/**
 * Pie de una lista paginada en el servidor: rango mostrado, total y Anterior / Siguiente.
 * `pagina` empieza en 0. El padre pide la página nueva al servidor en `onCambiar`.
 */
export function Paginador({
  total,
  pagina,
  onCambiar,
  porPagina = POR_PAGINA,
  className,
}: {
  total: number;
  pagina: number;
  onCambiar: (pagina: number) => void;
  porPagina?: number;
  className?: string;
}) {
  const ultima = Math.max(0, Math.ceil(total / porPagina) - 1);
  const primero = total ? pagina * porPagina + 1 : 0;
  const ultimo = Math.min((pagina + 1) * porPagina, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50 dark:bg-white/5 text-xs text-slate-500",
        className
      )}
    >
      <span>
        {total
          ? `Mostrando ${primero.toLocaleString("es-PE")}–${ultimo.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")}`
          : "Sin resultados"}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1" disabled={pagina === 0} onClick={() => onCambiar(pagina - 1)}>
          <ChevronLeftIcon className="size-4" />
          Anterior
        </Button>
        <span className="tabular-nums">
          Página {pagina + 1} de {ultima + 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={pagina >= ultima}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
