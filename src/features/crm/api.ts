import api from "@/shared/lib/axios";

export type Prioridad = "ALTA" | "MEDIA" | "BAJA";
export type TipoVeterinaria = "VETERINARIA" | "CLINICA" | "PET_SHOP" | "MUNICIPAL" | "DISTRIBUIDORA" | "POR_CONFIRMAR";

export const TIPOS: { value: TipoVeterinaria; label: string }[] = [
  { value: "VETERINARIA", label: "Veterinaria" },
  { value: "CLINICA", label: "Clínica" },
  { value: "PET_SHOP", label: "Pet shop / Spa" },
  { value: "MUNICIPAL", label: "Municipal" },
  { value: "DISTRIBUIDORA", label: "Distribuidora / Farmacia" },
  { value: "POR_CONFIRMAR", label: "Por confirmar" },
];

/** Distritos que cubre el comercial. Espejo de `PREFIJOS_DISTRITO` del backend (spec crm-veterinarias, R9). */
export const DISTRITOS_CRM = [
  "Santiago de Surco",
  "San Borja",
  "San Luis",
  "La Victoria",
  "Barranco",
  "Chorrillos",
  "San Miguel",
  "Pueblo Libre",
  "Magdalena del Mar",
  "San Isidro",
  "Lince",
  "Cercado de Lima",
  "Ate",
  "Santa Anita",
  "Surquillo",
  "Miraflores",
  "La Molina",
  "Breña",
  "Jesús María",
  "El Agustino",
] as const;

export const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;
export type Dia = (typeof DIAS)[number];

/** Un día del horario (R13). `abre`/`cierra` en HH:MM solo si está ABIERTO. */
export interface HorarioDia {
  dia: Dia;
  estado: "ABIERTO" | "24H" | "CERRADO";
  abre: string | null;
  cierra: string | null;
}

/** Veterinaria a visitar por el comercial (backend: spec crm-veterinarias). Obligatorios: nombre y distrito. */
export interface CrmVeterinaria {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoVeterinaria | null;
  razon_social: string | null;
  ruc: string | null;
  /** Para facturar: dirección fiscal de SUNAT (puede no ser la del local) y correo de facturación. */
  direccion_fiscal?: string | null;
  email_facturacion?: string | null;
  contacto: string | null;
  telefono: string | null;
  telefono2: string | null;
  direccion: string | null;
  distrito: string | null;
  latitud: number | null;
  longitud: number | null;
  /** true: punto buscado automáticamente por dirección, falta confirmarlo (spec crm-rutas, R4). */
  ubicacion_aprox: boolean;
  horario: HorarioDia[] | null;
  prioridad: Prioridad | null;
  urgencias_24h: boolean | null;
  perfil: string | null;
  estado_dato: string | null;
  web: string | null;
  fuente: string | null;
  /** Ruta comercial (se asigna en Rutas): id, código y orden de visita. */
  ruta_id: string | null;
  ruta: string | null;
  ruta_orden: number | null;
  /** Control comercial (spec crm-control-comercial): fecha de cada paso; null = pendiente. */
  visitada_at: string | null;
  info_entregada_at: string | null;
  interesada_at: string | null;
  /** Aliada creada desde esta ficha; null = todavía no es aliada. */
  veterinaria_id: string | null;
  /** Ya no existe: no se visita ni se convierte en aliada. */
  ya_no_existe: boolean;
  /** Google (spec crm-ubicacion): identificador del lugar, precisión y fecha de la coordenada. */
  place_id: string | null;
  ubicacion_precision: string | null;
  ubicacion_actualizada_at: string | null;
}

export type CrmVeterinariaCuerpo = Omit<
  CrmVeterinaria,
  "id" | "codigo" | "distrito" | "ruta_id" | "ruta" | "ruta_orden" | "visitada_at" | "info_entregada_at" | "interesada_at" | "veterinaria_id" | "ubicacion_actualizada_at"
> & {
  distrito: string;
};

export interface Coincidencia {
  id: string;
  codigo: string;
  nombre: string;
  campo: "telefono" | "ruc";
  valor: string;
}

const URL = "/crm/veterinarias";

export const listar = (q: string) =>
  api.get<CrmVeterinaria[]>(URL, { params: q ? { q } : {} }).then((r) => r.data);
