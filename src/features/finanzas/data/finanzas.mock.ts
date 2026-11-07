import type { GastoFijo, GastoVariable, Ingreso } from "../types";

// Datos de ejemplo de gastos variables. Se registran a mano cuando ocurren.
export const GASTOS_VARIABLES_EJEMPLO: GastoVariable[] = [
  {
    id: "gv-001",
    fecha: "2026-10-03",
    categoria: "Combustible",
    concepto: "Gasolina furgoneta (recojos)",
    monto: 120,
  },
  {
    id: "gv-002",
    fecha: "2026-10-18",
    categoria: "Mantenimiento del auto",
    concepto: "Cambio de aceite y filtros",
    monto: 260,
    observaciones: "Taller de confianza, próximo cambio en 5,000 km",
  },
  {
    id: "gv-003",
    fecha: "2026-11-01",
    categoria: "Compra de urnas",
    concepto: "Urnas de roble x 3",
    monto: 360,
  },
  {
    id: "gv-004",
    fecha: "2026-11-04",
    categoria: "Caja chica",
    concepto: "Bolsas, guantes y limpieza",
    monto: 45,
  },
  {
    id: "gv-005",
    fecha: "2026-11-05",
    categoria: "Combustible",
    concepto: "Gasolina furgoneta (recojos)",
    monto: 110,
  },
  // Cargas de combustible registradas desde el módulo Vehículo (bitácora).
  {
    id: "veh-comb-1",
    fecha: "2025-10-24",
    categoria: "Combustible",
    concepto: "Gasolina 95 · 10.5 gal",
    monto: 185,
    origen: "vehiculo",
    proveedor: "Grifo Primax (Av. Benavides)",
    kilometraje: 48120,
    galones: 10.5,
  },
  {
    id: "veh-comb-2",
    fecha: "2025-10-18",
    categoria: "Combustible",
    concepto: "Gasolina 95 · 11.0 gal",
    monto: 192.5,
    origen: "vehiculo",
    proveedor: "Grifo Repsol (Surco)",
    kilometraje: 47680,
    galones: 11,
  },
  {
    id: "veh-comb-3",
    fecha: "2025-10-10",
    categoria: "Combustible",
    concepto: "Gasolina 95 · 9.8 gal",
    monto: 171.5,
    origen: "vehiculo",
    proveedor: "Grifo Primax (San Isidro)",
    kilometraje: 47250,
    galones: 9.8,
  },
];

// TODO: reemplazar los montos de ejemplo por los valores reales de la empresa.
export const GASTOS_FIJOS_INICIALES: GastoFijo[] = [
  { id: "alquiler-local", nombre: "Alquiler del local", grupo: "Local", montoMensual: 1500 },

  { id: "luz", nombre: "Luz", grupo: "Servicios", montoMensual: 180 },
  { id: "agua", nombre: "Agua", grupo: "Servicios", montoMensual: 60 },
  { id: "internet", nombre: "Internet", grupo: "Servicios", montoMensual: 90 },

  { id: "sueldo-persona-1", nombre: "Sueldo Persona 1", grupo: "Personal", montoMensual: 1200 },
  { id: "sueldo-persona-2", nombre: "Sueldo Persona 2", grupo: "Personal", montoMensual: 1200 },
  { id: "sueldo-persona-3", nombre: "Sueldo Persona 3", grupo: "Personal", montoMensual: 1200 },

  {
    id: "deuda-1",
    nombre: "Deuda 1",
    grupo: "Préstamos",
    montoMensual: 350,
    saldoPendiente: 4200,
  },
  {
    id: "deuda-2",
    nombre: "Deuda 2",
    grupo: "Préstamos",
    montoMensual: 220,
    saldoPendiente: 2640,
  },
  {
    id: "deuda-3",
    nombre: "Deuda 3",
    grupo: "Préstamos",
    montoMensual: 500,
    saldoPendiente: 6000,
  },
];

// Datos de ejemplo. En el futuro se alimentan de los casos realizados.
export const INGRESOS_EJEMPLO: Ingreso[] = [
  {
    id: "ing-001",
    fecha: "2026-10-14",
    casoId: "000108",
    mascota: "Toby",
    servicio: "Cremación + Sala Despedida",
    monto: 450,
  },
  {
    id: "ing-002",
    fecha: "2026-10-21",
    casoId: "000110",
    mascota: "Nala",
    servicio: "Cremación Individual",
    monto: 650,
  },
  {
    id: "ing-003",
    fecha: "2026-10-28",
    casoId: "000112",
    mascota: "Michi",
    servicio: "Cremación Individual",
    monto: 280,
  },
  {
    id: "ing-004",
    fecha: "2026-11-02",
    casoId: "000120",
    mascota: "Max",
    servicio: "Cremación Individual",
    monto: 380,
  },
  {
    id: "ing-005",
    fecha: "2026-11-03",
    casoId: "000121",
    mascota: "Bony",
    servicio: "Cremación + Urna Cerámica",
    monto: 600,
  },
  {
    id: "ing-006",
    fecha: "2026-11-05",
    casoId: "000122",
    mascota: "Rocky",
    servicio: "Cremación Individual Estándar",
    monto: 320,
  },
];
