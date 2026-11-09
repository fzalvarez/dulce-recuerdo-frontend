import type { PlanId } from "./types";

// TODO: reemplazar por la fuente real de tarifas (módulo planes / backend).
// Las tarifas de planes y zonas son las mismas que se muestran en /planes.

export const RANGOS = [
  { id: "0-5", etiqueta: "0 a 5 kg" },
  { id: "5-15", etiqueta: "5,1 a 15 kg" },
  { id: "15-25", etiqueta: "15,1 a 25 kg" },
  { id: "25-35", etiqueta: "25,1 a 35 kg" },
  { id: "35+", etiqueta: "35,1 kg o más" },
] as const;

export type RangoId = (typeof RANGOS)[number]["id"];

export const PLAN_NOMBRE: Record<PlanId, string> = {
  clasico: "Dulce Recuerdo Clásico",
  paz: "Dulce Recuerdo Paz",
  eco: "Dulce Recuerdo Eco",
};

/** Precio al público por plan y rango de peso. */
export const PRECIO_PLAN: Record<PlanId, Record<RangoId, number>> = {
  clasico: { "0-5": 340, "5-15": 380, "15-25": 420, "25-35": 480, "35+": 540 },
  paz: { "0-5": 450, "5-15": 510, "15-25": 570, "25-35": 630, "35+": 680 },
  eco: { "0-5": 260, "5-15": 300, "15-25": 350, "25-35": 410, "35+": 460 },
};

/** Traslado a domicilio por distrito (zonas de /planes). */
export const ZONA_TRASLADO_POR_DISTRITO: Record<string, { zona: string; precio: number }> = {
  "San Luis": { zona: "Zona Central", precio: 0 },
  "San Borja": { zona: "Zona Central", precio: 0 },
  Surco: { zona: "Zona Central", precio: 0 },
  Miraflores: { zona: "Zona Central", precio: 0 },
  "San Isidro": { zona: "Zona Central", precio: 0 },
  "La Victoria": { zona: "Zona Central", precio: 0 },
  Barranco: { zona: "Zona 2", precio: 40 },
  "Jesús María": { zona: "Zona 2", precio: 40 },
  Lince: { zona: "Zona 2", precio: 40 },
  Magdalena: { zona: "Zona 2", precio: 40 },
  "Pueblo Libre": { zona: "Zona 2", precio: 40 },
  "La Molina": { zona: "Zona 3", precio: 60 },
  Chorrillos: { zona: "Zona 3", precio: 60 },
  "San Miguel": { zona: "Zona 3", precio: 60 },
  "Cercado de Lima": { zona: "Zona 3", precio: 60 },
  Rímac: { zona: "Zona 3", precio: 60 },
  "San Juan de Lurigancho": { zona: "Zona 4", precio: 90 },
  "Los Olivos": { zona: "Zona 4", precio: 90 },
  Comas: { zona: "Zona 4", precio: 90 },
  Independencia: { zona: "Zona 4", precio: 90 },
  "Villa El Salvador": { zona: "Zona 4", precio: 90 },
  "San Juan de Miraflores": { zona: "Zona 4", precio: 90 },
  Ate: { zona: "Zona 4", precio: 90 },
  "Puente Piedra": { zona: "Zona 5", precio: 140 },
  Carabayllo: { zona: "Zona 5", precio: 140 },
  Lurín: { zona: "Zona 5", precio: 140 },
  Pachacámac: { zona: "Zona 5", precio: 140 },
  Ventanilla: { zona: "Zona 5", precio: 140 },
  Callao: { zona: "Zona 5", precio: 140 },
};

export const DISTRITOS = Object.keys(ZONA_TRASLADO_POR_DISTRITO);

/** Recargo por traslado dentro de estas franjas horarias. */
export const RECARGO_PUNTA = 35;
export const FRANJAS_PUNTA: [string, string][] = [
  ["07:30", "09:30"],
  ["17:00", "19:00"],
];

/** Mi última huella, precio al público. */
export const COMPLEMENTO_HUELLA_PRECIO = 130;

// PENDIENTE DE DEFINIR: montos que todavía no tienen valor. Se muestran como
// "pendiente de tarifa" en la pantalla hasta que se completen.
/** Costo fijo de una eutanasia sola. */
export const EUTANASIA_COSTO_FIJO = 0;
/** Precio de la eutanasia cuando va incluida en una cremación. */
export const EUTANASIA_EXTRA_PRECIO = 0;

/** Días sin mensajes para marcar como abandonado (solo casos sin pago). */
export const DIAS_ABANDONO = 7;
