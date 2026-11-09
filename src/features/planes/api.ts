import api from "@/shared/lib/axios";

/** Montos como texto decimal ("340.00"); null = sin precio cargado. */
export type Monto = string;
export type PreciosRango = Record<string, Monto | null>;

export interface Plan {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: "Activo" | "Inactivo";
}

export interface Zona {
  id: string;
  nombre: string;
  precio: Monto;
  incluida: boolean;
  orden: number;
  distritos: string[];
}

export interface Complemento {
  id: string;
  nombre: string;
  precio: Monto;
  activo: boolean;
}

export interface Convenio {
  id: string;
  nombre: string;
  activo: boolean;
  precios: Record<string, Record<string, Monto>>;
}

export interface Tarifas {
  rangos: { id: string; etiqueta: string }[];
  planes: Record<string, Record<string, Monto>>;
  eutanasia: Record<string, { sola: Monto | null; extra: Monto | null }>;
  zonas: Zona[];
  recargo_punta: { monto: Monto | null; franjas: { inicio: string; fin: string }[] };
  complementos: Complemento[];
  convenios: Convenio[];
}

export async function cargarTodo(): Promise<{ planes: Plan[]; tarifas: Tarifas }> {
  const [p, t] = await Promise.all([api.get<Plan[]>("/planes"), api.get<Tarifas>("/tarifas")]);
  return { planes: p.data, tarifas: t.data };
}

// Planes
export const crearPlan = (cuerpo: Omit<Plan, "id">) => api.post<Plan>("/planes", cuerpo).then((r) => r.data);
export const editarPlan = (id: string, cuerpo: Partial<Omit<Plan, "id">>) => api.patch<Plan>(`/planes/${id}`, cuerpo).then((r) => r.data);
export const eliminarPlan = (id: string) => api.delete(`/planes/${id}`);
export const preciosPlan = (id: string, precios: PreciosRango) => api.put(`/tarifas/planes/${id}`, { precios });

// Eutanasia
export const preciosEutanasia = (precios: Record<string, { sola: Monto | null; extra: Monto | null }>) =>
  api.put("/tarifas/eutanasia", { precios });

// Zonas
export type ZonaCuerpo = Omit<Zona, "id">;
export const crearZona = (cuerpo: ZonaCuerpo) => api.post<Zona>("/tarifas/zonas", cuerpo);
export const editarZona = (id: string, cuerpo: ZonaCuerpo) => api.patch<Zona>(`/tarifas/zonas/${id}`, cuerpo);
export const eliminarZona = (id: string) => api.delete(`/tarifas/zonas/${id}`);

// Recargo de punta
export const guardarRecargo = (cuerpo: Tarifas["recargo_punta"]) => api.put("/tarifas/recargo-punta", cuerpo);

// Complementos
export const crearComplemento = (c: Omit<Complemento, "id">) => api.post("/tarifas/complementos", c);
export const editarComplemento = (id: string, c: Omit<Complemento, "id">) => api.patch(`/tarifas/complementos/${id}`, c);
export const eliminarComplemento = (id: string) => api.delete(`/tarifas/complementos/${id}`);

// Convenios
export const crearConvenio = (nombre: string) => api.post<Convenio>("/tarifas/convenios", { nombre });
export const editarConvenio = (id: string, c: { nombre?: string; activo?: boolean }) => api.patch(`/tarifas/convenios/${id}`, c);
export const preciosConvenio = (id: string, precios: Record<string, PreciosRango>) =>
  api.put(`/tarifas/convenios/${id}/precios`, { precios });
