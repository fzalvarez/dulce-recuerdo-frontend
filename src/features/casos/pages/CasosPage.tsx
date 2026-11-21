import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  MessageCircleIcon,
  PhoneIcon,
  PlusCircleIcon,
  SearchIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import * as casosApi from "../api";
import type { CasoFila, EstadoCaso } from "../types";
import {
  accionPrincipal,
  enlaceWhatsApp,
  ESTADO_LABEL,
  faltaUrna,
  fechaCorta,
  fechaHora,
  MODALIDAD_LABEL,
  SERVICIO_LABEL,
  soles,
} from "../utils/casos";
import {
  CancelarDialog,
  EntregaDialog,
  PagoDialog,
  PrecioDialog,
  RealizadoDialog,
  UrnaDialog,
} from "../components/Dialogos";
import { ejecutar } from "@/shared/utils/ejecutar";
import { NuevoCasoDialog } from "../components/NuevoCasoDialog";
import { DetalleCasoDialog, type AccionCaso } from "../components/DetalleCasoDialog";
import { ESTADO_BADGE, MODALIDAD_BADGE, pagoBadge } from "../utils/estilos";
import { EspecieIcono } from "../components/EspecieIcono";

type Filtro = "activos" | EstadoCaso | "todos";

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "activos", label: "En curso" },
  { key: "AGENDADO", label: "Agendados" },
  { key: "REALIZADO", label: "Por entregar" },
  { key: "ENTREGADO", label: "Entregados" },
  { key: "CANCELADO", label: "Cancelados" },
  { key: "todos", label: "Todos" },
];

/** Servicios por página: la bandeja se pide de a 100 y el backend ordena y filtra. */
const POR_PAGINA = 100;

/**
 * Fecha que muestra la columna Fecha: el último movimiento del servicio (entrega,
 * realización, agenda o registro). Los casos históricos usan la fecha de su servicio.
 * El backend ordena la bandeja con la misma regla.
 */
function fechaDelServicio(caso: CasoFila): string {
  return caso.fecha_entrega ?? caso.fecha_realizado ?? caso.inicio ?? caso.created_at;
}

