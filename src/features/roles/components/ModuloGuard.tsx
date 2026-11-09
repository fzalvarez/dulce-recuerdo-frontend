import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LockIcon } from "lucide-react";
import { useModulosPermitidos } from "../store/roles.store";
import { moduloDeRuta, rutaDeModulo } from "../utils/permisos";

/**
 * Muestra el contenido solo si el rol de la sesión incluye el módulo de la ruta.
 * Si no lo incluye, redirige al primer módulo permitido (R6).
 */
export function ModuloGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const permitidos = useModulosPermitidos();
  const actual = moduloDeRuta(pathname);

  if (actual && permitidos.includes(actual)) return <>{children}</>;
  if (permitidos.length === 0) return <SinModulos />;
  return <Navigate to={rutaDeModulo(permitidos[0])} replace />;
}

function SinModulos() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <LockIcon className="size-6" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Sin módulos asignados</h1>
        <p className="text-sm text-slate-600">
          Tu rol no tiene acceso a ningún módulo del panel. Pide a un administrador que te
          habilite alguno.
        </p>
      </div>
    </div>
  );
}
