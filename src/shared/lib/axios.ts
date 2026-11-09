import axios from "axios";
import { useAuthStore } from "@/features/auth/store/auth.store";

/** Cliente de la API del backend (`VITE_URL_CONEXION`, p. ej. http://localhost:8000/api/v1). */
const api = axios.create({
  baseURL: import.meta.env.VITE_URL_CONEXION,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sesión vencida o token inválido: se cierra la sesión y el layout protegido
// redirige al inicio de sesión. El propio login no cuenta.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url ?? "";
    if (error?.response?.status === 401 && !url.includes("/auth/login")) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
