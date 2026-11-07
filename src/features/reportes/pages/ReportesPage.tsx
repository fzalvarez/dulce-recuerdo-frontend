import { useMemo, useState } from "react";
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
import { CASOS_EJEMPLO, NOMBRE_VETERINARIA, VETERINARIAS_REFERIDORAS, ULTIMO_MES_CON_DATOS } from "../data/casos.mock";
import { ChartCard } from "../components/ChartCard";
import { BarrasVerticales, type GrupoBarra, type SerieBarra } from "../components/BarrasVerticales";
import { BarrasHorizontales, type FilaRanking } from "../components/BarrasHorizontales";
import {
  claveMes,
  contarPorMes,
  desplazarMes,
  etiquetaMesCorta,
  etiquetaMesLarga,
  formatPct,
  ordenarRanking,
  sumar,
  variacionPct,
  ventanaMeses,
} from "../utils/reportes";
import "../reportes.css";

type ReporteKey = "mensual" | "interanual" | "particulares" | "veterinarias" | "top-veterinarias" | "distritos";

const REPORTES: { key: ReporteKey; label: string }[] = [
  { key: "mensual", label: "Cremaciones por mes" },
  { key: "interanual", label: "Vs. año anterior" },
  { key: "particulares", label: "Particulares" },
  { key: "veterinarias", label: "Veterinarias aliadas" },
  { key: "top-veterinarias", label: "Top 5 veterinarias" },
  { key: "distritos", label: "Distritos" },
];

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
  const [longitud, setLongitud] = useState<3 | 6>(6);
  const [reporte, setReporte] = useState<ReporteKey>("mensual");

  const ventana = useMemo(() => ventanaMeses(finClave, longitud), [finClave, longitud]);
  const ventanaPrevia = useMemo(
    () => ventanaMeses(desplazarMes(finClave, -longitud), longitud),
    [finClave, longitud]
  );
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
  const conjuntoPeriodo = new Set(ventana);
  const referidosPorVet: Record<string, number> = {};
  for (const c of CASOS_EJEMPLO) {
    if (c.canal !== "veterinaria" || !c.veterinariaId) continue;
    if (!conjuntoPeriodo.has(c.fecha.slice(0, 7))) continue;
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
  for (const c of CASOS_EJEMPLO) {
    if (!conjuntoPeriodo.has(c.fecha.slice(0, 7))) continue;
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
  }));
  const filasDistritos: FilaRanking[] = rankingDistritos.map((d, i) => ({
    id: d.id,
    etiqueta: d.nombre,
    valor: d.valor,
    destacada: i < 5,
  }));

  return (
    <div className="reportes-root">
      <Breadcrumbs items={[{ label: "Reportes" }, { label: "Revisión de la empresa" }]} />

      <ModuleHeader
        title="Reportes"
        description="Revisión de la empresa cada 3 o 6 meses: cremaciones, canales, veterinarias y distritos."
      />

      {/* Filtros: una sola fila para todos los reportes */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Select value={String(longitud)} onValueChange={(v) => setLongitud(Number(v) as 3 | 6)}>
          <SelectTrigger className="md:w-60 whitespace-nowrap">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Período de 3 meses</SelectItem>
            <SelectItem value="6">Período de 6 meses</SelectItem>
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
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      <nav className="flex flex-wrap gap-2" aria-label="Reportes">
        {REPORTES.map((r) => (
          <button
            key={r.key}
            type="button"
            aria-pressed={reporte === r.key}
            onClick={() => setReporte(r.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
              reporte === r.key
                ? "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/12 dark:text-brand-400 dark:border-brand-500/30"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-gray-900 dark:text-slate-300 dark:border-white/10"
            )}
          >
            {r.label}
          </button>
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
            series={[SERIE_PERIODO, SERIE_ANTERIOR]}
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
            series={[SERIE_PERIODO, SERIE_ANTERIOR]}
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
            series={[SERIE_PERIODO, SERIE_ANTERIOR]}
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
              `${((r.valor / totalReferidos) * 100).toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`,
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
        <ChartCard
          titulo="Distritos que pidieron cremaciones"
          subtitulo={`Todos los canales · ${periodoLabel}. Top 5 destacado.`}
          tabla={{
            columnas: ["Puesto", "Distrito", "Cremaciones", "% del total"],
            filas: rankingDistritos.map((d, i) => [
              `#${i + 1}${i < 5 ? " · Top 5" : ""}`,
              d.nombre,
              d.valor,
              `${((d.valor / totalDistritos) * 100).toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`,
            ]),
          }}
          nota={`${rankingDistritos.length} distritos con cremaciones en el período.`}
        >
          <BarrasHorizontales filas={filasDistritos} descripcion="Distritos por cremaciones; los cinco primeros destacados" />
        </ChartCard>
      )}
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

