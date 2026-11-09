import type { CasoReportable, PlanId } from "../types";
import { DIAS_ALERTA, DIAS_COLCHON, HORIZONTE_MESES, INSUMOS, type Insumo, MESES_TENDENCIA, receta } from "../data/abastecimiento.mock";
import { rangoDePeso, ventanaMeses } from "./reportes";

export type EstadoInsumo = "critico" | "atencion" | "ok";

export interface FilaInsumo {
  insumo: Insumo;
  /** Consumo mensual proyectado según la tendencia de ventas. */
  consumoMes: number;
  /** Lo que se usará en el horizonte (3 meses). */
  necesidad: number;
  /** Días de stock al ritmo proyectado; null si no hay consumo. */
  coberturaDias: number | null;
  /** Cuántas unidades comprar; 0 si no hace falta. */
  comprar: number;
  estado: EstadoInsumo;
  /** Fecha sugerida del pedido, YYYY-MM-DD; null si no hace falta. */
  fechaPedir: string | null;
  /** Hoy hay que pedir (ya no alcanza el tiempo de entrega). */
  pedirYa: boolean;
}

export interface ResultadoAbastecimiento {
  filas: FilaInsumo[];
  /** Cremaciones del período sin plan clasificado: no tienen receta. */
  sinClasificar: number;
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

const PLANES: PlanId[] = ["clasico", "paz", "eco"];

interface Entrada {
  casos: CasoReportable[];
  casosPeriodo: CasoReportable[];
  finClave: string;
  longitud: number;
  hoy: string;
}

export function calcularAbastecimiento(e: Entrada): ResultadoAbastecimiento {
  // Tendencia por plan con los últimos 12 meses de ventas.
  const meses = ventanaMeses(e.finClave, MESES_TENDENCIA);
  const conteoMes: Record<string, Record<string, number>> = {};
  for (const c of e.casos) {
    const mes = c.fecha.slice(0, 7);
    conteoMes[c.plan] ??= {};
    conteoMes[c.plan][mes] = (conteoMes[c.plan][mes] ?? 0) + 1;
  }

  // Factor de tendencia por plan: proyección mensual frente al promedio del período.
  const ventasPeriodo: Record<PlanId, number> = { clasico: 0, paz: 0, eco: 0, "sin-clasificar": 0 };
  for (const c of e.casosPeriodo) ventasPeriodo[c.plan] += 1;

  const factor: Partial<Record<PlanId, number>> = {};
  for (const plan of PLANES) {
    const serie = meses.map((m) => conteoMes[plan]?.[m] ?? 0);
    const proyeccion = proyeccionMedia(serie, HORIZONTE_MESES);
    const promedio = ventasPeriodo[plan] / e.longitud;
    factor[plan] = promedio > 0 ? proyeccion / promedio : 1;
  }

  // Consumo del período por insumo, según la receta de cada cremación.
  const consumoPeriodo: Record<string, Partial<Record<PlanId, number>>> = {};
  for (const c of e.casosPeriodo) {
    if (c.pesoKg === undefined || c.plan === "sin-clasificar") continue;
    const r = receta(c.plan, rangoDePeso(c.pesoKg));
    for (const [insumo, cantidad] of Object.entries(r)) {
      consumoPeriodo[insumo] ??= {};
      consumoPeriodo[insumo][c.plan] = (consumoPeriodo[insumo][c.plan] ?? 0) + (cantidad ?? 0);
    }
  }

  const filas: FilaInsumo[] = INSUMOS.map((insumo) => {
    // Consumo mensual proyectado: lo del período por plan, escalado por la tendencia.
    // Los insumos compartidos (sobre, bolsa, certificado) se cuentan una sola vez por cremación.
    let consumoMes = 0;
    for (const plan of PLANES) {
      consumoMes += ((consumoPeriodo[insumo.id]?.[plan] ?? 0) / e.longitud) * (factor[plan] ?? 1);
    }
    const necesidad = consumoMes * HORIZONTE_MESES;

    if (consumoMes <= 0) {
      return {
        insumo, consumoMes, necesidad, coberturaDias: null, comprar: 0,
        estado: insumo.stock < insumo.minimo ? "atencion" : "ok", fechaPedir: null, pedirYa: false,
      };
    }

    const consumoDiario = consumoMes / 30;
    const coberturaDias = insumo.stock / consumoDiario;
    const diasHastaPedir = coberturaDias - insumo.leadTimeDias;
    // Lo necesario hasta que llegue el pedido, más un mes de colchón, sin bajar del mínimo.
    const objetivo = Math.max(consumoDiario * (insumo.leadTimeDias + DIAS_COLCHON), insumo.minimo);
    const comprar = Math.max(0, Math.ceil(objetivo - insumo.stock));

    let estado: EstadoInsumo = "ok";
    if (coberturaDias < insumo.leadTimeDias) estado = "critico";
    else if (diasHastaPedir <= DIAS_ALERTA || insumo.stock < insumo.minimo) estado = "atencion";

    // Con stock OK no se muestra acción de compra: solo se sugiere cuando hay alerta.
    if (estado === "ok") {
      return { insumo, consumoMes, necesidad, coberturaDias, comprar: 0, estado, fechaPedir: null, pedirYa: false };
    }
    const pedirYa = diasHastaPedir <= 0;
    const fechaPedir = pedirYa ? e.hoy : sumarDias(e.hoy, Math.round(diasHastaPedir));
    return { insumo, consumoMes, necesidad, coberturaDias, comprar, estado, fechaPedir, pedirYa };
  });

  const orden: Record<EstadoInsumo, number> = { critico: 0, atencion: 1, ok: 2 };
  filas.sort(
    (a, b) =>
      orden[a.estado] - orden[b.estado] ||
      (a.coberturaDias ?? Infinity) - (b.coberturaDias ?? Infinity) ||
      a.insumo.nombre.localeCompare(b.insumo.nombre, "es")
  );

  return { filas, sinClasificar: ventasPeriodo["sin-clasificar"] };
}

/** Dos o tres conclusiones cortas, solo con los insumos que requieren acción. */
export function conclusiones(r: ResultadoAbastecimiento): string[] {
  const alerta = r.filas.filter((f) => f.estado !== "ok").slice(0, 3);
  const out = alerta.map((f) => {
    const { nombre, unidad, leadTimeDias } = f.insumo;
    const dias = f.coberturaDias === null ? 0 : Math.round(f.coberturaDias);
    if (f.estado === "critico") {
      return `${nombre}: quedan ${dias} días y la entrega tarda ${leadTimeDias}. Comprar ${f.comprar} ${unidad} hoy.`;
    }
    return `${nombre}: quedan ${dias} días. Pedir antes del ${formatoFechaCorta(f.fechaPedir ?? "")}.`;
  });
  if (r.sinClasificar > 0) {
    out.push(`${r.sinClasificar} cremaciones sin plan clasificado no tienen receta y no descuentan insumos.`);
  }
  if (alerta.length === 0) out.unshift("Todos los insumos tienen cobertura para el período.");
  return out;
}
