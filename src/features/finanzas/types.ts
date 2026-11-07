export type GastoGrupo = "Local" | "Servicios" | "Personal" | "Préstamos";

export const GRUPOS_GASTO: GastoGrupo[] = ["Local", "Servicios", "Personal", "Préstamos"];

/** Gasto que se repite cada mes (luz, sueldos, cuotas de préstamos, etc.). */
export interface GastoFijo {
  id: string;
  nombre: string;
  grupo: GastoGrupo;
  montoMensual: number;
  /** Solo para préstamos: saldo que aún queda por pagar. */
  saldoPendiente?: number;
}

export const CATEGORIAS_GASTO_VARIABLE = [
  "Combustible",
  "Mantenimiento del auto",
  "Compra de urnas",
  "Compras varias",
  "Reparaciones",
  "Caja chica",
] as const;

export type CategoriaGastoVariable = (typeof CATEGORIAS_GASTO_VARIABLE)[number];

/**
 * Gasto que ocurre cuando se necesita (no se repite cada mes),
 * como combustible, compra de urnas o reparaciones.
 */
export interface GastoVariable {
  id: string;
  /** Fecha del gasto, formato YYYY-MM-DD. */
  fecha: string;
  categoria: CategoriaGastoVariable;
  concepto: string;
  monto: number;
  observaciones?: string;
}

/**
 * Ingreso generado automáticamente por un servicio realizado.
 * No se crea a mano: en el futuro vendrá del módulo `casos`.
 */
export interface Ingreso {
  id: string;
  /** Fecha en que el servicio se realizó, formato YYYY-MM-DD. */
  fecha: string;
  casoId: string;
  mascota: string;
  servicio: string;
  monto: number;
}
