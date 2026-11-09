import type { CasoReportable, PlanId } from "../types";
import { DIAS_ALERTA, DIAS_COLCHON, HORIZONTE_MESES, INSUMOS, type Insumo, type InsumoId, MESES_TENDENCIA, receta } from "../data/abastecimiento.mock";
import { rangoDePeso, ventanaMeses } from "./reportes";

export const PLANES_CON_RECETA: PlanId[] = ["clasico", "paz", "eco"];

export const PLAN_CORTO: Record<PlanId, string> = {
  clasico: "Clásico",
  paz: "Paz",
  eco: "Eco",
  "sin-clasificar": "Sin clasificar",
};

export type EstadoInsumo = "critico" | "atencion" | "ok";

export interface FilaInsumo {
  insumo: Insumo;
  /** Cantidad consumida en el período elegido. */
  consumoPeriodo: number;
  /** Consumo mensual proyectado según la tendencia de ventas. */
  consumoMesProyectado: number;
  /** Lo que se necesitará en el horizonte (3 meses). */
  necesidadHorizonte: number;
  /** Días de stock al ritmo proyectado; null si no hay consumo. */
  coberturaDias: number | null;
  /** Días que faltan para hacer el pedido sin quedarse sin stock; null si no hay consumo. */
  diasHastaPedir: number | null;
  /** Cantidad sugerida para comprar. */
  comprar: number;
  estado: EstadoInsumo;
  /** Fecha sugerida del pedido, YYYY-MM-DD. */
  fechaPedir: string | null;
  /** Consumo del período por plan, para explicar de dónde sale. */
  porPlan: Record<PlanId, number>;
}

export interface ResultadoAbastecimiento {
  filas: FilaInsumo[];
  /** Cremaciones del período sin plan clasificado: no tienen receta. */
  sinClasificar: number;
  /** Ventas por plan en el período y su tendencia proyectada por mes. */
  planes: { plan: PlanId; ventasPeriodo: number; proyeccionMes: number }[];
}

export function fechaISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return fechaISO(d);
}

