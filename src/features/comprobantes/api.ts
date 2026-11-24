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

/** Fila del registro: el comprobante y de dónde viene (servicio o factura de convenio). */
export interface ComprobanteFila extends Comprobante {
  origen: "SERVICIO" | "CONVENIO";
  /** Servicio: código del caso. Convenio: nombre de la veterinaria. */
  referencia: string | null;
  mascota: string | null;
}

export interface RegistroPagina {
  items: ComprobanteFila[];
  total: number;
  monto_aceptado: string;
}

/** Filtro de estado del registro: uno de SUNAT o los grupos PENDIENTE (en envío) y FALLIDO. */
export type FiltroEstado = "ACEPTADO" | "PENDIENTE" | "FALLIDO" | "ANULADO";

export interface FiltroRegistro {
  tipo?: "BOLETA" | "FACTURA";
  estado?: FiltroEstado;
  desde?: string;
  hasta?: string;
  q?: string;
  pagina: number;
  por_pagina: number;
}

export const registro = (f: FiltroRegistro) =>
  api.get<RegistroPagina>("/comprobantes/registro", { params: f }).then((r) => r.data);

export interface ServicioPorEmitir {
  caso_id: string;
  codigo: string | null;
  fecha: string | null;
  estado: string;
  mascota: string;
  cliente: string;
  cliente_dni: string | null;
  cliente_direccion: string | null;
  precio_total: string;
  /** Lo que se marcó al entregar (BOLETA, FACTURA) o null si no se registró. */
  comprobante_pedido: string | null;
}

export interface ConvenioPorEmitir {
  factura_id: string;
  veterinaria_id: string;
  veterinaria: string;
  crm_id: string | null;
  fecha_emision: string;
  total: string;
  estado: string;
}

export interface PorEmitir {
  servicios: ServicioPorEmitir[];
  total_servicios: number;
  convenios: ConvenioPorEmitir[];
}

export const porEmitir = (f: { desde?: string; hasta?: string; q?: string; pagina: number; por_pagina: number }) =>
  api.get<PorEmitir>("/comprobantes/por-emitir", { params: f }).then((r) => r.data);

// ---------- Clientes de facturación (directorio sin duplicar) ----------

export type OrigenCliente = "TUTOR" | "VETERINARIA" | "EMPRESA";

export interface ClienteFE {
  origen: OrigenCliente;
  /** Id de su ficha de origen: cliente (tutor), CRM (veterinaria) o empresa. */
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  tipo_documento: string;
  numero_documento: string | null;
  ruc: string | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  estado_contribuyente: string | null;
  historial: { boletas: number; facturas: number; total: string; ultimo: string | null };
}

export const listarClientes = (f: { q?: string; origen?: OrigenCliente; con_comprobantes?: boolean; pagina: number; por_pagina: number }) =>
  api.get<{ items: ClienteFE[]; total: number }>("/comprobantes/clientes", { params: f }).then((r) => r.data);

export interface Sugerencia {
  origen: OrigenCliente;
  id: string;
  cliente_tipo_doc: TipoDocCliente;
  cliente_num_doc: string;
  cliente_razon_social: string;
  cliente_direccion: string | null;
  detalle: string | null;
}

export const buscarClientes = (q: string) =>
  api.get<Sugerencia[]>("/comprobantes/clientes/buscar", { params: { q } }).then((r) => r.data);

export interface EmpresaCuerpo {
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  estado_contribuyente: string | null;
  notas: string | null;
}

export const crearEmpresa = (c: EmpresaCuerpo) => api.post("/comprobantes/clientes/empresas", c);
export const editarEmpresa = (id: string, c: Omit<EmpresaCuerpo, "ruc">) => api.patch(`/comprobantes/clientes/empresas/${id}`, c);

export interface ResultadoImportacion {
  aplicado: boolean;
  leidas: number;
  tutores_actualizados: number;
  tutores_nuevos: number;
  tutores_con_ruc: number;
  veterinarias_actualizadas: number;
  empresas_nuevas: number;
  empresas_actualizadas: number;
  sin_cambios: number;
  omitidos_proveedores: number;
  omitidos_sin_documento: number;
  errores: string[];
  muestra: { nombre: string; documento: string; accion: string; detalle: string | null }[];
}

