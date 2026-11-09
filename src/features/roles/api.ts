import api from "@/shared/lib/axios";
import type { ModuloId, RolId } from "./types";

export interface RolApi {
  id: RolId;
  nombre: string;
  modulos: ModuloId[];
}

export async function listarRoles(): Promise<RolApi[]> {
  const { data } = await api.get<RolApi[]>("/roles");
  return data;
}

export async function guardarModulosRol(rol: RolId, modulos: ModuloId[]): Promise<RolApi> {
  const { data } = await api.put<RolApi>(`/roles/${rol}/modulos`, { modulos });
  return data;
}
