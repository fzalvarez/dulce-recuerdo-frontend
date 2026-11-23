import api from "@/shared/lib/axios";

/** Comprobante electrónico emitido con Intifact (boleta 03 o factura 01). */
export interface Comprobante {
  id: string;
  caso_id: string | null;
  factura_veterinaria_id: string | null;
  tipo_doc: "01" | "03";
  serie: string;
  correlativo: string;
  numero: string;
  fecha_emision: string;
  cliente_tipo_doc: string;
  cliente_num_doc: string;
  cliente_razon_social: string;
  cliente_direccion: string | null;
  valor_venta: string;
  igv: string;
  total: string;
  precios_incluyen_igv: boolean;
  /** Estado SUNAT: ENCOLADO, ENVIANDO, ACEPTADO, RECHAZADO, ANULANDO, ANULADO… */
  estado: string;
  codigo_respuesta: string | null;
  descripcion_respuesta: string | null;
  /** test = SUNAT beta, sin valor fiscal. */
  ambiente: "test" | "live";
  created_at: string;
}

export type TipoDocCliente = "1" | "4" | "6" | "7";

export const TIPO_DOC_CLIENTE: Record<TipoDocCliente, string> = {
  "1": "DNI",
  "6": "RUC",
  "4": "Carné de extranjería",
  "7": "Pasaporte",
};

/** Estados después de los cuales se puede volver a emitir. El resto cuenta como vigente. */
export const NO_VIGENTES = ["RECHAZADO", "ANULADO", "ERROR", "COLA_FALLIDA"];

export const listar = (filtro: { caso_id?: string; factura_veterinaria_id?: string }) =>
  api.get<Comprobante[]>("/comprobantes", { params: filtro }).then((r) => r.data);

export const emitirParaCaso = (
  casoId: string,
  cuerpo: { tipo: "BOLETA" | "FACTURA"; cliente_tipo_doc: TipoDocCliente; cliente_num_doc: string; cliente_razon_social: string; cliente_direccion?: string | null }
) => api.post<Comprobante>(`/comprobantes/caso/${casoId}`, cuerpo).then((r) => r.data);

export const emitirFacturaConvenio = (
  facturaId: string,
  cuerpo: { cliente_num_doc: string; cliente_razon_social: string; cliente_direccion?: string | null }
) => api.post<Comprobante>(`/comprobantes/factura-convenio/${facturaId}`, cuerpo).then((r) => r.data);

export const actualizar = (id: string) => api.post<Comprobante>(`/comprobantes/${id}/actualizar`).then((r) => r.data);

/** Abre el PDF en otra pestaña. Pasa por el backend: la clave de Intifact no llega al navegador. */
export async function abrirPdf(id: string, formato: "a4" | "ticket80" = "a4") {
  const r = await api.get<Blob>(`/comprobantes/${id}/pdf`, { params: { formato }, responseType: "blob" });
  const url = URL.createObjectURL(r.data);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
