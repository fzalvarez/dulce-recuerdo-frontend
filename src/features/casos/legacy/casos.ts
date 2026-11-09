import type { Caso, EstadoMostrado, EstadoPago, Modalidad, Servicio } from "./types";
import {
  COMPLEMENTO_HUELLA_PRECIO,
  DIAS_ABANDONO,
  EUTANASIA_COSTO_FIJO,
  EUTANASIA_EXTRA_PRECIO,
  FRANJAS_PUNTA,
  PLAN_NOMBRE,
  PRECIO_PLAN,
  RANGOS,
  RECARGO_PUNTA,
  type RangoId,
  ZONA_TRASLADO_POR_DISTRITO,
} from "./tarifas";

const formatoSoles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export function soles(valor: number): string {
  return formatoSoles.format(valor);
}

export const ESTADO_LABEL: Record<EstadoMostrado, string> = {
  EN_CONVERSACION: "En conversación",
  AGENDADO: "Agendado",
  REALIZADO: "Realizado",
  ENTREGADO: "Entregado",
  ABANDONADO: "Abandonado",
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

export function hoyISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

/** Días entre dos fechas YYYY-MM-DD (hasta − desde). */
export function diasEntre(desde: string, hasta: string): number {
  const a = new Date(`${desde}T00:00:00`).getTime();
  const b = new Date(`${hasta}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function formatoFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export function rangoDePeso(kg: number): RangoId {
  if (kg <= 5) return "0-5";
  if (kg <= 15) return "5-15";
  if (kg <= 25) return "15-25";
  if (kg <= 35) return "25-35";
  return "35+";
}

export function rangoEtiqueta(id: RangoId): string {
  return RANGOS.find((r) => r.id === id)?.etiqueta ?? id;
}

/** Estado que se muestra: un caso sin pago que dejó de escribir pasa a abandonado. */
export function estadoMostrado(c: Caso, hoy: string): EstadoMostrado {
  const sinPago = c.pagos.length === 0;
  if (c.estado === "EN_CONVERSACION" && sinPago && diasEntre(c.ultimoContacto, hoy) >= DIAS_ABANDONO) {
    return "ABANDONADO";
  }
  return c.estado;
}

export function totalPagado(c: Caso): number {
  return c.pagos.reduce((acc, p) => acc + p.monto, 0);
}

export function estadoPago(c: Caso, total: number): EstadoPago {
  const pagado = totalPagado(c);
  if (pagado === 0) return "PENDIENTE";
  if (total > 0 && pagado >= total) return "PAGADO";
  return "PARCIAL";
}

export interface LineaPrecio {
  concepto: string;
  monto: number;
  /** Tarifa todavía sin definir: se muestra como "pendiente de tarifa". */
  pendiente?: boolean;
}

export interface Cotizacion {
  lineas: LineaPrecio[];
  total: number;
  /** Lo que falta para poder dar el precio final; null si ya está completo. */
  faltante: string | null;
}

function enFranjaPunta(hora: string): boolean {
  return FRANJAS_PUNTA.some(([ini, fin]) => hora >= ini && hora <= fin);
}

/** Precio del caso: plan y peso, extras, y traslado según distrito y hora si es domicilio. */
export function calcularPrecio(c: Caso): Cotizacion {
  const lineas: LineaPrecio[] = [];
  let faltante: string | null = null;

  if (c.servicio === "CREMACION") {
    if (!c.plan) faltante = "el plan";
    if (c.pesoKg === undefined) faltante = faltante ?? "el peso de la mascota";
    if (c.plan && c.pesoKg !== undefined) {
      const rango = rangoDePeso(c.pesoKg);
      lineas.push({
        concepto: `Cremación ${PLAN_NOMBRE[c.plan]} (${rangoEtiqueta(rango)})`,
        monto: PRECIO_PLAN[c.plan][rango],
      });
    }
    if (c.eutanasiaIncluida) {
      lineas.push({
        concepto: "Eutanasia incluida",
        monto: EUTANASIA_EXTRA_PRECIO,
        pendiente: EUTANASIA_EXTRA_PRECIO === 0,
      });
    }
    if (c.complementoHuella) {
      lineas.push({ concepto: "Mi última huella", monto: COMPLEMENTO_HUELLA_PRECIO });
    }
  } else {
    lineas.push({
      concepto: "Eutanasia",
      monto: EUTANASIA_COSTO_FIJO,
      pendiente: EUTANASIA_COSTO_FIJO === 0,
    });
  }

  if (c.modalidad === "DOMICILIO") {
    const zona = c.distrito ? ZONA_TRASLADO_POR_DISTRITO[c.distrito] : undefined;
    if (!zona) {
      faltante = faltante ?? "el distrito del domicilio";
    } else {
      lineas.push({ concepto: `Traslado a ${c.distrito} (${zona.zona})`, monto: zona.precio });
    }
    if (!c.horaServicio) {
      faltante = faltante ?? "la hora del servicio";
    } else if (enFranjaPunta(c.horaServicio)) {
      lineas.push({ concepto: "Recargo horario punta", monto: RECARGO_PUNTA });
    }
  }

  const total = lineas.reduce((acc, l) => acc + l.monto, 0);
  return { lineas, total, faltante };
}

/** Texto listo para pegar en WhatsApp. */
export function mensajeCotizacion(c: Caso, cot: Cotizacion): string {
  const nombre = c.tutor.split(" ")[0];
  const detalle = cot.lineas
    .map((l) => `• ${l.concepto}: ${l.pendiente ? "por confirmar" : soles(l.monto)}`)
    .join("\n");
  return [
    `Hola ${nombre}, este es el detalle para ${c.mascota}:`,
    detalle,
    `Total: ${soles(cot.total)}`,
    `Modalidad: ${MODALIDAD_LABEL[c.modalidad]}`,
  ].join("\n");
}

/** Acción principal que se ofrece según el estado del caso. */
export function accionPrincipal(c: Caso, estado: EstadoMostrado): { tipo: string; texto: string } | null {
  if (estado === "ABANDONADO" || estado === "ENTREGADO") return null;
  if (estado === "EN_CONVERSACION") {
    return c.pagos.length === 0 ? { tipo: "pago", texto: "Registrar pago" } : { tipo: "agendar", texto: "Agendar" };
  }
  if (estado === "AGENDADO") return { tipo: "realizado", texto: "Marcar realizado" };
  return { tipo: "entregado", texto: "Marcar entregado" };
}
