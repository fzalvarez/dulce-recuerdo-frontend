import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface OpcionBoton<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  /** Texto pequeño bajo la etiqueta (por ejemplo, el stock). */
  detalle?: ReactNode;
  disabled?: boolean;
}

/**
 * Elección única con botones visibles: un clic en vez de abrir un Select y elegir.
 * Para listas cortas y fijas. Con `icon`, el botón muestra el ícono sobre la etiqueta.
 */
export function BotonesOpcion<T extends string>({
  value,
  onChange,
  opciones,
  ariaLabel,
  columnas,
  className,
}: {
  value: T | "";
  onChange: (v: T) => void;
  opciones: OpcionBoton<T>[];
  ariaLabel: string;
  /** Clases de grid, p. ej. "grid-cols-3". Sin esto, los botones se acomodan en fila. */
  columnas?: string;
  className?: string;
}) {
  const conIcono = opciones.some((o) => o.icon);
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn(columnas ? `grid gap-2 ${columnas}` : "flex flex-wrap gap-2", className)}>
      {opciones.map((o) => {
        const activo = o.value === value;
        const Icono = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={activo}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg border text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
              "disabled:cursor-not-allowed disabled:opacity-40",
              conIcono ? "flex flex-col items-center justify-center gap-1 px-2 py-2.5" : "px-3 py-1.5",
              activo
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"
            )}
          >
            {Icono && <Icono className="size-5" />}
            <span className={cn(conIcono && "text-xs leading-tight text-center")}>{o.label}</span>
            {o.detalle && <span className="text-[11px] font-normal text-slate-500 leading-none">{o.detalle}</span>}
          </button>
        );
      })}
    </div>
  );
}
