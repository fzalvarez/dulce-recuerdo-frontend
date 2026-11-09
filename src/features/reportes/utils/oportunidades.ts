import type { CasoReportable, PlanId } from "../types";
import { PRECIO_PLAN } from "../../casos/data/tarifas";
import { rangoDePeso } from "./reportes";

/** Umbrales de las reglas. Cambiarlos cambia las señales, no los datos. */
export const MIN_CREMACIONES_CRECIMIENTO = 5;
export const UMBRAL_CRECIMIENTO_PCT = 15;
export const UMBRAL_VETERINARIAS_PCT = 35;
export const TOP_ALTA_DEMANDA = 3;

const PLANES_CON_PRECIO: PlanId[] = ["clasico", "paz", "eco"];

export interface FilaDistrito {
  distrito: string;
  cremaciones: number;
  previas: number;
  /** Variación frente al período anterior de igual longitud; null si no hay base. */
  variacionPct: number | null;
  particulares: number;
  veterinarias: number;
  pctVeterinarias: number;
  /** Participación del distrito en el total de la ciudad, en el período y en el anterior. */
  participacion: number;
  participacionPrevia: number;
  /** Precio de planes por peso, sin traslado. */
  ingreso: number;
  planPrincipal: PlanId | null;
  altaDemanda: boolean;
  /** Sube al menos el umbral frente al período anterior, con volumen mínimo. */
  crece: boolean;
  /** Crece y además sube más que la ciudad (gana participación). */
  ganaTerreno: boolean;
  oportunidad: boolean;
}

export interface Conclusion {
  texto: string;
  dato: string;
}

export interface ResultadoOportunidades {
  filas: FilaDistrito[];
  ingresoTotal: number;
  cremacionesSinPrecio: number;
  conclusiones: Conclusion[];
}

function variacion(actual: number, previo: number): number | null {
  if (!previo) return null;
  return ((actual - previo) / previo) * 100;
}

export function formatoSolesCorto(n: number): string {
  return `S/ ${Math.round(n).toLocaleString("es-PE")}`;
}

export function calcularOportunidades(
  casos: CasoReportable[],
  ventana: string[],
  ventanaPrevia: string[]
): ResultadoOportunidades {
  const enVentana = new Set(ventana);
  const enPrevia = new Set(ventanaPrevia);

  const porDistrito = new Map<string, FilaDistrito>();
  const get = (distrito: string): FilaDistrito => {
    let f = porDistrito.get(distrito);
    if (!f) {
      f = {
        distrito, cremaciones: 0, previas: 0, variacionPct: null, particulares: 0, veterinarias: 0,
        pctVeterinarias: 0, participacion: 0, participacionPrevia: 0, ingreso: 0, planPrincipal: null,
        altaDemanda: false, crece: false, ganaTerreno: false, oportunidad: false,
      };
      porDistrito.set(distrito, f);
    }
    return f;
  };

  const conteoPlanes = new Map<string, Partial<Record<PlanId, number>>>();
  let cremacionesSinPrecio = 0;

  for (const c of casos) {
    const mes = c.fecha.slice(0, 7);
    if (enPrevia.has(mes)) get(c.distrito).previas += 1;
    if (!enVentana.has(mes)) continue;

    const f = get(c.distrito);
    f.cremaciones += 1;
    if (c.canal === "veterinaria") f.veterinarias += 1;
    else f.particulares += 1;

    if (PLANES_CON_PRECIO.includes(c.plan) && c.pesoKg !== undefined) {
      const plan = c.plan as Exclude<PlanId, "sin-clasificar">;
      f.ingreso += PRECIO_PLAN[plan][rangoDePeso(c.pesoKg)];
      const planes = conteoPlanes.get(c.distrito) ?? {};
      planes[plan] = (planes[plan] ?? 0) + 1;
      conteoPlanes.set(c.distrito, planes);
    } else {
      cremacionesSinPrecio += 1;
    }
  }

  const filas = [...porDistrito.values()]
    .filter((f) => f.cremaciones > 0 || f.previas > 0)
    .map((f) => {
      const planes = conteoPlanes.get(f.distrito) ?? {};
      const principal = PLANES_CON_PRECIO
        .filter((p) => (planes[p] ?? 0) > 0)
        .sort((a, b) => (planes[b] ?? 0) - (planes[a] ?? 0))[0] ?? null;
      return {
        ...f,
        variacionPct: variacion(f.cremaciones, f.previas),
        pctVeterinarias: f.cremaciones ? (f.veterinarias / f.cremaciones) * 100 : 0,
        planPrincipal: principal,
      };
    })
    .filter((f) => f.cremaciones > 0)
    .sort((a, b) => b.cremaciones - a.cremaciones || a.distrito.localeCompare(b.distrito, "es"));

  // Participación en la ciudad: un distrito "crece" si sube más que la ciudad, no solo si sube.
  const totalActual = filas.reduce((acc, f) => acc + f.cremaciones, 0);
  const totalPrevio = [...porDistrito.values()].reduce((acc, f) => acc + f.previas, 0);
  filas.forEach((f) => {
    f.participacion = totalActual ? (f.cremaciones / totalActual) * 100 : 0;
    f.participacionPrevia = totalPrevio ? (f.previas / totalPrevio) * 100 : 0;
  });

  // Alta demanda: los primeros del ranking. Crece: variación fuerte con volumen mínimo.
  filas.forEach((f, i) => {
    f.altaDemanda = i < TOP_ALTA_DEMANDA;
    f.crece =
      f.variacionPct !== null &&
      f.variacionPct >= UMBRAL_CRECIMIENTO_PCT &&
      f.cremaciones >= MIN_CREMACIONES_CRECIMIENTO;
    f.ganaTerreno = f.crece && f.participacion > f.participacionPrevia;
    // Oportunidad: demanda o crecimiento, y pocas veterinarias como fuente.
    f.oportunidad = (f.altaDemanda || f.crece) && f.pctVeterinarias < UMBRAL_VETERINARIAS_PCT;
  });

  const ingresoTotal = filas.reduce((acc, f) => acc + f.ingreso, 0);
  return { filas, ingresoTotal, cremacionesSinPrecio, conclusiones: conclusionesDe(filas) };
}

