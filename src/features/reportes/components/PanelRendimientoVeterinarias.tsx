import { useMemo } from "react";
import type { CasoReportable, PlanId } from "../types";
import { calcularVeterinarias, type FilaVeterinaria } from "../utils/rendimientoVeterinarias";
import { formatoSolesCorto } from "../utils/oportunidades";

const PLAN_CORTO: Record<PlanId, string> = {
  clasico: "Clásico",
  paz: "Paz",
  eco: "Eco",
  "sin-clasificar": "Sin clasificar",
};

function signo(n: number): string {
  return `${n > 0 ? "+" : ""}${Math.round(n)}%`;
}

export function PanelRendimientoVeterinarias({
  casos,
  ventana,
  ventanaPrevia,
}: {
  casos: CasoReportable[];
  ventana: string[];
  ventanaPrevia: string[];
}) {
  const resultado = useMemo(
    () => calcularVeterinarias(casos, ventana, ventanaPrevia),
    [casos, ventana, ventanaPrevia]
  );
  const { filas, conclusiones, pctTop5, totalReferidos } = resultado;
  const caidas = filas.filter((f) => f.caida).length;
  const crecen = filas.filter((f) => f.crece).length;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Rendimiento de veterinarias</h2>
          <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Datos de maqueta
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Actividad, ingresos y planes de cada veterinaria aliada en el período.
        </p>
      </header>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        Las cinco principales concentran <strong className="text-slate-900 dark:text-white">{Math.round(pctTop5)}%</strong> de los
        referidos · {caidas} con caída · {crecen} con crecimiento
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[460px]">
          <thead className="text-label uppercase tracking-wider text-slate-500">
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="py-2 pr-3 font-semibold">Veterinaria</th>
              <th className="py-2 px-3 text-right font-semibold">Ingreso</th>
              <th className="py-2 pl-3 text-right font-semibold">% del ingreso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filas.map((f) => (
              <FilaTabla key={f.id} fila={f} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        {totalReferidos.toLocaleString("es-PE")} cremaciones referidas en el período. Ingreso según la tabla de planes, sin traslado.
      </p>

      <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-4">
        <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500 mb-2">Conclusiones</h3>
        <ul className="flex flex-col gap-3">
          {conclusiones.map((c) => (
            <li key={c.texto} className="text-sm text-slate-700 dark:text-slate-300">
              <p>{c.texto}</p>
              <p className="text-xs text-slate-500 mt-0.5">Dato: {c.dato}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FilaTabla({ fila }: { fila: FilaVeterinaria }) {
  return (
    <tr>
      <td className="py-2.5 pr-3 min-w-[200px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">{fila.nombre}</span>
          {fila.caida && fila.variacionPct !== null && (
            <span className="px-2 py-0.5 rounded-full border text-label font-semibold whitespace-nowrap bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20">
              Pierde actividad {signo(fila.variacionPct)}
            </span>
          )}
          {fila.crece && fila.variacionPct !== null && (
            <span className="px-2 py-0.5 rounded-full border text-label font-semibold whitespace-nowrap bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
              Crece {signo(fila.variacionPct)}
            </span>
          )}
        </div>
        <span className="block text-xs text-slate-500">
          Plan principal: {fila.planPrincipal ? PLAN_CORTO[fila.planPrincipal] : "—"}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">
        {formatoSolesCorto(fila.ingreso)}
      </td>
      <td className="py-2.5 pl-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
        {fila.pctIngreso.toLocaleString("es-PE", { maximumFractionDigits: 1 })}%
      </td>
    </tr>
  );
}
