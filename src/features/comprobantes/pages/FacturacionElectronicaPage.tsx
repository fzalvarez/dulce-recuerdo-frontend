import { useCallback, useEffect, useState } from "react";
import { EyeIcon, FileTextIcon, ReceiptIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Paginador } from "@/shared/components/common/Paginador";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Modal } from "@/features/casos/components/Dialogos";
import { soles } from "@/features/casos/utils/casos";
import { datosFiscales } from "@/features/veterinarias/api";
import { SeriesPanel } from "@/features/configuracion/components/SeriesPanel";
import * as C from "../api";
import { DetalleComprobante, EmitirComprobante, EstadoComprobante } from "../components/Comprobantes";

const POR_PAGINA = 25;

type Vista = "por-emitir" | "emitidos" | "series";

/** Fecha corta. Las fechas sin hora (AAAA-MM-DD) se leen en Lima, no en UTC. */
function fecha(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

/** Hace N días, en AAAA-MM-DD. */
function haceDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Texto de búsqueda que se aplica tras una pausa al escribir. Al aplicarse, `alAplicar` (volver a la página 1). */
function useBusqueda(alAplicar: () => void): [string, (v: string) => void, string] {
  const [texto, setTexto] = useState("");
  const [aplicado, setAplicado] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      if (texto.trim() === aplicado) return;
      setAplicado(texto.trim());
      alAplicar();
    }, 350);
    return () => clearTimeout(t);
  }, [texto, aplicado, alAplicar]);
  return [texto, setTexto, aplicado];
}

/** Setter que además vuelve a la primera página. */
function conReinicio<T>(set: (v: T) => void, reiniciar: () => void) {
  return (v: T) => {
    set(v);
    reiniciar();
  };
}

