import { useMemo, useState } from "react";
import { PlusCircleIcon, SearchIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/shared/utils";
import type { Caso, EstadoMostrado, EstadoPago, MetodoPago } from "../types";
import { CASOS_INICIALES } from "../data/casos.mock";
import { DIAS_ABANDONO, PLAN_NOMBRE } from "../data/tarifas";
import {
  accionPrincipal,
  calcularPrecio,
  ESTADO_LABEL,
  estadoMostrado,
  estadoPago,
  formatoFecha,
  hoyISO,
  MODALIDAD_LABEL,
  SERVICIO_LABEL,
  soles,
  totalPagado,
} from "../utils/casos";
import { AgendarDialog, NuevoCasoDialog, PagoDialog, type NuevoCasoDatos } from "../components/Dialogos";
import { DetalleCasoDialog } from "../components/DetalleCasoDialog";
import { ESTADO_BADGE, PAGO_BADGE } from "../utils/estilos";

type Filtro = "activos" | "entregados" | "abandonados" | "todos";

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "activos", label: "Activos" },
  { key: "entregados", label: "Entregados" },
  { key: "abandonados", label: "Abandonados" },
  { key: "todos", label: "Todos" },
];

interface Fila {
  caso: Caso;
  estado: EstadoMostrado;
  pago: EstadoPago;
  total: number;
}

function enFiltro(estado: EstadoMostrado, filtro: Filtro): boolean {
  if (filtro === "todos") return true;
  if (filtro === "entregados") return estado === "ENTREGADO";
  if (filtro === "abandonados") return estado === "ABANDONADO";
  return estado !== "ENTREGADO" && estado !== "ABANDONADO";
}

