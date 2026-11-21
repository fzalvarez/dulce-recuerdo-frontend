import type { EstadoCaso, Modalidad } from "../types";

/** Presencial en azul, no presencial en celeste, domicilio en violeta. */
export const MODALIDAD_BADGE: Record<Modalidad, string> = {
  PRESENCIAL: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  NO_PRESENCIAL: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  DOMICILIO: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
};

export const ESTADO_BADGE: Record<EstadoCaso, string> = {
  AGENDADO: "bg-indigo-100 text-indigo-800",
  REALIZADO: "bg-blue-100 text-blue-800",
  ENTREGADO: "bg-emerald-100 text-emerald-800",
  CANCELADO: "bg-slate-200 text-slate-500",
};

/** Estado del cobro según el saldo. */
export function pagoBadge(precio: number, pagado: number): { texto: string; clase: string } {
  if (pagado <= 0) return { texto: "Sin pago", clase: "bg-amber-50 text-amber-700" };
  if (pagado >= precio) return { texto: "Pagado", clase: "bg-emerald-50 text-emerald-700" };
  return { texto: "Pago parcial", clase: "bg-orange-50 text-orange-700" };
}
