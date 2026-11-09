import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CasoReportable, PlanId } from "../types";
import { calcularOportunidades, formatoSolesCorto, type FilaDistrito } from "../utils/oportunidades";

const PLAN_CORTO: Record<PlanId, string> = {
  clasico: "Clásico",
  paz: "Paz",
  eco: "Eco",
  "sin-clasificar": "Sin clasificar",
};

const BADGES = {
  altaDemanda: { texto: "Alta demanda", clase: "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20" },
  ganaTerreno: { texto: "Gana terreno", clase: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20" },
  oportunidad: { texto: "Oportunidad", clase: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20" },
} as const;

export function PanelOportunidades({
  casos,
  ventana,
  ventanaPrevia,
}: {
  casos: CasoReportable[];
  ventana: string[];
  ventanaPrevia: string[];
}) {
  const resultado = useMemo(() => calcularOportunidades(casos, ventana, ventanaPrevia), [casos, ventana, ventanaPrevia]);
  const { filas, conclusiones, ingresoTotal, cremacionesSinPrecio } = resultado;
  const oportunidades = filas.filter((f) => f.oportunidad).length;
  const ganan = filas.filter((f) => f.ganaTerreno).length;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Oportunidades comerciales</h2>
          <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Datos de maqueta
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Demanda, crecimiento y composición de clientes por distrito en el período.
        </p>
      </header>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        {oportunidades} {oportunidades === 1 ? "oportunidad" : "oportunidades"} · {ganan} ganan terreno · ingreso del
        período <strong className="text-slate-900 dark:text-white">{formatoSolesCorto(ingresoTotal)}</strong>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[440px]">
          <thead className="text-label uppercase tracking-wider text-slate-500">
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="py-2 pr-3 font-semibold">Distrito</th>
              <th className="py-2 px-3 text-right font-semibold">Cremaciones</th>
              <th className="py-2 px-3 text-right font-semibold">% de veterinarias</th>
              <th className="py-2 pl-3 text-right font-semibold">Ingreso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filas.map((f) => (
              <FilaTabla key={f.distrito} fila={f} />
            ))}
          </tbody>
        </table>
      </div>

      {cremacionesSinPrecio > 0 && (
        <p className="text-xs text-slate-500">
          {cremacionesSinPrecio} cremaciones sin plan clasificado no suman ingreso.
        </p>
      )}

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

function FilaTabla({ fila }: { fila: FilaDistrito }) {
  const badges = (["altaDemanda", "ganaTerreno", "oportunidad"] as const).filter((k) => fila[k]);
  const var_ = fila.variacionPct;

  return (
    <tr>
      <td className="py-2.5 pr-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">{fila.distrito}</span>
          {badges.map((k) => (
            <span key={k} className={cn("px-2 py-0.5 rounded-full border text-label font-semibold whitespace-nowrap", BADGES[k].clase)}>
              {BADGES[k].texto}
            </span>
          ))}
        </div>
        <span className="block text-xs text-slate-500">
          Plan principal: {fila.planPrincipal ? PLAN_CORTO[fila.planPrincipal] : "—"}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">
        <span className="block">{fila.cremaciones}</span>
        <span className="block text-[11px] text-slate-400">
          {var_ === null ? "sin período anterior" : `${var_ > 0 ? "+" : ""}${Math.round(var_)}% vs. período anterior`}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
        {Math.round(fila.pctVeterinarias)}%
      </td>
      <td className="py-2.5 pl-3 text-right tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">
        {formatoSolesCorto(fila.ingreso)}
      </td>
    </tr>
  );
}
