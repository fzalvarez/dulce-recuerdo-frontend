import api from "@/shared/lib/axios";
import type { RolId } from "@/features/roles/types";

export interface Usuario {
  id: string;
  nombre: string;
  username: string;
  email: string;
  rol_id: RolId;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsuarioCuerpo {
  nombre: string;
  username: string;
  email: string;
  rol_id: RolId;
  activo: boolean;
  password?: string;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>("/usuarios");
  return data;
}

export async function crearUsuario(cuerpo: UsuarioCuerpo & { password: string }): Promise<Usuario> {
  const { data } = await api.post<Usuario>("/usuarios", cuerpo);
  return data;
}

export async function actualizarUsuario(id: string, cuerpo: Partial<UsuarioCuerpo>): Promise<Usuario> {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}`, cuerpo);
  return data;
}

export async function eliminarUsuario(id: string): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}
