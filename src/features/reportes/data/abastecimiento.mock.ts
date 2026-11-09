import type { PlanId } from "../types";
import type { RangoPesoId } from "../utils/reportes";

// MAQUETA. Nada de este archivo está confirmado por la operación:
// - Las recetas por plan y rango son supuestos para mostrar el cálculo.
// - El stock, los tiempos de entrega y los proveedores son ficticios.
// Antes de usar el panel en decisiones reales, confirmar cada receta con el equipo.

export type InsumoId =
  | "urna-roble"
  | "cofre-lacado"
  | "urna-biodegradable"
  | "cajita"
  | "certificado"
  | "papel-fotografico"
  | "cuadro-marco"
  | "maceta-plantita"
  | "ceramica-frio"
  | "dije-plata"
  | "semilla";

export interface Insumo {
  id: InsumoId;
  nombre: string;
  unidad: string;
  /** Existencias actuales. */
  stock: number;
  /** Existencia mínima que se quiere mantener. */
  minimo: number;
  /** Días desde que se hace el pedido hasta que llega. */
  leadTimeDias: number;
  proveedor: string;
}

export const INSUMOS: Insumo[] = [
  { id: "urna-roble", nombre: "Urna de roble", unidad: "u", stock: 14, minimo: 6, leadTimeDias: 21, proveedor: "Carpintería Huanca" },
  { id: "cofre-lacado", nombre: "Cofre lacado", unidad: "u", stock: 5, minimo: 4, leadTimeDias: 30, proveedor: "Ebanistería Lacre" },
  { id: "urna-biodegradable", nombre: "Urna biodegradable", unidad: "u", stock: 22, minimo: 8, leadTimeDias: 14, proveedor: "EcoUrnas Perú" },
  { id: "cajita", nombre: "Cajita de presentación", unidad: "u", stock: 180, minimo: 60, leadTimeDias: 7, proveedor: "Papelera Andina" },
  { id: "certificado", nombre: "Certificado de autenticidad", unidad: "u", stock: 260, minimo: 80, leadTimeDias: 5, proveedor: "Imprenta Rímac" },
  { id: "papel-fotografico", nombre: "Papel fotográfico", unidad: "hoja", stock: 340, minimo: 120, leadTimeDias: 5, proveedor: "Foto Mayorista" },
  { id: "cuadro-marco", nombre: "Cuadro con marco", unidad: "u", stock: 9, minimo: 6, leadTimeDias: 18, proveedor: "Marcos Miraflores" },
  { id: "maceta-plantita", nombre: "Maceta con plantita", unidad: "u", stock: 30, minimo: 15, leadTimeDias: 12, proveedor: "Vivero Surco" },
  { id: "ceramica-frio", nombre: "Cerámica en frío", unidad: "kg", stock: 4.5, minimo: 3, leadTimeDias: 10, proveedor: "Arcillas del Sur" },
  { id: "dije-plata", nombre: "Dije de plata 925", unidad: "u", stock: 8, minimo: 5, leadTimeDias: 20, proveedor: "Joyería Andina" },
  { id: "semilla", nombre: "Semilla para urna ecológica", unidad: "sobre", stock: 60, minimo: 20, leadTimeDias: 8, proveedor: "Semillas Lima" },
];

/** Kilos de cerámica en frío según el peso: más peso, más material. */
const CERAMICA_KG_POR_RANGO: Record<RangoPesoId, number> = {
  "0-5": 0.1,
  "5-15": 0.2,
  "15-25": 0.3,
  "25-35": 0.4,
  "35+": 0.5,
};

/**
 * Receta por variante (plan × rango de peso). Cantidad de cada insumo por cremación.
 * MAQUETA: "sin-clasificar" no tiene receta; esas cremaciones no consumen insumos.
 */
export function receta(plan: PlanId, rango: RangoPesoId): Partial<Record<InsumoId, number>> {
  const cerámica = CERAMICA_KG_POR_RANGO[rango];
  switch (plan) {
    case "clasico":
      return {
        "urna-roble": 1,
        certificado: 1,
        cajita: 1,
        "papel-fotografico": 2,
        "ceramica-frio": cerámica,
      };
    case "paz":
      return {
        "cofre-lacado": 1,
        "dije-plata": 1,
        certificado: 1,
        cajita: 1,
        "papel-fotografico": 3,
        "cuadro-marco": 1,
        "ceramica-frio": cerámica,
      };
    case "eco":
      return {
        "urna-biodegradable": 1,
        semilla: 1,
        "maceta-plantita": 1,
        certificado: 1,
        "papel-fotografico": 1,
      };
    default:
      return {};
  }
}

/** Horizonte de proyección y de cobertura, en meses y días. */
export const HORIZONTE_MESES = 3;
export const MESES_TENDENCIA = 12;
export const DIAS_COLCHON = 30;
export const DIAS_ALERTA = 14;
