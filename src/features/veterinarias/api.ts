import api from "@/shared/lib/axios";
import type { MetodoPago } from "@/features/casos/types";

export interface Veterinaria {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  estado: "ACTIVA" | "INACTIVA";
  tipo_convenio_id: string | null;
  observaciones: string | null;
}

export type VeterinariaCuerpo = Omit<Veterinaria, "id">;

export interface Catalogo {
  convenios: { id: string; nombre: string; activo: boolean }[];
  planes: { id: string; nombre: string }[];
  rangos: { id: string; etiqueta: string }[];
}

export interface CasoPendiente {
  caso_id: string;
  fecha_realizado: string | null;
  mascota: string;
  tutor: string;
  precio_total: string;
  total_pagado: string;
  monto: string;
}

export interface Factura {
  id: string;
  veterinaria_id: string;
  numero_comprobante: string | null;
  fecha_emision: string;
  total: string;
  estado: "EMITIDA" | "PAGADA" | "ANULADA";
  fecha_pago: string | null;
  metodo_pago: MetodoPago | null;
  motivo_anulacion: string | null;
}

export async function cargar(): Promise<{ veterinarias: Veterinaria[]; catalogo: Catalogo; porCobrar: Factura[] }> {
  const [v, c, f] = await Promise.all([
    api.get<Veterinaria[]>("/veterinarias"),
    api.get<Catalogo>("/veterinarias/catalogo"),
    api.get<Factura[]>("/facturas-veterinaria", { params: { estado: "EMITIDA" } }),
  ]);
  return { veterinarias: v.data, catalogo: c.data, porCobrar: f.data };
}

export const crear = (c: VeterinariaCuerpo) => api.post<Veterinaria>("/veterinarias", c);
export const editar = (id: string, c: VeterinariaCuerpo) => api.patch<Veterinaria>(`/veterinarias/${id}`, c);

export const preciosPropios = (id: string) =>
  api.get<Record<string, Record<string, string>>>(`/veterinarias/${id}/precios`).then((r) => r.data);
export const guardarPreciosPropios = (id: string, precios: Record<string, Record<string, string | null>>) =>
  api.put(`/veterinarias/${id}/precios`, { precios });

export async function facturacion(vetId: string): Promise<{ pendientes: CasoPendiente[]; facturas: Factura[] }> {
  const [p, f] = await Promise.all([
    api.get<CasoPendiente[]>("/facturas-veterinaria/pendientes", { params: { veterinaria_id: vetId } }),
    api.get<Factura[]>("/facturas-veterinaria", { params: { veterinaria_id: vetId } }),
  ]);
  return { pendientes: p.data, facturas: f.data };
}

export const emitir = (c: { veterinaria_id: string; caso_ids: string[]; fecha_emision?: string; numero_comprobante?: string }) =>
  api.post<Factura>("/facturas-veterinaria", c);
export const cobrar = (id: string, metodo: MetodoPago, fecha: string) => api.post(`/facturas-veterinaria/${id}/cobro`, { metodo, fecha });
export const anular = (id: string, motivo: string) => api.post(`/facturas-veterinaria/${id}/anular`, { motivo });
