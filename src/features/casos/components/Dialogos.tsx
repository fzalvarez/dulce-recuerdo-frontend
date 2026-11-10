import { useState, type ReactNode } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ejecutar } from "@/shared/utils/ejecutar";
import { useRecurso } from "@/shared/hooks/useRecurso";
import * as casosApi from "../api";
import type { CasoFila, MetodoPago } from "../types";
import { combinarFechaHora, faltaUrna, hoyISO, METODO_LABEL, montoValido, soles } from "../utils/casos";
import { SelectorUrna } from "./SelectorUrna";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";

function horaActual(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function Modal({
  open,
  onOpenChange,
  children,
  ancho = "sm:max-w-lg",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  ancho?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${ancho} max-h-[90vh] overflow-y-auto`}>{children}</DialogContent>
    </Dialog>
  );
}

interface AccionProps {
  caso: CasoFila | null;
  onOpenChange: (open: boolean) => void;
  onHecho: () => void;
}

function Pie({ onCancelar, texto, guardando, onGuardar, variante = "operational" }: {
  onCancelar: () => void;
  texto: string;
  guardando: boolean;
  onGuardar: () => void;
  variante?: "operational" | "destructive";
}) {
  return (
    <DialogFooter>
      <Button variant="ghost" onClick={onCancelar} disabled={guardando}>
        Cancelar
      </Button>
      <Button variant={variante} onClick={onGuardar} disabled={guardando}>
        {guardando ? "Guardando…" : texto}
      </Button>
    </DialogFooter>
  );
}

// ---------- Registrar pago ----------

export function PagoDialog({ caso, onOpenChange, onHecho }: AccionProps) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange}>
      {caso && <PagoForm caso={caso} onCerrar={() => onOpenChange(false)} onHecho={onHecho} />}
    </Modal>
  );
}

function PagoForm({ caso, onCerrar, onHecho }: { caso: CasoFila; onCerrar: () => void; onHecho: () => void }) {
  const saldo = Math.max(0, Number(caso.saldo));
  const [monto, setMonto] = useState(saldo > 0 ? saldo.toFixed(2) : "");
  const [metodo, setMetodo] = useState<MetodoPago>("YAPE");
  const [fecha, setFecha] = useState(hoyISO());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const m = montoValido(monto);
    if (!m) return setError("El monto debe ser mayor a 0.");
    setGuardando(true);
    const ok = await ejecutar(
      () => casosApi.registrarPago({ caso_id: caso.id, monto: m, metodo, fecha: combinarFechaHora(fecha, "12:00") }),
      `Pago de ${soles(m)} registrado.`,
      "No se pudo registrar el pago."
    );
    setGuardando(false);
    if (ok) {
      onHecho();
      onCerrar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar pago · {caso.mascota}</DialogTitle>
        <DialogDescription>
          Precio: {soles(caso.precio_total)} · Pagado: {soles(caso.total_pagado)} · Saldo: {soles(saldo)}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pago-monto">Monto (S/)</Label>
          <Input id="pago-monto" type="number" min={0} step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium leading-none">Forma de pago</span>
          <BotonesOpcion ariaLabel="Forma de pago" columnas="grid-cols-2" value={metodo} onChange={setMetodo} opciones={(Object.keys(METODO_LABEL) as MetodoPago[]).map((m) => ({ value: m, label: METODO_LABEL[m] }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pago-fecha">Fecha del cobro</Label>
          <DatePicker id="pago-fecha" value={fecha} onChange={setFecha} />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Pie onCancelar={onCerrar} texto="Registrar pago" guardando={guardando} onGuardar={guardar} />
    </>
  );
}

// ---------- Marcar realizado (materiales) ----------

export function RealizadoDialog({ caso, onOpenChange, onHecho }: AccionProps) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange}>
      {caso && <RealizadoForm caso={caso} onCerrar={() => onOpenChange(false)} onHecho={onHecho} />}
    </Modal>
  );
}

interface LineaMaterial {
  clave: number;
  articulo_id: string;
  cantidad: string;
}

function RealizadoForm({ caso, onCerrar, onHecho }: { caso: CasoFila; onCerrar: () => void; onHecho: () => void }) {
  const disponibles = useRecurso(casosApi.materialesDisponibles);
  const opciones = useRecurso(casosApi.opciones);
  const esCremacion = caso.servicio === "CREMACION";
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState(horaActual);
  const [urnaId, setUrnaId] = useState(caso.urna_id ?? "");
  const [lineas, setLineas] = useState<LineaMaterial[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const agregar = () => setLineas((l) => [...l, { clave: Date.now() + Math.random(), articulo_id: "", cantidad: "1" }]);
  const cambiar = (clave: number, cambio: Partial<LineaMaterial>) =>
    setLineas((l) => l.map((x) => (x.clave === clave ? { ...x, ...cambio } : x)));

  const guardar = async () => {
    const materiales: { articulo_id: string; cantidad: number }[] = [];
    for (const l of lineas) {
      const cantidad = Number(l.cantidad);
      if (!l.articulo_id) return setError("Elige el artículo de cada línea o quítala.");
      if (!Number.isInteger(cantidad) || cantidad <= 0) return setError("La cantidad debe ser un entero mayor a 0.");
      materiales.push({ articulo_id: l.articulo_id, cantidad });
    }
    setGuardando(true);
    const ok = await ejecutar(
      () =>
        casosApi.marcarRealizado(caso.id, {
          fecha: combinarFechaHora(fecha, hora),
          materiales,
          urna_id: esCremacion && urnaId ? urnaId : null,
        }),
      "Servicio realizado. Queda pendiente la entrega.",
      "No se pudo marcar como realizado."
    );
    setGuardando(false);
    if (ok) {
      onHecho();
      onCerrar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Marcar realizado · {caso.mascota}</DialogTitle>
        <DialogDescription>
          Indica la urna, el marco, la placa y lo demás que se usó. Están incluidos en el plan: no
          cambian el precio, descuentan stock y registran su costo.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="re-fecha">Fecha del servicio</Label>
          <DatePicker id="re-fecha" value={fecha} onChange={setFecha} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="re-hora">Hora</Label>
          <Input id="re-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>

      {esCremacion && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Urna</span>
          <p className="text-xs text-slate-500">
            Sale del inventario al marcar realizado. Si todavía no se sabe, déjala vacía: se elige hasta la entrega.
          </p>
          {opciones.error && <p className="text-xs text-red-600">{opciones.error}</p>}
          {opciones.data && (
            <SelectorUrna
              urnas={opciones.data.urnas}
              value={urnaId}
              onChange={setUrnaId}
              actual={opciones.data.urnas.find((u) => u.id === caso.urna_id) ?? null}
            />
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Otros materiales (marco, placa…)</span>
        {disponibles.error && <p className="text-xs text-red-600">{disponibles.error}</p>}
        {lineas.map((l) => (
          <div key={l.clave} className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Select value={l.articulo_id} onValueChange={(v) => cambiar(l.clave, { articulo_id: v })}>
                <SelectTrigger className="w-full" aria-label="Artículo">
                  <SelectValue placeholder="Elegir artículo" />
                </SelectTrigger>
                <SelectContent>
                  {(disponibles.data ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nombre}
                      {a.tamano ? ` · ${a.tamano}` : ""}
                      {a.modelo ? ` · ${a.modelo}` : ""} ({a.stock} en stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              aria-label="Cantidad"
              className="w-20"
              type="number"
              min={1}
              value={l.cantidad}
              onChange={(e) => cambiar(l.clave, { cantidad: e.target.value })}
            />
            <Button variant="ghost" size="icon-sm" title="Quitar" onClick={() => setLineas((x) => x.filter((y) => y.clave !== l.clave))}>
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="self-start" onClick={agregar} disabled={disponibles.cargando}>
          Agregar material
        </Button>
        {disponibles.data?.length === 0 && (
          <p className="text-xs text-slate-500">No hay artículos con stock en Inventario.</p>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Pie onCancelar={onCerrar} texto="Marcar realizado" guardando={guardando} onGuardar={guardar} />
    </>
  );
}

// ---------- Cancelar ----------

export function CancelarDialog({ caso, onOpenChange, onHecho }: AccionProps) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange}>
      {caso && <CancelarForm caso={caso} onCerrar={() => onOpenChange(false)} onHecho={onHecho} />}
    </Modal>
  );
}

function CancelarForm({ caso, onCerrar, onHecho }: { caso: CasoFila; onCerrar: () => void; onHecho: () => void }) {
  const pagado = Number(caso.total_pagado);
  const [motivo, setMotivo] = useState("");
  const [retenido, setRetenido] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const retenidoNum = Number(retenido) || 0;

  const guardar = async () => {
    if (!motivo.trim()) return setError("Indica el motivo de la cancelación.");
    const r = montoValido(retenido, { permitirCero: true });
    if (r === null) return setError("El gasto retenido no es válido.");
    if (Number(r) > pagado) return setError("El gasto retenido no puede superar lo pagado.");
    setGuardando(true);
    const ok = await ejecutar(
      () => casosApi.cancelar(caso.id, motivo.trim(), r),
      `Caso cancelado. Se devuelve ${soles(pagado - Number(r))}.`,
      "No se pudo cancelar el caso."
    );
    setGuardando(false);
    if (ok) {
      onHecho();
      onCerrar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cancelar caso · {caso.mascota}</DialogTitle>
        <DialogDescription>
          Se devuelve lo pagado ({soles(pagado)}) menos el gasto que ya se haya generado.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ca-motivo">Motivo</Label>
          <Input id="ca-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ca-retenido">Gasto ya generado (S/)</Label>
          <Input id="ca-retenido" type="number" min={0} step="0.01" value={retenido} onChange={(e) => setRetenido(e.target.value)} />
          <p className="text-xs text-slate-500">A devolver: {soles(Math.max(0, pagado - retenidoNum))}</p>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Pie onCancelar={onCerrar} texto="Cancelar caso" guardando={guardando} onGuardar={guardar} variante="destructive" />
    </>
  );
}

// ---------- Ajustar precio ----------

export function PrecioDialog({ caso, onOpenChange, onHecho }: AccionProps) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange}>
      {caso && <PrecioForm caso={caso} onCerrar={() => onOpenChange(false)} onHecho={onHecho} />}
    </Modal>
  );
}

function PrecioForm({ caso, onCerrar, onHecho }: { caso: CasoFila; onCerrar: () => void; onHecho: () => void }) {
  const [precio, setPrecio] = useState(Number(caso.precio_total).toFixed(2));
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const p = montoValido(precio, { permitirCero: true });
    if (p === null) return setError("El precio no es válido.");
    if (!motivo.trim()) return setError("Indica el motivo del ajuste.");
    setGuardando(true);
    const ok = await ejecutar(
      () => casosApi.ajustarPrecio(caso.id, p, motivo.trim()),
      `Precio ajustado a ${soles(p)}.`,
      "No se pudo ajustar el precio."
    );
    setGuardando(false);
    if (ok) {
      onHecho();
      onCerrar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ajustar precio · {caso.mascota}</DialogTitle>
        <DialogDescription>El precio calculado por las tarifas queda guardado como referencia.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pr-precio">Nuevo precio (S/)</Label>
          <Input id="pr-precio" type="number" min={0} step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pr-motivo">Motivo</Label>
          <Input id="pr-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Pie onCancelar={onCerrar} texto="Guardar precio" guardando={guardando} onGuardar={guardar} />
    </>
  );
}

// ---------- Entregar ----------

/** Registra la entrega. Una cremación sin urna la elige aquí (spec urnas-variantes R14). */
export function EntregaDialog({ caso, onOpenChange, onHecho }: AccionProps) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange} ancho="sm:max-w-2xl">
      {caso && <EntregaForm caso={caso} onCerrar={() => onOpenChange(false)} onHecho={onHecho} />}
    </Modal>
  );
}

function EntregaForm({ caso, onCerrar, onHecho }: { caso: CasoFila; onCerrar: () => void; onHecho: () => void }) {
  const pideUrna = faltaUrna(caso);
  const opciones = useRecurso(() => (pideUrna ? casosApi.opciones() : Promise.resolve(null)), [pideUrna]);
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState(horaActual);
  const [urnaId, setUrnaId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (pideUrna && !urnaId) return setError("Elige la urna: una cremación no se entrega sin urna.");
    setGuardando(true);
    const ok = await ejecutar(
      () => casosApi.marcarEntregado(caso.id, combinarFechaHora(fecha, hora), pideUrna ? urnaId : null),
      `Entrega de ${caso.mascota} registrada.`,
      "No se pudo registrar la entrega."
    );
    setGuardando(false);
    if (ok) {
      onHecho();
      onCerrar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Entregar · {caso.mascota}</DialogTitle>
        <DialogDescription>
          {caso.tutor}
          {caso.urna ? ` · ${caso.urna}` : ""}
          {Number(caso.saldo) > 0 ? ` · Queda un saldo de ${soles(caso.saldo)}` : ""}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="en-fecha">Fecha</Label>
          <DatePicker id="en-fecha" value={fecha} onChange={setFecha} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="en-hora">Hora</Label>
          <Input id="en-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>
      {pideUrna && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Urna</span>
          <p className="text-xs text-slate-500">Todavía no se eligió. Sale del inventario al confirmar la entrega.</p>
          {opciones.error && <p className="text-xs text-red-600">{opciones.error}</p>}
          {opciones.data && <SelectorUrna urnas={opciones.data.urnas} value={urnaId} onChange={setUrnaId} />}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Pie onCancelar={onCerrar} texto="Confirmar entrega" guardando={guardando} onGuardar={guardar} />
    </>
  );
}

// ---------- Elegir o cambiar la urna ----------

export function UrnaDialog({ caso, onOpenChange, onHecho }: AccionProps) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange} ancho="sm:max-w-2xl">
      {caso && <UrnaForm caso={caso} onCerrar={() => onOpenChange(false)} onHecho={onHecho} />}
    </Modal>
  );
}

function UrnaForm({ caso, onCerrar, onHecho }: { caso: CasoFila; onCerrar: () => void; onHecho: () => void }) {
  const opciones = useRecurso(casosApi.opciones);
  const [urnaId, setUrnaId] = useState(caso.urna_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const saleYa = caso.estado === "REALIZADO";

  const guardar = async () => {
    if (!urnaId) return setError("Elige la urna.");
    setGuardando(true);
    const ok = await ejecutar(() => casosApi.elegirUrna(caso.id, urnaId), "Urna guardada.", "No se pudo guardar la urna.");
    setGuardando(false);
    if (ok) {
      onHecho();
      onCerrar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{caso.urna_id ? "Cambiar urna" : "Elegir urna"} · {caso.mascota}</DialogTitle>
        <DialogDescription>
          {saleYa
            ? "El servicio ya se realizó: la urna sale del inventario al guardar y ya no se podrá cambiar."
            : "Queda reservada para este caso y sale del inventario al marcarlo realizado."}
        </DialogDescription>
      </DialogHeader>
      {opciones.error && <p className="text-xs text-red-600">{opciones.error}</p>}
      {opciones.data && (
        <SelectorUrna
          urnas={opciones.data.urnas}
          value={urnaId}
          onChange={setUrnaId}
          actual={opciones.data.urnas.find((u) => u.id === caso.urna_id) ?? null}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Pie onCancelar={onCerrar} texto="Guardar urna" guardando={guardando} onGuardar={guardar} />
    </>
  );
}
