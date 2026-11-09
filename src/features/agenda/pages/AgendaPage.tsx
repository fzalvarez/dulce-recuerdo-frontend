import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  StoreIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import api from "@/shared/lib/axios";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { useModulosPermitidos } from "@/features/roles/store/roles.store";
import { Modal } from "@/features/casos/components/Dialogos";

interface EntradaAgenda {
  id: string;
  caso_id: string;
  inicio: string;
  fin: string;
  estado: "PROGRAMADA" | "REALIZADA" | "CANCELADA";
  tipo_ubicacion: "LOCAL" | "DOMICILIO";
  direccion: string | null;
  distrito: string | null;
  observaciones: string | null;
  mascota: string;
  especie: string | null;
  tutor: string;
  telefono: string | null;
  servicio: "CREMACION" | "EUTANASIA";
  modalidad: string;
  plan_nombre: string | null;
  caso_estado: string;
}

type Vista = "dia" | "semana";

const ESTADO: Record<EntradaAgenda["estado"], { label: string; clase: string }> = {
  PROGRAMADA: { label: "Programada", clase: "bg-indigo-100 text-indigo-800" },
  REALIZADA: { label: "Realizada", clase: "bg-emerald-100 text-emerald-800" },
  CANCELADA: { label: "Cancelada", clase: "bg-slate-200 text-slate-500" },
};

