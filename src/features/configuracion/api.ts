import api from "@/shared/lib/axios";
import type { Marca } from "@/features/planes/api";

export type { Marca };

/** Sub-marcas con planes propios (spec tarifas, R13). Requiere el módulo Configuración o Planes. */
export const listarMarcas = () => api.get<Marca[]>("/marcas").then((r) => r.data);
export const crearMarca = (nombre: string) => api.post<Marca>("/marcas", { nombre });
export const editarMarca = (id: string, cambios: { nombre?: string; activa?: boolean }) =>
  api.patch<Marca>(`/marcas/${id}`, cambios);
