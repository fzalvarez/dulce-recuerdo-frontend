import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { soles } from "@/features/casos/utils/casos";
import * as R from "../api";
import { ChartCard } from "../components/ChartCard";
import { BarrasVerticales, type GrupoBarra, type SerieBarra } from "../components/BarrasVerticales";
import { BarrasHorizontales, type FilaRanking } from "../components/BarrasHorizontales";
import { PanelAbastecimiento } from "../components/PanelAbastecimiento";
import { PanelOportunidades } from "../components/PanelOportunidades";
import { PanelRendimientoVeterinarias } from "../components/PanelRendimientoVeterinarias";
import {
  claveMes,
  desplazarMes,
  etiquetaMesCorta,
  etiquetaMesLarga,
  formatPct,
  formatPorcentaje,
  mesesEntre,
  PRIMER_MES_HISTORICO,
} from "../utils/reportes";
import { anualizarCremaciones, anualizarIngresos } from "../utils/anual";
import "../reportes.css";

type ReporteKey =
  | "mensual"
  | "ingresos"
  | "interanual"
  | "particulares"
  | "veterinarias"
  | "top-veterinarias"
  | "distritos"
  | "planes"
  | "peso";

const REPORTES: { key: ReporteKey; slug: string; label: string }[] = [
  { key: "mensual", slug: "cremaciones-mes", label: "Cremaciones por mes" },
  { key: "ingresos", slug: "ingresos-mes", label: "Ingresos por mes" },
  { key: "interanual", slug: "vs-anio-anterior", label: "Vs. año anterior" },
  { key: "particulares", slug: "particulares", label: "Particulares" },
  { key: "veterinarias", slug: "veterinarias-aliadas", label: "Veterinarias aliadas" },
  { key: "top-veterinarias", slug: "top-veterinarias", label: "Top 5 veterinarias" },
  { key: "distritos", slug: "distritos", label: "Distritos" },
  { key: "planes", slug: "planes-vendidos", label: "Planes vendidos" },
  { key: "peso", slug: "peso-mascota", label: "Peso de la mascota" },
];

type Vista = "mes" | "anio";
const ORIGENES: { valor: R.Origen; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos los casos" },
  { valor: "sistema", etiqueta: "Solo sistema" },
  { valor: "historico", etiqueta: "Solo histórico 2024–2025" },
];
/** Con más meses que estos, el periodo se ve por año (el usuario puede cambiarlo). */
const MAX_MESES_POR_MES = 18;

const SERIE_PERIODO: SerieBarra = { key: "periodo", label: "Mes del período", color: "var(--serie-1)" };
const SERIE_ANTERIOR: SerieBarra = { key: "anterior", label: "Mismo mes, año anterior", color: "var(--serie-2)" };

const MES_EN_CURSO = claveMes(new Date());
const ULTIMO_CERRADO = desplazarMes(MES_EN_CURSO, -1);
/** Meses que se pueden elegir: del primer mes del histórico al mes en curso. */
const MESES_ELEGIBLES = mesesEntre(PRIMER_MES_HISTORICO, MES_EN_CURSO);
const PRESETS: { key: string; label: string; desde: string; hasta: string }[] = [
  { key: "ultimos-6", label: "Últimos 6 meses", desde: desplazarMes(ULTIMO_CERRADO, -5), hasta: ULTIMO_CERRADO },
  { key: "ultimos-12", label: "Últimos 12 meses", desde: desplazarMes(ULTIMO_CERRADO, -11), hasta: ULTIMO_CERRADO },
  { key: "anio-2024", label: "Año 2024", desde: "2024-01", hasta: "2024-12" },
  { key: "anio-2025", label: "Año 2025", desde: "2025-01", hasta: "2025-12" },
  { key: "2024-2025", label: "2024–2025", desde: "2024-01", hasta: "2025-12" },
  { key: "todo", label: "Todo el histórico", desde: PRIMER_MES_HISTORICO, hasta: ULTIMO_CERRADO },
];

function fechaDeCorte(): string {
  return new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long" });
}

