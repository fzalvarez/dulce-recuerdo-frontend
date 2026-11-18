import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TAMANOS_PAGINA, type Direccion, type TamanoPagina } from "@/shared/hooks/useTabla";

/** Encabezado que ordena al hacer clic: ascendente, descendente y sin orden. */
export function ColumnaOrdenable({
  children,
  activa,
  direccion,
  onClick,
  className,
}: {
  children: ReactNode;
  activa: boolean;
  direccion?: Direccion;
  onClick: () => void;
  className?: string;
}) {
  const Icono = !activa ? ArrowUpDownIcon : direccion === "asc" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <th className={cn("px-4 py-3 font-semibold", className)} aria-sort={activa ? (direccion === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-800", activa && "text-brand-600")}>
        {children}
        <Icono className={cn("size-3.5", !activa && "opacity-40")} />
      </button>
    </th>
  );
}

/** Pie de tabla: cuántas filas se ven, filas por página (50/100/200) y cambio de página. */
export function Paginacion({
  pagina,
  totalPaginas,
  total,
  tamano,
  onPagina,
  onTamano,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamano: TamanoPagina;
  onPagina: (p: number) => void;
  onTamano: (t: TamanoPagina) => void;
}) {
  const desde = total === 0 ? 0 : (pagina - 1) * tamano + 1;
  const hasta = Math.min(pagina * tamano, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600">
      <span>
        {desde}–{hasta} de {total}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="mr-1">Filas por página</span>
          {TAMANOS_PAGINA.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTamano(t)}
              className={cn("rounded px-2 py-0.5 font-medium", t === tamano ? "bg-brand-50 text-brand-700" : "hover:bg-slate-100")}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)} title="Anterior">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span>
            {pagina} / {totalPaginas}
          </span>
          <Button variant="ghost" size="icon-sm" disabled={pagina >= totalPaginas} onClick={() => onPagina(pagina + 1)} title="Siguiente">
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
