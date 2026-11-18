import api from "@/shared/lib/axios";

export type Prioridad = "ALTA" | "MEDIA" | "BAJA";

/** Veterinaria a visitar por el comercial (backend: spec crm-veterinarias). Solo `nombre` es obligatorio. */
export interface CrmVeterinaria {
  id: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  distrito: string | null;
  horario: string | null;
  prioridad: Prioridad | null;
  urgencias_24h: boolean | null;
  perfil: string | null;
  estado_dato: string | null;
  web: string | null;
  fuente: string | null;
  ruta: string | null;
}

export type CrmVeterinariaCuerpo = Omit<CrmVeterinaria, "id">;

const URL = "/crm/veterinarias";

export const listar = (q: string) =>
  api.get<CrmVeterinaria[]>(URL, { params: q ? { q } : {} }).then((r) => r.data);
export const crear = (c: CrmVeterinariaCuerpo) => api.post<CrmVeterinaria>(URL, c);
export const editar = (id: string, c: CrmVeterinariaCuerpo) => api.patch<CrmVeterinaria>(`${URL}/${id}`, c);
export const eliminar = (id: string) => api.delete(`${URL}/${id}`);
