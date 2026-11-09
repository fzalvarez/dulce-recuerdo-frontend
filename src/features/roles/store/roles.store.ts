import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { MODULOS_INICIALES } from "../data/roles";
import type { ModuloId, RolId } from "../types";
import { aplicarProtegidos, esRolId } from "../utils/permisos";

interface RolesState {
  modulosPorRol: Record<RolId, ModuloId[]>;
  setModulos: (rol: RolId, modulos: ModuloId[]) => void;
}

// Estado en memoria: se reinicia al recargar hasta que exista API.
export const useRolesStore = create<RolesState>((set) => ({
  modulosPorRol: MODULOS_INICIALES,
  setModulos: (rol, modulos) =>
    set((state) => ({
      modulosPorRol: { ...state.modulosPorRol, [rol]: aplicarProtegidos(rol, modulos) },
    })),
}));

/** Módulos a los que puede entrar el usuario de la sesión. */
export function useModulosPermitidos(): ModuloId[] {
  const rol = useAuthStore((s) => s.getUserRol());
  const modulosPorRol = useRolesStore((s) => s.modulosPorRol);
  return esRolId(rol) ? modulosPorRol[rol] : [];
}
