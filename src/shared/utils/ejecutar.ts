import { getApiErrorMessage } from "@/shared/lib/http-error";
import { notifyError, notifySuccess } from "./index";

/** Ejecuta una acción contra la API con aviso de éxito o error. Devuelve si salió bien. */
export async function ejecutar(accion: () => Promise<unknown>, exito: string, fallo: string): Promise<boolean> {
  try {
    await accion();
    notifySuccess(exito);
    return true;
  } catch (e) {
    notifyError(getApiErrorMessage(e, fallo));
    return false;
  }
}
