import { useEffect, useState } from "react";
import { BanIcon, EyeIcon, FileCode2Icon, FileTextIcon, ReceiptIcon, RefreshCwIcon, SearchIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { notifyError, notifySuccess } from "@/shared/utils";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { Modal } from "@/features/casos/components/Dialogos";
import { soles } from "@/features/casos/utils/casos";
import * as C from "../api";
import { Documento } from "./Documento";
import { fechaDoc } from "../utils";

const DOC_ANONIMO = "00000000";
const nombreTipo = (tipoDoc: string) => (tipoDoc === "03" ? "Boleta" : "Factura");

// ---------- Estado y descargas ----------

/** Estado SUNAT. Lo intermedio (encolado, enviando) se muestra como «En envío». */
export function EstadoComprobante({ estado }: { estado: string }) {
  const estilo =
    estado === "ACEPTADO"
      ? { texto: "Aceptado SUNAT", clase: "bg-emerald-100 text-emerald-800" }
      : estado === "RECHAZADO"
        ? { texto: "Rechazado", clase: "bg-red-100 text-red-700" }
        : estado === "ANULANDO"
          ? { texto: "Anulación en curso", clase: "bg-orange-100 text-orange-800" }
          : estado === "ANULADO"
            ? { texto: "Anulado", clase: "bg-slate-200 text-slate-600" }
            : estado === "ERROR" || estado === "COLA_FALLIDA"
              ? { texto: "Error de envío", clase: "bg-red-100 text-red-700" }
              : { texto: "En envío", clase: "bg-amber-100 text-amber-800" };
  return <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold whitespace-nowrap", estilo.clase)}>{estilo.texto}</span>;
}

/** PDF A4, ticket, XML y CDR: lo mismo que ofrece cualquier facturador. */
export function Descargas({ comprobante, compacto }: { comprobante: { id: string; estado: string }; compacto?: boolean }) {
  const conCdr = ["ACEPTADO", "RECHAZADO", "ANULANDO", "ANULADO"].includes(comprobante.estado);
  const bajar = (clase: "xml" | "cdr") =>
    C.descargar(comprobante.id, clase).catch((e) => notifyError(getApiErrorMessage(e, `No se pudo descargar el ${clase.toUpperCase()}.`)));
  const tam = compacto ? "sm" : "default";
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size={tam} className="gap-1.5" onClick={() => C.abrirPdf(comprobante.id, "a4")}>
        <FileTextIcon className="size-3.5" />
        PDF A4
      </Button>
      <Button variant="outline" size={tam} className="gap-1.5" onClick={() => C.abrirPdf(comprobante.id, "ticket80")}>
        <ReceiptIcon className="size-3.5" />
        Ticket
      </Button>
      <Button variant="outline" size={tam} className="gap-1.5" onClick={() => bajar("xml")}>
        <FileCode2Icon className="size-3.5" />
        XML
      </Button>
      <Button variant="outline" size={tam} className="gap-1.5" disabled={!conCdr} title={conCdr ? "Constancia de recepción de SUNAT" : "SUNAT todavía no responde"} onClick={() => bajar("cdr")}>
        <ShieldCheckIcon className="size-3.5" />
        CDR
      </Button>
    </div>
  );
}

// ---------- Lista corta (dentro del servicio o de la factura de convenio) ----------

export function ListaComprobantes({ comprobantes, onCambio }: { comprobantes: C.Comprobante[]; onCambio: () => void }) {
  const [viendo, setViendo] = useState<string | null>(null);
  return (
    <>
      <ul className="flex flex-col gap-2">
        {comprobantes.map((c) => (
          <li key={c.id} className="rounded-lg border border-slate-200 dark:border-white/10 p-3 flex flex-col gap-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {nombreTipo(c.tipo_doc)} <span className="font-mono">{c.numero}</span>
                {c.ambiente === "test" && (
                  <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-800">PRUEBA</span>
                )}
              </span>
              <EstadoComprobante estado={c.estado} />
            </div>
            <p className="text-xs text-slate-500">
              {fechaDoc(c.fecha_emision)} · {c.cliente_razon_social} · <strong className="text-slate-700 dark:text-slate-200">{soles(c.total)}</strong>
            </p>
            {C.NO_VIGENTES.includes(c.estado) && c.descripcion_respuesta && <p className="text-xs text-red-600">{c.descripcion_respuesta}</p>}
            <Button variant="outline" size="sm" className="self-start gap-1.5" onClick={() => setViendo(c.id)}>
              <EyeIcon className="size-3.5" />
              Ver comprobante
            </Button>
          </li>
        ))}
      </ul>
      <Modal open={viendo !== null} onOpenChange={(o) => !o && setViendo(null)} ancho="sm:max-w-3xl">
        {viendo && <DetalleComprobante id={viendo} onCambio={onCambio} />}
      </Modal>
    </>
  );
}

