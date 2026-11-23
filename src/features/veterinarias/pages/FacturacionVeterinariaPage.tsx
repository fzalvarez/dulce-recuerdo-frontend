import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import type { MetodoPago } from "@/features/casos/types";
import { fechaCorta, hoyISO, METODO_LABEL, soles } from "@/features/casos/utils/casos";
import * as V from "../api";
import { ComprobanteDeConvenio } from "@/features/comprobantes/components/Comprobantes";

const ESTADO_FACTURA: Record<V.Factura["estado"], string> = {
  EMITIDA: "bg-blue-100 text-blue-800",
  PAGADA: "bg-emerald-100 text-emerald-800",
  ANULADA: "bg-slate-200 text-slate-500",
};

/** Fila de la hoja: lo mismo para un servicio pendiente o uno ya facturado. */
interface FilaHoja {
  clave: string;
  fecha: string | null;
  mascota: string;
  especie: string | null;
  peso_kg: number | null;
  precio: string;
  estado: { texto: string; clase: string };
  tutor: string;
}

/** Fecha como en el Excel de la veterinaria: dd/mm/aaaa. */
function fechaHoja(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const ESTADO_COBRO_PENDIENTE = { texto: "Pendiente", clase: "bg-red-600 text-white" };
const ESTADO_COBRO_PARCIAL = { texto: "Parcial", clase: "bg-amber-300" };
const ESTADO_EN_FACTURA: Record<V.Factura["estado"], { texto: string; clase: string }> = {
  EMITIDA: { texto: "Facturado", clase: "bg-blue-200" },
  PAGADA: { texto: "Pagado", clase: "bg-emerald-300" },
  ANULADA: { texto: "Anulada", clase: "bg-slate-300" },
};

function filaDePendiente(p: V.CasoPendiente): FilaHoja {
  return {
    clave: p.caso_id,
    fecha: p.fecha_realizado,
    mascota: p.mascota,
    especie: p.especie,
    peso_kg: p.peso_kg,
    precio: p.monto,
    estado: Number(p.total_pagado) > 0 ? ESTADO_COBRO_PARCIAL : ESTADO_COBRO_PENDIENTE,
    tutor: p.tutor,
  };
}

function filaDeLinea(l: V.LineaFactura, factura: V.Factura["estado"]): FilaHoja {
  return {
    clave: l.caso_id,
    fecha: l.fecha_realizado,
    mascota: l.mascota,
    especie: l.especie,
    peso_kg: l.peso_kg,
    precio: l.monto,
    estado: ESTADO_EN_FACTURA[factura],
    tutor: l.tutor,
  };
}

/**
 * Facturación de una veterinaria aliada, en página completa: los servicios pendientes se listan
 * como en la hoja de cálculo que usan hoy, se marcan los que van en la factura y se emite.
 * Cada factura emitida se puede abrir con el mismo formato.
 */
export default function FacturacionVeterinariaPage() {
  const { vetId = "" } = useParams();
  const vet = useRecurso(() => V.obtener(vetId), [vetId]);
  const fiscal = useRecurso(
    () => (vet.data?.crm_id ? V.datosFiscales(vet.data.crm_id) : Promise.resolve(null)),
    [vet.data?.crm_id ?? ""]
  );
  const datos = useRecurso(() => V.facturacion(vetId), [vetId]);

  const [elegidos, setElegidos] = useState<string[]>([]);
  const [descuento, setDescuento] = useState("0");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [cobro, setCobro] = useState<{ id: string; metodo: MetodoPago; fecha: string } | null>(null);
  const [anulando, setAnulando] = useState<{ id: string; motivo: string } | null>(null);
  const [verId, setVerId] = useState<string | null>(null);
  const detalle = useRecurso(async () => (verId ? V.detalleFactura(verId) : null), [verId]);

  const pendientes = useMemo(() => datos.data?.pendientes ?? [], [datos.data]);
  const elegidas = useMemo(() => pendientes.filter((p) => elegidos.includes(p.caso_id)), [pendientes, elegidos]);
  const suma = elegidas.reduce((acc, p) => acc + Number(p.monto), 0);
  const descuentoNum = Number(descuento || 0);
  const deuda = suma - descuentoNum;
  const descuentoValido = Number.isFinite(descuentoNum) && descuentoNum >= 0 && descuentoNum < suma;

  const fechas = pendientes.map((p) => p.fecha_realizado).filter((f): f is string => !!f).map((f) => new Date(f).getTime());
  const desde = fechas.length ? fechaHoja(new Date(Math.min(...fechas)).toISOString()) : "—";
  const hasta = fechas.length ? fechaHoja(new Date(Math.max(...fechas)).toISOString()) : "—";
  const nombreVet = vet.data?.nombre ?? "";

  const alternar = (id: string) => setElegidos((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const todos = (marcar: boolean) => setElegidos(marcar ? pendientes.map((p) => p.caso_id) : []);

  const emitir = async () => {
    const ok = await ejecutar(
      () =>
        V.emitir({
          veterinaria_id: vetId,
          caso_ids: elegidos,
          fecha_emision: fecha,
          numero_comprobante: numero.trim() || undefined,
          descuento: descuentoNum.toFixed(2),
        }),
      "Factura emitida.",
      "No se pudo emitir la factura."
    );
    if (ok) {
      setElegidos([]);
      setDescuento("0");
      setNumero("");
      datos.recargar();
    }
  };

  if (datos.error) return <p className="text-sm text-red-600">{datos.error}</p>;

  const facturaVista = verId ? datos.data?.facturas.find((f) => f.id === verId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Convenios veterinarios", to: "/veterinarias" }, { label: "Facturación" }]} />
      <Link to="/veterinarias" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 w-fit">
        <ArrowLeftIcon className="size-4" />
        Volver a convenios
      </Link>

      {/* Hoja de la veterinaria: siempre clara, como el Excel. */}
      <Hoja nombreVet={nombreVet} ruc={fiscal.data?.ruc ?? null} desde={desde} hasta={hasta}>
        <h2 className="text-sm font-semibold text-slate-700">Servicios pendientes de facturar</h2>
        {pendientes.length === 0 && !datos.cargando && (
          <p className="text-sm text-slate-500">No hay servicios pendientes para esta veterinaria.</p>
        )}
        {pendientes.length > 0 && (
          <TablaHoja filas={pendientes.map(filaDePendiente)} nombreVet={nombreVet} seleccion={{ elegidos, alternar, todos }} />
        )}
        {pendientes.length > 0 && (
          <p className="text-xs text-slate-500">
            Marcados: {elegidos.length} de {pendientes.length}
          </p>
        )}

        {elegidas.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-700">Factura a emitir</h2>
            <TablaHoja filas={elegidas.map(filaDePendiente)} nombreVet={nombreVet} />

            <div className="ml-auto w-full max-w-md border border-slate-800 text-sm">
              <div className="grid grid-cols-2 border-b border-slate-800">
                <span className="px-3 py-1.5 text-center font-semibold">SUMA</span>
                <span className="px-3 py-1.5 text-center tabular-nums">{soles(suma)}</span>
              </div>
              <div className="grid grid-cols-2 border-b border-slate-800 bg-yellow-300">
                <span className="px-3 py-1.5 text-center font-semibold">DESCUENTO</span>
                <div className="flex items-center justify-center px-2 py-1">
                  <Input
                    aria-label="Descuento"
                    inputMode="decimal"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    className="h-8 w-32 border-yellow-600 bg-yellow-200 text-center font-semibold text-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 bg-slate-900 text-white">
                <span className="px-3 py-1.5 text-center font-bold">DEUDA TOTAL</span>
                <span className="px-3 py-1.5 text-center font-bold tabular-nums">{soles(deuda)}</span>
              </div>
            </div>
            {!descuentoValido && (
              <p className="ml-auto text-xs text-red-600">El descuento debe ser mayor o igual a 0 y menor que la suma.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="fv-numero">N.º de comprobante (opcional)</Label>
                <Input id="fv-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fv-fecha">Fecha de emisión</Label>
                <DatePicker id="fv-fecha" value={fecha} onChange={setFecha} />
              </div>
              <Button variant="operational" disabled={!descuentoValido} onClick={emitir}>
                Emitir factura ({soles(deuda)})
              </Button>
            </div>
          </>
        )}
      </Hoja>

      {verId && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Detalle de la factura {facturaVista?.numero_comprobante ?? (verId ? `#${verId.slice(0, 8)}` : "")}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setVerId(null)}>
              Cerrar detalle
            </Button>
          </div>
          {detalle.error && <p className="text-sm text-red-600">{detalle.error}</p>}
          {detalle.data && (
            <Hoja
              nombreVet={nombreVet}
              ruc={fiscal.data?.ruc ?? null}
              desde={fechaHoja(detalle.data.lineas.map((l) => l.fecha_realizado).filter((f): f is string => !!f).sort()[0])}
              hasta={fechaHoja(detalle.data.lineas.map((l) => l.fecha_realizado).filter((f): f is string => !!f).sort().at(-1))}
            >
              <p className="text-sm text-slate-700">
                Fecha de emisión {fechaCorta(detalle.data.fecha_emision)}
                {detalle.data.numero_comprobante ? ` · comprobante ${detalle.data.numero_comprobante}` : ""}
              </p>
              <TablaHoja
                filas={detalle.data.lineas.map((l) => filaDeLinea(l, detalle.data!.estado))}
                nombreVet={nombreVet}
              />
              <div className="ml-auto w-full max-w-md border border-slate-800 text-sm">
                <div className="grid grid-cols-2 border-b border-slate-800">
                  <span className="px-3 py-1.5 text-center font-semibold">SUMA</span>
                  <span className="px-3 py-1.5 text-center tabular-nums">
                    {soles(detalle.data.lineas.reduce((acc, l) => acc + Number(l.monto), 0))}
                  </span>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-800 bg-yellow-300">
                  <span className="px-3 py-1.5 text-center font-semibold">DESCUENTO</span>
                  <span className="px-3 py-1.5 text-center tabular-nums font-semibold">{soles(detalle.data.descuento)}</span>
                </div>
                <div className="grid grid-cols-2 bg-slate-900 text-white">
                  <span className="px-3 py-1.5 text-center font-bold">DEUDA TOTAL</span>
                  <span className="px-3 py-1.5 text-center font-bold tabular-nums">{soles(detalle.data.total)}</span>
                </div>
              </div>
            </Hoja>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Facturas emitidas</h2>
        {datos.data?.facturas.length === 0 && <p className="text-sm text-slate-400">Sin facturas.</p>}
        {datos.data?.facturas.map((f) => (
          <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-slate-100 dark:border-white/5 py-1.5">
            <span>
              {f.numero_comprobante ?? `#${f.id.slice(0, 8)}`} · {fechaCorta(f.fecha_emision)} · <strong>{soles(f.total)}</strong>
              {Number(f.descuento) > 0 && ` (descuento ${soles(f.descuento)})`}
              {f.estado === "PAGADA" && f.metodo_pago && ` · cobrada ${fechaCorta(f.fecha_pago)} (${METODO_LABEL[f.metodo_pago]})`}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", ESTADO_FACTURA[f.estado])}>{f.estado.toLowerCase()}</span>
              <Button variant={verId === f.id ? "operational" : "outline"} size="sm" onClick={() => setVerId(verId === f.id ? null : f.id)}>
                Ver detalle
              </Button>
              {f.estado === "EMITIDA" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setCobro({ id: f.id, metodo: "TRANSFERENCIA", fecha: hoyISO() })}>
                    Registrar cobro
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setAnulando({ id: f.id, motivo: "" })}>
                    Anular
                  </Button>
                </>
              )}
            </span>
            {f.estado !== "ANULADA" && (
              <div className="basis-full">
                <ComprobanteDeConvenio
                  facturaId={f.id}
                  fiscal={{ ruc: fiscal.data?.ruc ?? "", razonSocial: fiscal.data?.razon_social ?? nombreVet, direccion: fiscal.data?.direccion ?? "" }}
                />
              </div>
            )}
          </div>
        ))}

        {cobro && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end rounded-lg border border-slate-200 dark:border-white/10 p-3">
            <div className="space-y-1.5">
              <span className="text-sm font-medium leading-none">Forma de pago</span>
              <BotonesOpcion
                ariaLabel="Forma de pago"
                columnas="grid-cols-2"
                value={cobro.metodo}
                onChange={(v) => setCobro((c) => c && { ...c, metodo: v })}
                opciones={(Object.keys(METODO_LABEL) as MetodoPago[]).map((m) => ({ value: m, label: METODO_LABEL[m] }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fv-fcobro">Fecha del cobro</Label>
              <DatePicker id="fv-fcobro" value={cobro.fecha} onChange={(v) => setCobro((c) => c && { ...c, fecha: v })} />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setCobro(null)}>
                Cancelar
              </Button>
              <Button
                variant="operational"
                onClick={async () => {
                  if (await ejecutar(() => V.cobrar(cobro.id, cobro.metodo, cobro.fecha), "Cobro registrado: los servicios quedan pagados.", "No se pudo registrar el cobro.")) {
                    setCobro(null);
                    datos.recargar();
                    detalle.recargar();
                  }
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {anulando && (
          <div className="flex flex-col sm:flex-row gap-3 items-end rounded-lg border border-red-200 p-3">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="fv-motivo">Motivo de la anulación</Label>
              <Input id="fv-motivo" value={anulando.motivo} onChange={(e) => setAnulando((a) => a && { ...a, motivo: e.target.value })} />
            </div>
            <Button variant="ghost" onClick={() => setAnulando(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!anulando.motivo.trim()}
              onClick={async () => {
                if (await ejecutar(() => V.anular(anulando.id, anulando.motivo.trim()), "Factura anulada: sus servicios vuelven a pendientes.", "No se pudo anular.")) {
                  setAnulando(null);
                  datos.recargar();
                  detalle.recargar();
                }
              }}
            >
              Anular
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

/** Hoja de la veterinaria: nombre en mayúsculas, RUC y periodo, con el contenido debajo. Siempre clara. */
function Hoja({
  nombreVet,
  ruc,
  desde,
  hasta,
  children,
}: {
  nombreVet: string;
  ruc: string | null;
  desde: string;
  hasta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-4 text-slate-900 shadow-xs flex flex-col gap-4">
      <div className="border-2 border-slate-800 text-center text-sm">
        <p className="border-b border-slate-800 py-1 font-bold">CLÍNICA VETERINARIA {nombreVet.toUpperCase()}</p>
        <p className="border-b border-slate-800 py-1 font-bold">RUC {ruc ?? "—"}</p>
        <p className="py-1 font-bold">
          Del {desde} al {hasta}
        </p>
      </div>
      {children}
    </div>
  );
}

/** Tabla con las mismas columnas que la hoja de la veterinaria. Con `seleccion`, cada fila lleva casilla. */
function TablaHoja({
  filas,
  nombreVet,
  seleccion,
}: {
  filas: FilaHoja[];
  nombreVet: string;
  seleccion?: { elegidos: string[]; alternar: (id: string) => void; todos: (marcar: boolean) => void };
}) {
  const celda = "border border-slate-400 px-2 py-1";
  const todasMarcadas = !!seleccion && filas.length > 0 && filas.every((f) => seleccion.elegidos.includes(f.clave));
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm text-slate-900">
        <thead className="bg-slate-100">
          <tr>
            {seleccion && (
              <th className={cn(celda, "w-10")}>
                <input
                  type="checkbox"
                  aria-label="Marcar todos"
                  className="size-4 accent-brand-500"
                  checked={todasMarcadas}
                  onChange={(e) => seleccion.todos(e.target.checked)}
                />
              </th>
            )}
            <th className={celda}>#</th>
            <th className={celda}>Fecha</th>
            <th className={celda}>Mascota</th>
            <th className={celda}>Especie</th>
            <th className={celda}>Peso (kg)</th>
            <th className={celda}>Precio</th>
            <th className={celda}>Estado</th>
            <th className={celda}>Cliente</th>
            <th className={celda}>Veterinaria</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={f.clave} className={cn(seleccion && seleccion.elegidos.includes(f.clave) && "bg-brand-50")}>
              {seleccion && (
                <td className={cn(celda, "text-center")}>
                  <input
                    type="checkbox"
                    aria-label={`Facturar ${f.mascota}`}
                    className="size-4 accent-brand-500"
                    checked={seleccion.elegidos.includes(f.clave)}
                    onChange={() => seleccion.alternar(f.clave)}
                  />
                </td>
              )}
              <td className={cn(celda, "text-center")}>{i + 1}</td>
              <td className={cn(celda, "whitespace-nowrap")}>{fechaHoja(f.fecha)}</td>
              <td className={celda}>{f.mascota}</td>
              <td className={celda}>{f.especie ?? "—"}</td>
              <td className={cn(celda, "text-right tabular-nums")}>{f.peso_kg != null ? f.peso_kg : "—"}</td>
              <td className={cn(celda, "text-right tabular-nums whitespace-nowrap")}>{soles(f.precio)}</td>
              <td className={cn(celda, "text-center font-semibold whitespace-nowrap", f.estado.clase)}>{f.estado.texto}</td>
              <td className={celda}>{f.tutor}</td>
              <td className={celda}>{nombreVet}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
