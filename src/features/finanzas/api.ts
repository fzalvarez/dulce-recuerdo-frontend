import api from "@/shared/lib/axios";
import type { CategoriaGasto, Frecuencia, Gasto, GastoFijo, GastoFijoDelMes, GrupoGastoFijo, Ingreso, Resumen } from "./types";

/** "2030-07" → [primer día, último día] como "YYYY-MM-DDT00:00:00" y "…T23:59:59". */
function rangoMes(mes: string): { desde: string; hasta: string } {
  const [y, m] = mes.split("-").map(Number);
  const ultimo = new Date(y, m, 0).getDate();
  return { desde: `${mes}-01T00:00:00`, hasta: `${mes}-${String(ultimo).padStart(2, "0")}T23:59:59` };
}

export async function cargarMes(mes: string): Promise<{
  resumen: Resumen;
  ingresos: Ingreso[];
  fijos: GastoFijoDelMes[];
  variables: Gasto[];
}> {
  const [r, i, f, v] = await Promise.all([
    api.get<Resumen>("/finanzas/resumen", { params: { mes } }),
    api.get<Ingreso[]>("/finanzas/ingresos", { params: { mes } }),
    api.get<GastoFijoDelMes[]>("/finanzas/gastos-fijos/mes", { params: { mes } }),
    api.get<Gasto[]>("/gastos", { params: rangoMes(mes) }),
  ]);
  return { resumen: r.data, ingresos: i.data, fijos: f.data, variables: v.data };
}

// Gastos fijos
export const listarFijos = () => api.get<GastoFijo[]>("/finanzas/gastos-fijos").then((r) => r.data);

export interface GastoFijoCuerpo {
  nombre: string;
  grupo: GrupoGastoFijo;
  monto: string;
  frecuencia: Frecuencia;
  mes_pago: number | null;
  saldo_pendiente: string | null;
  activo: boolean;
  observaciones: string | null;
}

export const crearFijo = (c: GastoFijoCuerpo) => api.post("/finanzas/gastos-fijos", c);
export const editarFijo = (id: string, c: GastoFijoCuerpo) => api.patch(`/finanzas/gastos-fijos/${id}`, c);
export const eliminarFijo = (id: string) => api.delete(`/finanzas/gastos-fijos/${id}`);
export const registrarMes = (id: string, mes: string, monto: string, observaciones: string | null) =>
  api.put(`/finanzas/gastos-fijos/${id}/meses/${mes}`, { monto, observaciones });
export const anularMes = (id: string, mes: string) => api.delete(`/finanzas/gastos-fijos/${id}/meses/${mes}`);

// Gastos variables
export interface GastoCuerpo {
  fecha: string;
  concepto: string;
  categoria: CategoriaGasto;
  monto: string;
  proveedor: string | null;
  observaciones: string | null;
}

export const crearGasto = (c: GastoCuerpo) => api.post("/gastos", c);
export const editarGasto = (id: string, c: GastoCuerpo) => api.patch(`/gastos/${id}`, c);
export const eliminarGasto = (id: string) => api.delete(`/gastos/${id}`);
