import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notifyError, notifySuccess } from "@/shared/utils";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PLAN_NOMBRE } from "../data/tarifas";
import type { Caso, EstadoMostrado, EstadoPago } from "../types";
import { ESTADO_BADGE, PAGO_BADGE } from "../utils/estilos";
import {
  accionPrincipal,
  calcularPrecio,
  ESTADO_LABEL,
  formatoFecha,
  MODALIDAD_LABEL,
  mensajeCotizacion,
  SERVICIO_LABEL,
  soles,
  totalPagado,
} from "../utils/casos";
import { Modal } from "./Dialogos";

export function DetalleCasoDialog({
  caso,
  estado,
  estadoPagoActual,
  onOpenChange,
  onAccion,
}: {
  caso: Caso | null;
  estado: EstadoMostrado;
  estadoPagoActual: EstadoPago;
  onOpenChange: (open: boolean) => void;
  onAccion: (tipo: string) => void;
}) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange}>
      {caso && (
        <DetalleContenido
          caso={caso}
          estado={estado}
          estadoPagoActual={estadoPagoActual}
          onCerrar={() => onOpenChange(false)}
          onAccion={onAccion}
        />
      )}
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

function DetalleContenido({
  caso,
  estado,
  estadoPagoActual,
  onCerrar,
  onAccion,
}: {
  caso: Caso;
  estado: EstadoMostrado;
  estadoPagoActual: EstadoPago;
  onCerrar: () => void;
  onAccion: (tipo: string) => void;
}) {
  const cot = calcularPrecio(caso);
  const pagado = totalPagado(caso);
  const accion = accionPrincipal(caso, estado);
  const puedeCopiar = cot.faltante === null && estado !== "ABANDONADO";

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensajeCotizacion(caso, cot));
      notifySuccess("Mensaje copiado. Pégalo en WhatsApp.");
    } catch {
      notifyError("No se pudo copiar. Revisa los permisos del navegador.");
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">#{caso.codigo}</span>
          <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", ESTADO_BADGE[estado])}>
            {ESTADO_LABEL[estado]}
          </span>
          {estado !== "ABANDONADO" && (
            <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", PAGO_BADGE[estadoPagoActual].clase)}>
              {PAGO_BADGE[estadoPagoActual].texto}
            </span>
          )}
        </div>
        <DialogTitle>
          {caso.mascota} · {caso.tutor}
        </DialogTitle>
        <DialogDescription>
          {caso.telefono}
          {caso.canal === "veterinaria" && caso.veterinaria ? ` · Refiere: ${caso.veterinaria}` : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <Seccion titulo="Servicio">
          <Fila etiqueta="Servicio" valor={SERVICIO_LABEL[caso.servicio]} />
          <Fila etiqueta="Modalidad" valor={MODALIDAD_LABEL[caso.modalidad]} />
          {caso.servicio === "CREMACION" && (
            <Fila etiqueta="Plan" valor={caso.plan ? PLAN_NOMBRE[caso.plan] : "Por definir"} />
          )}
          {caso.servicio === "CREMACION" && (
            <Fila etiqueta="Peso" valor={caso.pesoKg !== undefined ? `${caso.pesoKg} kg` : "Falta"} />
          )}
          {caso.modalidad === "DOMICILIO" && (
            <Fila etiqueta="Distrito" valor={caso.distrito ?? "Falta"} />
          )}
          {caso.direccion && <Fila etiqueta="Dirección" valor={caso.direccion} />}
          {caso.fechaServicio && (
            <Fila
              etiqueta="Agenda"
              valor={`${formatoFecha(caso.fechaServicio)}${caso.horaServicio ? ` · ${caso.horaServicio}` : ""}`}
            />
          )}
        </Seccion>

        <Seccion titulo="Precio">
          {cot.lineas.map((l) => (
            <Fila
              key={l.concepto}
              etiqueta={l.concepto}
              valor={l.pendiente ? <span className="text-amber-700">Pendiente de tarifa</span> : soles(l.monto)}
            />
          ))}
          <div className="mt-2 border-t border-slate-100 dark:border-white/10 pt-2">
            <Fila etiqueta="Total" valor={<span className="font-bold">{soles(cot.total)}</span>} />
            <Fila etiqueta="Pagado" valor={soles(pagado)} />
            <Fila
              etiqueta="Saldo"
              valor={<span className={cn(cot.total - pagado > 0 ? "text-amber-700" : "text-emerald-700")}>{soles(Math.max(0, cot.total - pagado))}</span>}
            />
          </div>
          {cot.faltante && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
              Para dar el precio falta: {cot.faltante}.
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={!puedeCopiar}
            onClick={copiar}
          >
            Copiar mensaje de cotización para WhatsApp
          </Button>
        </Seccion>

        <Seccion titulo="Pagos">
          {caso.pagos.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay pagos registrados.</p>
          ) : (
            caso.pagos.map((p) => (
              <Fila key={p.id} etiqueta={`${formatoFecha(p.fecha)} · ${p.metodo}`} valor={soles(p.monto)} />
            ))
          )}
        </Seccion>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar}>
          Cerrar
        </Button>
        {estado !== "ABANDONADO" && estado !== "ENTREGADO" && (
          <Button variant="outline" onClick={() => onAccion("pago")}>
            Registrar pago
          </Button>
        )}
        {accion && accion.tipo !== "pago" && (
          <Button variant="operational" onClick={() => onAccion(accion.tipo)}>
            {accion.texto}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
