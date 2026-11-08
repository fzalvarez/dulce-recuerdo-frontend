import type { EstadoMostrado, EstadoPago } from "../types";

export const ESTADO_BADGE: Record<EstadoMostrado, string> = {
  EN_CONVERSACION: "bg-slate-100 text-slate-700",
  AGENDADO: "bg-indigo-100 text-indigo-800",
  REALIZADO: "bg-blue-100 text-blue-800",
  ENTREGADO: "bg-emerald-100 text-emerald-800",
  ABANDONADO: "bg-slate-200 text-slate-500",
};

export const PAGO_BADGE: Record<EstadoPago, { texto: string; clase: string }> = {
  PENDIENTE: { texto: "Sin pago", clase: "bg-amber-50 text-amber-700" },
  PARCIAL: { texto: "Pago parcial", clase: "bg-orange-50 text-orange-700" },
  PAGADO: { texto: "Pagado", clase: "bg-emerald-50 text-emerald-700" },
};
