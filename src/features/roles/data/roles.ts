import type { ModuloDef, ModuloId, RolDef, RolId } from "../types";

/** Catálogo de módulos del panel, en el orden del menú. */
export const MODULOS: ModuloDef[] = [
  { id: "dashboard", nombre: "Dashboard", ruta: "/", grupo: "General" },
  { id: "casos", nombre: "Casos & Servicios", ruta: "/casos", grupo: "Despedidas" },
  { id: "agenda", nombre: "Agenda & Rutas", ruta: "/agenda", grupo: "Despedidas" },
  { id: "veterinarias", nombre: "Convenios Veterinarios", ruta: "/veterinarias", grupo: "Despedidas" },
  { id: "entregas", nombre: "Entregas", ruta: "/entregas", grupo: "Despedidas" },
  { id: "clientes", nombre: "Clientes", ruta: "/clientes", grupo: "Atención Veterinaria" },
  { id: "mascotas", nombre: "Mascotas", ruta: "/mascotas", grupo: "Atención Veterinaria" },
  { id: "finanzas", nombre: "Ingresos y Gastos", ruta: "/finanzas", grupo: "Finanzas" },
  { id: "reportes", nombre: "Reportes", ruta: "/reportes", grupo: "Reportes" },
  { id: "servicios", nombre: "Servicios", ruta: "/servicios", grupo: "Catálogos & Administración" },
  { id: "planes", nombre: "Planes", ruta: "/planes", grupo: "Catálogos & Administración" },
  { id: "inventario", nombre: "Inventario", ruta: "/inventario", grupo: "Catálogos & Administración" },
  { id: "activos", nombre: "Activos", ruta: "/activos", grupo: "Catálogos & Administración" },
  { id: "vehiculos", nombre: "Vehículo", ruta: "/vehiculos", grupo: "Catálogos & Administración" },
  { id: "usuarios", nombre: "Usuarios", ruta: "/usuarios", grupo: "Catálogos & Administración" },
  { id: "configuracion", nombre: "Configuración", ruta: "/configuracion", grupo: "General" },
];

/** Los cuatro roles fijos (spec roles.md, R1). */
export const ROLES: RolDef[] = [
  { id: "root", nombre: "Root" },
  { id: "admin", nombre: "Admin" },
  { id: "operador1", nombre: "Operador 1" },
  { id: "operador2", nombre: "Operador 2" },
];

/** Módulos que el rol no puede perder (spec roles.md, R3). */
export const MODULOS_PROTEGIDOS: Partial<Record<RolId, ModuloId[]>> = {
  root: ["usuarios"],
};

// TODO: reemplazar por la configuración real de roles cuando exista API.
export const MODULOS_INICIALES: Record<RolId, ModuloId[]> = {
  root: MODULOS.map((m) => m.id),
  admin: MODULOS.map((m) => m.id),
  operador1: ["dashboard", "casos", "agenda", "entregas", "clientes", "mascotas", "inventario"],
  operador2: ["dashboard", "agenda", "entregas", "vehiculos"],
};
