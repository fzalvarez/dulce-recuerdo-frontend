import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CasoReportable, PlanId } from "../types";
import { DIAS_ALERTA, HORIZONTE_MESES } from "../data/abastecimiento.mock";
import {
  calcularAbastecimiento,
  conclusiones,
  type EstadoInsumo,
  fechaISO,
  formatoCantidad,
  formatoFechaCorta,
  type FilaInsumo,
  PLAN_CORTO,
  PLANES_CON_RECETA,
} from "../utils/abastecimiento";

const ESTADO_META: Record<EstadoInsumo, { texto: string; simbolo: string; clase: string }> = {
  critico: { texto: "Crítico", simbolo: "▲", clase: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" },
  atencion: { texto: "Atención", simbolo: "!", clase: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" },
  ok: { texto: "Stock OK", simbolo: "✓", clase: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
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
  const [filtro, setFiltro] = useState<PlanId | "todos">("todos");
  const hoy = useMemo(() => fechaISO(new Date()), []);

  const resultado = useMemo(
    () => calcularAbastecimiento({ casos, casosPeriodo, finClave, longitud, planFiltro: filtro, hoy }),
    [casos, casosPeriodo, finClave, longitud, filtro, hoy]
  );

  const { filas } = resultado;
  const enAlerta = filas.filter((f) => f.estado !== "ok").length;
  const pedirYa = filas.filter((f) => f.diasHastaPedir !== null && f.diasHastaPedir <= 0).length;
  const proxima = filas
    .filter((f) => f.fechaPedir && f.diasHastaPedir !== null && f.diasHastaPedir > 0 && f.estado !== "ok")
    .sort((a, b) => (a.fechaPedir ?? "").localeCompare(b.fechaPedir ?? ""))[0];

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Análisis de abastecimiento</h2>
          <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Datos de maqueta
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Consumo de insumos según las ventas del período, proyectado con la tendencia de los últimos 12 meses.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por plan">
          {(["todos", ...PLANES_CON_RECETA] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={filtro === p}
              onClick={() => setFiltro(p)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold border transition-colors",
                filtro === p
                  ? "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/12 dark:text-brand-400 dark:border-brand-500/30"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-gray-900 dark:text-slate-300 dark:border-white/10"
              )}
            >
              {p === "todos" ? "Todos los planes" : PLAN_CORTO[p]}
            </button>
          ))}
        </div>
      </header>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        <Dato etiqueta="Insumos en alerta" valor={String(enAlerta)} tono={enAlerta > 0 ? "warn" : "ok"} />
        <Dato etiqueta="Pedir ya" valor={String(pedirYa)} tono={pedirYa > 0 ? "critico" : "ok"} />
        <Dato
          etiqueta="Próximo pedido"
          valor={proxima?.fechaPedir ? formatoFechaCorta(proxima.fechaPedir) : "—"}
          detalle={proxima ? proxima.insumo.nombre : undefined}
        />
      </div>

      {/* Insumos */}
      <ul className="flex flex-col gap-3" aria-label="Insumos">
        {filas.map((f) => (
          <FilaInsumoCard key={f.insumo.id} fila={f} mostrarPlanes={filtro === "todos"} />
        ))}
      </ul>

      {/* Conclusiones */}
      <div className="rounded-lg border border-slate-200 dark:border-white/10 p-4 flex flex-col gap-2">
        <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500">Conclusiones</h3>
        <ul className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
          {conclusiones(resultado).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-400">
        Supuestos de maqueta: recetas por variante, stock y tiempos de entrega ficticios. Proyección a {HORIZONTE_MESES}{" "}
        meses con tendencia lineal por plan. La alerta aparece con {DIAS_ALERTA} días o menos para pedir.
      </p>
    </section>
  );
}

function Dato({
  etiqueta,
  valor,
  detalle,
  tono = "neutro",
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  tono?: "ok" | "warn" | "critico" | "neutro";
}) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-3 min-w-0">
      <p className="text-label font-semibold uppercase tracking-wider text-slate-500 truncate">{etiqueta}</p>
      <p
        className={cn(
          "text-lg font-bold mt-0.5 truncate",
          tono === "critico" && "text-red-600 dark:text-red-400",
          tono === "warn" && "text-amber-700 dark:text-amber-400",
          tono === "ok" && "text-emerald-700 dark:text-emerald-400",
          tono === "neutro" && "text-slate-900 dark:text-white"
        )}
      >
        {valor}
      </p>
      {detalle && <p className="text-xs text-slate-500 truncate">{detalle}</p>}
    </div>
  );
}