// ---------- Fechas locales ----------

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sumarDias(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function lunesDe(d: Date): Date {
  return sumarDias(d, -((d.getDay() + 6) % 7));
}

function hora(isoTexto: string): string {
  return isoTexto.slice(11, 16);
}

function etiquetaDia(d: Date, largo = false): string {
  return d.toLocaleDateString("es-PE", largo ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric" });
}

async function cargar(desde: Date, hasta: Date): Promise<EntradaAgenda[]> {
  const { data } = await api.get<EntradaAgenda[]>("/agenda/calendario", {
    params: { desde: `${iso(desde)}T00:00:00`, hasta: `${iso(hasta)}T00:00:00` },
  });
  return data;
}

/** Agenda real del único vehículo: servicios por día o por semana (spec caso-flujo §9). */
export default function AgendaPage() {
  const [vista, setVista] = useState<Vista>("dia");
  const [ancla, setAncla] = useState(() => new Date());
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [reprogramar, setReprogramar] = useState<EntradaAgenda | null>(null);
  const puedeVerCasos = useModulosPermitidos().includes("casos");

  const desde = vista === "dia" ? ancla : lunesDe(ancla);
  const dias = vista === "dia" ? 1 : 7;
  const hasta = sumarDias(desde, dias);
  const clave = `${iso(desde)}|${dias}`;
  const recurso = useRecurso(() => cargar(desde, hasta), [clave]);
  const entradas = useMemo(() => recurso.data ?? [], [recurso.data]);
  const elegida = entradas.find((e) => e.id === seleccion) ?? entradas[0] ?? null;

  const mover = (paso: number) => setAncla((a) => sumarDias(a, paso * dias));
  const titulo =
    vista === "dia"
      ? etiquetaDia(desde, true)
      : `${desde.toLocaleDateString("es-PE", { day: "numeric", month: "short" })} – ${sumarDias(desde, 6).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <>
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Agenda & Rutas" }]} />
      <ModuleHeader
        title="Agenda"
        description="Un solo vehículo: los servicios no pueden cruzarse. Para agendar uno nuevo, registra el caso."
        actions={
          puedeVerCasos && (
            <Button asChild variant="operational" className="h-10">
              <Link to="/casos">Nuevo caso</Link>
            </Button>
          )
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" title="Anterior" onClick={() => mover(-1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAncla(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="icon-sm" title="Siguiente" onClick={() => mover(1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <span className="ml-2 text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{titulo}</span>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Vista">
          {(["dia", "semana"] as Vista[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={vista === v}
              onClick={() => setVista(v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border",
                vista === v ? "bg-brand-50 text-brand-700 border-brand-200" : "bg-white text-slate-600 border-slate-200 dark:bg-gray-900 dark:text-slate-300 dark:border-white/10"
              )}
            >
              {v === "dia" ? "Día" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-4">
          {vista === "dia" ? (
            <ListaDia entradas={entradas} elegida={elegida?.id} onElegir={setSeleccion} cargando={recurso.cargando} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)).map((d) => {
                const delDia = entradas.filter((e) => e.inicio.slice(0, 10) === iso(d));
                const esHoy = iso(d) === iso(new Date());
                return (
                  <div key={iso(d)} className="flex flex-col gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setAncla(d);
                        setVista("dia");
                      }}
                      className={cn("text-xs font-semibold capitalize text-left", esHoy ? "text-brand-600" : "text-slate-500")}
                    >
                      {etiquetaDia(d)}
                    </button>
                    {delDia.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSeleccion(e.id)}
                        className={cn(
                          "text-left rounded-md border px-2 py-1.5 text-xs",
                          elegida?.id === e.id ? "border-brand-300 bg-brand-50" : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                      >
                        <span className="block font-semibold">{hora(e.inicio)}</span>
                        <span className="block truncate">{e.mascota}</span>
                      </button>
                    ))}
                    {delDia.length === 0 && <span className="text-[11px] text-slate-400">—</span>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-4">
          {elegida ? (
            <Detalle entrada={elegida} onReprogramar={() => setReprogramar(elegida)} />
          ) : (
            <p className="text-sm text-slate-400">Sin servicios en este periodo.</p>
          )}
        </aside>
      </div>

      <Modal open={reprogramar !== null} onOpenChange={(o) => !o && setReprogramar(null)}>
        {reprogramar && <ReprogramarForm entrada={reprogramar} onCerrar={() => setReprogramar(null)} onHecho={recurso.recargar} />}
      </Modal>
    </>
  );
}

function ListaDia({
  entradas,
  elegida,
  onElegir,
  cargando,
}: {
  entradas: EntradaAgenda[];
  elegida?: string;
  onElegir: (id: string) => void;
  cargando: boolean;
}) {
  if (cargando) return <p className="text-sm text-slate-400">Cargando agenda…</p>;
  if (entradas.length === 0) return <p className="text-sm text-slate-400">No hay servicios este día.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {entradas.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => onElegir(e.id)}
            className={cn(
              "w-full text-left flex items-start gap-4 rounded-lg border px-4 py-3",
              elegida === e.id ? "border-brand-300 bg-brand-50/60" : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
            )}
          >
            <span className="text-sm font-bold text-slate-900 dark:text-white w-24 shrink-0">
              {hora(e.inicio)}–{hora(e.fin)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-slate-900 dark:text-white truncate">
                {e.mascota} · {e.tutor}
              </span>
              <span className="block text-xs text-slate-500 truncate">
                {e.servicio === "CREMACION" ? "Cremación" : "Eutanasia"}
                {e.plan_nombre ? ` · ${e.plan_nombre}` : ""}
                {e.tipo_ubicacion === "DOMICILIO" ? ` · Domicilio${e.distrito ? ` (${e.distrito})` : ""}` : " · En local"}
              </span>
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", ESTADO[e.estado].clase)}>{ESTADO[e.estado].label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Detalle({ entrada: e, onReprogramar }: { entrada: EntradaAgenda; onReprogramar: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{e.mascota}</h2>
        <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", ESTADO[e.estado].clase)}>{ESTADO[e.estado].label}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {e.especie ?? ""} · {e.servicio === "CREMACION" ? "Cremación" : "Eutanasia"}
        {e.plan_nombre ? ` · ${e.plan_nombre}` : ""}
      </p>
      <div className="flex flex-col gap-2 text-sm">
        <span className="inline-flex items-center gap-2">
          <CalendarClockIcon className="size-4 text-slate-400" />
          {new Date(e.inicio).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })} · {hora(e.inicio)}–{hora(e.fin)}
        </span>
        <span className="inline-flex items-center gap-2">
          {e.tipo_ubicacion === "DOMICILIO" ? <HomeIcon className="size-4 text-slate-400" /> : <StoreIcon className="size-4 text-slate-400" />}
          {e.tipo_ubicacion === "DOMICILIO" ? "A domicilio" : "En el local"}
        </span>
        {e.tipo_ubicacion === "DOMICILIO" && (
          <span className="inline-flex items-start gap-2">
            <MapPinIcon className="size-4 text-slate-400 mt-0.5" />
            {e.direccion ?? "—"}
            {e.distrito ? `, ${e.distrito}` : ""}
          </span>
        )}
        <span className="inline-flex items-center gap-2">
          <PhoneIcon className="size-4 text-slate-400" />
          {e.tutor}
          {e.telefono ? ` · ${e.telefono}` : ""}
        </span>
        {e.observaciones && <p className="text-xs text-slate-500">{e.observaciones}</p>}
      </div>
      {e.estado === "PROGRAMADA" && (
        <Button variant="outline" onClick={onReprogramar}>
          Reprogramar
        </Button>
      )}
      <p className="text-xs text-slate-400">Marcar realizado o cancelar se hace desde el caso.</p>
    </div>
  );
}

function ReprogramarForm({ entrada, onCerrar, onHecho }: { entrada: EntradaAgenda; onCerrar: () => void; onHecho: () => void }) {
  const [fecha, setFecha] = useState(entrada.inicio.slice(0, 10));
  const [inicio, setInicio] = useState(hora(entrada.inicio));
  const [fin, setFin] = useState(hora(entrada.fin));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!fecha || !inicio || !fin) return setError("Completa fecha y horas.");
    if (fin <= inicio) return setError("La hora de fin debe ser posterior a la de inicio.");
    setGuardando(true);
    const ok = await ejecutar(
      () => api.patch(`/agenda/${entrada.id}`, { inicio: `${fecha}T${inicio}:00`, fin: `${fecha}T${fin}:00` }),
      "Servicio reprogramado.",
      "No se pudo reprogramar."
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
        <DialogTitle>Reprogramar · {entrada.mascota}</DialogTitle>
        <DialogDescription>El sistema rechaza el cambio si se cruza con otro servicio.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rp-fecha">Fecha</Label>
          <DatePicker id="rp-fecha" value={fecha} onChange={setFecha} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rp-inicio">Desde</Label>
          <Input id="rp-inicio" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rp-fin">Hasta</Label>
          <Input id="rp-fin" type="time" value={fin} onChange={(e) => setFin(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Reprogramar"}
        </Button>
      </DialogFooter>
    </>
  );
}