/** Reporte de clientes de SUSII (CSV). Sin `aplicar`, solo muestra lo que haría. */
export function importarClientes(archivo: File, aplicar: boolean) {
  const datos = new FormData();
  datos.append("archivo", archivo);
  datos.append("aplicar", String(aplicar));
  return api.post<ResultadoImportacion>("/comprobantes/clientes/importar", datos).then((r) => r.data);
}

/** Serie de emisión (Configuración). Una activa por tipo; los números de este ambiente (test o live). */
export interface Serie {
  id: string;
  tipo: "BOLETA" | "FACTURA";
  tipo_doc: "01" | "03";
  serie: string;
  correlativo_inicial: number;
  activa: boolean;
  emitidos: number;
  ultimo: number | null;
  siguiente: number;
}

export const listarSeries = () => api.get<Serie[]>("/comprobantes/series").then((r) => r.data);
export const crearSerie = (c: { tipo: Serie["tipo"]; serie: string; correlativo_inicial: number; activa: boolean }) =>
  api.post<Serie>("/comprobantes/series", c);
export const editarSerie = (id: string, c: { serie?: string; correlativo_inicial?: number; activa?: boolean }) =>
  api.patch<Serie>(`/comprobantes/series/${id}`, c);

/** Línea del comprobante: valor unitario sin IGV, precio unitario con IGV e importe de la línea. */
export interface LineaComprobante {
  descripcion: string;
  cantidad: number;
  valor_unitario: string;
  precio_unitario: string;
  igv: string;
  total: string;
}

/** El comprobante como documento: lo que se emitiría (vista previa) o lo emitido (detalle). */
export interface DocumentoComprobante {
  tipo?: "BOLETA" | "FACTURA";
  tipo_doc?: "01" | "03";
  numero: string;
  fecha_emision: string;
  cliente_tipo_doc: string;
  cliente_num_doc: string;
  cliente_razon_social: string;
  cliente_direccion: string | null;
  precios_incluyen_igv: boolean;
  items: LineaComprobante[];
  descuento: string;
  valor_venta: string;
  igv: string;
  total: string;
  monto_en_letras: string | null;
  ambiente: "test" | "live";
}

export interface ComprobanteDetalle extends ComprobanteFila, DocumentoComprobante {
  tipo_doc: "01" | "03";
  hash: string | null;
  motivo_baja: string | null;
  fecha_baja: string | null;
  /** Días que quedan para anular ante SUNAT. 0 = corresponde nota de crédito. */
  dias_para_anular: number;
}

export type CuerpoCaso = Parameters<typeof emitirParaCaso>[1];
export type CuerpoConvenio = Parameters<typeof emitirFacturaConvenio>[1];

export const vistaPreviaCaso = (casoId: string, cuerpo: CuerpoCaso) =>
  api.post<DocumentoComprobante>(`/comprobantes/caso/${casoId}/vista-previa`, cuerpo).then((r) => r.data);
export const vistaPreviaConvenio = (facturaId: string, cuerpo: CuerpoConvenio) =>
  api.post<DocumentoComprobante>(`/comprobantes/factura-convenio/${facturaId}/vista-previa`, cuerpo).then((r) => r.data);

export const detalle = (id: string) => api.get<ComprobanteDetalle>(`/comprobantes/${id}/detalle`).then((r) => r.data);
export const anular = (id: string, motivo: string) => api.post<Comprobante>(`/comprobantes/${id}/anular`, { motivo }).then((r) => r.data);

/** Descarga el XML firmado o el CDR de SUNAT con el nombre oficial del archivo. */
export async function descargar(id: string, clase: "xml" | "cdr") {
  const r = await api.get<Blob>(`/comprobantes/${id}/${clase}`, { responseType: "blob" });
  const nombre = /filename="([^"]+)"/.exec(String(r.headers["content-disposition"] ?? ""))?.[1] ?? `${clase}-${id}`;
  const url = URL.createObjectURL(r.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Abre el PDF en otra pestaña. Pasa por el backend: la clave de Intifact no llega al navegador. */
export async function abrirPdf(id: string, formato: "a4" | "ticket80" = "a4") {
  const r = await api.get<Blob>(`/comprobantes/${id}/pdf`, { params: { formato }, responseType: "blob" });
  const url = URL.createObjectURL(r.data);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
