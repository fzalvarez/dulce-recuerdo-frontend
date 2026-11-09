import api from "@/shared/lib/axios";

export interface UsuarioActual {
  id: string;
  nombre: string;
  username: string;
  email: string;
  rol_id: string;
  modulos: string[];
}

export async function iniciarSesion(email: string, password: string): Promise<string> {
  const { data } = await api.post<{ access_token: string }>("/auth/login", { email, password });
  return data.access_token;
}

/** Usuario de la sesión y sus módulos. Recibe el token para usarlo antes de guardarlo. */
export async function usuarioActual(token?: string): Promise<UsuarioActual> {
  const { data } = await api.get<UsuarioActual>("/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}
