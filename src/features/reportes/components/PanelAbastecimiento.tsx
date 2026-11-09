import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CasoReportable } from "../types";
import { HORIZONTE_MESES } from "../data/abastecimiento.mock";
import {
  calcularAbastecimiento,
  conclusiones,
  type EstadoInsumo,
  fechaISO,
  formatoCantidad,
  formatoFechaCorta,
  type FilaInsumo,
} from "../utils/abastecimiento";

const ESTADO_TEXTO: Record<EstadoInsumo, string> = {
  critico: "Crítico",
  atencion: "Atención",
  ok: "OK",
};

const ESTADO_COLOR: Record<EstadoInsumo, string> = {
  critico: "text-red-600 dark:text-red-400",
  atencion: "text-amber-700 dark:text-amber-400",
  ok: "text-slate-500 dark:text-slate-400",
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
  const hoy = useMemo(() => fechaISO(new Date()), []);
  const resultado = useMemo(
    () => calcularAbastecimiento({ casos, casosPeriodo, finClave, longitud, hoy }),
    [casos, casosPeriodo, finClave, longitud, hoy]
  );
  const { filas } = resultado;
  const enAlerta = filas.filter((f) => f.estado !== "ok");
  const okCount = filas.length - enAlerta.length;
  const pedirYa = enAlerta.filter((f) => f.pedirYa).length;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Abastecimiento</h2>
          <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Datos de maqueta
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Stock frente a lo que se usará en los próximos {HORIZONTE_MESES} meses, según la tendencia de ventas.
        </p>
      </header>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        <strong className={cn(pedirYa > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white")}>
          {pedirYa} {pedirYa === 1 ? "insumo" : "insumos"} para pedir hoy
        </strong>
        {" · "}
        {enAlerta.length} en alerta
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[480px]">
          <thead className="text-label uppercase tracking-wider text-slate-500">
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="py-2 pr-3 font-semibold">Insumo</th>
              <th className="py-2 px-3 text-right font-semibold">Stock</th>
              <th className="py-2 px-3 text-right font-semibold">Usa en {HORIZONTE_MESES} meses</th>
              <th className="py-2 px-3 text-right font-semibold">Cobertura</th>
              <th className="py-2 pl-3 font-semibold">Acción</th>
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
        <p className="text-xs text-slate-500">{okCount} insumos con stock suficiente para el período.</p>
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

function FilaTabla({ fila }: { fila: FilaInsumo }) {
  const { insumo, estado, necesidad, coberturaDias, comprar, fechaPedir, pedirYa } = fila;
  const sinConsumo = coberturaDias === null;

  let accion = "Sin compra";
  if (comprar > 0) {
    accion = pedirYa
      ? `Pedir ${comprar} ${insumo.unidad} hoy`
      : `Pedir ${comprar} ${insumo.unidad} antes del ${formatoFechaCorta(fechaPedir ?? "")}`;
  }

  return (
    <tr>
      <td className="py-2.5 pr-3">
        <span className="block font-semibold text-slate-900 dark:text-white">{insumo.nombre}</span>
        <span className={cn("text-xs font-semibold", ESTADO_COLOR[estado])}>{ESTADO_TEXTO[estado]}</span>
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">
        {formatoCantidad(insumo.stock)} {insumo.unidad}
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
        {formatoCantidad(necesidad)} {insumo.unidad}
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
        {sinConsumo ? "—" : `${Math.round(coberturaDias)} días`}
      </td>
      <td
        className={cn(
          "py-2.5 pl-3 font-semibold",
          pedirYa ? "text-red-600 dark:text-red-400" : comprar > 0 ? "text-slate-900 dark:text-white" : "text-slate-400"
        )}
      >
        {accion}
      </td>
    </tr>
  );
}
