import { AxiosError } from "axios";

/**
 * Extrae un mensaje legible del error de una llamada a la API.
 * El backend (FastAPI) responde `{ detail: string }` para errores de negocio
 * y `{ detail: [{ msg, loc }] }` para errores de validación.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    if (error.message) return error.message;
  }
  return fallback;
}
