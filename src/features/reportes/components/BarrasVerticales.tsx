import { cn } from "@/lib/utils";
import { formatPct } from "../utils/reportes";

export interface SerieBarra {
  key: string;
  label: string;
  /** Valor CSS de la serie, ej. "var(--serie-1)". */
  color: string;
}

export interface GrupoBarra {
  etiqueta: string;
  parcial?: boolean;
  valores: Record<string, number>;
  /** Variación en %; null = sin base de comparación. Omitido = no se muestra. */
  variacion?: number | null;
  /** Dato bajo la etiqueta, ej. porcentaje del total. */
  subetiqueta?: string;
}

const ALTURA_BARRAS = 200;
const ALTURA_ETIQUETA = 22;

/**
 * Barras verticales agrupadas por mes. Valor encima de cada barra, mes debajo y la
 * variación al pie. Barras de 28px con esquina redondeada solo arriba; 2px de
 * separación entre barras del mismo mes. Con dos o más series hay leyenda.
 */
export function BarrasVerticales({
  grupos,
  series,
  descripcion,
  etiquetaVariacion,
}: {
  grupos: GrupoBarra[];
  series: SerieBarra[];
  descripcion: string;
  etiquetaVariacion: string;
}) {
  const max = Math.max(1, ...grupos.flatMap((g) => series.map((s) => g.valores[s.key] ?? 0)));
  const mostrarVariacion = grupos.some((g) => g.variacion !== undefined);

  return (
    <div className="flex flex-col gap-4">
      {series.length >= 2 && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Leyenda">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-x-auto pt-10 pb-1">
        <div
          role="img"
          aria-label={descripcion}
          className="flex w-full min-w-[640px]"
        >
          {grupos.map((g) => {
            const tooltip = `${g.etiqueta}: ${series
              .map((s) => `${s.label} ${g.valores[s.key] ?? 0}`)
              .join(" · ")}`;
            return (
              <div key={g.etiqueta} className="group relative flex flex-1 flex-col items-center px-2">
                {/* Tooltip al pasar el cursor */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-100 px-2 py-1 text-xs text-white dark:text-slate-900 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {tooltip}
                </div>

                {/* Barras: la base queda alineada en la línea inferior */}
                <div className="flex items-end gap-0.5 w-full justify-center border-b border-[var(--baseline)] pb-0">
                  {series.map((s) => {
                    const valor = g.valores[s.key] ?? 0;
                    const alto = Math.round((valor / max) * ALTURA_BARRAS);
                    return (
                      <div
                        key={s.key}
                        className="flex flex-col items-center justify-end"
                        style={{ height: ALTURA_BARRAS + ALTURA_ETIQUETA }}
                      >
                        <span className="text-xs font-semibold leading-none mb-1 text-[var(--ink)] tabular-nums">
                          {valor}
                        </span>
                        <div
                          className="w-7 rounded-t-[4px]"
                          style={{ height: alto, background: s.color }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-center text-xs leading-tight text-[var(--ink-2)]">
                  {g.etiqueta}
                  {g.parcial && (
                    <span className="block text-[10px] text-[var(--muted)]">parcial</span>
                  )}
                  {g.subetiqueta && (
                    <span className="block text-[11px] font-semibold text-[var(--ink)] tabular-nums">
                      {g.subetiqueta}
                    </span>
                  )}
                </div>

                {mostrarVariacion && (
                  <VariacionChip variacion={g.variacion ?? null} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {mostrarVariacion && (
        <p className="text-xs text-slate-500">
          Porcentaje debajo de cada mes: variación {etiquetaVariacion}.
        </p>
      )}
    </div>
  );
}

function VariacionChip({ variacion }: { variacion: number | null }) {
  if (variacion === null) {
    return <span className="mt-1 text-[11px] font-semibold text-[var(--muted)]">—</span>;
  }
  const sube = variacion >= 0;
  return (
    <span
      className={cn(
        "mt-1 text-[11px] font-semibold whitespace-nowrap",
        sube ? "text-[var(--up)]" : "text-[var(--down)]"
      )}
    >
      {sube ? "▲" : "▼"} {formatPct(variacion)}
    </span>
  );
}
