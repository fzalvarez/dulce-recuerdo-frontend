import type { CasoReportable, PlanId } from "../types";
import { PRECIO_PLAN } from "../../casos/data/tarifas";
import { VETERINARIAS_REFERIDORAS } from "../data/casos.mock";
import { rangoDePeso } from "./reportes";
import type { Conclusion } from "./oportunidades";

/** Umbrales de las alertas. Cambiarlos cambia las señales, no los datos. */
export const MIN_CREMACIONES_ALERTA = 5;
export const UMBRAL_CAIDA_PCT = -20;
export const UMBRAL_CRECIMIENTO_PCT = 30;
export const UMBRAL_DEPENDENCIA_PCT = 25;

const PLANES_CON_PRECIO: PlanId[] = ["clasico", "paz", "eco"];

export interface FilaVeterinaria {
  id: string;
  nombre: string;
  cremaciones: number;
  previas: number;
  /** Variación frente al período anterior; null si no hay base. */
  variacionPct: number | null;
  /** Participación en las cremaciones referidas por veterinarias. */
  pctReferidos: number;
  /** Ingreso de planes por peso, sin traslado. */
  ingreso: number;
  /** Participación en el ingreso total de la ciudad. */
  pctIngreso: number;
  planPrincipal: PlanId | null;
  caida: boolean;
  crece: boolean;
}

export interface ResultadoVeterinarias {
  filas: FilaVeterinaria[];
  totalReferidos: number;
  pctTop5: number;
  pctPrincipal: number;
  conclusiones: Conclusion[];
}

function variacion(actual: number, previo: number): number | null {
  if (!previo) return null;
  return ((actual - previo) / previo) * 100;
}

export function calcularVeterinarias(
  casos: CasoReportable[],
  ventana: string[],
  ventanaPrevia: string[]
): ResultadoVeterinarias {
  const enVentana = new Set(ventana);
  const enPrevia = new Set(ventanaPrevia);

  const base = new Map<string, { cremaciones: number; previas: number; ingreso: number; planes: Partial<Record<PlanId, number>> }>();
  for (const v of VETERINARIAS_REFERIDORAS) {
    base.set(v.id, { cremaciones: 0, previas: 0, ingreso: 0, planes: {} });
  }

  let ingresoTotal = 0;
  let totalReferidos = 0;

  for (const c of casos) {
    const mes = c.fecha.slice(0, 7);
    const enPeriodo = enVentana.has(mes);
    const enAnterior = enPrevia.has(mes);
    if (!enPeriodo && !enAnterior) continue;

    const precio =
      PLANES_CON_PRECIO.includes(c.plan) && c.pesoKg !== undefined
        ? PRECIO_PLAN[c.plan as Exclude<PlanId, "sin-clasificar">][rangoDePeso(c.pesoKg)]
        : 0;

    if (enPeriodo) ingresoTotal += precio;

    if (c.canal !== "veterinaria" || !c.veterinariaId) continue;
    const f = base.get(c.veterinariaId);
    if (!f) continue;

    if (enAnterior) f.previas += 1;
    if (enPeriodo) {
      f.cremaciones += 1;
      f.ingreso += precio;
      totalReferidos += 1;
      if (c.plan !== "sin-clasificar") f.planes[c.plan] = (f.planes[c.plan] ?? 0) + 1;
    }
  }

  const filas: FilaVeterinaria[] = VETERINARIAS_REFERIDORAS.map((v) => {
    const f = base.get(v.id)!;
    const variacionPct = variacion(f.cremaciones, f.previas);
    const principal = PLANES_CON_PRECIO
      .filter((p) => (f.planes[p] ?? 0) > 0)
      .sort((a, b) => (f.planes[b] ?? 0) - (f.planes[a] ?? 0))[0] ?? null;
    const alertable = Math.max(f.cremaciones, f.previas) >= MIN_CREMACIONES_ALERTA;
    return {
      id: v.id,
      nombre: v.nombre,
      cremaciones: f.cremaciones,
      previas: f.previas,
      variacionPct,
      pctReferidos: totalReferidos ? (f.cremaciones / totalReferidos) * 100 : 0,
      ingreso: f.ingreso,
      pctIngreso: ingresoTotal ? (f.ingreso / ingresoTotal) * 100 : 0,
      planPrincipal: principal,
      caida: alertable && variacionPct !== null && variacionPct <= UMBRAL_CAIDA_PCT,
      crece: alertable && variacionPct !== null && variacionPct >= UMBRAL_CRECIMIENTO_PCT && f.cremaciones >= MIN_CREMACIONES_ALERTA,
    };
  })
    .filter((f) => f.cremaciones > 0 || f.previas > 0)
    .sort((a, b) => b.cremaciones - a.cremaciones || a.nombre.localeCompare(b.nombre, "es"));

  const top5 = filas.slice(0, 5).reduce((acc, f) => acc + f.cremaciones, 0);
  const pctTop5 = totalReferidos ? (top5 / totalReferidos) * 100 : 0;
  const pctPrincipal = filas[0] ? filas[0].pctReferidos : 0;

  return {
    filas,
    totalReferidos,
    pctTop5,
    pctPrincipal,
    conclusiones: conclusionesDe(filas, pctPrincipal),
  };
}

function conclusionesDe(filas: FilaVeterinaria[], pctPrincipal: number): Conclusion[] {
  const out: Conclusion[] = [];
  const pct = (n: number) => `${Math.round(n)}%`;
  const signo = (n: number | null) => (n === null ? "sin base" : `${n > 0 ? "+" : ""}${Math.round(n)}%`);

  // 1. Dependencia de una sola veterinaria.
  const principal = filas[0];
  if (principal && pctPrincipal >= UMBRAL_DEPENDENCIA_PCT) {
    out.push({
      texto: `${principal.nombre} concentra gran parte de los referidos. Cuidar esa relación y buscar otras clínicas que deriven.`,
      dato: `${pct(pctPrincipal)} de las cremaciones referidas en el período (${principal.cremaciones}).`,
    });
  }

  // 2. Caídas de actividad.
  for (const f of filas.filter((x) => x.caida).slice(0, 1)) {
    out.push({
      texto: `${f.nombre} baja su actividad. Conviene contactarla para revisar si cambió el flujo de derivaciones.`,
      dato: `${signo(f.variacionPct)} vs. período anterior (${f.previas} → ${f.cremaciones} cremaciones).`,
    });
  }

  // 3. Crecimiento significativo.
  for (const f of filas.filter((x) => x.crece).slice(0, 1)) {
    out.push({
      texto: `${f.nombre} crece con fuerza. Reconocer la relación y revisar la capacidad de agenda para atender sus casos.`,
      dato: `${signo(f.variacionPct)} vs. período anterior, con ${f.cremaciones} cremaciones.`,
    });
  }

  if (out.length === 0) {
    out.push({
      texto: "Ninguna veterinaria tiene una caída o un crecimiento que requiera acción en este período.",
      dato: `Alertas: caída de ${Math.abs(UMBRAL_CAIDA_PCT)}% o más, crecimiento de ${UMBRAL_CRECIMIENTO_PCT}% o más, con ${MIN_CREMACIONES_ALERTA} casos como mínimo.`,
    });
  }
  return out.slice(0, 3);
}
