import type { CasoReportable, Canal } from "../types";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Clave de mes "YYYY-MM" a partir de una fecha. */
export function claveMes(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

export function desplazarMes(clave: string, delta: number): string {
  const [y, m] = clave.split("-").map(Number);
  return claveMes(new Date(y, m - 1 + delta, 1));
}

/** Meses de la ventana que termina en `finClave`, del más antiguo al más reciente. */
export function ventanaMeses(finClave: string, longitud: number): string[] {
  const meses: string[] = [];
  for (let i = longitud - 1; i >= 0; i--) meses.push(desplazarMes(finClave, -i));
  return meses;
}

export function etiquetaMesCorta(clave: string): string {
  const [y, m] = clave.split("-").map(Number);
  return `${MESES_CORTOS[m - 1]} ${String(y).slice(2)}`;
}

export function etiquetaMesLarga(clave: string): string {
  const [y, m] = clave.split("-").map(Number);
  return `${MESES_LARGOS[m - 1]} ${y}`;
}

/** Último mes que ya cerró respecto de `hoy`. */
export function ultimoMesCompleto(hoy: Date): string {
  return desplazarMes(claveMes(hoy), -1);
}

/** Cuenta casos por mes; `filtro` decide cuáles entran. */
export function contarPorMes(
  casos: CasoReportable[],
  filtro: (c: CasoReportable) => boolean = () => true
): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const c of casos) {
    if (!filtro(c)) continue;
    const mes = c.fecha.slice(0, 7);
    conteo[mes] = (conteo[mes] ?? 0) + 1;
  }
  return conteo;
}

export function contarPorCanal(casos: CasoReportable[], canal: Canal, meses: string[]) {
  const conjunto = new Set(meses);
  return contarPorMes(casos, (c) => c.canal === canal && conjunto.has(c.fecha.slice(0, 7)));
}

/** Variación en porcentaje; null si no hay base de comparación. */
export function variacionPct(actual: number, base: number): number | null {
  if (!base) return null;
  return ((actual - base) / base) * 100;
}

/** Variación con signo, para los reportes de crecimiento. */
export function formatPct(valor: number | null): string {
  if (valor === null) return "—";
  const signo = valor > 0 ? "+" : valor < 0 ? "−" : "";
  return `${signo}${Math.abs(valor).toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`;
}

/** Parte de un total, en porcentaje; null si el total es 0. */
export function porcentaje(parte: number, total: number): number | null {
  if (!total) return null;
  return (parte / total) * 100;
}

/** Porcentaje de participación, sin signo. */
export function formatPorcentaje(valor: number | null): string {
  if (valor === null) return "—";
  return `${valor.toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`;
}

export interface Ranking {
  id: string;
  nombre: string;
  valor: number;
}

/** Ordena de mayor a menor; empates por nombre alfabético. */
export function ordenarRanking<T extends Ranking>(filas: T[]): T[] {
  return [...filas].sort((a, b) => b.valor - a.valor || a.nombre.localeCompare(b.nombre, "es"));
}

export function sumar(valores: number[]): number {
  return valores.reduce((acc, v) => acc + v, 0);
}

export type RangoPesoId = "0-5" | "5-15" | "15-25" | "25-35" | "35+";

export const RANGOS_PESO: { id: RangoPesoId; etiqueta: string }[] = [
  { id: "0-5", etiqueta: "0 a 5 kg" },
  { id: "5-15", etiqueta: "5,1 a 15 kg" },
  { id: "15-25", etiqueta: "15,1 a 25 kg" },
  { id: "25-35", etiqueta: "25,1 a 35 kg" },
  { id: "35+", etiqueta: "35,1 kg o más" },
];

/** Rango de peso de un kilogramo exacto: 5 kg cae en "0-5", 5,1 kg en "5-15". */
export function rangoDePeso(kg: number): RangoPesoId {
  if (kg <= 5) return "0-5";
  if (kg <= 15) return "5-15";
  if (kg <= 25) return "15-25";
  if (kg <= 35) return "25-35";
  return "35+";
}
