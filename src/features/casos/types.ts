/** Estados operativos que guarda el caso. */
export type EstadoOperativo = "EN_CONVERSACION" | "AGENDADO" | "REALIZADO" | "ENTREGADO";

/** Lo que se muestra: ABANDONADO se calcula, no se guarda. */
export type EstadoMostrado = EstadoOperativo | "ABANDONADO";

export type Servicio = "CREMACION" | "EUTANASIA";

export type Modalidad = "PRESENCIAL" | "NO_PRESENCIAL" | "DOMICILIO";

export type PlanId = "clasico" | "paz" | "eco";

export type MetodoPago = "EFECTIVO" | "YAPE" | "POS";

export type EstadoPago = "PENDIENTE" | "PARCIAL" | "PAGADO";

export interface Pago {
  id: string;
  monto: number;
  metodo: MetodoPago;
  /** YYYY-MM-DD */
  fecha: string;
}

export interface Caso {
  id: string;
  codigo: string;
  tutor: string;
  telefono: string;
  mascota: string;
  especie: string;
  pesoKg?: number;
  servicio: Servicio;
  modalidad: Modalidad;
  /** Obligatorio para cremación; no aplica a eutanasia sola. */
  plan?: PlanId;
  /** Eutanasia como extra de una cremación. */
  eutanasiaIncluida: boolean;
  complementoHuella: boolean;
  /** Obligatorio si la modalidad es domicilio: define el traslado. */
  distrito?: string;
  direccion?: string;
  canal: "directo" | "veterinaria";
  veterinaria?: string;
  /** YYYY-MM-DD y HH:MM, cuando el caso está agendado. */
  fechaServicio?: string;
  horaServicio?: string;
  pagos: Pago[];
  /** YYYY-MM-DD del último mensaje. Se usa para detectar abandono. */
  ultimoContacto: string;
  estado: EstadoOperativo;
}
