import api from "@/shared/lib/axios";
import type { CategoriaGasto, Gasto } from "@/features/finanzas/types";

/** Factura de compra tal como la devuelve el backend (spec facturas-compra). Montos como texto. */
export interface FacturaCompra {
  id: string;
  numero_serie: string;
  /** "YYYY-MM-DD" */
  fecha: string;
  ruc_proveedor: string;
  razon_social: string;
  concepto: string;
  total: string;
  igv: string;
  base: string;
  gasto_id: string | null;
  tiene_adjunto: boolean;
  adjunto_nombre: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacturaCuerpo {
  numero_serie: string;
  fecha: string;
  ruc_proveedor: string;
  razon_social: string;
  concepto: string;
  total: string;
  igv: string;
}

export interface FacturaFiltros {
  q?: string;
  desde?: string;
  hasta?: string;
}

/** Tipos de adjunto que acepta el backend, y su tamaño máximo (5 MB). */
export const TIPOS_ADJUNTO = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const TAMANO_ADJUNTO_MAX = 5 * 1024 * 1024;

export const listarFacturas = (f: FacturaFiltros) =>
  api.get<FacturaCompra[]>("/facturas-compra", { params: f }).then((r) => r.data);

export const crearFactura = (c: FacturaCuerpo & { gasto_id?: string | null; crear_gasto_categoria?: CategoriaGasto | null }) =>
  api.post<FacturaCompra>("/facturas-compra", c).then((r) => r.data);

export const editarFactura = (id: string, c: Partial<FacturaCuerpo>) =>
  api.patch<FacturaCompra>(`/facturas-compra/${id}`, c).then((r) => r.data);

export const eliminarFactura = (id: string) => api.delete(`/facturas-compra/${id}`);

export const subirAdjunto = (id: string, archivo: File) => {
  const datos = new FormData();
  datos.append("archivo", archivo);
  return api.put<FacturaCompra>(`/facturas-compra/${id}/adjunto`, datos).then((r) => r.data);
};

export const quitarAdjunto = (id: string) => api.delete(`/facturas-compra/${id}/adjunto`);

/** Descarga el adjunto y devuelve una URL local para mostrarlo (imagen o PDF). Libérala con URL.revokeObjectURL. */
export async function cargarAdjunto(id: string): Promise<{ url: string; tipo: string }> {
  const r = await api.get<Blob>(`/facturas-compra/${id}/adjunto`, { responseType: "blob" });
  return { url: URL.createObjectURL(r.data), tipo: r.data.type };
}

/** Gastos recientes, para vincularlos a una factura. */
export const listarGastosRecientes = () => {
  const hoy = new Date();
  const hace = new Date(hoy);
  hace.setDate(hace.getDate() - 180);
  const iso = (d: Date) => `${d.toISOString().slice(0, 10)}T00:00:00`;
  return api.get<Gasto[]>("/gastos", { params: { desde: iso(hace), hasta: `${hoy.toISOString().slice(0, 10)}T23:59:59` } }).then((r) => r.data);
};

/** Campos que sugiere la IA a partir del PDF o la foto. Nulo = no se pudo leer con claridad. */
export interface FacturaExtraida {
  numero_serie: string | null;
  fecha: string | null;
  ruc_proveedor: string | null;
  razon_social: string | null;
  concepto: string | null;
  total: string | null;
  igv: string | null;
  confianza: "alta" | "media" | "baja";
}

/** Lee la factura con IA. No guarda nada: el usuario revisa los campos antes de confirmar. */
export const leerFacturaIA = (archivo: File) => {
  const datos = new FormData();
  datos.append("archivo", archivo);
  // Un PDF se procesa al subirlo: la lectura puede tardar más que el tiempo normal de una petición.
  return api.post<FacturaExtraida>("/facturas-compra/leer", datos, { timeout: 200_000 }).then((r) => r.data);
};
