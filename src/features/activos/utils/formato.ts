import type { EstadoActivo } from "../types";

export const ESTADO_BADGE: Record<EstadoActivo, string> = {
  operativo: "bg-emerald-50 text-emerald-700",
  reparacion: "bg-amber-50 text-amber-700",
  baja: "bg-slate-100 text-slate-600",
};

const moneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatSoles(value: number): string {
  return moneda.format(value);
}

function aISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function hoyISO(): string {
  return aISO(new Date());
}

export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return aISO(new Date(y, m - 1, d + dias));
}

export function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
