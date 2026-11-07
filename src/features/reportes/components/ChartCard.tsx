import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TablaDatosProps {
  columnas: string[];
  filas: (string | number)[][];
}

export function TablaDatos({ columnas, filas }: TablaDatosProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/10 text-label uppercase tracking-wider text-slate-500">
            {columnas.map((c, i) => (
              <th key={c} className={cn("py-2 px-3 font-semibold", i > 0 && "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {filas.map((fila, r) => (
            <tr key={r}>
              {fila.map((celda, i) => (
                <td
                  key={i}
                  className={cn(
                    "py-2 px-3 text-slate-800 dark:text-slate-200 tabular-nums",
                    i > 0 && "text-right"
                  )}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Contenedor de cada reporte: título, alternancia gráfico/tabla y nota al pie. */
export function ChartCard({
  titulo,
  subtitulo,
  tabla,
  nota,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  tabla: TablaDatosProps;
  nota?: ReactNode;
  children: ReactNode;
}) {
  const [vista, setVista] = useState<"grafico" | "tabla">("grafico");

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-5">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h2>
          {subtitulo && <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>}
        </div>
        <div className="flex rounded-lg bg-slate-100 dark:bg-white/5 p-0.5 text-xs font-semibold shrink-0 self-start">
          {(["grafico", "tabla"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vista === v}
              onClick={() => setVista(v)}
              className={cn(
                "px-3 py-1 rounded-md transition-colors",
                vista === v
                  ? "bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {v === "grafico" ? "Gráfico" : "Tabla"}
            </button>
          ))}
        </div>
      </header>

      {vista === "grafico" ? children : <TablaDatos {...tabla} />}

      {nota && <div className="text-xs text-slate-500">{nota}</div>}
    </section>
  );
}
