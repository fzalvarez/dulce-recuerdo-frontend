import { useAuthStore } from "@/features/auth/store/auth.store";
import { MODULOS } from "../data/roles";
import type { ModuloId } from "../types";

const IDS = new Set<string>(MODULOS.map((m) => m.id));

/** Módulos a los que puede entrar el usuario de la sesión, según el backend (`/auth/me`). */
export function useModulosPermitidos(): ModuloId[] {
  const modulos = useAuthStore((s) => s.modulos);
  return MODULOS.map((m) => m.id).filter((id) => IDS.has(id) && modulos.includes(id));
}
