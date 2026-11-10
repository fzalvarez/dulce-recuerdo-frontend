import api from "@/shared/lib/axios";
import type {
  ArticuloDisponible,
  Calculo,
  Canal,
  Caso,
  CasoDetalle,
  CasoFila,
  Cliente,
  EstadoCaso,
  Mascota,
  MetodoPago,
  Modalidad,
  Opciones,
  Pago,
  Servicio,
} from "./types";

export async function bandeja(params: { estado?: EstadoCaso; q?: string } = {}): Promise<CasoFila[]> {
  const { data } = await api.get<CasoFila[]>("/casos/bandeja", { params });
  return data;
}

export async function detalle(id: string): Promise<CasoDetalle> {
  const { data } = await api.get<CasoDetalle>(`/casos/${id}/detalle`);
  return data;
}

export async function opciones(): Promise<Opciones> {
  const { data } = await api.get<Opciones>("/casos/opciones");
  return data;
}

export async function materialesDisponibles(): Promise<ArticuloDisponible[]> {
  const { data } = await api.get<ArticuloDisponible[]>("/casos/materiales");
  return data;
}

// ---------- Ficha ----------

export async function buscarClientes(q: string): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>("/clientes", { params: { q } });
  return data;
}

export async function crearCliente(cuerpo: { nombre_completo: string; telefono: string; dni?: string }): Promise<Cliente> {
  const { data } = await api.post<Cliente>("/clientes", cuerpo);
  return data;
}

export async function mascotasDe(clienteId: string): Promise<Mascota[]> {
  const { data } = await api.get<Mascota[]>("/mascotas", { params: { cliente_id: clienteId } });
  return data;
}

export async function crearMascota(cuerpo: {
  cliente_id: string;
  nombre: string;
  especie: string;
  peso_kg?: number;
}): Promise<Mascota> {
  const { data } = await api.post<Mascota>("/mascotas", cuerpo);
  return data;
}

// ---------- Precio y registro ----------

export interface DatosServicio {
  servicio: Servicio;
  plan_id: string | null;
  peso_kg: number;
  eutanasia_incluida: boolean;
  complementos: string[];
  modalidad: Modalidad;
  veterinaria_id: string | null;
}

export async function calcular(d: DatosServicio & { distrito?: string; hora?: string }): Promise<Calculo> {
  const { data } = await api.post<Calculo>("/tarifas/calcular", d);
  return data;
}

export interface Registro extends DatosServicio {
  cliente_id: string;
  mascota_id: string;
  canal_origen: Canal;
  direccion_origen?: string;
  distrito_origen?: string;
  inicio: string;
  duracion_minutos: number;
  pago_inicial: { monto: string; metodo: MetodoPago } | null;
  precio_ajustado?: string;
  motivo_ajuste?: string;
  observaciones?: string;
  urna_id: string | null;
}

export async function registrar(cuerpo: Registro): Promise<Caso> {
  const { data } = await api.post<Caso>("/casos", cuerpo);
  return data;
}

// ---------- Acciones ----------

export async function registrarPago(cuerpo: { caso_id: string; monto: string; metodo: MetodoPago; fecha?: string }): Promise<Pago> {
  const { data } = await api.post<Pago>("/pagos", cuerpo);
  return data;
}

export async function pagosDe(casoId: string): Promise<Pago[]> {
  const { data } = await api.get<Pago[]>("/pagos", { params: { caso_id: casoId } });
  return data;
}

export async function marcarRealizado(
  id: string,
  cuerpo: { fecha?: string; materiales: { articulo_id: string; cantidad: number }[]; urna_id: string | null }
): Promise<Caso> {
  const { data } = await api.post<Caso>(`/casos/${id}/realizado`, cuerpo);
  return data;
}

/** Una cremación sin urna la elige al entregar (`urnaId`). */
export async function marcarEntregado(id: string, fecha?: string, urnaId: string | null = null): Promise<Caso> {
  const { data } = await api.post<Caso>(`/entregas/${id}`, { fecha, urna_id: urnaId });
  return data;
}

/** Elige o cambia la urna. Si el caso ya está realizado, la urna sale del inventario. */
export async function elegirUrna(id: string, urnaId: string): Promise<Caso> {
  const { data } = await api.put<Caso>(`/casos/${id}/urna`, { urna_id: urnaId });
  return data;
}

export async function cancelar(id: string, motivo: string, montoRetenido: string): Promise<Caso> {
  const { data } = await api.post<Caso>(`/casos/${id}/cancelar`, { motivo, monto_retenido: montoRetenido });
  return data;
}

export async function ajustarPrecio(id: string, precioTotal: string, motivo: string): Promise<Caso> {
  const { data } = await api.put<Caso>(`/casos/${id}/precio`, { precio_total: precioTotal, motivo });
  return data;
}
