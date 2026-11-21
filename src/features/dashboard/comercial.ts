import api from "@/shared/lib/axios";

/** Etapa de una veterinaria del CRM, en el orden de prioridad del backend. */
export type EstadoPunto = "PENDIENTE" | "VISITADA" | "INTERESADA" | "ALIADA" | "YA_NO_EXISTE";

export interface PuntoCrm {
  id: string;
  nombre: string;
  distrito: string | null;
  direccion: string | null;
  telefono: string | null;
  prioridad: string | null;
  ruta_codigo: string | null;
  ruta_color: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: EstadoPunto;
  visitada_at: string | null;
}

export interface RutaAvance {
  id: string;
  codigo: string;
  nombre: string;
  color: string | null;
  total: number;
  visitadas: number;
  pendientes: number;
}

export interface DashboardComercial {
  hoy: string;
  total: number;
  pendientes: number;
  visitadas: number;
  visitas_semana: number;
  visitas_mes: number;
  interesadas: number;
  aliadas: number;
  sin_ubicacion: number;
  ya_no_existe: number;
  sin_seguimiento: number;
  embudo: { visitadas: number; info_entregada: number; interesadas: number; aliadas: number };
  rutas: RutaAvance[];
  proximas: PuntoCrm[];
  recientes: PuntoCrm[];
  mapa: PuntoCrm[];
}

export const ETIQUETA_ESTADO: Record<EstadoPunto, string> = {
  PENDIENTE: "Por visitar",
  VISITADA: "Visitada",
  INTERESADA: "Interesada",
  ALIADA: "Aliada",
  YA_NO_EXISTE: "Ya no existe",
};

/** Color de cada etapa en el mapa. */
export const COLOR_ESTADO: Record<EstadoPunto, string> = {
  PENDIENTE: "#94a3b8",
  VISITADA: "#f59e0b",
  INTERESADA: "#10b981",
  ALIADA: "#1d4ed8",
  YA_NO_EXISTE: "#ef4444",
};

export const cargarDashboardComercial = () =>
  api.get<DashboardComercial>("/crm/comercial/dashboard").then((r) => r.data);
