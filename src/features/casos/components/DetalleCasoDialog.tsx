import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import * as casosApi from "../api";
import type { CasoFila } from "../types";
import { ESTADO_BADGE, pagoBadge } from "../utils/estilos";
import {
  accionPrincipal,
  CANAL_LABEL,
  ESTADO_LABEL,
  fechaCorta,
  fechaHora,
  METODO_LABEL,
  MODALIDAD_LABEL,
  SERVICIO_LABEL,
  soles,
} from "../utils/casos";
import { Modal } from "./Dialogos";

export type AccionCaso = "pago" | "realizado" | "entregado" | "cancelar" | "precio";

export function DetalleCasoDialog({
  fila,
  onOpenChange,
  onAccion,
}: {
  fila: CasoFila | null;
  onOpenChange: (open: boolean) => void;
  onAccion: (tipo: AccionCaso) => void;
}) {
  return (
    <Modal open={fila !== null} onOpenChange={onOpenChange}>
      {fila && <DetalleContenido fila={fila} onCerrar={() => onOpenChange(false)} onAccion={onAccion} />}
    </Modal>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{etiqueta}</span>
      <span className="text-right font-medium text-slate-900 dark:text-white">{valor}</span>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 dark:border-white/10 p-4">
      <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500 mb-2">{titulo}</h3>
      {children}
    </section>
  );
}

function DetalleContenido({ fila, onCerrar, onAccion }: { fila: CasoFila; onCerrar: () => void; onAccion: (tipo: AccionCaso) => void }) {
  const detalle = useRecurso(() => casosApi.detalle(fila.id), [fila.id]);
  const pagos = useRecurso(() => casosApi.pagosDe(fila.id), [fila.id]);
  const d = detalle.data;
  const accion = accionPrincipal(fila.estado);
  const pago = pagoBadge(Number(fila.precio_total), Number(fila.total_pagado));
  const abierto = fila.estado === "AGENDADO" || fila.estado === "REALIZADO";

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">#{fila.id.slice(0, 8)}</span>
          <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", ESTADO_BADGE[fila.estado])}>
            {ESTADO_LABEL[fila.estado]}
          </span>
          {fila.estado !== "CANCELADO" && (
            <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", pago.clase)}>{pago.texto}</span>
          )}
        </div>
        <DialogTitle>
          {fila.mascota} · {fila.tutor}
        </DialogTitle>
        <DialogDescription>
          {fila.telefono ?? ""}
          {fila.dni ? ` · DNI ${fila.dni}` : ""}
          {fila.veterinaria ? ` · Refiere: ${fila.veterinaria}` : ""}
        </DialogDescription>
      </DialogHeader>

      {detalle.error && <p className="text-sm text-red-600">{detalle.error}</p>}

      <div className="flex flex-col gap-4">
        <Seccion titulo="Servicio">
          <Fila etiqueta="Servicio" valor={SERVICIO_LABEL[fila.servicio]} />
          <Fila etiqueta="Modalidad" valor={MODALIDAD_LABEL[fila.modalidad]} />
          <Fila etiqueta="Origen" valor={CANAL_LABEL[fila.canal_origen]} />
          {fila.plan_nombre && <Fila etiqueta="Plan" valor={fila.plan_nombre} />}
          <Fila etiqueta="Peso" valor={`${fila.peso_kg} kg`} />
          {fila.eutanasia_incluida && <Fila etiqueta="Eutanasia" valor="Incluida" />}
          {fila.distrito_origen && <Fila etiqueta="Distrito" valor={fila.distrito_origen} />}
          {d?.caso.direccion_origen && <Fila etiqueta="Dirección" valor={d.caso.direccion_origen} />}
          <Fila etiqueta="Agenda" valor={fechaHora(fila.inicio)} />
          {fila.fecha_realizado && <Fila etiqueta="Realizado" valor={fechaHora(fila.fecha_realizado)} />}
          {fila.fecha_entrega && <Fila etiqueta="Entregado" valor={fechaHora(fila.fecha_entrega)} />}
          {d?.caso.motivo_cancelacion && <Fila etiqueta="Motivo de cancelación" valor={d.caso.motivo_cancelacion} />}
          {d?.caso.monto_devuelto && <Fila etiqueta="Devuelto" valor={soles(d.caso.monto_devuelto)} />}
        </Seccion>

        <Seccion titulo="Precio">
          {d?.caso.desglose.map((l) => <Fila key={l.concepto} etiqueta={l.concepto} valor={soles(l.monto)} />)}
          <div className="mt-2 border-t border-slate-100 dark:border-white/10 pt-2">
            {d && d.caso.precio_total !== d.caso.precio_calculado && (
              <Fila etiqueta={`Ajustado a mano (${d.caso.motivo_ajuste ?? ""})`} valor={`antes ${soles(d.caso.precio_calculado)}`} />
            )}
            <Fila etiqueta="Total" valor={<span className="font-bold">{soles(fila.precio_total)}</span>} />
            <Fila etiqueta="Pagado" valor={soles(fila.total_pagado)} />
            <Fila
              etiqueta="Saldo"
              valor={<span className={cn(Number(fila.saldo) > 0 ? "text-amber-700" : "text-emerald-700")}>{soles(Math.max(0, Number(fila.saldo)))}</span>}
            />
            {d?.margen && <Fila etiqueta="Margen (precio − materiales)" valor={soles(d.margen)} />}
          </div>
        </Seccion>

        <Seccion titulo="Pagos">
          {pagos.data?.length === 0 && <p className="text-sm text-slate-500">Sin pagos registrados.</p>}
          {pagos.data?.map((p) => (
            <Fila key={p.id} etiqueta={`${fechaCorta(p.fecha)} · ${METODO_LABEL[p.metodo]}${p.factura_id ? " · factura" : ""}`} valor={soles(p.monto)} />
          ))}
        </Seccion>

        {d && d.materiales.length > 0 && (
          <Seccion titulo="Materiales usados">
            {d.materiales.map((m) => (
              <Fila key={m.articulo_id} etiqueta={`${m.nombre} × ${m.cantidad}`} valor={soles(m.costo_total)} />
            ))}
          </Seccion>
        )}
      </div>

      <DialogFooter className="flex-wrap gap-2">
        <Button variant="ghost" onClick={onCerrar}>
          Cerrar
        </Button>
        {fila.estado === "AGENDADO" && (
          <Button variant="ghost" className="text-red-600" onClick={() => onAccion("cancelar")}>
            Cancelar caso
          </Button>
        )}
        {abierto && (
          <Button variant="outline" onClick={() => onAccion("precio")}>
            Ajustar precio
          </Button>
        )}
        {fila.estado !== "CANCELADO" && Number(fila.saldo) > 0 && (
          <Button variant="outline" onClick={() => onAccion("pago")}>
            Registrar pago
          </Button>
        )}
        {accion && (
          <Button variant="operational" onClick={() => onAccion(accion.tipo)}>
            {accion.texto}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