/** Reportes calculados en el backend con datos reales (spec reportes). */
export default function ReportesPage() {
  const [desde, setDesde] = useState(() => desplazarMes(ULTIMO_CERRADO, -5));
  const [hasta, setHasta] = useState(ULTIMO_CERRADO);
  const [origen, setOrigen] = useState<R.Origen>("todos");
  const [vistaElegida, setVistaElegida] = useState<Vista | null>(null);
  const { reporte: slug } = useParams();
  const reporte: ReporteKey = REPORTES.find((r) => r.slug === slug)?.key ?? "mensual";
  const numMeses = mesesEntre(desde, hasta).length;
  const vista: Vista = vistaElegida ?? (numMeses > MAX_MESES_POR_MES ? "anio" : "mes");
  const esAnio = vista === "anio";
  const rango: R.Rango = { desde, hasta, origen };
  const clave = `${desde}|${hasta}|${origen}`;

  const crem = useRecurso(() => R.cremaciones(rango), [clave]);
  const usaIngresos = reporte === "ingresos";
  const usaComposicion = ["top-veterinarias", "distritos", "planes", "peso"].includes(reporte);
  const ing = useRecurso(() => (usaIngresos ? R.ingresos(rango) : Promise.resolve(undefined)), [clave, usaIngresos]);
  const comp = useRecurso(() => (usaComposicion ? R.composicion(rango) : Promise.resolve(undefined)), [clave, usaComposicion]);
  const vets = useRecurso(() => (reporte === "top-veterinarias" ? R.veterinarias(rango) : Promise.resolve(undefined)), [clave, reporte]);
  const opor = useRecurso(() => (reporte === "distritos" ? R.oportunidades(rango) : Promise.resolve(undefined)), [clave, reporte]);
  const abas = useRecurso(() => (reporte === "planes" ? R.abastecimiento(hasta) : Promise.resolve(undefined)), [hasta, reporte]);

  const c = crem.data;
  const meses = useMemo(() => (c ? (esAnio ? anualizarCremaciones(c.meses) : c.meses) : []), [c, esAnio]);
  const ingresosVista = useMemo(() => {
    const filas = ing.data?.meses ?? [];
    return esAnio ? anualizarIngresos(filas) : filas;
  }, [ing.data, esAnio]);
  const colMes = esAnio ? "Año" : "Mes";
  const colPeriodo = esAnio ? "Año del período" : "Mes del período";
  const colAnterior = esAnio ? "Año anterior" : "Mismo mes, año anterior";
  const serieActual: SerieBarra = { ...SERIE_PERIODO, label: colPeriodo };
  const serieAnterior: SerieBarra = { ...SERIE_ANTERIOR, label: colAnterior };
  const periodoLabel = `${etiquetaMesLarga(desde)} – ${etiquetaMesLarga(hasta)}`;
  const incluyeParcial = !!c?.periodo.incluye_mes_en_curso;
  const totalPeriodo = c?.total ?? 0;
  const totalPrevio = c?.total_previo ?? 0;
  const variacionPeriodo = c?.variacion ?? null;
  const error = crem.error ?? ing.error ?? comp.error ?? vets.error ?? opor.error ?? abas.error;

  const notaParcial = incluyeParcial ? (
    <span className="text-amber-700 dark:text-amber-400">
      {etiquetaMesLarga(MES_EN_CURSO)} es un mes parcial: datos hasta el {fechaDeCorte()}. Sus variaciones no
      se comparan con meses completos.
    </span>
  ) : null;

  // Reporte 1: variación contra el mes anterior (en la vista anual, contra el año anterior).
  const grupos1: GrupoBarra[] = meses.map((m) => ({
    etiqueta: etiquetaMesCorta(m.mes),
    parcial: m.parcial,
    valores: { total: m.total },
    variacion: esAnio ? m.variacion_interanual : m.variacion_mes_anterior,
  }));

  // Reportes 2, 3 y 4: mes contra el mismo mes del año anterior.
  const interanual = (actual: (m: R.MesCremaciones) => number, previo: (m: R.MesCremaciones) => number, v: (m: R.MesCremaciones) => number | null): GrupoBarra[] =>
    meses.map((m) => ({
      etiqueta: etiquetaMesCorta(m.mes),
      parcial: m.parcial,
      valores: { periodo: actual(m), anterior: previo(m) },
      variacion: v(m),
    }));
  const grupos2 = interanual((m) => m.total, (m) => m.total_anio_anterior, (m) => m.variacion_interanual);
  const grupos3 = interanual((m) => m.particulares, (m) => m.particulares_anio_anterior, (m) => m.variacion_interanual_particulares);
  const grupos4 = interanual((m) => m.veterinarias, (m) => m.veterinarias_anio_anterior, (m) => m.variacion_interanual_veterinarias);

  const filasIngresos = ingresosVista.map((f) => ({
    clave: f.mes,
    etiqueta: etiquetaMesCorta(f.mes),
    parcial: f.parcial,
    cremaciones: f.cremaciones,
    ingreso: Number(f.ingreso),
    cobrado: Number(f.cobrado),
    precioPromedio: f.precio_promedio === null ? null : Number(f.precio_promedio),
  }));

  const k = comp.data;
  const totalCasos = k?.total ?? 0;
  const totalReferidos = k?.total_referidos ?? 0;
  const top5Vets = (k?.veterinarias ?? []).slice(0, 5);
  const rankingDistritos = k?.distritos ?? [];
  const rankingPlanes = k?.planes ?? [];
  const presenciales = k?.presenciales ?? 0;
  const conEutanasia = k?.con_eutanasia ?? 0;

  const filasTop5: FilaRanking[] = top5Vets.map((r) => ({ id: r.id, etiqueta: r.nombre, valor: r.cremaciones, destacada: true, detalle: formatPorcentaje(r.porcentaje) }));
  const filasDistritos: FilaRanking[] = rankingDistritos.map((d, i) => ({ id: d.id, etiqueta: d.nombre, valor: d.cremaciones, destacada: i < 5, detalle: formatPorcentaje(d.porcentaje) }));
  const filasPlanes: FilaRanking[] = rankingPlanes.map((p) => ({ id: p.id, etiqueta: p.nombre, valor: p.cremaciones, destacada: p.nombre !== "Sin plan", detalle: formatPorcentaje(p.porcentaje) }));
  const gruposPeso: GrupoBarra[] = (k?.pesos ?? []).map((r) => ({ etiqueta: r.etiqueta, valores: { total: r.cremaciones }, subetiqueta: formatPorcentaje(r.porcentaje) }));

  return (
    <div className="reportes-root flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Reportes" }, { label: "Revisión de la empresa" }]} />

      <ModuleHeader
        title="Reportes"
        description="Revisión de la empresa: cremaciones, canales, veterinarias, distritos, planes y peso."
      />

      {/* Filtros: periodo (rápido o libre), origen de los casos y vista, en un solo bloque */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 mr-1">Periodo rápido:</span>
          {PRESETS.map((p) => {
            const activo = p.desde === desde && p.hasta === hasta;
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={activo}
                onClick={() => {
                  setDesde(p.desde);
                  setHasta(p.hasta);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activo
                    ? "bg-brand-500 text-white shadow-sm font-semibold"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="filtro-desde" className="whitespace-nowrap">Desde:</Label>
              <Select value={desde} onValueChange={setDesde}>
                <SelectTrigger id="filtro-desde" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES_ELEGIBLES.filter((m) => m <= hasta).map((m) => (
                    <SelectItem key={m} value={m}>
                      {etiquetaMesLarga(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filtro-hasta" className="whitespace-nowrap">Hasta:</Label>
              <Select value={hasta} onValueChange={setHasta}>
                <SelectTrigger id="filtro-hasta" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES_ELEGIBLES.filter((m) => m >= desde).map((m) => (
                    <SelectItem key={m} value={m}>
                      {etiquetaMesLarga(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filtro-origen" className="whitespace-nowrap">Casos:</Label>
              <Select value={origen} onValueChange={(v) => setOrigen(v as R.Origen)}>
                <SelectTrigger id="filtro-origen" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENES.map((o) => (
                    <SelectItem key={o.valor} value={o.valor}>
                      {o.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Ver por:</span>
            <div role="group" aria-label="Ver por mes o por año" className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
              {(["mes", "anio"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vista === v}
                  onClick={() => setVistaElegida(v)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors",
                    vista === v ? "bg-brand-500 text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  )}
                >
                  {v === "mes" ? "Mes" : "Año"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <span className="text-sm text-slate-500">{periodoLabel}</span>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Resumen del período */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Resumen
          label="Cremaciones del período"
          valor={totalPeriodo.toLocaleString("es-PE")}
          hint={incluyeParcial ? "Incluye un mes parcial" : `${numMeses} meses`}
        />
        <Resumen
          label="Promedio mensual"
          valor={(c?.promedio_mensual ?? 0).toLocaleString("es-PE", { maximumFractionDigits: 1 })}
          hint="Cremaciones por mes"
        />
        <Resumen
          label="Variación vs. período anterior"
          valor={formatPct(variacionPeriodo)}
          hint={`Período anterior: ${totalPrevio.toLocaleString("es-PE")} cremaciones`}
          tone={variacionPeriodo === null ? "neutral" : variacionPeriodo >= 0 ? "up" : "down"}
        />
      </section>

      {/* Selector de reporte: un solo bloque, como las categorías de Inventario */}
      <nav aria-label="Reportes" className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-4 flex flex-wrap items-center gap-2">
        {REPORTES.map((r) => (
          <Link
            key={r.key}
            to={`/reportes/${r.slug}`}
            aria-current={reporte === r.key ? "page" : undefined}
            className={cn(
              "px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              reporte === r.key
                ? "bg-brand-500 text-white shadow-sm font-semibold"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
            )}
          >
            {r.label}
          </Link>
        ))}
      </nav>

      {reporte === "mensual" && (
        <ChartCard
          titulo={esAnio ? "Cremaciones por año" : "Cremaciones por mes"}
          subtitulo={
            esAnio
              ? `Total anual y variación frente al año anterior · ${periodoLabel}`
              : `Total mensual y variación frente al mes anterior · ${periodoLabel}`
          }
          nota={notaParcial}
          tabla={{
            columnas: [colMes, "Cremaciones", esAnio ? "Variación vs. año anterior" : "Variación vs. mes anterior"],
            filas: grupos1.map((g) => [
              g.etiqueta + (g.parcial ? " (parcial)" : ""),
              g.valores.total,
              formatPct(g.variacion ?? null),
            ]),
          }}
        >
          <BarrasVerticales
            grupos={grupos1}
            series={[{ key: "total", label: "Cremaciones", color: "var(--serie-1)" }]}
            descripcion={`Cremaciones por mes, ${periodoLabel}`}
            etiquetaVariacion={esAnio ? "contra el año anterior" : "contra el mes anterior"}
          />
        </ChartCard>
      )}

      {reporte === "ingresos" && (
        <ChartCard
          titulo={esAnio ? "Ingresos por año" : "Ingresos por mes"}
          subtitulo={`Importe cobrado, cremaciones y precio promedio · ${periodoLabel}`}
          nota={
            <>
              <p>
                Ingreso: precio de los servicios realizados en el mes. Cobrado: pagos con fecha de cobro en el mes,
                incluidos anticipos y facturas a veterinarias. Precio promedio: ingreso entre cremaciones del mes.
              </p>
              {notaParcial && <p className="mt-1">{notaParcial}</p>}
            </>
          }
          tabla={{
            columnas: [colMes, "Cremaciones", "Ingreso", "Cobrado", "Precio promedio"],
            filas: [
              ...filasIngresos.map((f) => [
                f.etiqueta + (f.parcial ? " (parcial)" : ""),
                f.cremaciones,
                soles(f.ingreso),
                soles(f.cobrado),
                f.precioPromedio === null ? "—" : soles(f.precioPromedio),
              ]),
              [
                "Total",
                filasIngresos.reduce((a, f) => a + f.cremaciones, 0),
                soles(ing.data?.ingreso_total),
                soles(ing.data?.cobrado_total),
                "—",
              ],
            ],
          }}
        >
          <BarrasVerticales
            grupos={filasIngresos.map((f) => ({
              etiqueta: f.etiqueta,
              parcial: f.parcial,
              valores: { ingreso: f.ingreso, cobrado: f.cobrado },
            }))}
            series={[
              { key: "ingreso", label: "Ingreso (servicios del mes)", color: "var(--serie-1)" },
              { key: "cobrado", label: "Cobrado", color: "var(--serie-2)" },
            ]}
            descripcion={`Ingreso y cobrado por mes, ${periodoLabel}`}
            etiquetaVariacion=""
            formatoValor={(v) => soles(v)}
          />
        </ChartCard>
      )}

      {reporte === "interanual" && (
        <ChartCard
          titulo={esAnio ? "Cremaciones: año contra año anterior" : "Cremaciones: mes contra el mismo mes del año anterior"}
          subtitulo={`Todos los canales · ${periodoLabel}`}
          nota={notaParcial}
          tabla={{
            columnas: [colMes, colPeriodo, colAnterior, "Variación interanual"],
            filas: grupos2.map((g) => [
              g.etiqueta + (g.parcial ? " (parcial)" : ""),
              g.valores.periodo,
              g.valores.anterior,
              formatPct(g.variacion ?? null),
            ]),
          }}
        >
          <BarrasVerticales
            grupos={grupos2}
            series={[serieAnterior, serieActual]}
            descripcion={`Cremaciones por mes frente al año anterior, ${periodoLabel}`}
            etiquetaVariacion={esAnio ? "contra el año anterior" : "contra el mismo mes del año anterior"}
          />
        </ChartCard>
      )}

      {reporte === "particulares" && (
        <ChartCard
          titulo="Particulares: año contra año"
          subtitulo={`Clientes directos, sin veterinaria · ${periodoLabel}`}
          nota={notaParcial}
          tabla={{
            columnas: [colMes, colPeriodo, colAnterior, "Variación interanual"],
            filas: grupos3.map((g) => [
              g.etiqueta + (g.parcial ? " (parcial)" : ""),
              g.valores.periodo,
              g.valores.anterior,
              formatPct(g.variacion ?? null),
            ]),
          }}
        >
          <BarrasVerticales
            grupos={grupos3}
            series={[serieAnterior, serieActual]}
            descripcion={`Cremaciones de particulares por mes frente al año anterior, ${periodoLabel}`}
            etiquetaVariacion={esAnio ? "contra el año anterior" : "contra el mismo mes del año anterior"}
          />
        </ChartCard>
      )}

      {reporte === "veterinarias" && (
        <ChartCard
          titulo="Veterinarias aliadas: año contra año"
          subtitulo={`Casos referidos por veterinarias · ${periodoLabel}`}
          nota={notaParcial}
          tabla={{
            columnas: [colMes, colPeriodo, colAnterior, "Variación interanual"],
            filas: grupos4.map((g) => [
              g.etiqueta + (g.parcial ? " (parcial)" : ""),
              g.valores.periodo,
              g.valores.anterior,
              formatPct(g.variacion ?? null),
            ]),
          }}
        >
          <BarrasVerticales
            grupos={grupos4}
            series={[serieAnterior, serieActual]}
            descripcion={`Cremaciones referidas por veterinarias por mes frente al año anterior, ${periodoLabel}`}
            etiquetaVariacion={esAnio ? "contra el año anterior" : "contra el mismo mes del año anterior"}
          />
        </ChartCard>
      )}

      {reporte === "top-veterinarias" && (
        <div className="grid grid-cols-1 min-[1360px]:grid-cols-2 gap-5 items-start">
          <div className="flex flex-col gap-5 min-w-0">
        <ChartCard
          titulo="Top 5 veterinarias referidoras"
          subtitulo={`Cremaciones referidas por veterinarias aliadas · ${periodoLabel}`}
          tabla={{
            columnas: ["Puesto", "Veterinaria", "Referidos", "% de referidos"],
            filas: top5Vets.map((r, i) => [
              `#${i + 1}`,
              r.nombre,
              r.cremaciones,
              formatPorcentaje(r.porcentaje),
            ]),
          }}
          nota={`Total de referidos en el período: ${totalReferidos.toLocaleString("es-PE")}.`}
        >
          {top5Vets.length > 0 ? (
            <BarrasHorizontales filas={filasTop5} descripcion="Top 5 veterinarias por referidos" />
          ) : (
            <p className="text-sm text-slate-500">No hubo referidos de veterinarias en este período.</p>
          )}
        </ChartCard>
          </div>
          <PanelRendimientoVeterinarias datos={vets.data} />
        </div>
      )}

      {reporte === "distritos" && (
        <div className="grid grid-cols-1 min-[1360px]:grid-cols-2 gap-5 items-start">
          <div className="flex flex-col gap-5 min-w-0">
        <ChartCard
          titulo="Distritos que pidieron cremaciones"
          subtitulo={`Todos los canales · ${periodoLabel}. Top 5 destacado.`}
          tabla={{
            columnas: ["Puesto", "Distrito", "Cremaciones", "% del total"],
            filas: rankingDistritos.map((d, i) => [
              `#${i + 1}${i < 5 ? " · Top 5" : ""}`,
              d.nombre,
              d.cremaciones,
              formatPorcentaje(d.porcentaje),
            ]),
          }}
          nota={`${rankingDistritos.length} distritos con cremaciones en el período.`}
        >
          <BarrasHorizontales filas={filasDistritos} descripcion="Distritos por cremaciones; los cinco primeros destacados" />
        </ChartCard>
          </div>
          <PanelOportunidades datos={opor.data} />
        </div>
      )}

      {reporte === "planes" && (
        <div className="grid grid-cols-1 min-[1360px]:grid-cols-2 gap-5 items-start">
          <div className="flex flex-col gap-5 min-w-0">
          <ChartCard
            titulo="Planes vendidos"
            subtitulo={`Cremaciones realizadas por plan · ${periodoLabel}`}
            nota={notaParcial}
            tabla={{
              columnas: ["Plan", "Ventas", "% del total"],
              filas: [
                ...rankingPlanes.map((p) => [p.nombre, p.cremaciones, formatPorcentaje(p.porcentaje)]),
                ["Total", totalCasos, totalCasos ? "100%" : "—"],
              ],
            }}
          >
            <BarrasHorizontales filas={filasPlanes} descripcion="Ventas por plan de cremación" />
          </ChartCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ExtraDosPartes
              titulo="Presencialidad"
              primera={{ label: "Presencial", valor: presenciales }}
              segunda={{ label: "No presencial", valor: totalCasos - presenciales }}
              total={totalCasos}
            />
            <ExtraDosPartes
              titulo="Eutanasia"
              primera={{ label: "Con eutanasia", valor: conEutanasia }}
              segunda={{ label: "Sin eutanasia", valor: totalCasos - conEutanasia }}
              total={totalCasos}
            />
          </div>
          </div>
          <PanelAbastecimiento datos={abas.data} />
        </div>
      )}

      {reporte === "peso" && (
        <ChartCard
          titulo="Peso de la mascota"
          subtitulo={`Cremaciones por rango de peso · ${periodoLabel}`}
          tabla={{
            columnas: ["Rango de peso", "Cremaciones", "% del total"],
            filas: [
              ...(k?.pesos ?? []).map((r) => [r.etiqueta, r.cremaciones, formatPorcentaje(r.porcentaje)]),
              ["Total", totalCasos, totalCasos ? "100%" : "—"],
            ],
          }}
          nota={
            <>
              <p>
                Total de cremaciones con peso registrado: {totalCasos.toLocaleString("es-PE")}. El
                porcentaje bajo cada rango es su parte del total del período.
              </p>
              {notaParcial && <p className="mt-1">{notaParcial}</p>}
            </>
          }
        >
          <BarrasVerticales
            grupos={gruposPeso}
            series={[{ key: "total", label: "Cremaciones", color: "var(--serie-1)" }]}
            descripcion="Cremaciones por rango de peso de la mascota"
            etiquetaVariacion=""
          />
        </ChartCard>
      )}
    </div>
  );
}

/** Dato de dos partes con su porcentaje sobre el total reportado. */
function ExtraDosPartes({
  titulo,
  primera,
  segunda,
  total,
}: {
  titulo: string;
  primera: { label: string; valor: number };
  segunda: { label: string; valor: number };
  total: number;
}) {
  const pA = total ? (primera.valor / total) * 100 : null;
  const pB = total ? (segunda.valor / total) * 100 : null;
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 lg:p-6 flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{titulo}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Porcentaje sobre el total reportado: {total.toLocaleString("es-PE")} cremaciones
        </p>
      </div>
      <div
        role="img"
        aria-label={`${primera.label}: ${formatPorcentaje(pA)}; ${segunda.label}: ${formatPorcentaje(pB)}`}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--grid)]"
      >
        <div className="h-full" style={{ width: `${pA ?? 0}%`, background: "var(--serie-1)" }} />
        <div className="h-full" style={{ width: `${pB ?? 0}%`, background: "var(--baseline)" }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ParteDato color="var(--serie-1)" label={primera.label} valor={primera.valor} pct={pA} />
        <ParteDato color="var(--baseline)" label={segunda.label} valor={segunda.valor} pct={pB} />
      </div>
    </section>
  );
}

function ParteDato({
  color,
  label,
  valor,
  pct,
}: {
  color: string;
  label: string;
  valor: number;
  pct: number | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} aria-hidden />
        {label}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
        {valor.toLocaleString("es-PE")}
      </p>
      <p className="text-sm font-semibold text-[var(--ink-2)] tabular-nums">
        {formatPorcentaje(pct)} del total
      </p>
    </div>
  );
}

function Resumen({
  label,
  valor,
  hint,
  tone = "neutral",
}: {
  label: string;
  valor: string;
  hint: string;
  tone?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={cn(
          "text-xl font-bold mt-1",
          tone === "up" && "text-[var(--up)]",
          tone === "down" && "text-[var(--down)]",
          tone === "neutral" && "text-slate-900 dark:text-white"
        )}
      >
        {valor}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
    </div>
  );
}
