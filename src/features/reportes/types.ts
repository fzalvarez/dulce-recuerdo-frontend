export type Canal = "particular" | "veterinaria";

/** Planes de cremación. "sin-clasificar" es el cuarto caso opcional. */
export type PlanId = "clasico" | "eco" | "paz" | "sin-clasificar";

/** Cremación realizada, con los datos que usan los reportes. */
export interface CasoReportable {
  id: string;
  /** Fecha de la cremación, formato YYYY-MM-DD. */
  fecha: string;
  canal: Canal;
  /** Solo si el canal es "veterinaria". */
  veterinariaId?: string;
  distrito: string;
  plan: PlanId;
  /** Servicio complementario: presencia del tutor durante el proceso. */
  presencial: boolean;
  /** Servicio complementario: eutanasia incluida en la venta. */
  eutanasia: boolean;
  /** Peso de la mascota al momento del servicio, en kg. */
  pesoKg: number;
  /** Precio de lista del plan y peso, en S/. 0 si no tiene plan clasificado. */
  precio: number;
  /** Fecha en que se cobra, YYYY-MM-DD. Puede ser un mes antes de la cremación (anticipo). */
  fechaCobro: string;
}