function conclusionesDe(filas: FilaDistrito[]): Conclusion[] {
  const out: Conclusion[] = [];
  const pct = (n: number) => `${Math.round(n)}%`;
  const signo = (n: number | null) => (n === null ? "sin base" : `${n > 0 ? "+" : ""}${Math.round(n)}%`);

  // 1. Oportunidades: demanda o crecimiento con pocas veterinarias.
  const oportunidades = filas.filter((f) => f.oportunidad).slice(0, 1);
  for (const f of oportunidades) {
    out.push({
      texto: `${f.distrito}: evaluar una alianza con veterinarias de la zona. Casi todo llega directo.`,
      dato: `${pct(100 - f.pctVeterinarias)} particulares, ${f.cremaciones} cremaciones (${signo(f.variacionPct)} vs. período anterior).`,
    });
  }

  // 2. Crecimiento sostenido.
  const crecen = filas.filter((f) => f.ganaTerreno && !f.oportunidad).slice(0, 1);
  for (const f of crecen) {
    out.push({
      texto: `${f.distrito} gana terreno frente a la ciudad: revisar la capacidad de agenda y traslado en esa zona.`,
      dato: `${signo(f.variacionPct)} vs. período anterior; pasa de ${pct(f.participacionPrevia)} a ${pct(f.participacion)} del total.`,
    });
  }

  // 3. Caídas en distritos de alta demanda.
  const caen = filas
    .filter((f) => f.altaDemanda && f.variacionPct !== null && f.variacionPct <= -10)
    .slice(0, 1);
  for (const f of caen) {
    out.push({
      texto: `${f.distrito} baja: confirmar si alguna veterinaria dejó de referir o si hay competencia nueva.`,
      dato: `${signo(f.variacionPct)} vs. período anterior; ${pct(f.pctVeterinarias)} de sus cremaciones vienen de veterinarias.`,
    });
  }

  if (out.length === 0) {
    out.push({
      texto: "Ningún distrito cumple las reglas de oportunidad en este período.",
      dato: `Umbrales: crecimiento desde ${UMBRAL_CRECIMIENTO_PCT}% con ${MIN_CREMACIONES_CRECIMIENTO} cremaciones, veterinarias por debajo de ${UMBRAL_VETERINARIAS_PCT}%.`,
    });
  }
  return out.slice(0, 3);
}
