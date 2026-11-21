import api from "@/shared/lib/axios";

/** Resultado de la prueba o de la carga de ventas históricas (spec importacion-historica). */
export interface ResumenCarga {
  aplicado: boolean;
  lineas: string[];
  contadores: Record<string, number>;
  total: string;
  pagado: string;
}

export interface ArchivosCarga {
  casos: File;
  pagos2024: File;
  pagos2025: File;
  veterinarias: File;
}

/** Prueba (aplicar=false, no escribe) o carga real (aplicar=true) de las ventas históricas. */
export function cargarHistorico(archivos: ArchivosCarga, aplicar: boolean) {
  const datos = new FormData();
  datos.append("casos", archivos.casos);
  datos.append("pagos_2024", archivos.pagos2024);
  datos.append("pagos_2025", archivos.pagos2025);
  datos.append("veterinarias", archivos.veterinarias);
  datos.append("aplicar", String(aplicar));
  // Cargar más de mil casos puede tardar; no cortar la petición antes.
  return api.post<ResumenCarga>("/historico/carga", datos, { timeout: 300_000 }).then((r) => r.data);
}
