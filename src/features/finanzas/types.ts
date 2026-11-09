export type GastoGrupo = "Local" | "Servicios" | "Administración" | "Personal" | "Préstamos";

export const GRUPOS_GASTO: GastoGrupo[] = ["Local", "Servicios", "Administración", "Personal", "Préstamos"];

/** Mensual: se paga cada mes. Anual: se paga una vez al año, en `mesPago`. */
export type Frecuencia = "mensual" | "anual";

/** Gasto que se repite (luz, sueldos, cuotas de préstamos, seguros, etc.). */
export interface GastoFijo {
  id: string;
  nombre: string;
  grupo: GastoGrupo;
  /** Monto de cada pago: mensual si la frecuencia es mensual, por año si es anual. */
  monto: number;
  frecuencia: Frecuencia;
  /** Solo anuales: mes en que se paga (1 a 12). */
  mesPago?: number;
  /** Solo para préstamos: saldo que aún queda por pagar. */
  saldoPendiente?: number;
}

export const CATEGORIAS_GASTO_VARIABLE = [
  "Combustible",
  "Mantenimiento del auto",
  "Peajes y estacionamiento",
  "Lavado y desinfección",
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
  /** "vehiculo" = registrado desde el módulo Vehículo (combustible, mantenimiento, etc.). */
  origen?: "manual" | "vehiculo";
  /** Establecimiento o taller donde se hizo el gasto. */
  proveedor?: string;
  /** Solo gastos de vehículo: odómetro al momento del registro. */
  kilometraje?: number;
  /** Solo gastos de vehículo con combustible: galones cargados. */
  galones?: number;
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
