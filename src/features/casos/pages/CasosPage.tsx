import { useMemo, useState } from "react";
import { PlusCircleIcon, SearchIcon } from "lucide-react";
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
  ESTADO_LABEL,
  faltaUrna,
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
import { ESTADO_BADGE, pagoBadge } from "../utils/estilos";

type Filtro = "activos" | EstadoCaso | "todos";

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "activos", label: "En curso" },
  { key: "AGENDADO", label: "Agendados" },
  { key: "REALIZADO", label: "Por entregar" },
  { key: "ENTREGADO", label: "Entregados" },
  { key: "CANCELADO", label: "Cancelados" },
  { key: "todos", label: "Todos" },
];

function enFiltro(estado: EstadoCaso, filtro: Filtro): boolean {
  if (filtro === "todos") return true;
  if (filtro === "activos") return estado === "AGENDADO" || estado === "REALIZADO";
  return estado === filtro;
}

export default function CasosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const recurso = useRecurso(() => casosApi.bandeja({ q: q || undefined }), [q]);
  const casos = useMemo(() => recurso.data ?? [], [recurso.data]);

  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [detalle, setDetalle] = useState<CasoFila | null>(null);
  const [accion, setAccion] = useState<{ tipo: AccionCaso; caso: CasoFila } | null>(null);

  const conteo = useMemo(
    () => Object.fromEntries(FILTROS.map((f) => [f.key, casos.filter((c) => enFiltro(c.estado, f.key)).length])) as Record<Filtro, number>,
    [casos]
  );
  const visibles = useMemo(() => casos.filter((c) => enFiltro(c.estado, filtro)), [casos, filtro]);

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
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Casos & Servicios" }]} />

      <ModuleHeader
        title="Casos"
        description="Cada servicio contratado: agenda, pagos, realización y entrega de la urna."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setNuevoAbierto(true)}>
            <PlusCircleIcon className="size-4" />
            Nuevo caso
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar casos">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filtro === f.key}
              onClick={() => setFiltro(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                filtro === f.key
                  ? "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/12 dark:text-brand-400 dark:border-brand-500/30"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-gray-900 dark:text-slate-300 dark:border-white/10"
              )}
            >
              {f.label} <span className="opacity-70">({conteo[f.key] ?? 0})</span>
            </button>
          ))}
        </div>
        <form
          className="relative md:ml-auto md:w-80"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(busqueda.trim());
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
          <table className="w-full text-left text-sm min-w-[860px]">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Caso</th>
                <th className="px-5 py-3 font-semibold">Servicio</th>
                <th className="px-5 py-3 font-semibold">Agenda</th>
                <th className="px-5 py-3 font-semibold">Pago</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold text-right">Siguiente paso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {visibles.map((caso) => {
                const siguiente = accionPrincipal(caso.estado);
                const pago = pagoBadge(Number(caso.precio_total), Number(caso.total_pagado));
                const saldo = Number(caso.saldo);
                return (
                  <tr key={caso.id} className={cn("hover:bg-slate-50/60 dark:hover:bg-white/5", caso.estado === "CANCELADO" && "opacity-70")}>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => setDetalle(caso)} className="text-left">
                        <span className="block font-semibold text-slate-900 dark:text-white hover:text-brand-500">
                          {caso.mascota} · {caso.tutor}
                        </span>
                        <span className="text-xs text-slate-500">
                          {caso.especie ?? ""} · {caso.peso_kg} kg{caso.veterinaria ? ` · ${caso.veterinaria}` : ""}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block text-slate-800 dark:text-slate-200">
                        {SERVICIO_LABEL[caso.servicio]} · {MODALIDAD_LABEL[caso.modalidad]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {caso.plan_nombre ?? ""}
                        {caso.distrito_origen ? ` · ${caso.distrito_origen}` : ""}
                      </span>
                    </td>
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
                      {siguiente ? (
                        <Button
                          variant={siguiente.tipo === "realizado" ? "operational" : "outline"}
                          size="sm"
                          onClick={() => ejecutarAccion(caso, siguiente.tipo)}
                        >
                          {siguiente.texto}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recurso.cargando && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">Cargando casos…</td>
                </tr>
              )}
              {recurso.error && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-red-600">{recurso.error}</td>
                </tr>
              )}
              {!recurso.cargando && !recurso.error && visibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">No hay casos en esta vista.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 dark:bg-white/5 text-xs text-slate-500">
          {visibles.length} de {casos.length} casos{q ? ` para “${q}”` : ""}.
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
