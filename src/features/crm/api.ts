import api from "@/shared/lib/axios";

export type Prioridad = "ALTA" | "MEDIA" | "BAJA";

/** Distritos que cubre el comercial. Espejo de `DISTRITOS_CRM` del backend (spec crm-veterinarias, R9). */
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
] as const;

/** Veterinaria a visitar por el comercial (backend: spec crm-veterinarias). Solo `nombre` es obligatorio. */
export interface CrmVeterinaria {
  id: string;
  nombre: string;
  ruc: string | null;
  contacto: string | null;
  telefono: string | null;
  telefono2: string | null;
  direccion: string | null;
  distrito: string | null;
  latitud: number | null;
  longitud: number | null;
  horario: string | null;
  prioridad: Prioridad | null;
  urgencias_24h: boolean | null;
  perfil: string | null;
  estado_dato: string | null;
  web: string | null;
  fuente: string | null;
  ruta: string | null;
}

export type CrmVeterinariaCuerpo = Omit<CrmVeterinaria, "id">;

const URL = "/crm/veterinarias";

export const listar = (q: string) =>
  api.get<CrmVeterinaria[]>(URL, { params: q ? { q } : {} }).then((r) => r.data);
export const crear = (c: CrmVeterinariaCuerpo) => api.post<CrmVeterinaria>(URL, c);
export const editar = (id: string, c: CrmVeterinariaCuerpo) => api.patch<CrmVeterinaria>(`${URL}/${id}`, c);
export const eliminar = (id: string) => api.delete(`${URL}/${id}`);

export interface Ubicacion {
  latitud: number;
  longitud: number;
}

/**
 * Busca la dirección en OpenStreetMap (Nominatim). Devuelve null si no la encuentra.
 * Uso liviano: una búsqueda por clic o al guardar, nunca en cada tecla.
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
