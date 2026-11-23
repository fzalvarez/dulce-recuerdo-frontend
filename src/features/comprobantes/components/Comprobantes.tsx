import { useState } from "react";
import { FileTextIcon, ReceiptIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { soles } from "@/features/casos/utils/casos";
import * as C from "../api";

const DOC_ANONIMO = "00000000";

/** Estado SUNAT del comprobante. Lo intermedio (encolado, enviando) se muestra como «En envío». */
export function EstadoComprobante({ estado }: { estado: string }) {
  const estilo =
    estado === "ACEPTADO"
      ? { texto: "Aceptado SUNAT", clase: "bg-emerald-100 text-emerald-800" }
      : estado === "RECHAZADO"
        ? { texto: "Rechazado", clase: "bg-red-100 text-red-700" }
        : estado === "ANULADO"
          ? { texto: "Anulado", clase: "bg-slate-200 text-slate-500" }
          : { texto: "En envío", clase: "bg-amber-100 text-amber-800" };
  return <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold whitespace-nowrap", estilo.clase)}>{estilo.texto}</span>;
}

/** Comprobantes emitidos: número, cliente, total, estado SUNAT y PDF. */
export function ListaComprobantes({ comprobantes, onCambio }: { comprobantes: C.Comprobante[]; onCambio: () => void }) {
  return (
    <ul className="flex flex-col gap-2">
      {comprobantes.map((c) => (
        <li key={c.id} className="rounded-lg border border-slate-200 dark:border-white/10 p-3 flex flex-col gap-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">
              {c.tipo_doc === "03" ? "Boleta" : "Factura"} {c.numero}
              {c.ambiente === "test" && (
                <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-800">PRUEBA</span>
              )}
            </span>
            <EstadoComprobante estado={c.estado} />
          </div>
          <p className="text-xs text-slate-500">
            {C.TIPO_DOC_CLIENTE[c.cliente_tipo_doc as C.TipoDocCliente] ?? "Doc."} {c.cliente_num_doc} · {c.cliente_razon_social} ·{" "}
            <strong className="text-slate-700 dark:text-slate-200">{soles(c.total)}</strong> (IGV {soles(c.igv)})
          </p>
          {c.estado === "RECHAZADO" && c.descripcion_respuesta && <p className="text-xs text-red-600">{c.descripcion_respuesta}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => C.abrirPdf(c.id, "a4")}>
              <FileTextIcon className="size-3.5" />
              PDF A4
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => C.abrirPdf(c.id, "ticket80")}>
              <ReceiptIcon className="size-3.5" />
              Ticket
            </Button>
            {c.estado !== "ACEPTADO" && c.estado !== "ANULADO" && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  if (await ejecutar(() => C.actualizar(c.id), "Estado actualizado.", "No se pudo consultar el estado.")) onCambio();
                }}
              >
                <RefreshCwIcon className="size-3.5" />
                Actualizar estado
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Comprobante electrónico de un servicio: lo emitido y, si no hay uno vigente, el formulario para
 * emitir boleta (cliente particular) o factura (con RUC). Prellena con la ficha del cliente.
 */
export function ComprobanteDeServicio({
  casoId,
  cliente,
  bloqueado,
  onEmitido,
}: {
  casoId: string;
  cliente: { nombre: string; dni: string | null; direccion: string | null } | null;
  /** Motivo por el que no se puede emitir (p. ej. servicio cancelado o facturado por convenio). */
  bloqueado?: string | null;
  onEmitido?: () => void;
}) {
  const recurso = useRecurso(() => C.listar({ caso_id: casoId }), [casoId]);
  const comprobantes = recurso.data ?? [];
  const vigente = comprobantes.some((c) => !C.NO_VIGENTES.includes(c.estado));

  return (
    <div className="flex flex-col gap-3">
      {recurso.error && <p className="text-xs text-red-600">{recurso.error}</p>}
      {comprobantes.length > 0 && <ListaComprobantes comprobantes={comprobantes} onCambio={recurso.recargar} />}
      {!vigente && !recurso.cargando && (bloqueado ? (
        <p className="text-xs text-slate-500">{bloqueado}</p>
      ) : (
        <FormularioEmision
          casoId={casoId}
          cliente={cliente}
          onHecho={() => {
            recurso.recargar();
            onEmitido?.();
          }}
        />
      ))}
    </div>
  );
}

function FormularioEmision({
  casoId,
  cliente,
  onHecho,
}: {
  casoId: string;
  cliente: { nombre: string; dni: string | null; direccion: string | null } | null;
  onHecho: () => void;
}) {
  const [tipo, setTipo] = useState<"BOLETA" | "FACTURA">("BOLETA");
  const [tipoDoc, setTipoDoc] = useState<C.TipoDocCliente>("1");
  const [numero, setNumero] = useState(cliente?.dni ?? "");
  const [razon, setRazon] = useState(cliente?.nombre ?? "");
  const [direccion, setDireccion] = useState(cliente?.direccion ?? "");
  const [anonimo, setAnonimo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cambiarTipo = (t: "BOLETA" | "FACTURA") => {
    setTipo(t);
    setAnonimo(false);
    if (t === "FACTURA") {
      setTipoDoc("6");
      setNumero("");
      setRazon("");
    } else {
      setTipoDoc("1");
      setNumero(cliente?.dni ?? "");
      setRazon(cliente?.nombre ?? "");
    }
  };

  const emitir = async () => {
    setGuardando(true);
    const ok = await ejecutar(
      () =>
        C.emitirParaCaso(casoId, {
          tipo,
          cliente_tipo_doc: anonimo ? "1" : tipoDoc,
          cliente_num_doc: anonimo ? DOC_ANONIMO : numero.trim(),
          cliente_razon_social: anonimo ? "CONSUMIDOR FINAL" : razon.trim(),
          cliente_direccion: direccion.trim() || null,
        }),
      tipo === "BOLETA" ? "Boleta emitida." : "Factura emitida.",
      "No se pudo emitir el comprobante."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  const completo = anonimo || (numero.trim() && razon.trim());
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 dark:border-white/15 p-3">
      <BotonesOpcion
        ariaLabel="Tipo de comprobante"
        columnas="grid-cols-2"
        value={tipo}
        onChange={cambiarTipo}
        opciones={[
          { value: "BOLETA", label: "Boleta" },
          { value: "FACTURA", label: "Factura" },
        ]}
      />
      {tipo === "BOLETA" && (
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" className="size-4 accent-brand-500" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
          Consumidor final, sin documento (solo menos de S/ 700)
        </label>
      )}
      {!anonimo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ce-tipodoc">Documento</Label>
            <Select value={tipoDoc} onValueChange={(v) => setTipoDoc(v as C.TipoDocCliente)} disabled={tipo === "FACTURA"}>
              <SelectTrigger id="ce-tipodoc" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(C.TIPO_DOC_CLIENTE) as C.TipoDocCliente[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {C.TIPO_DOC_CLIENTE[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ce-numero">Número</Label>
            <Input id="ce-numero" inputMode="numeric" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ce-razon">{tipo === "FACTURA" ? "Razón social" : "Nombre"}</Label>
            <Input id="ce-razon" value={razon} onChange={(e) => setRazon(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ce-direccion">Dirección (opcional)</Label>
            <Input id="ce-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
        </div>
      )}
      <Button variant="operational" className="self-start" disabled={!completo || guardando} onClick={emitir}>
        {guardando ? "Emitiendo…" : tipo === "BOLETA" ? "Emitir boleta" : "Emitir factura"}
      </Button>
    </div>
  );
}

/**
 * Factura electrónica de una factura de convenio. Prellena RUC, razón social y dirección con la ficha
 * del CRM de la veterinaria; se revisan antes de emitir.
 */
export function ComprobanteDeConvenio({
  facturaId,
  fiscal,
}: {
  facturaId: string;
  fiscal: { ruc: string; razonSocial: string; direccion: string };
}) {
  const recurso = useRecurso(() => C.listar({ factura_veterinaria_id: facturaId }), [facturaId]);
  const comprobantes = recurso.data ?? [];
  const vigente = comprobantes.some((c) => !C.NO_VIGENTES.includes(c.estado));
  const [abierto, setAbierto] = useState(false);
  const [ruc, setRuc] = useState(fiscal.ruc);
  const [razon, setRazon] = useState(fiscal.razonSocial);
  const [direccion, setDireccion] = useState(fiscal.direccion);
  const [guardando, setGuardando] = useState(false);

  const emitir = async () => {
    setGuardando(true);
    const ok = await ejecutar(
      () => C.emitirFacturaConvenio(facturaId, { cliente_num_doc: ruc.trim(), cliente_razon_social: razon.trim(), cliente_direccion: direccion.trim() || null }),
      "Factura electrónica emitida.",
      "No se pudo emitir la factura electrónica."
    );
    setGuardando(false);
    if (ok) {
      setAbierto(false);
      recurso.recargar();
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2">
      {comprobantes.length > 0 && <ListaComprobantes comprobantes={comprobantes} onCambio={recurso.recargar} />}
      {!vigente && !recurso.cargando && !abierto && (
        <Button variant="outline" size="sm" className="self-start gap-1.5" onClick={() => setAbierto(true)}>
          <ReceiptIcon className="size-3.5" />
          Emitir factura electrónica
        </Button>
      )}
      {!vigente && abierto && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end rounded-lg border border-dashed border-slate-300 dark:border-white/15 p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`fe-ruc-${facturaId}`}>RUC</Label>
            <Input id={`fe-ruc-${facturaId}`} inputMode="numeric" maxLength={11} value={ruc} onChange={(e) => setRuc(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`fe-razon-${facturaId}`}>Razón social</Label>
            <Input id={`fe-razon-${facturaId}`} value={razon} onChange={(e) => setRazon(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor={`fe-dir-${facturaId}`}>Dirección (opcional)</Label>
            <Input id={`fe-dir-${facturaId}`} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <Button variant="ghost" size="sm" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button variant="operational" size="sm" disabled={!/^\d{11}$/.test(ruc.trim()) || !razon.trim() || guardando} onClick={emitir}>
              {guardando ? "Emitiendo…" : "Emitir factura"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
