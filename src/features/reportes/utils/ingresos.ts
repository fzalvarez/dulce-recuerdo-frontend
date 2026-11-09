import type { CasoReportable } from "../types";
import { etiquetaMesCorta } from "./reportes";

const formatoSolesEntero = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

export function soles(valor: number): string {
  return formatoSolesEntero.format(valor);
}

export interface FilaIngresoMes {
  clave: string;
  etiqueta: string;
  /** Cremaciones realizadas en el mes. */
  cremaciones: number;
  /** Importe cobrado en el mes: pagos con fecha de cobro en ese mes. */
  importeCobrado: number;
  /** Precio promedio de lista de las cremaciones con plan clasificado; null si no hay. */
  precioPromedio: number | null;
}

/** Ingresos por mes: lo cobrado (por fecha de cobro) y el precio promedio (por fecha de cremación). */
export function calcularIngresosMes(casos: CasoReportable[], ventana: string[]): FilaIngresoMes[] {
  const enVentana = new Set(ventana);
  const filas = new Map<string, { cremaciones: number; importe: number; suma: number; n: number }>();
  for (const m of ventana) filas.set(m, { cremaciones: 0, importe: 0, suma: 0, n: 0 });

  for (const c of casos) {
    const mes = c.fecha.slice(0, 7);
    const f = enVentana.has(mes) ? filas.get(mes) : undefined;
    if (f) {
      f.cremaciones += 1;
      if (c.plan !== "sin-clasificar") {
        f.suma += c.precio;
        f.n += 1;
      }
    }
    const mesCobro = c.fechaCobro.slice(0, 7);
    const g = enVentana.has(mesCobro) ? filas.get(mesCobro) : undefined;
    if (g) g.importe += c.precio;
  }

  return ventana.map((clave) => {
    const f = filas.get(clave)!;
    return {
      clave,
      etiqueta: etiquetaMesCorta(clave),
      cremaciones: f.cremaciones,
      importeCobrado: f.importe,
      precioPromedio: f.n ? f.suma / f.n : null,
    };
  });
}
