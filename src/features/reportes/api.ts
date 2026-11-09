import api from "@/shared/lib/axios";

/** Respuestas de `/reportes/*` (spec reportes del backend). Montos como texto decimal. */

export interface Periodo {
  desde: string;
  hasta: string;
  meses: string[];
  meses_previos: string[];
  incluye_mes_en_curso: boolean;
}

export interface Conclusion {
  texto: string;
  dato: string;
}

export interface MesCremaciones {
  mes: string;
  parcial: boolean;
  total: number;
  particulares: number;
  veterinarias: number;
  variacion_mes_anterior: number | null;
  total_anio_anterior: number;
  particulares_anio_anterior: number;
  veterinarias_anio_anterior: number;
  variacion_interanual: number | null;
  variacion_interanual_particulares: number | null;
  variacion_interanual_veterinarias: number | null;
}

export interface ReporteCremaciones {
  periodo: Periodo;
  total: number;
  total_previo: number;
  variacion: number | null;
  promedio_mensual: number;
  meses: MesCremaciones[];
}

export interface ReporteIngresos {
  periodo: Periodo;
  ingreso_total: string;
  cobrado_total: string;
  meses: { mes: string; parcial: boolean; cremaciones: number; ingreso: string; cobrado: string; precio_promedio: string | null }[];
}

export interface FilaRankingApi {
  id: string;
  nombre: string;
  cremaciones: number;
  porcentaje: number | null;
}

export interface ReporteComposicion {
  periodo: Periodo;
  total: number;
  total_referidos: number;
  veterinarias: FilaRankingApi[];
  distritos: FilaRankingApi[];
  planes: FilaRankingApi[];
  presenciales: number;
  con_eutanasia: number;
  pesos: { rango: string; etiqueta: string; cremaciones: number; porcentaje: number | null }[];
}

export interface FilaDistrito {
  distrito: string;
  cremaciones: number;
  previas: number;
  variacion: number | null;
  particulares: number;
  veterinarias: number;
  pct_veterinarias: number;
  participacion: number;
  participacion_previa: number;
  ingreso: string;
  plan_principal: string | null;
  alta_demanda: boolean;
  crece: boolean;
  gana_terreno: boolean;
  oportunidad: boolean;
}

export interface ReporteOportunidades {
  periodo: Periodo;
  ingreso_total: string;
  filas: FilaDistrito[];
  conclusiones: Conclusion[];
}

export interface FilaVeterinaria {
  veterinaria_id: string;
  nombre: string;
  cremaciones: number;
  previas: number;
  variacion: number | null;
  pct_referidos: number;
  ingreso: string;
  pct_ingreso: number;
  plan_principal: string | null;
  caida: boolean;
  crece: boolean;
}

export interface ReporteVeterinarias {
  periodo: Periodo;
  total_referidos: number;
  pct_top5: number;
  pct_principal: number;
  filas: FilaVeterinaria[];
  conclusiones: Conclusion[];
}

export interface FilaInsumo {
  articulo_id: string;
  sku: string;
  nombre: string;
  tipo: string;
  stock: number;
  stock_minimo: number;
  dias_entrega: number | null;
  proveedor: string | null;
  consumo_mes: number;
  necesidad: number;
  cobertura_dias: number | null;
  estado: "CRITICO" | "ATENCION" | "OK";
}

export interface ReporteAbastecimiento {
  hasta: string;
  meses_tendencia: number;
  horizonte_meses: number;
  filas: FilaInsumo[];
  conclusiones: string[];
}

const get = <T,>(ruta: string, params: Record<string, string | number>) => api.get<T>(`/reportes/${ruta}`, { params }).then((r) => r.data);

export const cremaciones = (fin: string, meses: number) => get<ReporteCremaciones>("cremaciones", { fin, meses });
export const ingresos = (fin: string, meses: number) => get<ReporteIngresos>("ingresos", { fin, meses });
export const composicion = (fin: string, meses: number) => get<ReporteComposicion>("composicion", { fin, meses });
export const oportunidades = (fin: string, meses: number) => get<ReporteOportunidades>("oportunidades", { fin, meses });
export const veterinarias = (fin: string, meses: number) => get<ReporteVeterinarias>("veterinarias", { fin, meses });
export const abastecimiento = (fin: string) => get<ReporteAbastecimiento>("abastecimiento", { fin });
