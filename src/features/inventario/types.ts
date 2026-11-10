/** Tipos de Inventario, tal como los devuelve el backend (spec inventario). */

export type TipoArticulo = "URNA" | "MARCO" | "PLACA" | "RECUERDO" | "SUMINISTRO" | "MEDICAMENTO";
export type Nivel = "OPTIMO" | "BAJO" | "CRITICO";

export const TIPO_LABEL: Record<TipoArticulo, string> = {
  URNA: "Urnas",
  MARCO: "Marcos",
  PLACA: "Placas",
  RECUERDO: "Recuerdos",
  SUMINISTRO: "Suministros",
  MEDICAMENTO: "Medicamentos",
};

export interface Articulo {
  id: string;
  sku: string;
  nombre: string;
  detalle: string | null;
  tipo: TipoArticulo;
  tamano: string | null;
  modelo: string | null;
  /** Solo en urnas: línea + tamaño + forma + color identifican la urna. */
  linea: LineaUrna | null;
  forma: string | null;
  color: string | null;
  stock: number;
  stock_minimo: number;
  nivel: Nivel;
  costo_promedio: string;
  valor_stock: string;
  activo: boolean;
  observaciones: string | null;
}

/** Proveedor que vende un artículo. Puede haber varios; uno es el principal. */
export interface Proveedor {
  id: string;
  articulo_id: string;
  empresa: string;
  contacto: string | null;
  telefono: string;
  celular: string | null;
  correo: string | null;
  direccion: string | null;
  /** Días desde el pedido hasta que llega. */
  dias_entrega: number | null;
  principal: boolean;
  notas: string | null;
}

export interface Movimiento {
  id: string;
  articulo_id: string;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
  fecha: string;
  cantidad: number;
  costo_unitario: string;
  costo_total: string;
  stock_resultante: number;
  caso_id: string | null;
  gasto_id: string | null;
  proveedor: string | null;
  motivo: string | null;
}

// ---------- Urnas (spec urnas-variantes) ----------

export type LineaUrna = "SIN_VIDRIO" | "CON_VIDRIO";
export type TamanoUrna = "PEQUENA" | "MEDIANA" | "GRANDE" | "GRANDE_ESPECIAL";

export const LINEA_LABEL: Record<LineaUrna, string> = {
  SIN_VIDRIO: "Sin vidrio (corte 45)",
  CON_VIDRIO: "Con vidrio",
};

/** En este orden se muestran. */
export const TAMANO_LABEL: Record<TamanoUrna, string> = {
  PEQUENA: "Pequeña",
  MEDIANA: "Mediana",
  GRANDE: "Grande",
  GRANDE_ESPECIAL: "Grande especial",
};

export interface CeldaUrna {
  articulo_id: string;
  stock: number;
  /** Stock menos las urnas ya elegidas en casos agendados. */
  disponible: number;
  nivel: Nivel;
  activo: boolean;
}

export interface FilaUrna {
  linea: LineaUrna;
  tamano: TamanoUrna;
  forma: string;
  celdas: Record<string, CeldaUrna>;
}

export interface MatrizUrnas {
  colores: string[];
  filas: FilaUrna[];
}
