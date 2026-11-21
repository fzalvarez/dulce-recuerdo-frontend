import api from "@/shared/lib/axios";

/** Sede del negocio (Configuración → Sedes). Se dibuja sobre todos los mapas cuando está activa. */
export interface Sede {
  id: string;
  nombre: string;
  direccion: string | null;
  distrito: string | null;
  latitud: number;
  longitud: number;
  activa: boolean;
}

export interface SedeCuerpo {
  nombre: string;
  direccion: string | null;
  distrito: string | null;
  latitud: number;
  longitud: number;
  activa?: boolean;
}

/** Lo piden los mapas: cualquier usuario con sesión. */
export const listarSedesActivas = () => api.get<Sede[]>("/sedes/activas").then((r) => r.data);
/** Configuración: todas las sedes. */
export const listarSedes = () => api.get<Sede[]>("/sedes").then((r) => r.data);
export const crearSede = (cuerpo: SedeCuerpo) => api.post<Sede>("/sedes", cuerpo).then((r) => r.data);
export const editarSede = (id: string, cambios: Partial<SedeCuerpo>) =>
  api.patch<Sede>(`/sedes/${id}`, cambios).then((r) => r.data);
