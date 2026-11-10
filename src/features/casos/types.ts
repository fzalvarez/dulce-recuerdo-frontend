/** Tipos del módulo Casos, tal como los devuelve el backend (spec caso-flujo). */

import type { LineaUrna, TamanoUrna } from "@/features/inventario/types";

export type EstadoCaso = "AGENDADO" | "REALIZADO" | "ENTREGADO" | "CANCELADO";
export type Servicio = "CREMACION" | "EUTANASIA";
export type Modalidad = "PRESENCIAL" | "NO_PRESENCIAL" | "DOMICILIO";
export type Canal = "CLIENTE_DIRECTO" | "VETERINARIA_REFERIDORA";
export type MetodoPago = "EFECTIVO" | "YAPE" | "POS" | "TRANSFERENCIA";

/** Los montos llegan como texto decimal ("500.00"). */
export type Monto = string;

/** Fila de `GET /casos/bandeja`. */
export interface CasoFila {
  id: string;
  estado: EstadoCaso;
  servicio: Servicio;
  modalidad: Modalidad;
  canal_origen: Canal;
  plan_nombre: string | null;
  peso_kg: number;
  eutanasia_incluida: boolean;
  distrito_origen: string | null;
  mascota: string;
  especie: string | null;
  tutor: string;
  telefono: string | null;
  dni: string | null;
  veterinaria: string | null;
  precio_total: Monto;
  total_pagado: Monto;
  saldo: Monto;
  inicio: string | null;
  fecha_realizado: string | null;
  fecha_entrega: string | null;
  urna_id: string | null;
  /** Nombre de la urna elegida, si hay. */
  urna: string | null;
  created_at: string;
}

export interface LineaDesglose {
  concepto: string;
  monto: Monto;
}

export interface Caso {
  id: string;
  cliente_id: string;
  mascota_id: string;
  veterinaria_id: string | null;
  canal_origen: Canal;
  estado: EstadoCaso;
  servicio: Servicio;
  plan_id: string | null;
  peso_kg: number;
  eutanasia_incluida: boolean;
  modalidad: Modalidad;
  precio_calculado: Monto;
  precio_total: Monto;
  motivo_ajuste: string | null;
  desglose: LineaDesglose[];
  direccion_origen: string | null;
  distrito_origen: string | null;
  observaciones: string | null;
  fecha_realizado: string | null;
  fecha_entrega: string | null;
  cancelado_en: string | null;
  motivo_cancelacion: string | null;
  monto_retenido: Monto | null;
  monto_devuelto: Monto | null;
  costo_materiales: Monto | null;
  urna_id: string | null;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre_completo: string;
  telefono: string;
  dni: string | null;
  email: string | null;
  direccion: string | null;
}

export interface Mascota {
  id: string;
  cliente_id: string;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  peso_kg: number | null;
  color: string | null;
}

export interface Material {
  articulo_id: string;
  sku: string;
  nombre: string;
  tipo: string;
  cantidad: number;
  costo_unitario: Monto;
  costo_total: Monto;
}

export interface AgendaEntrada {
  id: string;
  inicio: string;
  fin: string;
  tipo_ubicacion: string;
  estado: string;
}

export interface CasoDetalle {
  caso: Caso;
  cliente: Cliente;
  mascota: Mascota;
  veterinaria: { id: string; nombre: string } | null;
  total_pagado: Monto;
  saldo_pendiente: Monto;
  proxima_agenda: AgendaEntrada | null;
  materiales: Material[];
  margen: Monto | null;
  urna: OpcionUrna | null;
}

export interface Pago {
  id: string;
  caso_id: string;
  monto: Monto;
  metodo: MetodoPago;
  fecha: string;
  factura_id: string | null;
  observaciones: string | null;
}

export interface Opciones {
  planes: { id: string; nombre: string }[];
  veterinarias: { id: string; nombre: string; tiene_convenio: boolean }[];
  complementos: { id: string; nombre: string; precio: Monto }[];
  distritos: string[];
  urnas: OpcionUrna[];
  tamano_urna_por_rango: { rango_id: string; etiqueta: string; peso_max_kg: number | null; tamano: TamanoUrna }[];
}

/** Urna activa para elegir en un caso (spec urnas-variantes). */
export interface OpcionUrna {
  id: string;
  nombre: string;
  linea: LineaUrna;
  tamano: TamanoUrna;
  forma: string;
  color: string;
  /** Stock menos las urnas ya elegidas en casos agendados. */
  disponible: number;
}

export interface ArticuloDisponible {
  id: string;
  sku: string;
  nombre: string;
  tipo: string;
  tamano: string | null;
  modelo: string | null;
  stock: number;
}

export interface Calculo {
  rango_id: string;
  lineas: LineaDesglose[];
  total: Monto;
  precio_sugerido: Monto | null;
}
