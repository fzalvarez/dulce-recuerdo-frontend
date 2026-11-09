/** Los cuatro roles son fijos: no se crean ni se borran (spec roles.md, R1). */
export type RolId = "root" | "admin" | "operador1" | "operador2";

/** Identificador de módulo = primer segmento de su ruta (`/casos` → `casos`). */
export type ModuloId =
  | "dashboard"
  | "casos"
  | "agenda"
  | "veterinarias"
  | "entregas"
  | "clientes"
  | "mascotas"
  | "finanzas"
  | "reportes"
  | "servicios"
  | "planes"
  | "inventario"
  | "activos"
  | "vehiculos"
  | "usuarios"
  | "configuracion";

export interface RolDef {
  id: RolId;
  nombre: string;
}

export interface ModuloDef {
  id: ModuloId;
  nombre: string;
  ruta: string;
  grupo: string;
}
