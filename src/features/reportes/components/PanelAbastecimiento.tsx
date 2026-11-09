import { cn } from "@/lib/utils";
import type { FilaInsumo, ReporteAbastecimiento } from "../api";

const ESTADO_BADGE: Record<Exclude<FilaInsumo["estado"], "OK">, { texto: string; clase: string }> = {
  CRITICO: { texto: "Crítico", clase: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20" },
  ATENCION: { texto: "Atención", clase: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20" },
};

function cantidad(n: number): string {
  return n.toLocaleString("es-PE", { maximumFractionDigits: 1 });
}

/** Cobertura de stock según el consumo real de inventario (spec reportes §4.3). */
export function PanelAbastecimiento({ datos }: { datos: ReporteAbastecimiento | undefined }) {
  if (!datos) return <section className="text-sm text-slate-500">Cargando abastecimiento…</section>;
  const enAlerta = datos.filas.filter((f) => f.estado !== "OK");
  const criticos = enAlerta.filter((f) => f.estado === "CRITICO").length;
  const okCount = datos.filas.length - enAlerta.length;
  const h = datos.horizonte_meses;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Abastecimiento</h2>
        <p className="text-xs text-slate-500">
          Stock frente al consumo de los próximos {h} meses, proyectado con las salidas reales de los últimos {datos.meses_tendencia} meses.
        </p>
      </header>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        {criticos} {criticos === 1 ? "artículo" : "artículos"} con cobertura menor que su entrega · {enAlerta.length - criticos} en atención
      </p>

      {enAlerta.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-label uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="py-2 pr-3 font-semibold">Artículo</th>
                <th className="py-2 px-3 text-right font-semibold">Stock</th>
                <th className="py-2 px-3 text-right font-semibold">Usa en {h} meses</th>
                <th className="py-2 px-3 text-right font-semibold">Cobertura (días)</th>
                <th className="py-2 pl-3 text-right font-semibold">Entrega (días)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {enAlerta.map((f) => {
                const badge = f.estado === "OK" ? null : ESTADO_BADGE[f.estado];
                return (
                  <tr key={f.articulo_id}>
                    <td className="py-2.5 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{f.nombre}</span>
                        {badge && <span className={cn("px-2 py-0.5 rounded-full border text-label font-semibold whitespace-nowrap", badge.clase)}>{badge.texto}</span>}
                      </div>
                      {f.proveedor && <span className="block text-xs text-slate-500">{f.proveedor}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{f.stock}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{cantidad(f.necesidad)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{f.cobertura_dias === null ? "—" : Math.floor(f.cobertura_dias)}</td>
                    <td className="py-2.5 pl-3 text-right tabular-nums">{f.dias_entrega ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {okCount > 0 && <p className="text-xs text-slate-500">{okCount} artículos con cobertura suficiente.</p>}

      <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-4">
        <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500 mb-2">Conclusiones</h3>
        <ul className="flex flex-col gap-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
          {datos.conclusiones.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
