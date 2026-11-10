import api from "@/shared/lib/axios";
import type { Articulo, LineaUrna, MatrizUrnas, Movimiento, Proveedor, TamanoUrna, TipoArticulo } from "./types";

const BASE = "/inventario/articulos";

export interface ArticuloCuerpo {
  sku: string;
  nombre: string;
  detalle: string | null;
  tipo: TipoArticulo;
  tamano: string | null;
  modelo: string | null;
  stock_minimo: number;
  activo: boolean;
}

export const listar = () => api.get<Articulo[]>(BASE).then((r) => r.data);
export const crear = (c: ArticuloCuerpo) => api.post<Articulo>(BASE, c);
export const editar = (id: string, c: ArticuloCuerpo) => api.patch<Articulo>(`${BASE}/${id}`, c);

export const entrada = (id: string, c: { cantidad: number; costo_unitario: string; fecha: string; proveedor: string | null; registrar_gasto: boolean; motivo: string | null }) =>
  api.post(`${BASE}/${id}/entradas`, c);
export const salida = (id: string, c: { cantidad: number; fecha: string; motivo: string }) => api.post(`${BASE}/${id}/salidas`, c);
export const ajuste = (id: string, c: { stock_contado: number; fecha: string; motivo: string }) => api.post(`${BASE}/${id}/ajustes`, c);

export const movimientos = (articuloId: string) =>
  api.get<Movimiento[]>("/inventario/movimientos", { params: { articulo_id: articuloId } }).then((r) => r.data);
export const anularMovimiento = (id: string) => api.delete(`/inventario/movimientos/${id}`);

export type ProveedorCuerpo = Omit<Proveedor, "id" | "articulo_id">;
export const proveedores = (id: string) => api.get<Proveedor[]>(`${BASE}/${id}/proveedores`).then((r) => r.data);
export const crearProveedor = (id: string, c: ProveedorCuerpo) => api.post(`${BASE}/${id}/proveedores`, c);
export const editarProveedor = (id: string, provId: string, c: ProveedorCuerpo) => api.patch(`${BASE}/${id}/proveedores/${provId}`, c);
export const eliminarProveedor = (id: string, provId: string) => api.delete(`${BASE}/${id}/proveedores/${provId}`);

// ---------- Urnas (spec urnas-variantes) ----------

export const matrizUrnas = () => api.get<MatrizUrnas>("/inventario/urnas/matriz").then((r) => r.data);

export const generarModelos = (c: {
  linea: LineaUrna;
  tamano: TamanoUrna;
  formas: string[];
  colores: string[] | null;
  stock_minimo: number;
}) => api.post<{ creadas: Articulo[]; existentes: Articulo[] }>("/inventario/urnas/modelos", c).then((r) => r.data);

export const agregarColor = (c: { color: string; stock_minimo: number }) =>
  api.post<Articulo[]>("/inventario/urnas/colores", c).then((r) => r.data);

export const entradaUrnas = (c: {
  fecha: string;
  proveedor: string | null;
  registrar_gasto: boolean;
  motivo: string | null;
  filas: { linea: LineaUrna; tamano: TamanoUrna; forma: string; costo_unitario: string; cantidades: Record<string, number> }[];
}) => api.post<{ unidades: number; costo_total: string }>("/inventario/urnas/entradas", c).then((r) => r.data);
