import { AxiosError } from "axios";

/** Formato único de error del backend (spec errores-uniformes del backend). */
interface ErrorApi {
  code?: string;
  message?: string;
  details?: { campo: string; mensaje: string }[] | null;
}

/**
 * Extrae un mensaje legible del error de una llamada a la API.
 * El backend responde `{ code, message, details }`; en errores de validación,
 * `details` trae `[{ campo, mensaje }]` y se muestra el primero.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    if (!error.response) return "No se pudo conectar con el servidor.";
    const data = error.response.data as ErrorApi | undefined;
    const detalle = data?.details?.[0];
    if (data?.code === "ERROR_VALIDACION" && detalle) return `${detalle.campo}: ${detalle.mensaje}`;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  return fallback;
}

/** Código del error de la API (`NO_ENCONTRADO`, `CONFLICTO`...), si lo hay. */
export function getApiErrorCode(error: unknown): string | null {
  if (error instanceof AxiosError) return (error.response?.data as ErrorApi | undefined)?.code ?? null;
  return null;
}
