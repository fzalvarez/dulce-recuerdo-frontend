import api from "@/shared/lib/axios";

export interface Vehiculo {
  id: string;
  placa: string;
  descripcion: string | null;
  estado: "ACTIVO" | "INACTIVO";
  codigo_movil: string | null;
  modelo: string | null;
  tipo_unidad: string | null;
  anio_fabricacion: number | null;
  kilometraje_actual: number | null;
  soat_aseguradora: string | null;
  soat_poliza: string | null;
  soat_vence: string | null;
  citv_certificado: string | null;
  citv_planta: string | null;
  citv_vence: string | null;
}

export type VehiculoCuerpo = Omit<Vehiculo, "id">;

export type TipoEvento = "COMBUSTIBLE" | "MANTENIMIENTO_PROGRAMADO" | "MANTENIMIENTO_CORRECTIVO" | "LAVADO" | "PEAJES";

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  COMBUSTIBLE: "Combustible",
  MANTENIMIENTO_PROGRAMADO: "Mantenimiento preventivo",
  MANTENIMIENTO_CORRECTIVO: "Mantenimiento correctivo",
  LAVADO: "Lavado y desinfección",
  PEAJES: "Peajes y estacionamiento",
};

export interface Evento {
  id: string;
  vehiculo_id: string;
  tipo: TipoEvento;
  fecha: string;
  kilometraje: number;
  galones: string | null;
  monto: string;
  proveedor: string;
  observaciones: string | null;
  gasto_id: string | null;
}

export interface EventoCuerpo {
  tipo: TipoEvento;
  fecha: string;
  kilometraje: number;
  galones: string | null;
  monto: string;
  proveedor: string;
  observaciones: string | null;
}

export const listar = () => api.get<Vehiculo[]>("/vehiculos").then((r) => r.data);
export const crear = (c: VehiculoCuerpo) => api.post<Vehiculo>("/vehiculos", c);
export const editar = (id: string, c: Partial<VehiculoCuerpo>) => api.patch<Vehiculo>(`/vehiculos/${id}`, c);
export const eventos = (id: string) => api.get<Evento[]>(`/vehiculos/${id}/eventos`).then((r) => r.data);
export const registrarEvento = (id: string, c: EventoCuerpo) => api.post<Evento>(`/vehiculos/${id}/eventos`, c);
export const eliminarEvento = (id: string, eventoId: string) => api.delete(`/vehiculos/${id}/eventos/${eventoId}`);
