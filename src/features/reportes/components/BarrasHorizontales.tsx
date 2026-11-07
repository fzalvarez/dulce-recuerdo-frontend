import { cn } from "@/lib/utils";

export interface FilaRanking {
  id: string;
  etiqueta: string;
  valor: number;
  /** Destacada = top 5: color de la serie. El resto va en gris (de-énfasis). */
  destacada?: boolean;
}

/**
 * Ranking en barras horizontales. Barras de 12px con esquina redondeada al final,
 * valor a la derecha. El número de puesto va en tinta secundaria, no en color de serie.
 */
export function BarrasHorizontales({ filas, descripcion }: { filas: FilaRanking[]; descripcion: string }) {
  const max = Math.max(1, ...filas.map((f) => f.valor));

  return (
    <ul className="flex flex-col gap-3" aria-label={descripcion}>
      {filas.map((f, i) => (
        <li
          key={f.id}
          className="grid grid-cols-[minmax(0,18rem)_1fr_auto] items-center gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-[var(--ink-2)] w-6 shrink-0 tabular-nums">
              #{i + 1}
            </span>
            <span
              className={cn(
                "text-sm truncate",
                f.destacada ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
              )}
              title={f.etiqueta}
            >
              {f.etiqueta}
            </span>
          </div>

          <div className="h-3 rounded-full bg-[var(--grid)] overflow-hidden">
            <div
              className="h-full rounded-r-[4px]"
              style={{
                width: `${(f.valor / max) * 100}%`,
                background: f.destacada ? "var(--serie-1)" : "var(--baseline)",
              }}
            />
          </div>

          <span className="text-sm font-semibold text-[var(--ink)] tabular-nums w-10 text-right">
            {f.valor}
          </span>
        </li>
      ))}
    </ul>
  );
}
