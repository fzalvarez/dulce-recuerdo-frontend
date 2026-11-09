import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CASOS_EJEMPLO,
  NOMBRE_PLAN,
  NOMBRE_VETERINARIA,
  PLANES_ORDEN,
  ULTIMO_MES_CON_DATOS,
  VETERINARIAS_REFERIDORAS,
} from "../data/casos.mock";
import type { PlanId } from "../types";
import { ChartCard } from "../components/ChartCard";
import { BarrasVerticales, type GrupoBarra, type SerieBarra } from "../components/BarrasVerticales";
import { BarrasHorizontales, type FilaRanking } from "../components/BarrasHorizontales";
import { PanelAbastecimiento } from "../components/PanelAbastecimiento";
import { PanelOportunidades } from "../components/PanelOportunidades";
import {
  claveMes,
  contarPorMes,
  desplazarMes,
  etiquetaMesCorta,
  etiquetaMesLarga,
  formatPct,
  formatPorcentaje,
  ordenarRanking,
  porcentaje,
  RANGOS_PESO,
  rangoDePeso,
  sumar,
  variacionPct,
  ventanaMeses,
  type RangoPesoId,
} from "../utils/reportes";
import "../reportes.css";

type ReporteKey =
  | "mensual"
  | "interanual"
  | "particulares"
  | "veterinarias"
  | "top-veterinarias"
  | "distritos"
  | "planes"
  | "peso";

const REPORTES: { key: ReporteKey; slug: string; label: string }[] = [
  { key: "mensual", slug: "cremaciones-mes", label: "Cremaciones por mes" },
  { key: "interanual", slug: "vs-anio-anterior", label: "Vs. año anterior" },
  { key: "particulares", slug: "particulares", label: "Particulares" },
  { key: "veterinarias", slug: "veterinarias-aliadas", label: "Veterinarias aliadas" },
  { key: "top-veterinarias", slug: "top-veterinarias", label: "Top 5 veterinarias" },
  { key: "distritos", slug: "distritos", label: "Distritos" },
  { key: "planes", slug: "planes-vendidos", label: "Planes vendidos" },
  { key: "peso", slug: "peso-mascota", label: "Peso de la mascota" },
];

type Longitud = 3 | 6 | 9 | 12;
const LONGITUDES: Longitud[] = [3, 6, 9, 12];

const SERIE_PERIODO: SerieBarra = { key: "periodo", label: "Mes del período", color: "var(--serie-1)" };
const SERIE_ANTERIOR: SerieBarra = { key: "anterior", label: "Mismo mes, año anterior", color: "var(--serie-2)" };

// Conteos calculados una sola vez sobre todos los casos.
const TOTAL_MES = contarPorMes(CASOS_EJEMPLO);
const PARTICULAR_MES = contarPorMes(CASOS_EJEMPLO, (c) => c.canal === "particular");
const VETERINARIA_MES = contarPorMes(CASOS_EJEMPLO, (c) => c.canal === "veterinaria");

const MES_EN_CURSO = claveMes(new Date());
const PRIMER_MES_OPCION = "2025-01";

const OPCIONES_FIN: string[] = [];
for (let m = PRIMER_MES_OPCION; m <= ULTIMO_MES_CON_DATOS; m = desplazarMes(m, 1)) {
  OPCIONES_FIN.push(m);
}

function fechaDeCorte(): string {
  return new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long" });
}

