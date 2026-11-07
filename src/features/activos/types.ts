// Activos: equipos durables. Se controlan por estado y ubicación, no por stock.

export const CATEGORIAS_ACTIVO = ["Traslado", "Atención", "Cremación", "Mobiliario"] as const;
export type CategoriaActivo = (typeof CATEGORIAS_ACTIVO)[number];

export const ESTADOS_ACTIVO = {
  operativo: "Operativo",
  reparacion: "En reparación",
  baja: "Dado de baja",
} as const;
export type EstadoActivo = keyof typeof ESTADOS_ACTIVO;

export interface Activo {
  id: string;
  /** Código interno, único. Ej: ACT-TAP-01 */
  codigo: string;
  nombre: string;
  categoria: CategoriaActivo;
  /** Unidades que se registran bajo este código (ej. 4 tapers iguales). */
  cantidad: number;
  /** Fecha de compra, formato YYYY-MM-DD. */
  fechaCompra: string;
  /** Costo total pagado en S/. */
  costo: number;
  estado: EstadoActivo;
  /** Dónde está: sede, furgoneta, sala, taller... */
  ubicacion: string;
  /** Próxima revisión o mantenimiento, YYYY-MM-DD (opcional). */
  proximaRevision?: string;
  observaciones?: string;
}

export type ActivoData = Omit<Activo, "id">;