export function formatoFechaCorta(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function formatoCantidad(n: number): string {
  return n.toLocaleString("es-PE", { maximumFractionDigits: 1 });
}

/** Promedio de los próximos `pasos` valores de una tendencia lineal ajustada a `serie`. */
export function proyeccionMedia(serie: number[], pasos: number): number {
  const n = serie.length;
  if (n === 0) return 0;
  const xs = serie.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = serie.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((acc, x, i) => acc + (x - mx) * (serie[i] - my), 0);
  const den = xs.reduce((acc, x) => acc + (x - mx) ** 2, 0);
  const pendiente = den === 0 ? 0 : num / den;
  const intercepto = my - pendiente * mx;
  let suma = 0;
  for (let k = 0; k < pasos; k++) suma += Math.max(0, intercepto + pendiente * (n + k));
  return suma / pasos;
}

interface Entrada {
  casos: CasoReportable[];
  casosPeriodo: CasoReportable[];
  finClave: string;
  longitud: number;
  planFiltro: PlanId | "todos";
  hoy: string;
}

export function calcularAbastecimiento(e: Entrada): ResultadoAbastecimiento {
  const planes: PlanId[] = e.planFiltro === "todos" ? PLANES_CON_RECETA : [e.planFiltro];
  const enFiltro = (p: PlanId) => planes.includes(p);

  // Tendencia por plan: ventas mensuales de los últimos 12 meses.
  const meses = ventanaMeses(e.finClave, MESES_TENDENCIA);
  const conteoMes: Record<string, Record<string, number>> = {};
  for (const c of e.casos) {
    const mes = c.fecha.slice(0, 7);
    conteoMes[c.plan] ??= {};
    conteoMes[c.plan][mes] = (conteoMes[c.plan][mes] ?? 0) + 1;
  }

  const ventasPeriodo: Record<PlanId, number> = { clasico: 0, paz: 0, eco: 0, "sin-clasificar": 0 };
  for (const c of e.casosPeriodo) ventasPeriodo[c.plan] += 1;

  const factorPlan: Record<string, number> = {};
  const planesInfo = planes.map((plan) => {
    const serie = meses.map((m) => conteoMes[plan]?.[m] ?? 0);
    const proyeccionMes = proyeccionMedia(serie, HORIZONTE_MESES);
    const promedioPeriodo = ventasPeriodo[plan] / e.longitud;
    factorPlan[plan] = promedioPeriodo > 0 ? proyeccionMes / promedioPeriodo : 1;
    return { plan, ventasPeriodo: ventasPeriodo[plan], proyeccionMes };
  });

  // Consumo del período por insumo y plan, según la receta de cada variante.
  const consumo: Record<string, Record<string, number>> = {};
  for (const c of e.casosPeriodo) {
    if (!enFiltro(c.plan) || c.pesoKg === undefined) continue;
    const r = receta(c.plan, rangoDePeso(c.pesoKg));
    for (const [insumo, cantidad] of Object.entries(r) as [InsumoId, number][]) {
      consumo[insumo] ??= {};
      consumo[insumo][c.plan] = (consumo[insumo][c.plan] ?? 0) + cantidad;
    }
  }

  const filas: FilaInsumo[] = INSUMOS.map((insumo) => {
    const porPlan = { clasico: 0, paz: 0, eco: 0, "sin-clasificar": 0 } as Record<PlanId, number>;
    let consumoPeriodo = 0;
    let consumoMesProyectado = 0;
    for (const plan of planes) {
      const q = consumo[insumo.id]?.[plan] ?? 0;
      porPlan[plan] = q;
      consumoPeriodo += q;
      consumoMesProyectado += (q / e.longitud) * (factorPlan[plan] ?? 1);
    }

    const necesidadHorizonte = consumoMesProyectado * HORIZONTE_MESES;
    if (consumoMesProyectado <= 0) {
      return {
        insumo, consumoPeriodo, consumoMesProyectado, necesidadHorizonte,
        coberturaDias: null, diasHastaPedir: null, comprar: 0,
        estado: insumo.stock < insumo.minimo ? "atencion" : "ok", fechaPedir: null, porPlan,
      };
    }

    const consumoDiario = consumoMesProyectado / 30;
    const coberturaDias = insumo.stock / consumoDiario;
    const diasHastaPedir = coberturaDias - insumo.leadTimeDias;
    // Cubrir lo que se consume mientras llega el pedido, más un mes de colchón, sin bajar del mínimo.
    const objetivo = Math.max(consumoDiario * (insumo.leadTimeDias + DIAS_COLCHON), insumo.minimo);
    const comprar = Math.max(0, Math.ceil(objetivo - insumo.stock));

    let estado: EstadoInsumo = "ok";
    if (coberturaDias < insumo.leadTimeDias) estado = "critico";
    else if (diasHastaPedir <= DIAS_ALERTA || insumo.stock < insumo.minimo) estado = "atencion";

    const fechaPedir = diasHastaPedir <= 0 ? e.hoy : sumarDias(e.hoy, Math.round(diasHastaPedir));

    return {
      insumo, consumoPeriodo, consumoMesProyectado, necesidadHorizonte,
      coberturaDias, diasHastaPedir, comprar, estado, fechaPedir, porPlan,
    };
  });

  const orden: Record<EstadoInsumo, number> = { critico: 0, atencion: 1, ok: 2 };
  filas.sort(
    (a, b) =>
      orden[a.estado] - orden[b.estado] ||
      (a.diasHastaPedir ?? Infinity) - (b.diasHastaPedir ?? Infinity) ||
      a.insumo.nombre.localeCompare(b.insumo.nombre, "es")
  );

  return { filas, sinClasificar: ventasPeriodo["sin-clasificar"], planes: planesInfo };
}

/** Frases para la sección de conclusiones. Se generan solo a partir de los números. */
export function conclusiones(r: ResultadoAbastecimiento): string[] {
  const out: string[] = [];
  for (const f of r.filas.filter((x) => x.estado !== "ok").slice(0, 3)) {
    const { nombre, unidad, leadTimeDias, proveedor } = f.insumo;
    const dias = f.coberturaDias === null ? null : Math.round(f.coberturaDias);
    const reparto = (Object.entries(f.porPlan) as [PlanId, number][])
      .filter(([, q]) => q > 0)
      .sort((a, b) => b[1] - a[1]);
    const total = reparto.reduce((acc, [, q]) => acc + q, 0);
    const principal = reparto[0];
    const pctPrincipal = principal && total > 0 ? Math.round((principal[1] / total) * 100) : 0;
    const quien = principal && reparto.length > 1 ? ` ${PLAN_CORTO[principal[0]]} explica el ${pctPrincipal}% del consumo.` : "";

    if (f.estado === "critico") {
      out.push(
        `${nombre} (${proveedor}): quedan unos ${dias} días de stock y la entrega tarda ${leadTimeDias} días. No llega a tiempo: comprar ${f.comprar} ${unidad} de inmediato.${quien}`
      );
    } else {
      const cuando = f.diasHastaPedir !== null && f.diasHastaPedir <= 0 ? "ya" : `antes del ${formatoFechaCorta(f.fechaPedir ?? "")}`;
      out.push(
        `${nombre}: quedan unos ${dias} días de stock. Pedir ${cuando} para recibir a tiempo (entrega ${leadTimeDias} días).${quien}`
      );
    }
  }
  if (r.sinClasificar > 0) {
    out.push(`${r.sinClasificar} ventas sin clasificar no tienen receta: no consumen insumos en este cálculo.`);
  }
  if (out.length === 0 || r.filas.every((f) => f.estado === "ok")) {
    out.unshift("Todos los insumos tienen cobertura suficiente para el período.");
  }
  return out;
}
