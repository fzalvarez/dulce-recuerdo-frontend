import type { PlanId } from "../types";
import type { RangoPesoId } from "../utils/reportes";

// MAQUETA. Los insumos son los reales de la operación; las cantidades de stock,
// los tiempos de entrega y los supuestos de receta NO están confirmados.
// Supuestos a confirmar:
// - Tamaño de urna: chica hasta 15 kg, grande desde 15,1 kg.
// - Clásico usa urna casita; Paz usa urna rectangular.
// - Plaquita: una por urna (Clásico y Paz).
// - Sobre y bolsa de cartón: una por cremación, en los tres planes.

export type InsumoId =
  | "urna-casita-chica"
  | "urna-casita-grande"
  | "urna-rectangular-chica"
  | "urna-rectangular-grande"
  | "cuadro-marquito"
  | "maceta-plantita"
  | "plaquita"
  | "ceramica-huella"
  | "cajita-trupan"
  | "papel-fotografico"
  | "sobre"
  | "bolsa-carton"
  | "certificado";

export interface Insumo {
  id: InsumoId;
  nombre: string;
  unidad: string;
  /** Existencias actuales (maqueta). */
  stock: number;
  /** Existencia mínima que se quiere mantener (maqueta). */
  minimo: number;
  /** Días desde el pedido hasta la llegada (maqueta). */
  leadTimeDias: number;
  proveedor: string;
}

export const INSUMOS: Insumo[] = [
  { id: "urna-casita-chica", nombre: "Urna casita chica (mármol)", unidad: "u", stock: 6, minimo: 4, leadTimeDias: 30, proveedor: "Marmolería Pacífico" },
  { id: "urna-casita-grande", nombre: "Urna casita grande (mármol)", unidad: "u", stock: 4, minimo: 3, leadTimeDias: 30, proveedor: "Marmolería Pacífico" },
  { id: "urna-rectangular-chica", nombre: "Urna rectangular chica (mármol)", unidad: "u", stock: 8, minimo: 4, leadTimeDias: 30, proveedor: "Marmolería Pacífico" },
  { id: "urna-rectangular-grande", nombre: "Urna rectangular grande (mármol)", unidad: "u", stock: 3, minimo: 3, leadTimeDias: 30, proveedor: "Marmolería Pacífico" },
  { id: "cuadro-marquito", nombre: "Marquito de madera", unidad: "u", stock: 20, minimo: 8, leadTimeDias: 18, proveedor: "Marcos Miraflores" },
  { id: "maceta-plantita", nombre: "Maceta con plantita", unidad: "u", stock: 20, minimo: 15, leadTimeDias: 12, proveedor: "Vivero Surco" },
  { id: "plaquita", nombre: "Plaquita", unidad: "u", stock: 50, minimo: 20, leadTimeDias: 10, proveedor: "Grabados Lima" },
  { id: "ceramica-huella", nombre: "Huella en cerámica", unidad: "u", stock: 10, minimo: 8, leadTimeDias: 20, proveedor: "Arcillas del Sur" },
  { id: "cajita-trupan", nombre: "Cajita de trupán", unidad: "u", stock: 40, minimo: 15, leadTimeDias: 14, proveedor: "Cartonería Andina" },
  { id: "papel-fotografico", nombre: "Papel fotográfico", unidad: "hoja", stock: 340, minimo: 120, leadTimeDias: 5, proveedor: "Foto Mayorista" },
  { id: "sobre", nombre: "Sobre", unidad: "u", stock: 300, minimo: 100, leadTimeDias: 5, proveedor: "Papelera Andina" },
  { id: "bolsa-carton", nombre: "Bolsa de cartón", unidad: "u", stock: 200, minimo: 80, leadTimeDias: 7, proveedor: "Papelera Andina" },
  { id: "certificado", nombre: "Certificado de cremación", unidad: "u", stock: 260, minimo: 80, leadTimeDias: 5, proveedor: "Imprenta Rímac" },
];

/** Insumos que se entregan con cada cremación, según el texto oficial de cada plan. */
const ENVOLTURA: InsumoId[] = ["sobre", "bolsa-carton", "certificado"];

/** Receta por cremación según plan y rango de peso. "sin-clasificar" no tiene receta. */
export function receta(plan: PlanId, rango: RangoPesoId): Partial<Record<InsumoId, number>> {
  const grande = rango === "15-25" || rango === "25-35" || rango === "35+";
  const base: Partial<Record<InsumoId, number>> = {};

  if (plan === "clasico") {
    base[grande ? "urna-casita-grande" : "urna-casita-chica"] = 1;
    base["maceta-plantita"] = 1;
    base["cuadro-marquito"] = 1;
    base.plaquita = 1;
    base["papel-fotografico"] = 1;
  } else if (plan === "paz") {
    base[grande ? "urna-rectangular-grande" : "urna-rectangular-chica"] = 1;
    base["maceta-plantita"] = 1;
    base["cuadro-marquito"] = 1;
    base["ceramica-huella"] = 1;
    base.plaquita = 1;
    base["papel-fotografico"] = 1;
  } else if (plan === "eco") {
    base["cajita-trupan"] = 1;
  } else {
    return {};
  }

  for (const id of ENVOLTURA) base[id] = 1;
  return base;
}

/** Horizonte de proyección y de cobertura, en meses y días. */
export const HORIZONTE_MESES = 3;
export const MESES_TENDENCIA = 12;
export const DIAS_COLCHON = 30;
export const DIAS_ALERTA = 14;
