/** Proveedor que vende un insumo. Un insumo puede tener varios; uno es el principal. */
export interface Proveedor {
  id: string;
  /** Razón social o nombre comercial. */
  empresa: string;
  /** Persona de contacto. */
  contacto?: string;
  telefono: string;
  /** Celular o WhatsApp, si es distinto del teléfono. */
  celular?: string;
  correo?: string;
  direccion?: string;
  /** Días desde el pedido hasta que llega el insumo. */
  diasEntrega?: number;
  principal: boolean;
  notas?: string;
}
