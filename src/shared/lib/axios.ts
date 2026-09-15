import axios from "axios";
import { useAuthStore } from "@/features/auth/store/auth.store";

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

export default api;