function FilaInsumoCard({ fila, mostrarPlanes }: { fila: FilaInsumo; mostrarPlanes: boolean }) {
  const { insumo, estado, necesidadHorizonte, consumoMesProyectado, coberturaDias, comprar, fechaPedir, porPlan } = fila;
  const meta = ESTADO_META[estado];
  const max = Math.max(insumo.stock, necesidadHorizonte, 1);
  const faltante = necesidadHorizonte > insumo.stock;

  const urgente = fila.diasHastaPedir !== null && fila.diasHastaPedir <= 0;
  const textoAccion =
    comprar === 0
      ? "Stock suficiente para el horizonte."
      : estado === "ok"
        ? `Próxima compra: ${comprar} ${insumo.unidad} antes del ${formatoFechaCorta(fechaPedir ?? "")}`
        : `Comprar ${comprar} ${insumo.unidad} · ${urgente ? "pedir hoy" : `pedir antes del ${formatoFechaCorta(fechaPedir ?? "")}`}`;

  const planesOrdenados = (Object.entries(porPlan) as [PlanId, number][])
    .filter(([, q]) => q > 0)
    .sort((a, b) => b[1] - a[1]);
  const totalConsumo = planesOrdenados.reduce((acc, [, q]) => acc + q, 0);

  return (
    <li className="rounded-lg border border-slate-200 dark:border-white/10 p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{insumo.nombre}</p>
          <p className="text-xs text-slate-500 truncate">
            {insumo.proveedor} · entrega {insumo.leadTimeDias} días
          </p>
        </div>
        <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold whitespace-nowrap", meta.clase)}>
          <span aria-hidden>{meta.simbolo} </span>
          {meta.texto}
        </span>
      </div>

      {/* Stock frente a lo que se necesitará en el horizonte */}
      <div className="flex flex-col gap-1.5">
        <Barra
          etiqueta="Stock"
          valor={insumo.stock}
          unidad={insumo.unidad}
          max={max}
          color="var(--serie-1)"
        />
        <Barra
          etiqueta={`Necesidad ${HORIZONTE_MESES} meses`}
          valor={necesidadHorizonte}
          unidad={insumo.unidad}
          max={max}
          color={faltante ? "var(--down)" : "var(--baseline)"}
        />
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">
        Consumo proyectado: <strong>{formatoCantidad(consumoMesProyectado)} {insumo.unidad}/mes</strong>
        {coberturaDias !== null && (
          <>
            {" "}· cobertura: <strong>{Math.round(coberturaDias)} días</strong>
          </>
        )}
        {mostrarPlanes && totalConsumo > 0 && planesOrdenados.length > 0 && (
          <>
            {" "}· principal: {PLAN_CORTO[planesOrdenados[0][0]]} ({Math.round((planesOrdenados[0][1] / totalConsumo) * 100)}%)
          </>
        )}
      </p>

      <p className={cn("text-sm font-semibold", comprar > 0 ? "text-slate-900 dark:text-white" : "text-emerald-700 dark:text-emerald-400")}>
        {textoAccion}
      </p>
    </li>
  );
}

function Barra({
  etiqueta,
  valor,
  unidad,
  max,
  color,
}: {
  etiqueta: string;
  valor: number;
  unidad: string;
  max: number;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-2">
      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{etiqueta}</span>
      <div className="h-3 rounded-full bg-[var(--grid)] overflow-hidden">
        <div className="h-full rounded-r-[4px]" style={{ width: `${(valor / max) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
        {formatoCantidad(valor)} {unidad}
      </span>
    </div>
  );
}