// ---------- Detalle de un comprobante emitido ----------

/** El comprobante emitido: documento, estado SUNAT, descargas y anulación. */
export function DetalleComprobante({ id, onCambio }: { id: string; onCambio?: () => void }) {
  const recurso = useRecurso(() => C.detalle(id), [id]);
  const d = recurso.data;
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const refrescar = () => {
    recurso.recargar();
    onCambio?.();
  };
  const consultar = async () => {
    setOcupado(true);
    if (await ejecutar(() => C.actualizar(id), "Estado consultado en SUNAT.", "No se pudo consultar el estado.")) refrescar();
    setOcupado(false);
  };
  const confirmarAnulacion = async () => {
    setOcupado(true);
    const ok = await ejecutar(
      () => C.anular(id, motivo.trim()),
      "Anulación enviada a SUNAT.",
      "No se pudo anular el comprobante."
    );
    setOcupado(false);
    if (ok) {
      setAnulando(false);
      refrescar();
    }
  };

  if (recurso.error) return <p className="text-sm text-red-600">{recurso.error}</p>;
  if (!d) return <p className="text-sm text-slate-500">Cargando comprobante…</p>;

  const enCurso = !["ACEPTADO", "ANULADO", ...C.NO_VIGENTES].includes(d.estado);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {nombreTipo(d.tipo_doc)} <span className="font-mono">{d.numero}</span>
          <EstadoComprobante estado={d.estado} />
        </DialogTitle>
        <DialogDescription>
          {d.origen === "CONVENIO" ? `Factura de convenio · ${d.referencia ?? ""}` : `Servicio ${d.referencia ?? ""}${d.mascota ? ` · ${d.mascota}` : ""}`}
        </DialogDescription>
      </DialogHeader>

      {(d.codigo_respuesta || d.descripcion_respuesta) && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-xs",
            C.NO_VIGENTES.includes(d.estado) ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-300"
          )}
        >
          <span className="font-semibold">Respuesta SUNAT{d.codigo_respuesta ? ` (${d.codigo_respuesta})` : ""}:</span>{" "}
          {d.descripcion_respuesta ?? "—"}
        </p>
      )}
      {d.motivo_baja && (
        <p className="rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-800">
          <span className="font-semibold">Anulación pedida el {fechaDoc(d.fecha_baja)}:</span> {d.motivo_baja}
        </p>
      )}

      <Documento doc={d} />

      <Descargas comprobante={d} compacto />

      {d.hash && <p className="text-[11px] text-slate-400 break-all">Código hash: {d.hash}</p>}

      <DialogFooter className="flex-wrap gap-2 sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(enCurso || d.estado === "ANULANDO") && (
            <Button variant="ghost" className="gap-1.5" disabled={ocupado} onClick={consultar}>
              <RefreshCwIcon className="size-4" />
              Consultar estado en SUNAT
            </Button>
          )}
        </div>
        {d.estado === "ACEPTADO" &&
          (d.dias_para_anular > 0 ? (
            <Button variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setAnulando(true)}>
              <BanIcon className="size-4" />
              Anular comprobante
            </Button>
          ) : (
            <p className="text-xs text-slate-500 max-w-72">
              Pasó el plazo de 7 días para anular ante SUNAT: para corregirlo corresponde una nota de crédito.
            </p>
          ))}
      </DialogFooter>

      {anulando && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50/60 p-3 dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-sm text-red-800 dark:text-red-300">
            Se enviará a SUNAT la {d.tipo_doc === "03" ? "anulación por resumen diario" : "comunicación de baja"} de{" "}
            <strong className="font-mono">{d.numero}</strong> por {soles(d.total)}. Quedan {d.dias_para_anular} día(s) de plazo. No se
            puede deshacer; si el servicio sigue cobrándose, después emite un comprobante nuevo.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="baja-motivo">Motivo (lo recibe SUNAT)</Label>
            <Textarea id="baja-motivo" rows={2} maxLength={250} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Error en los datos del cliente" />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setAnulando(false)} disabled={ocupado}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={motivo.trim().length < 3 || ocupado} onClick={confirmarAnulacion}>
              {ocupado ? "Enviando…" : "Confirmar anulación"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Emisión con vista previa ----------

type Cliente = { nombre: string; dni: string | null; direccion: string | null };

export type OrigenEmision =
  | { tipo: "servicio"; casoId: string; cliente: Cliente | null; tipoInicial?: "BOLETA" | "FACTURA"; titulo?: string }
  | { tipo: "convenio"; facturaId: string; fiscal: { ruc: string; razonSocial: string; direccion: string }; titulo?: string };

/**
 * Emisión como en un facturador: a la izquierda los datos del cliente; a la derecha el comprobante
 * tal como saldrá (número, detalle, IGV, total y monto en letras), calculado sin enviar nada.
 * Solo con el documento a la vista se confirma el envío a SUNAT; luego se muestra el resultado.
 */
export function EmitirComprobante({ origen: origenProp, onCerrar, onEmitido }: { origen: OrigenEmision; onCerrar: () => void; onEmitido?: () => void }) {
  // Fijo durante la emisión: la vista previa no se recalcula si el padre vuelve a dibujar.
  const [origen] = useState(origenProp);
  const convenio = origen.tipo === "convenio";
  const inicial = origen.tipo === "servicio" ? (origen.tipoInicial ?? "BOLETA") : "FACTURA";
  const [tipo, setTipo] = useState<"BOLETA" | "FACTURA">(inicial);
  const [tipoDoc, setTipoDoc] = useState<C.TipoDocCliente>(inicial === "FACTURA" ? "6" : "1");
  const datoInicial = (t: "BOLETA" | "FACTURA") =>
    origen.tipo === "convenio"
      ? { numero: origen.fiscal.ruc, razon: origen.fiscal.razonSocial, direccion: origen.fiscal.direccion }
      : t === "FACTURA"
        ? { numero: "", razon: "", direccion: origen.cliente?.direccion ?? "" }
        : { numero: origen.cliente?.dni ?? "", razon: origen.cliente?.nombre ?? "", direccion: origen.cliente?.direccion ?? "" };
  const [numero, setNumero] = useState(datoInicial(inicial).numero);
  const [razon, setRazon] = useState(datoInicial(inicial).razon);
  const [direccion, setDireccion] = useState(datoInicial(inicial).direccion);
  const [anonimo, setAnonimo] = useState(false);
  const [previa, setPrevia] = useState<C.DocumentoComprobante | null>(null);
  const [errorPrevia, setErrorPrevia] = useState<string | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [emitido, setEmitido] = useState<C.Comprobante | null>(null);

  const cambiarTipo = (t: "BOLETA" | "FACTURA") => {
    setTipo(t);
    setAnonimo(false);
    setTipoDoc(t === "FACTURA" ? "6" : "1");
    const d = datoInicial(t);
    setNumero(d.numero);
    setRazon(d.razon);
  };

  const docCliente = anonimo ? "1" : tipoDoc;
  const numCliente = anonimo ? DOC_ANONIMO : numero.trim();
  const razonCliente = anonimo ? "CONSUMIDOR FINAL" : razon.trim();
  const largo: Partial<Record<C.TipoDocCliente, number>> = { "1": 8, "6": 11 };
  const faltante = !razonCliente
    ? `Escribe ${tipo === "FACTURA" ? "la razón social" : "el nombre del cliente"}.`
    : largo[docCliente] && !new RegExp(`^\\d{${largo[docCliente]}}$`).test(numCliente)
      ? `El ${C.TIPO_DOC_CLIENTE[docCliente]} tiene ${largo[docCliente]} dígitos.`
      : !numCliente
        ? "Escribe el número de documento."
        : null;

  // Vista previa: se recalcula al cambiar los datos (con una pausa para no consultar por cada tecla).
  useEffect(() => {
    if (faltante || emitido) return;
    let vigente = true;
    const t = setTimeout(async () => {
      setCalculando(true);
      try {
        const doc =
          origen.tipo === "servicio"
            ? await C.vistaPreviaCaso(origen.casoId, {
                tipo,
                cliente_tipo_doc: docCliente,
                cliente_num_doc: numCliente,
                cliente_razon_social: razonCliente,
                cliente_direccion: direccion.trim() || null,
              })
            : await C.vistaPreviaConvenio(origen.facturaId, {
                cliente_num_doc: numCliente,
                cliente_razon_social: razonCliente,
                cliente_direccion: direccion.trim() || null,
              });
        if (vigente) {
          setPrevia(doc);
          setErrorPrevia(null);
        }
      } catch (e) {
        if (vigente) {
          setPrevia(null);
          setErrorPrevia(getApiErrorMessage(e, "No se pudo calcular el comprobante."));
        }
      } finally {
        if (vigente) setCalculando(false);
      }
    }, 450);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [origen, tipo, docCliente, numCliente, razonCliente, direccion, faltante, emitido]);

  const emitir = async () => {
    setEnviando(true);
    try {
      const cuerpo = { cliente_num_doc: numCliente, cliente_razon_social: razonCliente, cliente_direccion: direccion.trim() || null };
      const c =
        origen.tipo === "servicio"
          ? await C.emitirParaCaso(origen.casoId, { ...cuerpo, tipo, cliente_tipo_doc: docCliente })
          : await C.emitirFacturaConvenio(origen.facturaId, cuerpo);
      setEmitido(c);
      notifySuccess(`${nombreTipo(c.tipo_doc)} ${c.numero} enviada a SUNAT.`);
      onEmitido?.();
    } catch (e) {
      notifyError(getApiErrorMessage(e, "No se pudo emitir el comprobante."));
    } finally {
      setEnviando(false);
    }
  };

  if (emitido) return <ResultadoEmision comprobante={emitido} onCerrar={onCerrar} />;

  const listo = !faltante && previa && !errorPrevia && !calculando;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{convenio ? "Emitir factura electrónica" : "Emitir comprobante electrónico"}</DialogTitle>
        <DialogDescription>{origen.titulo ?? "Revisa el comprobante antes de enviarlo a SUNAT."}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4">
        {/* Datos */}
        <div className="flex flex-col gap-3">
          <BuscadorCliente
            soloRuc={convenio}
            onElegir={(s) => {
              if (!convenio) setTipo(s.cliente_tipo_doc === "6" ? "FACTURA" : "BOLETA");
              setAnonimo(false);
              setTipoDoc(s.cliente_tipo_doc);
              setNumero(s.cliente_num_doc);
              setRazon(s.cliente_razon_social);
              setDireccion(s.cliente_direccion ?? "");
            }}
          />
          {!convenio && (
            <div className="space-y-1.5">
              <Label>Tipo de comprobante</Label>
              <BotonesOpcion
                ariaLabel="Tipo de comprobante"
                columnas="grid-cols-2"
                value={tipo}
                onChange={cambiarTipo}
                opciones={[
                  { value: "BOLETA", label: "Boleta", detalle: "Persona natural, DNI" },
                  { value: "FACTURA", label: "Factura", detalle: "Empresa o persona con RUC" },
                ]}
              />
            </div>
          )}
          {tipo === "BOLETA" && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" className="size-4 accent-brand-500" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
              Consumidor final, sin documento (solo menos de S/ 700)
            </label>
          )}
          {!anonimo && (
            <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-3">
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
                <Input
                  id="ce-numero"
                  inputMode="numeric"
                  maxLength={tipoDoc === "6" ? 11 : tipoDoc === "1" ? 8 : 20}
                  className="tabular-nums"
                  value={numero}
                  onChange={(e) => setNumero(tipoDoc === "1" || tipoDoc === "6" ? e.target.value.replace(/\D/g, "") : e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ce-razon">{tipo === "FACTURA" ? "Razón social" : "Nombre completo"}</Label>
                <Input id="ce-razon" value={razon} onChange={(e) => setRazon(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ce-direccion">Dirección {tipo === "FACTURA" ? "fiscal" : "(opcional)"}</Label>
                <Input id="ce-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
            </div>
          )}
          {faltante && <p className="text-xs text-amber-700">{faltante}</p>}
        </div>

        {/* Comprobante */}
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase tracking-wider font-semibold text-slate-500">Así saldrá el comprobante</p>
          {errorPrevia ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorPrevia}</p>
          ) : previa ? (
            <div className={cn("transition-opacity", calculando && "opacity-50")}>
              <Documento doc={previa} borrador />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              {calculando ? "Calculando…" : "Completa los datos del cliente para ver el comprobante."}
            </p>
          )}
        </div>
      </div>

      <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 max-w-md">
          {listo && previa
            ? `Se enviará a SUNAT la ${tipo === "BOLETA" ? "boleta" : "factura"} ${previa.numero} por ${soles(previa.total)} a nombre de ${previa.cliente_razon_social}. Una vez aceptada, solo se corrige anulándola (hasta 7 días) o con nota de crédito.`
            : "El comprobante se envía solo cuando lo confirmes."}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="operational" disabled={!listo || enviando} onClick={emitir}>
            {enviando ? "Enviando a SUNAT…" : "Emitir y enviar a SUNAT"}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

/** Busca en el directorio de clientes (tutores, veterinarias y empresas) y llena el formulario. */
function BuscadorCliente({ onElegir, soloRuc }: { onElegir: (s: C.Sugerencia) => void; soloRuc?: boolean }) {
  const [texto, setTexto] = useState("");
  const [opciones, setOpciones] = useState<C.Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) return;
    let vigente = true;
    const t = setTimeout(async () => {
      try {
        const r = await C.buscarClientes(q);
        if (vigente) {
          setOpciones(soloRuc ? r.filter((s) => s.cliente_tipo_doc === "6") : r);
          setAbierto(true);
        }
      } catch {
        if (vigente) setOpciones([]);
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [texto, soloRuc]);

  return (
    <div className="relative space-y-1.5">
      <Label htmlFor="ce-buscar">Buscar cliente registrado</Label>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          id="ce-buscar"
          className="pl-9"
          autoComplete="off"
          placeholder="Nombre, razón social, DNI o RUC"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (e.target.value.trim().length < 2) setAbierto(false);
          }}
          onFocus={() => opciones.length && texto.trim().length >= 2 && setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
        />
      </div>
      {abierto && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-lg">
          {opciones.map((s) => (
            <li key={`${s.origen}-${s.id}-${s.cliente_num_doc}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onElegir(s);
                  setTexto("");
                  setAbierto(false);
                }}
              >
                <span className="font-medium text-slate-900 dark:text-white">{s.cliente_razon_social}</span>
                <span className="block text-xs text-slate-500">
                  {C.TIPO_DOC_CLIENTE[s.cliente_tipo_doc] ?? "Doc."} {s.cliente_num_doc}
                  {s.detalle ? ` · ${s.detalle}` : ""}
                </span>
              </button>
            </li>
          ))}
          {opciones.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">Sin coincidencias: escribe los datos abajo.</li>}
        </ul>
      )}
    </div>
  );
}

/** Después de emitir: estado SUNAT y descargas, como la pantalla final de un facturador. */
function ResultadoEmision({ comprobante, onCerrar }: { comprobante: C.Comprobante; onCerrar: () => void }) {
  const [c, setC] = useState(comprobante);
  const [consultando, setConsultando] = useState(false);
  const aceptado = c.estado === "ACEPTADO";
  const fallido = C.NO_VIGENTES.includes(c.estado);
  const consultar = async () => {
    setConsultando(true);
    try {
      setC(await C.actualizar(c.id));
    } catch (e) {
      notifyError(getApiErrorMessage(e, "No se pudo consultar el estado."));
    } finally {
      setConsultando(false);
    }
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {nombreTipo(c.tipo_doc)} <span className="font-mono">{c.numero}</span>
          <EstadoComprobante estado={c.estado} />
        </DialogTitle>
        <DialogDescription>
          {aceptado
            ? "SUNAT aceptó el comprobante. Ya puedes entregarlo al cliente."
            : fallido
              ? "SUNAT no aceptó el comprobante. Revisa el motivo, corrige los datos y vuelve a emitir."
              : "Enviado. SUNAT suele responder en segundos; consulta el estado en un momento."}
        </DialogDescription>
      </DialogHeader>
      {c.descripcion_respuesta && (
        <p className={cn("rounded-md px-3 py-2 text-xs", fallido ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800")}>
          {c.descripcion_respuesta}
        </p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-slate-500">Cliente</dt>
        <dd>{c.cliente_razon_social} · {C.TIPO_DOC_CLIENTE[c.cliente_tipo_doc as C.TipoDocCliente] ?? "Doc."} {c.cliente_num_doc}</dd>
        <dt className="text-slate-500">Total</dt>
        <dd className="font-semibold">{soles(c.total)} <span className="font-normal text-slate-500">(IGV {soles(c.igv)})</span></dd>
      </dl>
      {!fallido && <Descargas comprobante={c} />}
      <DialogFooter>
        {!aceptado && !fallido && (
          <Button variant="ghost" className="gap-1.5" disabled={consultando} onClick={consultar}>
            <RefreshCwIcon className="size-4" />
            Consultar estado
          </Button>
        )}
        <Button variant="operational" onClick={onCerrar}>
          Listo
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------- Dentro del servicio y de la factura de convenio ----------

/**
 * Comprobante electrónico de un servicio: lo emitido y, si no hay uno vigente, el botón para emitir
 * (abre la emisión con vista previa).
 */
export function ComprobanteDeServicio({
  casoId,
  cliente,
  bloqueado,
  onEmitido,
}: {
  casoId: string;
  cliente: Cliente | null;
  /** Motivo por el que no se puede emitir (p. ej. servicio cancelado o facturado por convenio). */
  bloqueado?: string | null;
  onEmitido?: () => void;
}) {
  const recurso = useRecurso(() => C.listar({ caso_id: casoId }), [casoId]);
  const comprobantes = recurso.data ?? [];
  const vigente = comprobantes.some((c) => !C.NO_VIGENTES.includes(c.estado));
  const [emitiendo, setEmitiendo] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {recurso.error && <p className="text-xs text-red-600">{recurso.error}</p>}
      {comprobantes.length > 0 && <ListaComprobantes comprobantes={comprobantes} onCambio={recurso.recargar} />}
      {!vigente &&
        !recurso.cargando &&
        (bloqueado ? (
          <p className="text-xs text-slate-500">{bloqueado}</p>
        ) : (
          <Button variant="operational" size="sm" className="self-start gap-1.5" onClick={() => setEmitiendo(true)}>
            <ReceiptIcon className="size-3.5" />
            Emitir boleta o factura
          </Button>
        ))}
      <Modal open={emitiendo} onOpenChange={(o) => !o && setEmitiendo(false)} ancho="sm:max-w-5xl">
        {emitiendo && (
          <EmitirComprobante
            origen={{ tipo: "servicio", casoId, cliente }}
            onCerrar={() => setEmitiendo(false)}
            onEmitido={() => {
              recurso.recargar();
              onEmitido?.();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

/** Factura electrónica de una factura de convenio. Datos fiscales prellenados de la ficha del CRM. */
export function ComprobanteDeConvenio({
  facturaId,
  fiscal,
  onEmitido,
}: {
  facturaId: string;
  fiscal: { ruc: string; razonSocial: string; direccion: string };
  onEmitido?: () => void;
}) {
  const recurso = useRecurso(() => C.listar({ factura_veterinaria_id: facturaId }), [facturaId]);
  const comprobantes = recurso.data ?? [];
  const vigente = comprobantes.some((c) => !C.NO_VIGENTES.includes(c.estado));
  const [emitiendo, setEmitiendo] = useState(false);

  return (
    <div className="mt-2 flex flex-col gap-2">
      {comprobantes.length > 0 && <ListaComprobantes comprobantes={comprobantes} onCambio={recurso.recargar} />}
      {!vigente && !recurso.cargando && (
        <Button variant="outline" size="sm" className="self-start gap-1.5" onClick={() => setEmitiendo(true)}>
          <ReceiptIcon className="size-3.5" />
          Emitir factura electrónica
        </Button>
      )}
      <Modal open={emitiendo} onOpenChange={(o) => !o && setEmitiendo(false)} ancho="sm:max-w-5xl">
        {emitiendo && (
          <EmitirComprobante
            origen={{ tipo: "convenio", facturaId, fiscal }}
            onCerrar={() => setEmitiendo(false)}
            onEmitido={() => {
              recurso.recargar();
              onEmitido?.();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
