import type { TamanoUrna } from "@/features/inventario/types";
import type { Canal, CasoFila, EstadoCaso, MetodoPago, Modalidad, Monto, Servicio } from "../types";

const formatoSoles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** Formatea un monto (número o texto decimal de la API) en soles. */
export function soles(valor: number | Monto | null | undefined): string {
  return formatoSoles.format(Number(valor ?? 0));
}

export const ESTADO_LABEL: Record<EstadoCaso, string> = {
  AGENDADO: "Agendado",
  REALIZADO: "Realizado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const SERVICIO_LABEL: Record<Servicio, string> = {
  CREMACION: "Cremación",
  EUTANASIA: "Eutanasia",
};

export const MODALIDAD_LABEL: Record<Modalidad, string> = {
  PRESENCIAL: "Presencial",
  NO_PRESENCIAL: "No presencial",
  DOMICILIO: "Recojo a domicilio",
};

export const CANAL_LABEL: Record<Canal, string> = {
  CLIENTE_DIRECTO: "Directo",
  VETERINARIA_REFERIDORA: "Veterinaria",
};

export const METODO_LABEL: Record<MetodoPago, string> = {
  EFECTIVO: "Efectivo",
  YAPE: "Yape",
  POS: "POS (tarjeta)",
  TRANSFERENCIA: "Transferencia",
};

export function hoyISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

/** "2030-03-05T10:00:00" → "05 mar · 10:00". */
export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  const hora = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fecha} · ${hora}`;
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

/** Fecha (YYYY-MM-DD) y hora (HH:MM) locales → ISO sin zona, como lo guarda el backend. */
export function combinarFechaHora(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00`;
}

/** Monto escrito por la persona → texto con dos decimales, o null si no es válido. */
export function montoValido(texto: string, { permitirCero = false } = {}): string | null {
  const n = Number(texto.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || (!permitirCero && n === 0)) return null;
  return n.toFixed(2);
}

/** Siguiente acción del caso según su estado. */
export function accionPrincipal(estado: EstadoCaso): { tipo: "realizado" | "entregado"; texto: string } | null {
  if (estado === "AGENDADO") return { tipo: "realizado", texto: "Marcar realizado" };
  if (estado === "REALIZADO") return { tipo: "entregado", texto: "Marcar entregado" };
  return null;
}

// ---------- Urna (spec urnas-variantes) ----------

/** Una cremación sin urna no se puede entregar sin elegirla. */
export function faltaUrna(caso: CasoFila): boolean {
  return caso.servicio === "CREMACION" && !caso.urna_id;
}

/** Se puede elegir o cambiar mientras la urna no haya salido del inventario. */
export function urnaEditable(caso: CasoFila): boolean {
  return caso.servicio === "CREMACION" && (caso.estado === "AGENDADO" || (caso.estado === "REALIZADO" && !caso.urna_id));
}

/** Tamaño de urna sugerido para un peso, según los rangos que manda el backend. */
export function tamanoSugerido(
  pesoKg: number,
  rangos: { peso_max_kg: number | null; tamano: TamanoUrna }[]
): TamanoUrna | null {
  if (!Number.isFinite(pesoKg) || pesoKg <= 0) return null;
  return rangos.find((r) => r.peso_max_kg === null || pesoKg <= r.peso_max_kg)?.tamano ?? null;
}
