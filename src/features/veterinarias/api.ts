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
  /** Ficha del CRM de la que viene (null si no viene de una). Nombre, teléfono y dirección se editan allí. */
  crm_id: string | null;
  crm_codigo: string | null;
}

/** Campos que la aliada guarda por su cuenta. Nombre, teléfono y dirección vienen de la ficha del CRM. */
export const CAMPOS_DE_FICHA = ["nombre", "telefono", "direccion"] as const;

export type VeterinariaCuerpo = Omit<Veterinaria, "id" | "crm_id" | "crm_codigo">;

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

// Sin alta: las aliadas nacen de una ficha del CRM (POST /crm/comercial/{id}/convertir).
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