export default function ReportesPage() {
  const [finClave, setFinClave] = useState(() => {
    // Por defecto, el último mes que ya cerró.
    const anterior = desplazarMes(MES_EN_CURSO, -1);
    return anterior < PRIMER_MES_OPCION ? PRIMER_MES_OPCION : anterior;
  });
  const [longitud, setLongitud] = useState<Longitud>(6);
  // El reporte activo sale de la URL: /reportes/<slug>.
  const { reporte: slug } = useParams();
  const reporte: ReporteKey = REPORTES.find((r) => r.slug === slug)?.key ?? "mensual";

  const ventana = useMemo(() => ventanaMeses(finClave, longitud), [finClave, longitud]);
  const ventanaPrevia = useMemo(
    () => ventanaMeses(desplazarMes(finClave, -longitud), longitud),
    [finClave, longitud]
  );
  const conjuntoPeriodo = useMemo(() => new Set(ventana), [ventana]);
  const casosPeriodo = useMemo(
    () => CASOS_EJEMPLO.filter((c) => conjuntoPeriodo.has(c.fecha.slice(0, 7))),
    [conjuntoPeriodo]
  );
  const totalCasos = casosPeriodo.length;
  const incluyeParcial = ventana.includes(MES_EN_CURSO);

  const totalPeriodo = sumar(ventana.map((m) => TOTAL_MES[m] ?? 0));
  const totalPrevio = sumar(ventanaPrevia.map((m) => TOTAL_MES[m] ?? 0));
  const variacionPeriodo = variacionPct(totalPeriodo, totalPrevio);

  const periodoLabel = `${etiquetaMesLarga(ventana[0])} – ${etiquetaMesLarga(ventana[ventana.length - 1])}`;
  const notaParcial = incluyeParcial ? (
    <span className="text-amber-700 dark:text-amber-400">
      {etiquetaMesLarga(MES_EN_CURSO)} es un mes parcial: datos hasta el {fechaDeCorte()}. Sus variaciones no
      se comparan con meses completos.
    </span>
  ) : null;

  // Reporte 1: un año, variación contra el mes anterior.
  const grupos1: GrupoBarra[] = ventana.map((m) => {
    const parcial = m === MES_EN_CURSO;
    return {
      etiqueta: etiquetaMesCorta(m),
      parcial,
      valores: { total: TOTAL_MES[m] ?? 0 },
      variacion: parcial
        ? null
        : variacionPct(TOTAL_MES[m] ?? 0, TOTAL_MES[desplazarMes(m, -1)] ?? 0),
    };
  });

  // Reportes 2, 3 y 4: mes contra el mismo mes del año anterior.
  function gruposInteranuales(conteo: Record<string, number>): GrupoBarra[] {
    return ventana.map((m) => {
      const parcial = m === MES_EN_CURSO;
      const actual = conteo[m] ?? 0;
      const previo = conteo[desplazarMes(m, -12)] ?? 0;
      return {
        etiqueta: etiquetaMesCorta(m),
        parcial,
        valores: { periodo: actual, anterior: previo },
        variacion: parcial ? null : variacionPct(actual, previo),
      };
    });
  }
  const grupos2 = gruposInteranuales(TOTAL_MES);
  const grupos3 = gruposInteranuales(PARTICULAR_MES);
  const grupos4 = gruposInteranuales(VETERINARIA_MES);

  // Reporte 5: top 5 veterinarias por referidos en el período.
  const referidosPorVet: Record<string, number> = {};
  for (const c of casosPeriodo) {
    if (c.canal !== "veterinaria" || !c.veterinariaId) continue;
    referidosPorVet[c.veterinariaId] = (referidosPorVet[c.veterinariaId] ?? 0) + 1;
  }
  const totalReferidos = sumar(Object.values(referidosPorVet));
  const top5Vets = ordenarRanking(
    VETERINARIAS_REFERIDORAS.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      valor: referidosPorVet[v.id] ?? 0,
    })).filter((r) => r.valor > 0)
  ).slice(0, 5);

  // Reporte 6: distritos en el período; los 5 primeros se destacan.
  const conteoDistrito: Record<string, number> = {};
  for (const c of casosPeriodo) {
    conteoDistrito[c.distrito] = (conteoDistrito[c.distrito] ?? 0) + 1;
  }
  const rankingDistritos = ordenarRanking(
    Object.entries(conteoDistrito).map(([nombre, valor]) => ({ id: nombre, nombre, valor }))
  );
  const totalDistritos = sumar(rankingDistritos.map((d) => d.valor));

  const filasTop5: FilaRanking[] = top5Vets.map((r) => ({
    id: r.id,
    etiqueta: r.nombre,
    valor: r.valor,
    destacada: true,
    detalle: formatPorcentaje(porcentaje(r.valor, totalReferidos)),
  }));
  const filasDistritos: FilaRanking[] = rankingDistritos.map((d, i) => ({
    id: d.id,
    etiqueta: d.nombre,
    valor: d.valor,
    destacada: i < 5,
    detalle: formatPorcentaje(porcentaje(d.valor, totalDistritos)),
  }));

  // Reporte 7: ventas por plan. "Sin clasificar" va en gris: no es un plan.
  const conteoPlan: Record<PlanId, number> = { clasico: 0, eco: 0, paz: 0, "sin-clasificar": 0 };
  for (const c of casosPeriodo) conteoPlan[c.plan] += 1;
  const rankingPlanes = ordenarRanking(
    PLANES_ORDEN.map((id) => ({ id, nombre: NOMBRE_PLAN[id], valor: conteoPlan[id] }))
  );
  const filasPlanes: FilaRanking[] = rankingPlanes.map((p) => ({
    id: p.id,
    etiqueta: p.nombre,
    valor: p.valor,
    destacada: p.id !== "sin-clasificar",
    detalle: formatPorcentaje(porcentaje(p.valor, totalCasos)),
  }));
  const presenciales = casosPeriodo.filter((c) => c.presencial).length;
  const conEutanasia = casosPeriodo.filter((c) => c.eutanasia).length;

  // Reporte 8: peso de la mascota por rango.
  const conteoRango: Record<RangoPesoId, number> = { "0-5": 0, "5-15": 0, "15-25": 0, "25-35": 0, "35+": 0 };
  for (const c of casosPeriodo) conteoRango[rangoDePeso(c.pesoKg)] += 1;
  const gruposPeso: GrupoBarra[] = RANGOS_PESO.map((r) => ({
    etiqueta: r.etiqueta,
    valores: { total: conteoRango[r.id] },
    subetiqueta: formatPorcentaje(porcentaje(conteoRango[r.id], totalCasos)),
  }));

  return (
    <div className="reportes-root flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Reportes" }, { label: "Revisión de la empresa" }]} />

      <ModuleHeader
        title="Reportes"
        description="Revisión de la empresa: cremaciones, canales, veterinarias, distritos, planes y peso."
      />

      {/* Filtros: una sola fila para todos los reportes */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Select value={String(longitud)} onValueChange={(v) => setLongitud(Number(v) as Longitud)}>
          <SelectTrigger className="md:w-60 whitespace-nowrap">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LONGITUDES.map((l) => (
              <SelectItem key={l} value={String(l)}>
                Período de {l} meses
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={finClave} onValueChange={setFinClave}>
          <SelectTrigger className="md:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCIONES_FIN.map((m) => (
              <SelectItem key={m} value={m}>
                Termina en {etiquetaMesLarga(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-500 md:ml-2">{periodoLabel}</span>
      </div>

      {/* Resumen del período */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Resumen
          label="Cremaciones del período"
          valor={totalPeriodo.toLocaleString("es-PE")}
          hint={incluyeParcial ? "Incluye un mes parcial" : `${longitud} meses`}
        />
        <Resumen
          label="Promedio mensual"
          valor={(totalPeriodo / longitud).toLocaleString("es-PE", { maximumFractionDigits: 1 })}
          hint="Cremaciones por mes"
        />
        <Resumen
          label="Variación vs. período anterior"
          valor={formatPct(variacionPeriodo)}
          hint={`Período anterior: ${totalPrevio.toLocaleString("es-PE")} cremaciones`}
          tone={variacionPeriodo === null ? "neutral" : variacionPeriodo >= 0 ? "up" : "down"}
        />
      </section>

      {/* Selector de reporte */}
      <nav className="flex flex-wrap gap-3" aria-label="Reportes">
        {REPORTES.map((r) => (
          <Link
            key={r.key}
            to={`/reportes/${r.slug}`}
            aria-current={reporte === r.key ? "page" : undefined}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
              reporte === r.key
                ? "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/12 dark:text-brand-400 dark:border-brand-500/30"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-gray-900 dark:text-slate-300 dark:border-white/10"
            )}
          >
            {r.label}
          </Link>
        ))}
      </nav>

      {reporte === "mensual" && (
        <ChartCard
          titulo="Cremaciones por mes"
          subtitulo={`Total mensual y variación frente al mes anterior · ${periodoLabel}`}
          nota={notaParcial}
          tabla={{
            columnas: ["Mes", "Cremaciones", "Variación vs. mes anterior"],
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
            etiquetaVariacion="contra el mes anterior"
          />
        </ChartCard>
      )}

      {reporte === "interanual" && (
        <ChartCard
          titulo="Cremaciones: mes contra el mismo mes del año anterior"
          subtitulo={`Todos los canales · ${periodoLabel}`}
          nota={notaParcial}
          tabla={{
            columnas: ["Mes", "Mes del período", "Mismo mes, año anterior", "Variación interanual"],
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
            series={[SERIE_ANTERIOR, SERIE_PERIODO]}
            descripcion={`Cremaciones por mes frente al año anterior, ${periodoLabel}`}
            etiquetaVariacion="contra el mismo mes del año anterior"
          />
        </ChartCard>
      )}

      {reporte === "particulares" && (
        <ChartCard
          titulo="Particulares: año contra año"
          subtitulo={`Clientes directos, sin veterinaria · ${periodoLabel}`}
          nota={notaParcial}
          tabla={{
            columnas: ["Mes", "Mes del período", "Mismo mes, año anterior", "Variación interanual"],
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
            series={[SERIE_ANTERIOR, SERIE_PERIODO]}
            descripcion={`Cremaciones de particulares por mes frente al año anterior, ${periodoLabel}`}
            etiquetaVariacion="contra el mismo mes del año anterior"
          />
        </ChartCard>
      )}

      {reporte === "veterinarias" && (
        <ChartCard
          titulo="Veterinarias aliadas: año contra año"
          subtitulo={`Casos referidos por veterinarias · ${periodoLabel}`}
          nota={notaParcial}
          tabla={{
            columnas: ["Mes", "Mes del período", "Mismo mes, año anterior", "Variación interanual"],
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
            series={[SERIE_ANTERIOR, SERIE_PERIODO]}
            descripcion={`Cremaciones referidas por veterinarias por mes frente al año anterior, ${periodoLabel}`}
            etiquetaVariacion="contra el mismo mes del año anterior"
          />
        </ChartCard>
      )}

      {reporte === "top-veterinarias" && (
        <ChartCard
          titulo="Top 5 veterinarias referidoras"
          subtitulo={`Cremaciones referidas por veterinarias aliadas · ${periodoLabel}`}
          tabla={{
            columnas: ["Puesto", "Veterinaria", "Referidos", "% de referidos"],
            filas: top5Vets.map((r, i) => [
              `#${i + 1}`,
              NOMBRE_VETERINARIA[r.id] ?? r.nombre,
              r.valor,
              formatPorcentaje(porcentaje(r.valor, totalReferidos)),
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
      )}

      {reporte === "distritos" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <div className="flex flex-col gap-5 min-w-0">
        <ChartCard
          titulo="Distritos que pidieron cremaciones"
          subtitulo={`Todos los canales · ${periodoLabel}. Top 5 destacado.`}
          tabla={{
            columnas: ["Puesto", "Distrito", "Cremaciones", "% del total"],
            filas: rankingDistritos.map((d, i) => [
              `#${i + 1}${i < 5 ? " · Top 5" : ""}`,
              d.nombre,
              d.valor,
              formatPorcentaje(porcentaje(d.valor, totalDistritos)),
            ]),
          }}
          nota={`${rankingDistritos.length} distritos con cremaciones en el período.`}
        >
          <BarrasHorizontales filas={filasDistritos} descripcion="Distritos por cremaciones; los cinco primeros destacados" />
        </ChartCard>
          </div>
          <PanelOportunidades casos={CASOS_EJEMPLO} ventana={ventana} ventanaPrevia={ventanaPrevia} />
        </div>
      )}

      {reporte === "planes" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <div className="flex flex-col gap-5 min-w-0">
          <ChartCard
            titulo="Planes vendidos"
            subtitulo={`Cremaciones vendidas por plan · ${periodoLabel}`}
            nota={notaParcial}
            tabla={{
              columnas: ["Plan", "Ventas", "% del total"],
              filas: [
                ...rankingPlanes.map((p) => [
                  p.nombre,
                  p.valor,
                  formatPorcentaje(porcentaje(p.valor, totalCasos)),
                ]),
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
          <PanelAbastecimiento casos={CASOS_EJEMPLO} casosPeriodo={casosPeriodo} finClave={finClave} longitud={longitud} />
        </div>
      )}

      {reporte === "peso" && (
        <ChartCard
          titulo="Peso de la mascota"
          subtitulo={`Cremaciones por rango de peso · ${periodoLabel}`}
          tabla={{
            columnas: ["Rango de peso", "Cremaciones", "% del total"],
            filas: [
              ...RANGOS_PESO.map((r) => [
                r.etiqueta,
                conteoRango[r.id],
                formatPorcentaje(porcentaje(conteoRango[r.id], totalCasos)),
              ]),
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
  const pA = porcentaje(primera.valor, total);
  const pB = porcentaje(segunda.valor, total);
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
