import { useMemo, useState } from "react";
import {
  PencilIcon,
  PlusCircleIcon,
  SearchIcon,
  WrenchIcon,
  CheckCircle2Icon,
  CalendarClockIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/shared/utils";
import {
  CATEGORIAS_ACTIVO,
  ESTADOS_ACTIVO,
  type Activo,
  type ActivoData,
  type CategoriaActivo,
  type EstadoActivo,
} from "../types";
import { ACTIVOS_EJEMPLO } from "../data/activos.mock";
import { ActivoDialog } from "../components/ActivoDialog";
import { ESTADO_BADGE, formatFecha, hoyISO, sumarDias } from "../utils/formato";

// Revisiones dentro de este rango (o ya vencidas) se destacan.
const DIAS_AVISO_REVISION = 30;

export default function ActivosPage() {
  const [activos, setActivos] = useState<Activo[]>(ACTIVOS_EJEMPLO);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<CategoriaActivo | "todas">("todas");
  const [estado, setEstado] = useState<EstadoActivo | "todos">("todos");
  const [dialog, setDialog] = useState<{ open: boolean; activo: Activo | null }>({
    open: false,
    activo: null,
  });

  const hoy = useMemo(() => hoyISO(), []);
  const limiteAviso = useMemo(() => sumarDias(hoy, DIAS_AVISO_REVISION), [hoy]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return activos
      .filter(
        (a) =>
          (!q || a.nombre.toLowerCase().includes(q) || a.codigo.toLowerCase().includes(q)) &&
          (categoria === "todas" || a.categoria === categoria) &&
          (estado === "todos" || a.estado === estado)
      )
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [activos, busqueda, categoria, estado]);

  const enUso = activos.filter((a) => a.estado !== "baja");
  const unidadesActivas = enUso.reduce((acc, a) => acc + a.cantidad, 0);
  const enReparacion = activos.filter((a) => a.estado === "reparacion").length;
  const revisionesPendientes = enUso.filter(
    (a) => a.proximaRevision && a.proximaRevision <= limiteAviso
  ).length;

  const handleGuardar = (datos: ActivoData) => {
    const editando = dialog.activo;
    if (editando) {
      setActivos((prev) => prev.map((a) => (a.id === editando.id ? { ...a, ...datos } : a)));
      notifySuccess(`Activo "${datos.nombre}" actualizado.`);
    } else {
      setActivos((prev) => [...prev, { ...datos, id: `act-${Date.now()}` }]);
      notifySuccess(`Activo "${datos.nombre}" registrado.`);
    }
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Activos" }]} />

      <ModuleHeader
        title="Activos"
        description="Equipos durables del negocio. Se controlan por estado y ubicación, no por stock."
        actions={
          <Button
            variant="operational"
            className="gap-1.5 h-10"
            onClick={() => setDialog({ open: true, activo: null })}
          >
            <PlusCircleIcon className="size-4" />
            Nuevo Activo
          </Button>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Unidades en uso"
          value={String(unidadesActivas)}
          hint={`${enUso.length} registros (sin dados de baja)`}
          icon={CheckCircle2Icon}
          tone="ok"
        />
        <KpiCard
          label="En reparación"
          value={String(enReparacion)}
          hint={enReparacion === 1 ? "registro en taller" : "registros en taller"}
          icon={WrenchIcon}
          tone={enReparacion > 0 ? "warn" : "ok"}
        />
        <KpiCard
          label="Revisiones pendientes"
          value={String(revisionesPendientes)}
          hint={`Vencidas o en los próximos ${DIAS_AVISO_REVISION} días`}
          icon={CalendarClockIcon}
          tone={revisionesPendientes > 0 ? "warn" : "ok"}
        />
      </section>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="pl-9"
          />
        </div>
        <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaActivo | "todas")}>
          <SelectTrigger className="md:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {CATEGORIAS_ACTIVO.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoActivo | "todos")}>
          <SelectTrigger className="md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {(Object.keys(ESTADOS_ACTIVO) as EstadoActivo[]).map((e) => (
              <SelectItem key={e} value={e}>
                {ESTADOS_ACTIVO[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Código</th>
                <th className="px-5 py-3 font-semibold">Activo</th>
                <th className="px-5 py-3 font-semibold">Ubicación</th>
                <th className="px-5 py-3 font-semibold text-right">Unidades</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Próxima revisión</th>
                <th className="px-5 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((a) => (
                <tr key={a.id} className={cn("hover:bg-slate-50/60", a.estado === "baja" && "opacity-60")}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{a.codigo}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-900">{a.nombre}</p>
                    <p className="text-xs text-slate-500">{a.categoria}</p>
                    {a.observaciones && (
                      <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{a.observaciones}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{a.ubicacion}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">{a.cantidad}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-label font-semibold whitespace-nowrap",
                        ESTADO_BADGE[a.estado]
                      )}
                    >
                      {ESTADOS_ACTIVO[a.estado]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <RevisionCell fecha={a.proximaRevision} hoy={hoy} limite={limiteAviso} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialog({ open: true, activo: a })}
                    >
                      <PencilIcon className="size-3.5" />
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                    No hay activos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 text-xs text-slate-500">
          Mostrando <strong className="text-slate-900">{filtrados.length}</strong> de{" "}
          <strong className="text-slate-900">{activos.length}</strong> registros
        </div>
      </div>

      <ActivoDialog
        open={dialog.open}
        activo={dialog.activo}
        codigosOcupados={activos.filter((a) => a.id !== dialog.activo?.id).map((a) => a.codigo)}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        onGuardar={handleGuardar}
      />
    </>
  );
}

function RevisionCell({ fecha, hoy, limite }: { fecha?: string; hoy: string; limite: string }) {
  if (!fecha) return <span className="text-xs text-slate-400">Sin programar</span>;
  const vencida = fecha < hoy;
  const proxima = !vencida && fecha <= limite;
  return (
    <div className="flex flex-col">
      <span
        className={cn(
          "text-sm font-medium",
          vencida ? "text-red-700" : proxima ? "text-amber-700" : "text-slate-700"
        )}
      >
        {formatFecha(fecha)}
      </span>
      {(vencida || proxima) && (
        <span className={cn("text-label font-semibold", vencida ? "text-red-600" : "text-amber-600")}>
          {vencida ? "Vencida" : "Próxima"}
        </span>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "ok" | "warn";
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex items-start gap-4">
      <div
        className={cn(
          "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center",
          tone === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-xl font-bold mt-1 text-slate-900">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      </div>
    </div>
  );
}