export const crear = (c: CrmVeterinariaCuerpo) => api.post<CrmVeterinaria>(URL, c);
export const editar = (id: string, c: CrmVeterinariaCuerpo) => api.patch<CrmVeterinaria>(`${URL}/${id}`, c);
export const eliminar = (id: string) => api.delete(`${URL}/${id}`);
export const obtener = (id: string) => api.get<CrmVeterinaria>(`${URL}/${id}`).then((r) => r.data);

/** Otras veterinarias con el mismo teléfono o RUC (R14). Solo avisa. */
export const coincidencias = (telefonos: string[], ruc: string | null, excluirId?: string) =>
  api
    .get<Coincidencia[]>(`${URL}/coincidencias`, {
      params: { telefono: telefonos, ruc: ruc ?? undefined, excluir_id: excluirId },
      paramsSerializer: { indexes: null }, // telefono=1&telefono=2
    })
    .then((r) => r.data);

export interface Ubicacion {
  latitud: number;
  longitud: number;
}

/** Ubicación encontrada por Google en el servidor. No se guarda hasta que el usuario la confirma. */
export interface UbicacionBuscada extends Ubicacion {
  place_id: string;
  direccion_formateada: string;
  /** ROOFTOP = exacta; otras = aproximada y hay que confirmarla en el mapa. */
  precision: string;
  aprox: boolean;
}

/** Busca la dirección con Google (en el servidor). 404 si no la encuentra en Lima. */
export const buscarUbicacion = (direccion: string, distrito: string | null) =>
  api.post<UbicacionBuscada>("/crm/ubicaciones/buscar", { direccion, distrito }).then((r) => r.data);

// ---------- Rutas (spec crm-rutas del backend) ----------

export interface Parada {
  id: string;
  codigo: string;
  nombre: string;
  distrito: string | null;
  direccion: string | null;
  telefono: string | null;
  prioridad: Prioridad | null;
  latitud: number | null;
  longitud: number | null;
  ubicacion_aprox: boolean;
  orden: number;
}

export interface Ruta {
  id: string;
  codigo: string;
  nombre: string;
  prioridad: Prioridad | null;
  color: string | null;
  notas: string | null;
  /** Calculados a partir de las paradas. */
  distritos: string[];
  paradas: Parada[];
}

export type RutaCuerpo = Pick<Ruta, "codigo" | "nombre" | "prioridad" | "color" | "notas">;

const RUTAS = "/crm/rutas";

export const listarRutas = () => api.get<Ruta[]>(RUTAS).then((r) => r.data);
export const crearRuta = (c: RutaCuerpo) => api.post<Ruta>(RUTAS, c);
export const editarRuta = (id: string, c: RutaCuerpo) => api.patch<Ruta>(`${RUTAS}/${id}`, c);
export const eliminarRuta = (id: string) => api.delete(`${RUTAS}/${id}`);
/** Deja en la ruta exactamente esas veterinarias, en ese orden. */
export const fijarParadas = (id: string, veterinariaIds: string[]) =>
  api.put<Ruta>(`${RUTAS}/${id}/paradas`, { veterinaria_ids: veterinariaIds });

// ---------- Control comercial (spec crm-control-comercial del backend) ----------

const COMERCIAL = "/crm/comercial";

/** Fichas visitadas, en orden de visita (incluye las ya aliadas). */
export const listarVisitas = () => api.get<CrmVeterinaria[]>(COMERCIAL).then((r) => r.data);
export const agregarVisita = (crmId: string) => api.post<CrmVeterinaria>(COMERCIAL, { crm_veterinaria_id: crmId });
export const quitarVisita = (crmId: string) => api.delete(`${COMERCIAL}/${crmId}`);
export const actualizarPasos = (crmId: string, pasos: { info_entregada?: boolean; interesada?: boolean }) =>
  api.patch<CrmVeterinaria>(`${COMERCIAL}/${crmId}`, pasos);
/** Crea la veterinaria aliada desde la ficha y cierra los pasos que falten. */
export const convertirAliada = (crmId: string) =>
  api.post<{ id: string; nombre: string }>(`${COMERCIAL}/${crmId}/convertir`);
