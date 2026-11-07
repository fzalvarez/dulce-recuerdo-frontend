export type Canal = "particular" | "veterinaria";

/** Cremación realizada, con los datos que usan los reportes. */
export interface CasoReportable {
  id: string;
  /** Fecha de la cremación, formato YYYY-MM-DD. */
  fecha: string;
  canal: Canal;
  /** Solo si el canal es "veterinaria". */
  veterinariaId?: string;
  distrito: string;
}
