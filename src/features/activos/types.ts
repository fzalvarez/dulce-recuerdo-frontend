// Activos: equipos durables. Se controlan por estado y ubicación, no por stock (spec inventario §3).

export type CategoriaActivo = "TRASLADO" | "ATENCION" | "CREMACION" | "MOBILIARIO";
export type EstadoActivo = "OPERATIVO" | "EN_REPARACION" | "DADO_DE_BAJA";

export const CATEGORIA_LABEL: Record<CategoriaActivo, string> = {
  TRASLADO: "Traslado",
  ATENCION: "Atención",
  CREMACION: "Cremación",
  MOBILIARIO: "Mobiliario",
};

export const ESTADO_LABEL: Record<EstadoActivo, string> = {
  OPERATIVO: "Operativo",
  EN_REPARACION: "En reparación",
  DADO_DE_BAJA: "Dado de baja",
};

export interface Activo {
  id: string;
  /** Código interno, único. Ej: ACT-TAP-01 */
  codigo: string;
  nombre: string;
  categoria: CategoriaActivo;
  cantidad: number;
  fecha_compra: string | null;
  /** Costo total en S/ (texto decimal). */
  costo: string;
  estado: EstadoActivo;
  ubicacion: string | null;
  proxima_revision: string | null;
  observaciones: string | null;
}

export type ActivoCuerpo = Omit<Activo, "id">;
