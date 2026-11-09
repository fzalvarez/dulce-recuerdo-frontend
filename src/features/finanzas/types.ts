/** Tipos de Ingresos y Gastos, tal como los devuelve el backend (spec finanzas). */

export type Monto = string;

export type GrupoGastoFijo = "LOCAL" | "SERVICIOS" | "ADMINISTRACION" | "PERSONAL" | "PRESTAMOS";
export type Frecuencia = "MENSUAL" | "ANUAL";

export const GRUPO_LABEL: Record<GrupoGastoFijo, string> = {
  LOCAL: "Local",
  SERVICIOS: "Servicios",
  ADMINISTRACION: "Administración",
  PERSONAL: "Personal",
  PRESTAMOS: "Préstamos",
};

export interface GastoFijo {
  id: string;
  nombre: string;
  grupo: GrupoGastoFijo;
  /** Monto base: estima los meses sin registro. */
  monto: Monto;
  frecuencia: Frecuencia;
  mes_pago: number | null;
  saldo_pendiente: Monto | null;
  activo: boolean;
  observaciones: string | null;
}

export interface GastoFijoDelMes {
  gasto_fijo_id: string;
  nombre: string;
  grupo: GrupoGastoFijo;
  frecuencia: Frecuencia;
  monto_base: Monto;
  monto: Monto;
  estado: "REGISTRADO" | "ESTIMADO";
  observaciones: string | null;
  saldo_pendiente: Monto | null;
}

export type CategoriaGasto =
  | "COMBUSTIBLE"
  | "MANTENIMIENTO_AUTO"
  | "PEAJES_ESTACIONAMIENTO"
  | "LAVADO_DESINFECCION"
  | "COMPRA_URNAS"
  | "COMPRAS_VARIAS"
  | "REPARACIONES"
  | "CAJA_CHICA"
  | "ADICIONALES_PERSONAL";

export const CATEGORIA_LABEL: Record<CategoriaGasto, string> = {
  COMBUSTIBLE: "Combustible",
  MANTENIMIENTO_AUTO: "Mantenimiento del auto",
  PEAJES_ESTACIONAMIENTO: "Peajes y estacionamiento",
  LAVADO_DESINFECCION: "Lavado y desinfección",
  COMPRA_URNAS: "Compra de urnas",
  COMPRAS_VARIAS: "Compras varias",
  REPARACIONES: "Reparaciones",
  CAJA_CHICA: "Caja chica",
  ADICIONALES_PERSONAL: "Adicionales del personal",
};

export type OrigenGasto = "MANUAL" | "VEHICULO" | "INVENTARIO";

export interface Gasto {
  id: string;
  fecha: string;
  concepto: string;
  categoria: CategoriaGasto;
  monto: Monto;
  origen: OrigenGasto;
  proveedor: string | null;
  vehiculo_id: string | null;
  observaciones: string | null;
}

export interface Ingreso {
  caso_id: string;
  fecha: string;
  mascota: string;
  servicio: string;
  canal_origen: "CLIENTE_DIRECTO" | "VETERINARIA_REFERIDORA";
  monto: Monto;
}

export interface Resumen {
  mes: string;
  ingresos: { total: Monto; cantidad: number };
  gastos_fijos: { total: Monto; registrado: Monto; estimado: Monto; por_grupo: { grupo: GrupoGastoFijo; total: Monto }[] };
  gastos_variables: { total: Monto; por_categoria: { categoria: CategoriaGasto; total: Monto }[] };
  total_gastos: Monto;
  resultado: Monto;
}
