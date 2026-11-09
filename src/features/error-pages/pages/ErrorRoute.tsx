import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ErrorFallback } from "@/shared/components/common/ErrorFallback";
import Error404 from "./Error404";

/**
 * Error de ruta: 404 si la página no existe; cualquier otro fallo muestra
 * "Algo salió mal" en lugar de decir, por error, que la página no existe.
 */
export default function ErrorRoute() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <Error404 />;
  }

  const detalle = error instanceof Error ? error.message : undefined;
  return <ErrorFallback detalle={detalle} onReintentar={() => window.location.reload()} />;
}
