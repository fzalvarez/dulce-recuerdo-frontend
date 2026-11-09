import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  titulo?: string;
  mensaje?: string;
  /** Detalle técnico. Solo se muestra en desarrollo. */
  detalle?: string;
  onReintentar?: () => void;
}

/** Pantalla de error general: explica qué pasó, ofrece reintentar y volver al inicio. */
export function ErrorFallback({
  titulo = "Algo salió mal",
  mensaje = "Ocurrió un error inesperado al mostrar esta página. Puedes intentar de nuevo o volver al inicio.",
  detalle,
  onReintentar,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs p-6 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlertTriangleIcon className="size-6" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{titulo}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{mensaje}</p>
        {import.meta.env.DEV && detalle && (
          <pre className="w-full text-left text-xs bg-slate-50 dark:bg-white/5 rounded-md p-3 overflow-x-auto text-red-700 dark:text-red-300">
            {detalle}
          </pre>
        )}
        <div className="flex items-center gap-2">
          {onReintentar && (
            <Button variant="outline" onClick={onReintentar}>
              Reintentar
            </Button>
          )}
          <Button variant="operational" onClick={() => window.location.assign("/")}>
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
