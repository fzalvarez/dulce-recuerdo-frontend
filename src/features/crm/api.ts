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
}

export type CrmVeterinariaCuerpo = Omit<CrmVeterinaria, "id" | "codigo" | "distrito" | "ruta_id" | "ruta" | "ruta_orden"> & {
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

/**
 * Busca la dirección en OpenStreetMap (Nominatim). Devuelve null si no la encuentra.
 * Uso liviano: una búsqueda por clic, nunca en cada tecla.
 */
export async function geocodificar(direccion: string, distrito: string | null): Promise<Ubicacion | null> {
  const consulta = [direccion, distrito, "Lima", "Perú"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pe&q=${encodeURIComponent(consulta)}`;
  const r = await fetch(url, { headers: { "Accept-Language": "es" } });
  if (!r.ok) return null;
  const datos = (await r.json()) as { lat: string; lon: string }[];
  if (!datos.length) return null;
  return { latitud: Number(datos[0].lat), longitud: Number(datos[0].lon) };
}

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