/** Facturación electrónica: qué falta emitir, todo lo emitido con su estado SUNAT y las series. */
export default function FacturacionElectronicaPage() {
  const rol = useAuthStore((s) => s.getUserRol)();
  const verSeries = rol === "root" || rol === "admin";
  const [vista, setVista] = useState<Vista>("por-emitir");

  const pestañas: [Vista, string][] = [
    ["por-emitir", "Por emitir"],
    ["emitidos", "Comprobantes emitidos"],
    ...(verSeries ? ([["series", "Series y correlativos"]] as [Vista, string][]) : []),
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Finanzas" }, { label: "Facturación electrónica" }]} />
      <ModuleHeader
        title="Facturación electrónica"
        description="Boletas y facturas electrónicas enviadas a SUNAT: emite las pendientes y revisa su estado."
      />

      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10 mb-4 overflow-x-auto">
        {pestañas.map(([clave, texto]) => (
          <button
            key={clave}
            type="button"
            onClick={() => setVista(clave)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap",
              vista === clave ? "border-brand-500 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {texto}
          </button>
        ))}
      </div>

      {vista === "por-emitir" && <PorEmitirPanel />}
      {vista === "emitidos" && <EmitidosPanel />}
      {vista === "series" && verSeries && <SeriesPanel />}
    </>
  );
}

// ---------- Por emitir ----------

type Emision =
  | { tipo: "servicio"; servicio: C.ServicioPorEmitir }
  | { tipo: "convenio"; convenio: C.ConvenioPorEmitir };

function PorEmitirPanel() {
  const [pagina, setPagina] = useState(0);
  const primera = useCallback(() => setPagina(0), []);
  const [desde, setDesdeBase] = useState(haceDias(60));
  const [hasta, setHastaBase] = useState("");
  const setDesde = conReinicio(setDesdeBase, primera);
  const setHasta = conReinicio(setHastaBase, primera);
  const [texto, setTexto, q] = useBusqueda(primera);
  const [emision, setEmision] = useState<Emision | null>(null);

  const recurso = useRecurso(
    () =>
      C.porEmitir({ desde: desde || undefined, hasta: hasta || undefined, q: q || undefined, pagina: pagina + 1, por_pagina: POR_PAGINA }),
    [desde, hasta, q, pagina]
  );
  const datos = recurso.data;
  const cerrar = () => setEmision(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Resumen titulo="Servicios sin comprobante" valor={datos ? String(datos.total_servicios) : "—"} detalle="Clientes particulares, en el período" />
        <Resumen titulo="Facturas de convenio sin emitir" valor={datos ? String(datos.convenios.length) : "—"} detalle="A veterinarias aliadas" />
        <Resumen
          titulo="Monto pendiente (convenios)"
          valor={datos ? soles(datos.convenios.reduce((a, c) => a + Number(c.total), 0)) : "—"}
          detalle="Total de las facturas de convenio"
        />
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      {/* Servicios a clientes particulares */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Servicios a clientes particulares</h2>
          <p className="text-sm text-slate-500">
            Realizados o entregados, sin boleta ni factura electrónica. No aparecen los marcados «sin comprobante» ni los
            referidos por una veterinaria (esos van en su factura de convenio).
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input className="pl-9" placeholder="Mascota, cliente, DNI o código" value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe-desde" className="text-xs">Desde</Label>
            <DatePicker id="pe-desde" value={desde} onChange={setDesde} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe-hasta" className="text-xs">Hasta</Label>
            <DatePicker id="pe-hasta" value={hasta} onChange={setHasta} />
          </div>
        </div>
        <Tarjeta>
          <table className="w-full text-left text-sm min-w-180">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Servicio</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Pidió</th>
                <th className="px-4 py-3 font-semibold text-right">Precio</th>
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {(datos?.servicios ?? []).map((s) => (
                <tr key={s.caso_id}>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{fecha(s.fecha)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{s.mascota}</p>
                    <p className="text-xs text-slate-500">{s.codigo ?? "Sin código"} · {s.estado === "ENTREGADO" ? "Entregado" : "Realizado"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800 dark:text-slate-200">{s.cliente}</p>
                    <p className="text-xs text-slate-500">{s.cliente_dni ? `DNI ${s.cliente_dni}` : "Sin DNI en la ficha"}</p>
                  </td>
                  <td className="px-4 py-3">
                    {s.comprobante_pedido === "FACTURA" || s.comprobante_pedido === "BOLETA" ? (
                      <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-sky-50 text-sky-700">
                        {s.comprobante_pedido === "FACTURA" ? "Factura" : "Boleta"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">No indicado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{soles(s.precio_total)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="operational" size="sm" className="gap-1.5" onClick={() => setEmision({ tipo: "servicio", servicio: s })}>
                      <ReceiptIcon className="size-3.5" />
                      Emitir
                    </Button>
                  </td>
                </tr>
              ))}
              {!recurso.cargando && datos && datos.servicios.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No hay servicios pendientes de comprobante en este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {datos && datos.total_servicios > POR_PAGINA && (
            <Paginador total={datos.total_servicios} pagina={pagina} onCambiar={setPagina} porPagina={POR_PAGINA} />
          )}
        </Tarjeta>
      </section>

      {/* Facturas de convenio */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Facturas de convenio a veterinarias</h2>
          <p className="text-sm text-slate-500">Facturas de convenio vigentes que todavía no tienen su factura electrónica.</p>
        </div>
        <Tarjeta>
          <table className="w-full text-left text-sm min-w-140">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Veterinaria</th>
                <th className="px-4 py-3 font-semibold">Cobro</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {(datos?.convenios ?? []).map((c) => (
                <tr key={c.factura_id}>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{fecha(c.fecha_emision)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.veterinaria}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.estado === "PAGADA" ? "Pagada" : "Por cobrar"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{soles(c.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="operational" size="sm" className="gap-1.5" onClick={() => setEmision({ tipo: "convenio", convenio: c })}>
                      <ReceiptIcon className="size-3.5" />
                      Emitir factura
                    </Button>
                  </td>
                </tr>
              ))}
              {!recurso.cargando && datos && datos.convenios.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Todas las facturas de convenio tienen su factura electrónica.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Tarjeta>
      </section>

      <Modal open={emision !== null} onOpenChange={(o) => !o && cerrar()} ancho="sm:max-w-5xl">
        {emision?.tipo === "servicio" && (
          <EmitirComprobante
            origen={{
              tipo: "servicio",
              casoId: emision.servicio.caso_id,
              cliente: { nombre: emision.servicio.cliente, dni: emision.servicio.cliente_dni, direccion: emision.servicio.cliente_direccion },
              tipoInicial: emision.servicio.comprobante_pedido === "FACTURA" ? "FACTURA" : "BOLETA",
              titulo: `${emision.servicio.mascota} · ${emision.servicio.codigo ?? "servicio"} del ${fecha(emision.servicio.fecha)} · ${emision.servicio.cliente}`,
            }}
            onCerrar={cerrar}
            onEmitido={recurso.recargar}
          />
        )}
        {emision?.tipo === "convenio" && <EmisionConvenio convenio={emision.convenio} onCerrar={cerrar} onEmitido={recurso.recargar} />}
      </Modal>
    </div>
  );
}

function EmisionConvenio({ convenio, onCerrar, onEmitido }: { convenio: C.ConvenioPorEmitir; onCerrar: () => void; onEmitido: () => void }) {
  const fiscal = useRecurso(
    () => (convenio.crm_id ? datosFiscales(convenio.crm_id) : Promise.resolve({ ruc: null, razon_social: null, direccion: null })),
    [convenio.crm_id]
  );
  if (fiscal.cargando) return <p className="text-sm text-slate-500">Cargando datos fiscales de la veterinaria…</p>;
  return (
    <EmitirComprobante
      origen={{
        tipo: "convenio",
        facturaId: convenio.factura_id,
        fiscal: {
          ruc: fiscal.data?.ruc ?? "",
          razonSocial: fiscal.data?.razon_social ?? convenio.veterinaria,
          direccion: fiscal.data?.direccion ?? "",
        },
        titulo: `${convenio.veterinaria} · factura de convenio del ${fecha(convenio.fecha_emision)} por ${soles(convenio.total)}. Datos fiscales tomados de la ficha del CRM.`,
      }}
      onCerrar={onCerrar}
      onEmitido={onEmitido}
    />
  );
}

// ---------- Emitidos ----------

const ESTADOS: { value: C.FiltroEstado | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ACEPTADO", label: "Aceptados" },
  { value: "PENDIENTE", label: "En envío" },
  { value: "FALLIDO", label: "Rechazados" },
  { value: "ANULADO", label: "Anulados" },
];

function EmitidosPanel() {
  const [pagina, setPagina] = useState(0);
  const primera = useCallback(() => setPagina(0), []);
  const [tipo, setTipoBase] = useState<"todos" | "BOLETA" | "FACTURA">("todos");
  const [estado, setEstadoBase] = useState<C.FiltroEstado | "todos">("todos");
  const [desde, setDesdeBase] = useState("");
  const [hasta, setHastaBase] = useState("");
  const setTipo = conReinicio(setTipoBase, primera);
  const setEstado = conReinicio(setEstadoBase, primera);
  const setDesde = conReinicio(setDesdeBase, primera);
  const setHasta = conReinicio(setHastaBase, primera);
  const [texto, setTexto, q] = useBusqueda(primera);
  const [viendo, setViendo] = useState<string | null>(null);

  const recurso = useRecurso(
    () =>
      C.registro({
        tipo: tipo === "todos" ? undefined : tipo,
        estado: estado === "todos" ? undefined : estado,
        desde: desde || undefined,
        hasta: hasta || undefined,
        q: q || undefined,
        pagina: pagina + 1,
        por_pagina: POR_PAGINA,
      }),
    [tipo, estado, desde, hasta, q, pagina]
  );
  const datos = recurso.data;

  const actualizar = async (id: string) => {
    if (await ejecutar(() => C.actualizar(id), "Estado actualizado.", "No se pudo consultar el estado.")) recurso.recargar();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input className="pl-9" placeholder="Número (B001-12), cliente o documento" value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-desde" className="text-xs">Desde</Label>
            <DatePicker id="em-desde" value={desde} onChange={setDesde} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em-hasta" className="text-xs">Hasta</Label>
            <DatePicker id="em-hasta" value={hasta} onChange={setHasta} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <BotonesOpcion
            ariaLabel="Tipo de comprobante"
            value={tipo}
            onChange={setTipo}
            opciones={[
              { value: "todos", label: "Todos" },
              { value: "BOLETA", label: "Boletas" },
              { value: "FACTURA", label: "Facturas" },
            ]}
          />
          <BotonesOpcion ariaLabel="Estado SUNAT" value={estado} onChange={setEstado} opciones={ESTADOS} />
        </div>
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <Tarjeta>
        <table className="w-full text-left text-sm min-w-220">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Comprobante</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Origen</th>
              <th className="px-4 py-3 font-semibold text-right">Total</th>
              <th className="px-4 py-3 font-semibold">Estado SUNAT</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(datos?.items ?? []).map((c) => (
              <tr key={c.id} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setViendo(c.id)}
                    className="font-mono font-semibold text-brand-600 hover:underline"
                    title="Ver comprobante"
                  >
                    {c.numero}
                  </button>
                  <p className="text-xs text-slate-500">
                    {c.tipo_doc === "03" ? "Boleta" : "Factura"}
                    {c.ambiente === "test" && (
                      <span className="ml-1.5 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">PRUEBA</span>
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{fecha(c.fecha_emision)}</td>
                <td className="px-4 py-3">
                  <p className="text-slate-800 dark:text-slate-200">{c.cliente_razon_social}</p>
                  <p className="text-xs text-slate-500">
                    {C.TIPO_DOC_CLIENTE[c.cliente_tipo_doc as C.TipoDocCliente] ?? "Doc."} {c.cliente_num_doc}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-700 dark:text-slate-200">{c.origen === "CONVENIO" ? "Convenio" : "Servicio"}</p>
                  <p className="text-xs text-slate-500">
                    {c.origen === "CONVENIO" ? c.referencia : [c.referencia, c.mascota].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <p className="font-medium">{soles(c.total)}</p>
                  <p className="text-xs text-slate-500">IGV {soles(c.igv)}</p>
                </td>
                <td className="px-4 py-3">
                  <EstadoComprobante estado={c.estado} />
                  {C.NO_VIGENTES.includes(c.estado) && c.descripcion_respuesta && (
                    <p className="mt-1 max-w-56 text-xs text-red-600">{c.descripcion_respuesta}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" title="Ver comprobante" onClick={() => setViendo(c.id)}>
                      <EyeIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="PDF A4" onClick={() => C.abrirPdf(c.id, "a4")}>
                      <FileTextIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Ticket" onClick={() => C.abrirPdf(c.id, "ticket80")}>
                      <ReceiptIcon className="size-4" />
                    </Button>
                    {c.estado !== "ACEPTADO" && c.estado !== "ANULADO" && (
                      <Button variant="ghost" size="icon-sm" title="Consultar estado en SUNAT" onClick={() => actualizar(c.id)}>
                        <RefreshCwIcon className="size-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!recurso.cargando && datos && datos.items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No hay comprobantes con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {datos && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-white/5">
            <span className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
              Aceptados en el filtro: <strong>{soles(datos.monto_aceptado)}</strong>
            </span>
            <Paginador total={datos.total} pagina={pagina} onCambiar={setPagina} porPagina={POR_PAGINA} className="flex-1" />
          </div>
        )}
      </Tarjeta>

      <Modal open={viendo !== null} onOpenChange={(o) => !o && setViendo(null)} ancho="sm:max-w-3xl">
        {viendo && <DetalleComprobante id={viendo} onCambio={recurso.recargar} />}
      </Modal>
    </div>
  );
}

// ---------- Piezas ----------

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
      {children}
    </div>
  );
}

function Resumen({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-4">
      <p className="text-label uppercase tracking-wider text-slate-500 font-semibold">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{valor}</p>
      <p className="text-xs text-slate-500">{detalle}</p>
    </div>
  );
}
