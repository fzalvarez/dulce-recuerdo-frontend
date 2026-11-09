import { MODULOS, MODULOS_PROTEGIDOS, ROLES } from "../data/roles";
import type { ModuloId, RolId } from "../types";

export function esRolId(valor: string): valor is RolId {
  return ROLES.some((r) => r.id === valor);
}

/** Módulo al que pertenece una ruta. `/` es el dashboard. */
export function moduloDeRuta(pathname: string): ModuloId | null {
  const segmento = pathname.split("/").filter(Boolean)[0];
  if (!segmento) return "dashboard";
  return MODULOS.find((m) => m.id === segmento)?.id ?? null;
}

export function rutaDeModulo(id: ModuloId): string {
  return MODULOS.find((m) => m.id === id)!.ruta;
}

/** Devuelve los módulos en el orden del menú, con los protegidos siempre incluidos. */
export function aplicarProtegidos(rol: RolId, modulos: ModuloId[]): ModuloId[] {
  const incluidos = new Set([...modulos, ...(MODULOS_PROTEGIDOS[rol] ?? [])]);
  return MODULOS.map((m) => m.id).filter((id) => incluidos.has(id));
}