export default function CasosPage() {
  const [casos, setCasos] = useState<Caso[]>(CASOS_INICIALES);
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [busqueda, setBusqueda] = useState("");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [pagoId, setPagoId] = useState<string | null>(null);
  const [agendarId, setAgendarId] = useState<string | null>(null);

  const hoy = useMemo(() => hoyISO(), []);

  const filas: Fila[] = useMemo(
    () =>
      casos.map((caso) => {
        const total = calcularPrecio(caso).total;
        return {
          caso,
          estado: estadoMostrado(caso, hoy),
          pago: estadoPago(caso, total),
          total,
        };
      }),
    [casos, hoy]
  );

  const conteo = useMemo(
    () => ({
      activos: filas.filter((f) => enFiltro(f.estado, "activos")).length,
      entregados: filas.filter((f) => enFiltro(f.estado, "entregados")).length,
      abandonados: filas.filter((f) => enFiltro(f.estado, "abandonados")).length,
      todos: filas.length,
    }),
    [filas]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas
      .filter((f) => enFiltro(f.estado, filtro))
      .filter(
        (f) =>
          !q ||
          f.caso.tutor.toLowerCase().includes(q) ||
          f.caso.mascota.toLowerCase().includes(q) ||
          f.caso.codigo.includes(q)
      )
      .sort((a, b) => b.caso.ultimoContacto.localeCompare(a.caso.ultimoContacto));
  }, [filas, filtro, busqueda]);

  const casoPorId = (id: string | null) => casos.find((c) => c.id === id) ?? null;
  const filaDetalle = detalleId ? filas.find((f) => f.caso.id === detalleId) ?? null : null;
  const casoPago = casoPorId(pagoId);
  const casoAgendar = casoPorId(agendarId);
  const totalPago = casoPago ? calcularPrecio(casoPago).total : 0;

  const actualizar = (id: string, cambio: (c: Caso) => Caso) =>
    setCasos((prev) => prev.map((c) => (c.id === id ? cambio(c) : c)));

  const ejecutarAccion = (id: string, tipo: string) => {
    if (tipo === "pago") return setPagoId(id);
    if (tipo === "agendar") return setAgendarId(id);
    if (tipo === "realizado") {
      actualizar(id, (c) => ({ ...c, estado: "REALIZADO" }));
      return notifySuccess("Servicio marcado como realizado. Falta la entrega de la urna.");
    }
    if (tipo === "entregado") {
      actualizar(id, (c) => ({ ...c, estado: "ENTREGADO" }));
      return notifySuccess("Caso entregado y cerrado.");
    }
  };

  const guardarPago = (monto: number, metodo: MetodoPago) => {
    if (!pagoId) return;
    actualizar(pagoId, (c) => ({
      ...c,
      pagos: [...c.pagos, { id: `p-${Date.now()}`, monto, metodo, fecha: hoy }],
    }));
    notifySuccess(`Pago de ${soles(monto)} registrado.`);
  };

  const guardarAgenda = (fecha: string, hora: string) => {
    if (!agendarId) return;
    actualizar(agendarId, (c) => ({ ...c, estado: "AGENDADO", fechaServicio: fecha, horaServicio: hora }));
    notifySuccess("Caso agendado.");
  };

  const crearCaso = (datos: NuevoCasoDatos) => {
    const maxCodigo = Math.max(...casos.map((c) => Number(c.codigo)));
    const nuevo: Caso = {
      ...datos,
      id: `c-${Date.now()}`,
      codigo: String(maxCodigo + 1).padStart(6, "0"),
      pagos: [],
      ultimoContacto: hoy,
      estado: "EN_CONVERSACION",
    };
    setCasos((prev) => [...prev, nuevo]);
    notifySuccess(`Caso #${nuevo.codigo} abierto para ${nuevo.mascota}.`);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Casos & Servicios" }]} />

      <ModuleHeader
        title="Casos"
        description="Un caso por mascota: desde el primer mensaje hasta la entrega de la urna."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setNuevoAbierto(true)}>
            <PlusCircleIcon className="size-4" />
            Nuevo caso
          </Button>
        }
      />

      {/* Filtros y búsqueda */}
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
              {f.label} <span className="opacity-70">({conteo[f.key]})</span>
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tutor, mascota o código"
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabla */}
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
              {visibles.map((f) => {
                const { caso, estado } = f;
                const accion = accionPrincipal(caso, estado);
                const saldo = Math.max(0, f.total - totalPagado(caso));
                return (
                  <tr key={caso.id} className={cn("hover:bg-slate-50/60 dark:hover:bg-white/5", estado === "ABANDONADO" && "opacity-70")}>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => setDetalleId(caso.id)} className="text-left">
                        <span className="block font-semibold text-slate-900 dark:text-white hover:text-brand-500">
                          {caso.mascota} · {caso.tutor}
                        </span>
                        <span className="text-xs text-slate-500">
                          #{caso.codigo} · {caso.especie}
                          {caso.pesoKg !== undefined ? ` · ${caso.pesoKg} kg` : ""}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block text-slate-800 dark:text-slate-200">
                        {SERVICIO_LABEL[caso.servicio]} · {MODALIDAD_LABEL[caso.modalidad]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {caso.servicio === "CREMACION" && caso.plan ? PLAN_NOMBRE[caso.plan] : ""}
                        {caso.modalidad === "DOMICILIO" && caso.distrito ? ` · ${caso.distrito}` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {caso.fechaServicio
                        ? `${formatoFecha(caso.fechaServicio)}${caso.horaServicio ? ` · ${caso.horaServicio}` : ""}`
                        : "Sin agendar"}
                    </td>
                    <td className="px-5 py-3">
                      {estado === "ABANDONADO" ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="flex flex-col gap-1 items-start">
                          <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", PAGO_BADGE[f.pago].clase)}>
                            {PAGO_BADGE[f.pago].texto}
                          </span>
                          {f.total > 0 && saldo > 0 && (
                            <span className="text-xs text-slate-500">Falta {soles(saldo)}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold whitespace-nowrap", ESTADO_BADGE[estado])}>
                        {ESTADO_LABEL[estado]}
                      </span>
                      {estado === "ABANDONADO" && (
                        <span className="block text-xs text-slate-400 mt-1">
                          Sin respuesta desde {formatoFecha(caso.ultimoContacto)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {accion ? (
                        <Button
                          variant={accion.tipo === "pago" || accion.tipo === "agendar" ? "operational" : "outline"}
                          size="sm"
                          onClick={() => ejecutarAccion(caso.id, accion.tipo)}
                        >
                          {accion.texto}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                    No hay casos en esta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 dark:bg-white/5 text-xs text-slate-500">
          {visibles.length} de {filas.length} casos. Un caso pasa a abandonado solo cuando lleva{" "}
          {DIAS_ABANDONO} días sin mensajes y sin pagos.
        </div>
      </div>

      <NuevoCasoDialog open={nuevoAbierto} onOpenChange={setNuevoAbierto} onGuardar={crearCaso} />

      <DetalleCasoDialog
        caso={filaDetalle?.caso ?? null}
        estado={filaDetalle?.estado ?? "EN_CONVERSACION"}
        estadoPagoActual={filaDetalle?.pago ?? "PENDIENTE"}
        onOpenChange={(open) => {
          if (!open) setDetalleId(null);
        }}
        onAccion={(tipo) => {
          if (!detalleId) return;
          setDetalleId(null);
          ejecutarAccion(detalleId, tipo);
        }}
      />

      <PagoDialog
        caso={casoPago}
        total={totalPago}
        onOpenChange={(open) => {
          if (!open) setPagoId(null);
        }}
        onGuardar={guardarPago}
      />

      <AgendarDialog
        caso={casoAgendar}
        onOpenChange={(open) => {
          if (!open) setAgendarId(null);
        }}
        onGuardar={guardarAgenda}
      />
    </>
  );
}
