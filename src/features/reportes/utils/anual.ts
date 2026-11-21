import type { MesCremaciones, ReporteIngresos } from "../api";

/** Variación porcentual con un decimal, igual que el backend; null sin base. */
function variacion(actual: number, base: number): number | null {
  if (!base) return null;
  return Math.round(((actual - base) / base) * 1000) / 10;
}

const suma = (lista: MesCremaciones[], campo: (m: MesCremaciones) => number) =>
  lista.reduce((acc, m) => acc + campo(m), 0);

function agrupar<T extends { mes: string }>(filas: T[]): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  for (const f of filas) {
    const anio = f.mes.slice(0, 4);
    grupos.set(anio, [...(grupos.get(anio) ?? []), f]);
  }
  return grupos;
}

/**
 * Cremaciones por año: suma de los meses del año. Un año con el mes en curso queda
 * parcial y sin variación, como en los meses. Las variaciones son frente al mismo
 * número de meses del año anterior (cada mes trae su mismo mes del año previo).
 */
export function anualizarCremaciones(meses: MesCremaciones[]): MesCremaciones[] {
  return [...agrupar(meses)].map(([anio, lista]) => {
    const total = suma(lista, (m) => m.total);
    const particulares = suma(lista, (m) => m.particulares);
    const veterinarias = suma(lista, (m) => m.veterinarias);
    const aa = suma(lista, (m) => m.total_anio_anterior);
    const paa = suma(lista, (m) => m.particulares_anio_anterior);
    const vaa = suma(lista, (m) => m.veterinarias_anio_anterior);
    const parcial = lista.some((m) => m.parcial);
    return {
      mes: anio,
      parcial,
      total,
      particulares,
      veterinarias,
      variacion_mes_anterior: null,
      total_anio_anterior: aa,
      particulares_anio_anterior: paa,
      veterinarias_anio_anterior: vaa,
      variacion_interanual: parcial ? null : variacion(total, aa),
      variacion_interanual_particulares: parcial ? null : variacion(particulares, paa),
      variacion_interanual_veterinarias: parcial ? null : variacion(veterinarias, vaa),
    };
  });
}

type FilaIngresos = ReporteIngresos["meses"][number];

/** Ingresos por año: importes sumados en céntimos y precio promedio ponderado. */
export function anualizarIngresos(meses: FilaIngresos[]): FilaIngresos[] {
  const centimos = (texto: string) => Math.round(Number(texto) * 100);
  const soles = (c: number) => (c / 100).toFixed(2);
  return [...agrupar(meses)].map(([anio, lista]) => {
    const cremaciones = lista.reduce((acc, f) => acc + f.cremaciones, 0);
    const ingreso = lista.reduce((acc, f) => acc + centimos(f.ingreso), 0);
    const cobrado = lista.reduce((acc, f) => acc + centimos(f.cobrado), 0);
    return {
      mes: anio,
      parcial: lista.some((f) => f.parcial),
      cremaciones,
      ingreso: soles(ingreso),
      cobrado: soles(cobrado),
      precio_promedio: cremaciones ? soles(Math.round(ingreso / cremaciones)) : null,
    };
  });
}
