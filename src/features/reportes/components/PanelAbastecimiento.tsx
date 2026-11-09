import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CasoReportable } from "../types";
import { HORIZONTE_MESES } from "../data/abastecimiento.mock";
import { calcularAbastecimiento, conclusiones, type EstadoInsumo, formatoCantidad, type FilaInsumo } from "../utils/abastecimiento";

const ESTADO_BADGE: Record<Exclude<EstadoInsumo, "ok">, { texto: string; clase: string }> = {
  critico: {
    texto: "Crítico",
    clase: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
  },
  atencion: {
    texto: "Atención",
    clase: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  },
};

export function PanelAbastecimiento({
  casos,
  casosPeriodo,
  finClave,
  longitud,
}: {
  casos: CasoReportable[];
  casosPeriodo: CasoReportable[];
  finClave: string;
  longitud: number;
}) {
  const resultado = useMemo(
    () => calcularAbastecimiento({ casos, casosPeriodo, finClave, longitud }),
    [casos, casosPeriodo, finClave, longitud]
  );
  const { filas } = resultado;
  const enAlerta = filas.filter((f) => f.estado !== "ok");
  const criticos = enAlerta.filter((f) => f.estado === "critico").length;
  const atencion = enAlerta.length - criticos;
  const okCount = filas.length - enAlerta.length;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Abastecimiento</h2>
          <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Datos de maqueta
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Stock frente a lo que se usará en los próximos {HORIZONTE_MESES} meses, según la tendencia de ventas.
        </p>
      </header>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        {criticos} {criticos === 1 ? "insumo" : "insumos"} con cobertura menor que su entrega · {atencion} en atención
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[460px]">
          <thead className="text-label uppercase tracking-wider text-slate-500">
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="py-2 pr-3 font-semibold">Insumo</th>
              <th className="py-2 px-3 text-right font-semibold">Stock</th>
              <th className="py-2 px-3 text-right font-semibold">Usa en {HORIZONTE_MESES} meses</th>
              <th className="py-2 px-3 text-right font-semibold">Cobertura</th>
              <th className="py-2 pl-3 text-right font-semibold">Entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {enAlerta.map((f) => (
              <FilaTabla key={f.insumo.id} fila={f} />
            ))}
          </tbody>
        </table>
      </div>

      {okCount > 0 && (
        <p className="text-xs text-slate-500">{okCount} insumos con cobertura suficiente para el período.</p>
      )}

      <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-4">
        <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500 mb-2">Conclusiones</h3>
        <ul className="flex flex-col gap-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
          {conclusiones(resultado).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Cantidad con unidad solo cuando no es "u". */
function cantidad(valor: number, unidad: string): string {
  return unidad === "u" ? formatoCantidad(valor) : `${formatoCantidad(valor)} ${unidad}`;
}

function FilaTabla({ fila }: { fila: FilaInsumo }) {
  const { insumo, estado, necesidad, coberturaDias } = fila;
  const badge = estado === "ok" ? null : ESTADO_BADGE[estado];

  return (
    <tr>
      <td className="py-2.5 pr-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">{insumo.nombre}</span>
          {badge && (
            <span className={cn("px-2 py-0.5 rounded-full border text-label font-semibold whitespace-nowrap", badge.clase)}>
              {badge.texto}
            </span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">
        {cantidad(insumo.stock, insumo.unidad)}
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
        {cantidad(necesidad, insumo.unidad)}
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">
        <span className="block">{coberturaDias === null ? "—" : Math.floor(coberturaDias)}</span>
        {coberturaDias !== null && <span className="block text-[11px] text-slate-400">(días)</span>}
      </td>
      <td className="py-2.5 pl-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
        <span className="block">{insumo.leadTimeDias}</span>
        <span className="block text-[11px] text-slate-400">(días)</span>
      </td>
    </tr>
  );
}
