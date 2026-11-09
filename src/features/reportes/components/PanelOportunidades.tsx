import { cn } from "@/lib/utils";
import type { FilaDistrito, ReporteOportunidades } from "../api";
import { formatoSolesCorto } from "../utils/reportes";

const BADGES = {
  alta_demanda: { texto: "Alta demanda", clase: "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20" },
  gana_terreno: { texto: "Gana terreno", clase: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20" },
  oportunidad: { texto: "Oportunidad", clase: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20" },
} as const;

/** Oportunidades por distrito, calculadas en el backend con los umbrales del negocio. */
export function PanelOportunidades({ datos }: { datos: ReporteOportunidades | undefined }) {
  if (!datos) return <section className="text-sm text-slate-500">Cargando oportunidades…</section>;
  const { filas, conclusiones, ingreso_total } = datos;
  const oportunidades = filas.filter((f) => f.oportunidad).length;
  const ganan = filas.filter((f) => f.gana_terreno).length;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Oportunidades comerciales</h2>
        <p className="text-xs text-slate-500">Demanda, crecimiento y composición de clientes por distrito en el período.</p>
      </header>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        {oportunidades} {oportunidades === 1 ? "oportunidad" : "oportunidades"} · {ganan} ganan terreno · ingreso del período{" "}
        <strong className="text-slate-900 dark:text-white">{formatoSolesCorto(Number(ingreso_total))}</strong>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-label uppercase tracking-wider text-slate-500">
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="py-2 pr-3 font-semibold">Distrito</th>
              <th className="py-2 px-3 text-right font-semibold">Cremaciones</th>
              <th className="py-2 px-3 font-semibold">Particulares y veterinarias</th>
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
  const badges = (["alta_demanda", "gana_terreno", "oportunidad"] as const).filter((k) => fila[k]);
  const pctVet = fila.pct_veterinarias;
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
        <span className="block text-xs text-slate-500">Plan principal: {fila.plan_principal ?? "—"}</span>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">{fila.cremaciones}</td>
      <td className="py-2.5 px-3 min-w-[160px]">
        <div
          role="img"
          aria-label={`Particulares ${Math.round(100 - pctVet)}%, veterinarias ${Math.round(pctVet)}%`}
          className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--grid)]"
        >
          <div className="h-full" style={{ width: `${100 - pctVet}%`, background: "var(--serie-1)" }} />
          <div className="h-full" style={{ width: `${pctVet}%`, background: "var(--baseline)" }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-500 tabular-nums">
          <span>Particulares {Math.round(100 - pctVet)}%</span>
          <span>Veterinarias {Math.round(pctVet)}%</span>
        </div>
      </td>
      <td className="py-2.5 pl-3 text-right tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">{formatoSolesCorto(Number(fila.ingreso))}</td>
    </tr>
  );
}