export default function CasosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [pagina, setPagina] = useState(0);
  const recurso = useRecurso(
    () => casosApi.bandejaPagina({ filtro, q: q || undefined, offset: pagina * POR_PAGINA, limite: POR_PAGINA }),
    [filtro, q, pagina]
  );
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [detalle, setDetalle] = useState<CasoFila | null>(null);
  const [accion, setAccion] = useState<{ tipo: AccionCaso; caso: CasoFila } | null>(null);

  const visibles = recurso.data?.items ?? [];
  const total = recurso.data?.total ?? 0;
  const conteo = recurso.data?.conteos ?? {};
  const ultimaPagina = Math.max(0, Math.ceil(total / POR_PAGINA) - 1);
  const primero = total ? pagina * POR_PAGINA + 1 : 0;
  const ultimo = Math.min((pagina + 1) * POR_PAGINA, total);

  const cambiarFiltro = (nuevo: Filtro) => {
    setFiltro(nuevo);
    setPagina(0);
  };

  const ejecutarAccion = async (caso: CasoFila, tipo: AccionCaso) => {
    if (tipo === "entregado" && !faltaUrna(caso)) {
      const ok = await ejecutar(() => casosApi.marcarEntregado(caso.id), "Entrega registrada. Caso cerrado.", "No se pudo registrar la entrega.");
      if (ok) recurso.recargar();
      return;
    }
    setAccion({ tipo, caso });
  };

  const cerrarAccion = (open: boolean) => {
    if (!open) setAccion(null);
  };
  const casoDe = (tipo: AccionCaso) => (accion?.tipo === tipo ? accion.caso : null);

  return (
    <>
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Servicios" }]} />

      <ModuleHeader
        title="Servicios"
        description="Cada servicio contratado: agenda, pagos, realización y entrega de la urna."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setNuevoAbierto(true)}>
            <PlusCircleIcon className="size-4" />
            Nuevo caso
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar servicios">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filtro === f.key}
              onClick={() => cambiarFiltro(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                filtro === f.key
                  ? "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/12 dark:text-brand-400 dark:border-brand-500/30"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-gray-900 dark:text-slate-300 dark:border-white/10"
              )}
            >
              {f.label} <span className="opacity-70">({(conteo[f.key] ?? 0).toLocaleString("es-PE")})</span>
            </button>
          ))}
        </div>
        <form
          className="relative md:ml-auto md:w-80"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(busqueda.trim());
            setPagina(0);
          }}
        >
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Tutor, DNI, teléfono o mascota (Enter)"
            className="pl-9"
          />
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Mascota</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Servicio</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Agenda</th>
                <th className="px-5 py-3 font-semibold">Pago</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {visibles.map((caso) => {
                const siguiente = accionPrincipal(caso.estado);
                const pago = pagoBadge(Number(caso.precio_total), Number(caso.total_pagado));
                const saldo = Number(caso.saldo);
                const datosMascota = [caso.peso_kg != null ? `${caso.peso_kg} kg` : null, caso.sexo].filter(Boolean).join(" · ");
                return (
                  <tr key={caso.id} className={cn("hover:bg-slate-50/60 dark:hover:bg-white/5", caso.estado === "CANCELADO" && "opacity-70")}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <EspecieIcono especie={caso.especie} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setDetalle(caso)}
                            className="block max-w-full truncate text-left font-semibold text-slate-900 dark:text-white hover:text-brand-500"
                          >
                            {caso.mascota}
                          </button>
                          <span className="block truncate text-xs text-slate-500">{datosMascota || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block truncate font-medium text-slate-900 dark:text-white">{caso.tutor}</span>
                      {caso.telefono ? (
                        <span className="mt-0.5 flex items-center gap-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                          <a
                            href={`tel:${caso.telefono.replace(/\s+/g, "")}`}
                            className="inline-flex items-center gap-1 hover:text-brand-500"
                          >
                            <PhoneIcon className="size-3.5 text-slate-400" aria-hidden />
                            {caso.telefono}
                          </a>
                          <a
                            href={enlaceWhatsApp(caso.telefono)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Escribir por WhatsApp"
                            className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                          >
                            <MessageCircleIcon className="size-3.5" aria-hidden />
                            WhatsApp
                          </a>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Sin teléfono</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-800 dark:text-slate-200">{SERVICIO_LABEL[caso.servicio]}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold whitespace-nowrap", MODALIDAD_BADGE[caso.modalidad])}>
                          {MODALIDAD_LABEL[caso.modalidad]}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500">
                        {caso.plan_nombre ?? ""}
                        {caso.distrito_origen ? ` · ${caso.distrito_origen}` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{fechaCorta(fechaDelServicio(caso))}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{fechaHora(caso.inicio)}</td>
                    <td className="px-5 py-3">
                      {caso.estado === "CANCELADO" ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="flex flex-col gap-1 items-start">
                          <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", pago.clase)}>{pago.texto}</span>
                          <span className="text-xs text-slate-500">
                            {soles(caso.total_pagado)} de {soles(caso.precio_total)}
                            {saldo > 0 ? ` · falta ${soles(saldo)}` : ""}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold whitespace-nowrap", ESTADO_BADGE[caso.estado])}>
                        {ESTADO_LABEL[caso.estado]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDetalle(caso)} title="Ver ficha completa">
                          <EyeIcon className="size-4" />
                          Ver
                        </Button>
                        {siguiente && (
                          <Button
                            variant={siguiente.tipo === "realizado" ? "operational" : "outline"}
                            size="sm"
                            onClick={() => ejecutarAccion(caso, siguiente.tipo)}
                          >
                            {siguiente.texto}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {recurso.cargando && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">Cargando servicios…</td>
                </tr>
              )}
              {recurso.error && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-red-600">{recurso.error}</td>
                </tr>
              )}
              {!recurso.cargando && !recurso.error && visibles.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">No hay servicios en esta vista.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50 dark:bg-white/5 text-xs text-slate-500">
          <span>
            {total
              ? `Mostrando ${primero.toLocaleString("es-PE")}–${ultimo.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")}`
              : "Sin servicios"}
            {q ? ` para “${q}”` : ""}.
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
              <ChevronLeftIcon className="size-4" />
              Anterior
            </Button>
            <span className="tabular-nums">
              Página {pagina + 1} de {ultimaPagina + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={pagina >= ultimaPagina}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <NuevoCasoDialog open={nuevoAbierto} onOpenChange={setNuevoAbierto} onCreado={recurso.recargar} />

      <DetalleCasoDialog
        fila={detalle}
        onOpenChange={(open) => {
          if (!open) setDetalle(null);
        }}
        onAccion={(tipo) => {
          const caso = detalle;
          setDetalle(null);
          if (caso) ejecutarAccion(caso, tipo);
        }}
      />

      <PagoDialog caso={casoDe("pago")} onOpenChange={cerrarAccion} onHecho={recurso.recargar} />
      <RealizadoDialog caso={casoDe("realizado")} onOpenChange={cerrarAccion} onHecho={recurso.recargar} />
      <CancelarDialog caso={casoDe("cancelar")} onOpenChange={cerrarAccion} onHecho={recurso.recargar} />
      <PrecioDialog caso={casoDe("precio")} onOpenChange={cerrarAccion} onHecho={recurso.recargar} />
      <EntregaDialog caso={casoDe("entregado")} onOpenChange={cerrarAccion} onHecho={recurso.recargar} />
      <UrnaDialog caso={casoDe("urna")} onOpenChange={cerrarAccion} onHecho={recurso.recargar} />
    </>
  );
}
