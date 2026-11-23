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

const ESTADO_FACTURA: Record<V.Factura["estado"], string> = {
  EMITIDA: "bg-blue-100 text-blue-800",
  PAGADA: "bg-emerald-100 text-emerald-800",
  ANULADA: "bg-slate-200 text-slate-500",
};

/** Fecha como en el Excel de la veterinaria: dd/mm/aaaa. */
function fechaHoja(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Facturación de una veterinaria aliada, en página completa: los servicios pendientes se listan
 * como en la hoja de cálculo que usan hoy, se marcan los que van en la factura y se emite.
 */
export default function FacturacionVeterinariaPage() {
  const { vetId = "" } = useParams();
  const vet = useRecurso(() => V.obtener(vetId), [vetId]);
  const ruc = useRecurso(
    () => (vet.data?.crm_id ? V.rucDeFicha(vet.data.crm_id) : Promise.resolve(null)),
    [vet.data?.crm_id ?? ""]
  );
  const datos = useRecurso(() => V.facturacion(vetId), [vetId]);

  const [elegidos, setElegidos] = useState<string[]>([]);
  const [descuento, setDescuento] = useState("0");
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [cobro, setCobro] = useState<{ id: string; metodo: MetodoPago; fecha: string } | null>(null);
  const [anulando, setAnulando] = useState<{ id: string; motivo: string } | null>(null);

  const pendientes = useMemo(() => datos.data?.pendientes ?? [], [datos.data]);
  const elegidas = useMemo(() => pendientes.filter((p) => elegidos.includes(p.caso_id)), [pendientes, elegidos]);
  const suma = elegidas.reduce((acc, p) => acc + Number(p.monto), 0);
  const descuentoNum = Number(descuento || 0);
  const deuda = suma - descuentoNum;
  const descuentoValido = Number.isFinite(descuentoNum) && descuentoNum >= 0 && descuentoNum < suma;

  const fechas = pendientes.map((p) => p.fecha_realizado).filter((f): f is string => !!f).map((f) => new Date(f).getTime());
  const desde = fechas.length ? fechaHoja(new Date(Math.min(...fechas)).toISOString()) : "—";
  const hasta = fechas.length ? fechaHoja(new Date(Math.max(...fechas)).toISOString()) : "—";
  const nombreVet = (vet.data?.nombre ?? "").toUpperCase();

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

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Convenios veterinarios", to: "/veterinarias" }, { label: "Facturación" }]} />
      <Link to="/veterinarias" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 w-fit">
        <ArrowLeftIcon className="size-4" />
        Volver a convenios
      </Link>

      {/* Hoja de la veterinaria: siempre clara, como el Excel. */}
      <div className="rounded-md border border-slate-300 bg-white p-4 text-slate-900 shadow-xs flex flex-col gap-4">
        <div className="border-2 border-slate-800 text-center text-sm">
          <p className="border-b border-slate-800 py-1 font-bold">CLÍNICA VETERINARIA {nombreVet}</p>
          <p className="border-b border-slate-800 py-1 font-bold">RUC {ruc.data ?? "—"}</p>
          <p className="py-1 font-bold">
            Del {desde} al {hasta}
          </p>
        </div>

        <h2 className="text-sm font-semibold text-slate-700">Servicios pendientes de facturar</h2>
        {pendientes.length === 0 && !datos.cargando && (
          <p className="text-sm text-slate-500">No hay servicios pendientes para esta veterinaria.</p>
        )}
        {pendientes.length > 0 && (
          <TablaServicios
            filas={pendientes}
            nombreVet={vet.data?.nombre ?? ""}
            seleccion={{ elegidos, alternar, todos }}
          />
        )}
        {pendientes.length > 0 && (
          <p className="text-xs text-slate-500">
            Marcados: {elegidos.length} de {pendientes.length}
          </p>
        )}

        {elegidas.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-slate-700">Factura a emitir</h2>
            <TablaServicios filas={elegidas} nombreVet={vet.data?.nombre ?? ""} />

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
      </div>

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

/** Tabla con las mismas columnas que la hoja de la veterinaria. Con `seleccion`, cada fila lleva casilla. */
function TablaServicios({
  filas,
  nombreVet,
  seleccion,
}: {
  filas: V.CasoPendiente[];
  nombreVet: string;
  seleccion?: { elegidos: string[]; alternar: (id: string) => void; todos: (marcar: boolean) => void };
}) {
  const celda = "border border-slate-400 px-2 py-1";
  const todasMarcadas = !!seleccion && filas.length > 0 && filas.every((p) => seleccion.elegidos.includes(p.caso_id));
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
          {filas.map((p, i) => {
            const parcial = Number(p.total_pagado) > 0;
            return (
              <tr key={p.caso_id} className={cn(seleccion && seleccion.elegidos.includes(p.caso_id) && "bg-brand-50")}>
                {seleccion && (
                  <td className={cn(celda, "text-center")}>
                    <input
                      type="checkbox"
                      aria-label={`Facturar ${p.mascota}`}
                      className="size-4 accent-brand-500"
                      checked={seleccion.elegidos.includes(p.caso_id)}
                      onChange={() => seleccion.alternar(p.caso_id)}
                    />
                  </td>
                )}
                <td className={cn(celda, "text-center")}>{i + 1}</td>
                <td className={cn(celda, "whitespace-nowrap")}>{fechaHoja(p.fecha_realizado)}</td>
                <td className={celda}>{p.mascota}</td>
                <td className={celda}>{p.especie ?? "—"}</td>
                <td className={cn(celda, "text-right tabular-nums")}>{p.peso_kg != null ? p.peso_kg : "—"}</td>
                <td className={cn(celda, "text-right tabular-nums whitespace-nowrap")}>{soles(p.monto)}</td>
                <td className={cn(celda, "text-center font-semibold whitespace-nowrap", parcial ? "bg-amber-300" : "bg-red-600 text-white")}>
                  {parcial ? "Parcial" : "Pendiente"}
                </td>
                <td className={celda}>{p.tutor}</td>
                <td className={celda}>{nombreVet}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
