import { useMemo, useState } from "react";
import {
  ClockIcon,
  PawPrintIcon,
  MapPinIcon,
  DoorOpenIcon,
  UsersIcon,
  UserIcon,
  InfoIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  CalendarDaysIcon,
  Columns3Icon,
  CalendarRangeIcon,
  LifeBuoyIcon,
  CalendarCheck2Icon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/shared/utils";

// TODO: reemplazar por datos reales del módulo `agenda` cuando se exponga el endpoint.
type EstadoEvento = "realizado" | "activo" | "confirmado" | "programado";

interface EventoDetalle {
  estado: EstadoEvento;
  statusTextDetail: string;
  petName: string;
  petSpec: string;
  caseNum: string;
  serviceTitle: string;
  time: string;
  duration: string;
  location: string;
  tutor: string;
  notes: string;
  extraLine?: string;
}

const ESTADO_BADGE: Record<EstadoEvento, { label: string; dot: string; text: string; bg: string }> = {
  realizado: { label: "Realizado", dot: "bg-operational", text: "text-emerald-700", bg: "bg-emerald-50" },
  activo: { label: "Próximo", dot: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-100/70" },
  confirmado: { label: "Confirmado", dot: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-100/70" },
  programado: { label: "Programado", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
};

const EVENTOS: Record<string, EventoDetalle> = {
  "lucas-ceremonia": {
    estado: "activo",
    statusTextDetail: "Confirmado para hoy",
    petName: "Lucas",
    petSpec: "Canino · Golden Retriever (32 kg)",
    caseNum: "Caso #REC-2024-089",
    serviceTitle: "Ceremonia de Despedida con Testigos",
    time: "16:30 – 17:30 hrs",
    duration: "60 minutos",
    location: "Sala Serena (Sede Central)",
    tutor: "Tutora: Valeria Mendoza · 3 acompañantes",
    notes:
      "La familia solicitó música instrumental suave y 15 minutos de silencio previo en sala antes de dar inicio al responso solemne.",
    extraLine: "Acompañamiento familiar presencial",
  },
  luna: {
    estado: "realizado",
    statusTextDetail: "Servicio Realizado",
    petName: "Luna",
    petSpec: "Felino · Común Europeo (4.2 kg)",
    caseNum: "Caso #REC-2024-086",
    serviceTitle: "Recojo y Traslado a Sede Central",
    time: "10:00 – 11:30 hrs",
    duration: "90 minutos",
    location: "Domicilio Miraflores → Sede Central",
    tutor: "Tutor: Roberto Gómez · Tel. 981 234 567",
    notes:
      "Traslado con cuna de descanso térmica y protocolo de preservación inmediata completado con firma de conformidad.",
  },
  "lucas-manto": {
    estado: "realizado",
    statusTextDetail: "Servicio Realizado",
    petName: "Lucas",
    petSpec: "Canino · Golden Retriever (32 kg)",
    caseNum: "Caso #REC-2024-089",
    serviceTitle: "Acondicionamiento y Manto",
    time: "13:40 – 15:00 hrs",
    duration: "80 minutos",
    location: "Sala de Preparación Técnica",
    tutor: "Tutora: Valeria Mendoza",
    notes:
      "Peinado de manto, toma de huellas en arcilla de memoria y colocación de pañuelo floral según solicitud.",
  },
  "mia-entrega": {
    estado: "programado",
    statusTextDetail: "Programado hoy",
    petName: "Mía",
    petSpec: "Felino · Siamés Tradicional (3.5 kg)",
    caseNum: "Caso #REC-2024-088",
    serviceTitle: "Entrega de Urna y Muestras de Memoria",
    time: "18:00 – 18:45 hrs",
    duration: "45 minutos",
    location: "Recepción Principal (Módulo de Entrega Solemne)",
    tutor: "Tutora: Patricia Alarcón",
    notes:
      "Urna de roble tallada con plaqueta grabada, certificado de cremación individual y relicario con muestra de pelaje.",
  },
  "max-recojo": {
    estado: "programado",
    statusTextDetail: "Programado para mañana",
    petName: "Max",
    petSpec: "Canino · Bóxer (28 kg)",
    caseNum: "Caso #REC-2024-091",
    serviceTitle: "Recojo Especializado en Clínica",
    time: "10:00 – 11:15 hrs",
    duration: "75 minutos",
    location: "Clínica Veterinaria San Borja → Sede Central",
    tutor: "Tutor: Dr. Ernesto Morales (Veterinario)",
    notes: "Unidad móvil asignada: Móvil 2. Llevar camilla acolchada para canino mediano/grande.",
  },
  "coco-ceremonia": {
    estado: "confirmado",
    statusTextDetail: "Confirmado para mañana",
    petName: "Coco",
    petSpec: "Canino · Poodle Toy (4 kg)",
    caseNum: "Caso #REC-2024-092",
    serviceTitle: "Ceremonia Familiar Íntima",
    time: "12:30 – 13:45 hrs",
    duration: "75 minutos",
    location: "Sala Armonía (Sede Central)",
    tutor: "Tutora: Sofía Castro · 4 asistentes",
    notes: "Se preparará altar con proyección digital de fotografías proporcionadas por la familia.",
  },
  "simon-entrega": {
    estado: "programado",
    statusTextDetail: "Programado a Domicilio",
    petName: "Simón",
    petSpec: "Felino · Persa Blanco (5 kg)",
    caseNum: "Caso #REC-2024-090",
    serviceTitle: "Entrega Solemne a Domicilio",
    time: "16:00 – 17:00 hrs",
    duration: "60 minutos",
    location: "Domicilio San Isidro (Av. Los Eucaliptos)",
    tutor: "Tutor: Andrés Paredes",
    notes: "Entrega con caja conmemorativa y ramo de flores blancas de despedida.",
  },
  "nala-manto": {
    estado: "programado",
    statusTextDetail: "Programado para Jueves",
    petName: "Nala",
    petSpec: "Canino · Pastor Alemán (34 kg)",
    caseNum: "Caso #REC-2024-094",
    serviceTitle: "Acondicionamiento y Manto",
    time: "11:30 – 13:00 hrs",
    duration: "90 minutos",
    location: "Sala de Preparación Técnica",
    tutor: "Tutor: Daniel Quispe",
    notes: "Protocolo completo de preservación estética y preparación para velatorio privado.",
  },
  "rocky-ceremonia": {
    estado: "confirmado",
    statusTextDetail: "Confirmado Jueves",
    petName: "Rocky",
    petSpec: "Canino · Mestizo (18 kg)",
    caseNum: "Caso #REC-2024-095",
    serviceTitle: "Ceremonia Íntima con Familia",
    time: "15:00 – 16:15 hrs",
    duration: "75 minutos",
    location: "Sala Serena (Sede Central)",
    tutor: "Tutora: Elena Rivas · 2 acompañantes",
    notes: "Familia solicitó lectura de carta de agradecimiento durante la ceremonia.",
  },
};

type Vista = "dia" | "3dias" | "semana";

const VISTA_INFO: Record<Vista, { dateLabel: string; stats: string }> = {
  dia: { dateLabel: "Martes, 24 de Octubre de 2025", stats: "4 servicios · 1 realizado · 1 en curso · 0 conflictos" },
  "3dias": { dateLabel: "24 – 26 de Octubre de 2025 (Mar, Mié, Jue)", stats: "9 servicios · 3 días activos · Capacidad al 65%" },
  semana: { dateLabel: "Semana del 23 al 29 de Octubre de 2025", stats: "16 servicios · Semana 43 · 100% trazabilidad" },
};

type BloqueDia =
  | { tipo: "libre"; hora: string; mensaje: string; accionLabel: string }
  | { tipo: "evento"; id: string; horaInicio: string; horaFin: string };

const TIMELINE_DIA: BloqueDia[] = [
  { tipo: "libre", hora: "09:00", mensaje: "Horario libre para coordinación o desinfección de salas", accionLabel: "+ Asignar" },
  { tipo: "evento", id: "luna", horaInicio: "10:00", horaFin: "11:30" },
  { tipo: "libre", hora: "12:00", mensaje: "Intervalo operativo de mantenimiento y sanitización", accionLabel: "+ Asignar" },
  { tipo: "evento", id: "lucas-manto", horaInicio: "13:40", horaFin: "15:00" },
  { tipo: "evento", id: "lucas-ceremonia", horaInicio: "16:30", horaFin: "17:30" },
  { tipo: "evento", id: "mia-entrega", horaInicio: "18:00", horaFin: "18:45" },
  { tipo: "libre", hora: "19:00", mensaje: "Horario libre para programación de nuevo servicio", accionLabel: "+ Agendar en 19:00" },
];

const COLUMNAS_3DIAS: { dia: string; etiqueta: string; eventos: { id: string; extra: string }[] }[] = [
  {
    dia: "Martes 24 Oct",
    etiqueta: "Hoy",
    eventos: [
      { id: "luna", extra: "Tutor: Roberto Gómez" },
      { id: "lucas-manto", extra: "Sala de Preparación Técnica" },
      { id: "lucas-ceremonia", extra: "Tutora: Valeria Mendoza · Sala Serena" },
      { id: "mia-entrega", extra: "Recepción Principal" },
    ],
  },
  {
    dia: "Miércoles 25 Oct",
    etiqueta: "Mañana",
    eventos: [
      { id: "max-recojo", extra: "Clínica San Borja → Sede Central" },
      { id: "coco-ceremonia", extra: "Tutora: Sofía Castro · Sala Armonía" },
      { id: "simon-entrega", extra: "Tutor: Andrés Paredes · San Isidro" },
    ],
  },
  {
    dia: "Jueves 26 Oct",
    etiqueta: "Pasado mañana",
    eventos: [
      { id: "nala-manto", extra: "Sala Técnica Especializada" },
      { id: "rocky-ceremonia", extra: "Tutora: Elena Rivas · Sala Serena" },
    ],
  },
];

const SEMANA: { dia: string; hoy?: boolean; resumen?: string; guardia?: boolean; chips: { hora: string; nombre: string; id: string }[] }[] = [
  { dia: "Lun 23", resumen: "2 concluidos", chips: [{ hora: "09:30", nombre: "Toby", id: "luna" }, { hora: "14:00", nombre: "Kira", id: "luna" }] },
  {
    dia: "Mar 24",
    hoy: true,
    resumen: "4 activos",
    chips: [
      { hora: "10:00", nombre: "Luna", id: "luna" },
      { hora: "16:30", nombre: "Lucas", id: "lucas-ceremonia" },
      { hora: "18:00", nombre: "Mía", id: "mia-entrega" },
    ],
  },
  { dia: "Mié 25", resumen: "3 servicios", chips: [{ hora: "10:00", nombre: "Max", id: "max-recojo" }, { hora: "12:30", nombre: "Coco", id: "coco-ceremonia" }, { hora: "16:00", nombre: "Simón", id: "simon-entrega" }] },
  { dia: "Jue 26", resumen: "2 servicios", chips: [{ hora: "11:30", nombre: "Nala", id: "nala-manto" }, { hora: "15:00", nombre: "Rocky", id: "rocky-ceremonia" }] },
  { dia: "Vie 27", resumen: "2 servicios", chips: [{ hora: "11:00", nombre: "Milo", id: "max-recojo" }, { hora: "17:00", nombre: "Thor", id: "coco-ceremonia" }] },
  { dia: "Sáb 28", resumen: "2 servicios", chips: [{ hora: "10:30", nombre: "Sasha", id: "lucas-ceremonia" }, { hora: "13:00", nombre: "Bruno", id: "mia-entrega" }] },
  { dia: "Dom 29", guardia: true, chips: [] },
];

function EstadoBadge({
  estado,
  label,
  className,
}: {
  estado: EstadoEvento;
  label?: string;
  className?: string;
}) {
  const s = ESTADO_BADGE[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label font-semibold",
        s.bg,
        s.text,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {label ?? s.label}
    </span>
  );
}

export default function AgendaPage() {
  const [vista, setVista] = useState<Vista>("dia");
  const [seleccionadoId, setSeleccionadoId] = useState("lucas-ceremonia");

  const seleccionado = EVENTOS[seleccionadoId];
  const info = VISTA_INFO[vista];

  const tabs: { id: Vista; label: string; icon: React.ComponentType<{ className?: string }> }[] = useMemo(
    () => [
      { id: "dia", label: "Día", icon: CalendarDaysIcon },
      { id: "3dias", label: "3 días", icon: Columns3Icon },
      { id: "semana", label: "Semana", icon: CalendarRangeIcon },
    ],
    []
  );

  return (
    <>
      <Breadcrumbs items={[{ label: "Módulos de Servicio" }, { label: "Agenda & Rutas" }]} />

      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">Agenda</h1>
          <p className="text-xs text-slate-500 mt-1">
            Programación horaria de servicios, ceremonias y acompañamientos del día.
          </p>
        </div>
        <Button
          className="gap-1.5 self-start lg:self-auto"
          onClick={() => notifySuccess("Abriendo formulario para programar un nuevo servicio.")}
        >
          <PlusCircleIcon className="size-4" />
          Programar Servicio
        </Button>
      </div>

      {/* Control: navegación, resumen y conmutador de vistas */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white shadow-xs border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 rounded-lg p-1">
            <button
              onClick={() => notifySuccess("Mostrando el día anterior.")}
              title="Día anterior"
              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              onClick={() => notifySuccess("Volviendo a la fecha de hoy.")}
              className="px-3 py-1 text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => notifySuccess("Mostrando el día siguiente.")}
              title="Día siguiente"
              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <CalendarCheck2Icon className="size-5 text-brand-500" />
            <span className="text-sm font-semibold text-slate-900 tracking-tight">{info.dateLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium">
            {info.stats.split(" · ").map((part, i) => (
              <span key={part} className={cn(i === 0 && "font-semibold text-slate-900")}>
                {i > 0 && <span className="mr-1.5 text-slate-300">·</span>}
                {part}
              </span>
            ))}
          </div>

          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setVista(t.id)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  vista === t.id
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/70"
                )}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Distribución principal: vistas + detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Vistas interactivas */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {vista === "dia" && (
            <div className="flex flex-col gap-1 bg-white p-5 lg:p-6 rounded-xl shadow-xs border border-slate-200">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-5 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-900">Línea de Tiempo del Turno</span>
                </div>
                <span className="text-xs font-medium text-slate-500">Jornada 09:00 - 19:00 hrs</span>
              </div>

              {TIMELINE_DIA.map((bloque) => {
                if (bloque.tipo === "libre") {
                  return (
                    <div key={bloque.hora} className="group flex items-start gap-4 min-h-[75px] py-2">
                      <div className="w-16 shrink-0 pt-0.5 text-right">
                        <span className="text-sm font-semibold text-slate-500">{bloque.hora}</span>
                      </div>
                      <div className="flex-1 min-h-[56px] rounded-lg p-4 bg-slate-50/60 border border-dashed border-slate-300 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 italic">{bloque.mensaje}</span>
                        <button
                          onClick={() => notifySuccess(`Abriendo asignación rápida para las ${bloque.hora}.`)}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded bg-white shadow-xs text-slate-500 text-xs font-semibold hover:text-brand-500 transition-all"
                        >
                          {bloque.accionLabel}
                        </button>
                      </div>
                    </div>
                  );
                }

                const ev = EVENTOS[bloque.id];
                const activo = bloque.id === "lucas-ceremonia";
                const seleccionadoActual = bloque.id === seleccionadoId;

                return (
                  <div key={bloque.id} className="flex items-start gap-4 min-h-[110px] pt-2 pb-3">
                    <div className="w-16 shrink-0 pt-1 text-right">
                      <span className={cn("text-sm font-bold", activo ? "text-brand-500" : "text-slate-900")}>
                        {bloque.horaInicio}
                      </span>
                      <span className="block text-xs text-slate-500">{bloque.horaFin}</span>
                      {activo && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 text-label font-bold uppercase tracking-wider">
                          Activo
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSeleccionadoId(bloque.id)}
                      className={cn(
                        "text-left cursor-pointer flex-1 rounded-xl p-4 shadow-xs hover:shadow-md transition-all relative",
                        activo
                          ? "bg-brand-50/60 border-2 border-brand-200"
                          : cn(
                              "bg-white border",
                              seleccionadoActual ? "border-brand-300" : "border-slate-200 hover:border-brand-200"
                            )
                      )}
                    >
                      {activo && <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-brand-500 rounded-r" />}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <EstadoBadge estado={ev.estado} />
                          <span className="text-xs text-slate-500">{ev.caseNum}</span>
                        </div>
                        {activo ? (
                          <div className="flex items-center gap-1 text-brand-500 text-xs font-semibold">
                            <span>Seleccionado para revisión</span>
                            <ArrowRightIcon className="size-3.5" />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Duración: {ev.duration}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className={cn("font-semibold", activo ? "text-lg text-slate-900" : "text-base text-slate-900")}>
                          {ev.serviceTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <PawPrintIcon className="size-4 text-brand-500" />
                            {ev.petName} ({ev.petSpec.split("· ")[1]?.split(" (")[0] ?? ev.petSpec})
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPinIcon className="size-4" />
                            {ev.location}
                          </span>
                          {ev.extraLine && (
                            <span className="flex items-center gap-1.5">
                              <UsersIcon className="size-4" />
                              {ev.extraLine}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {vista === "3dias" && (
            <div className="flex flex-col gap-4 bg-white p-5 lg:p-6 rounded-xl shadow-xs border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Columns3Icon className="size-5 text-brand-500" />
                  <span className="text-sm font-semibold text-slate-900">Planificación de 3 Días</span>
                </div>
                <span className="text-xs font-medium text-slate-500">9 servicios programados en total</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {COLUMNAS_3DIAS.map((col) => (
                  <div key={col.dia} className="flex flex-col gap-3 rounded-xl bg-slate-50/60 p-4 border border-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <span className="text-sm font-semibold text-slate-900 block">{col.dia}</span>
                        <span
                          className={cn(
                            "block text-label font-semibold uppercase tracking-wider",
                            col.etiqueta === "Hoy" ? "text-brand-500" : "text-slate-400"
                          )}
                        >
                          {col.etiqueta}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-bold",
                          col.etiqueta === "Hoy" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {col.eventos.length} servicios
                      </span>
                    </div>

                    {col.eventos.map((e) => {
                      const ev = EVENTOS[e.id];
                      const activo = e.id === seleccionadoId && vista === "3dias";
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSeleccionadoId(e.id)}
                          className={cn(
                            "text-left relative p-3.5 rounded-lg bg-white shadow-xs hover:shadow-md border transition-all",
                            activo ? "border-2 border-brand-300" : "border-slate-200 hover:border-brand-200"
                          )}
                        >
                          {activo && <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-brand-500 rounded-r" />}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={cn("text-xs font-bold", activo ? "text-brand-500" : "text-slate-900")}>
                              {ev.time.replace(" hrs", "")}
                            </span>
                            <EstadoBadge estado={ev.estado} />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-1">{ev.serviceTitle}</h4>
                          <div className="text-slate-500 text-xs flex items-center gap-1 mb-1">
                            <PawPrintIcon className="size-3.5 text-brand-500" />
                            <strong className="text-slate-700">{ev.petName}</strong> · {ev.caseNum}
                          </div>
                          <div className="text-slate-400 text-xs">{e.extra}</div>
                        </button>
                      );
                    })}

                    {col.etiqueta === "Pasado mañana" && (
                      <button
                        onClick={() => notifySuccess("Abriendo formulario para agendar el jueves.")}
                        className="mt-1 border border-dashed border-slate-300 rounded-lg p-3 text-center text-brand-500 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-white transition-colors"
                      >
                        <PlusCircleIcon className="size-4" />
                        Agendar en Jueves
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {vista === "semana" && (
            <div className="flex flex-col gap-4 bg-white p-5 lg:p-6 rounded-xl shadow-xs border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CalendarRangeIcon className="size-5 text-brand-500" />
                  <span className="text-sm font-semibold text-slate-900">Panorama Semanal (Lunes a Domingo)</span>
                </div>
                <span className="text-xs font-medium text-slate-500">16 servicios planificados</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 items-start">
                {SEMANA.map((col) => (
                  <div
                    key={col.dia}
                    className={cn(
                      "flex flex-col gap-2 p-2.5 rounded-lg border",
                      col.hoy
                        ? "bg-brand-50/60 border-2 border-brand-200"
                        : col.guardia
                          ? "bg-slate-50/30 border-dashed border-slate-300"
                          : "bg-slate-50/60 border-slate-200"
                    )}
                  >
                    <div className={cn("text-center pb-1 border-b", col.hoy ? "border-brand-200" : "border-slate-200")}>
                      <span
                        className={cn(
                          "block text-label uppercase font-semibold",
                          col.hoy ? "text-brand-500 font-bold" : col.guardia ? "text-slate-400" : "text-slate-500"
                        )}
                      >
                        {col.dia}
                        {col.hoy && " (Hoy)"}
                      </span>
                      <span className={cn("text-label font-bold", col.hoy ? "text-brand-500" : "text-slate-400")}>
                        {col.guardia ? "Guardia pasiva" : col.resumen}
                      </span>
                    </div>

                    {col.guardia ? (
                      <p className="p-3 text-center text-slate-400 text-xs italic">
                        Solo emergencias y traslados críticos
                      </p>
                    ) : (
                      col.chips.map((chip, i) => {
                        const ev = EVENTOS[chip.id];
                        const destacado = col.hoy && i === 1;
                        return (
                          <button
                            key={chip.hora + chip.nombre}
                            onClick={() => setSeleccionadoId(chip.id)}
                            className={cn(
                              "text-left p-2 rounded bg-white border transition-all",
                              destacado ? "border-2 border-brand-500" : "border-slate-200 hover:border-brand-200"
                            )}
                          >
                            <div className={cn("text-label font-bold", destacado ? "text-brand-500" : "text-slate-900")}>
                              {chip.hora} · {chip.nombre}
                            </div>
                            <div
                              className={cn(
                                "text-label font-semibold flex items-center gap-1",
                                ESTADO_BADGE[ev.estado].text
                              )}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full", ESTADO_BADGE[ev.estado].dot)} />
                              {ESTADO_BADGE[ev.estado].label}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel de detalle del evento seleccionado */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20">
          <div className="flex flex-col rounded-xl bg-white p-5 lg:p-6 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-900">Detalle del Servicio en Agenda</span>
              <EstadoBadge
                estado={seleccionado.estado}
                label={seleccionado.statusTextDetail}
                className="whitespace-nowrap"
              />
            </div>

            <div className="flex items-start justify-between gap-3 p-4 rounded-lg bg-slate-50 mb-4 border border-slate-200 flex-wrap">
              <div className="flex flex-col">
                <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
                  Mascota & Expediente
                </span>
                <span className="text-lg font-bold text-slate-900 mt-0.5">{seleccionado.petName}</span>
                <span className="text-xs text-slate-500">{seleccionado.petSpec}</span>
              </div>
              <Link
                to="/casos"
                className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline font-semibold mt-1"
              >
                {seleccionado.caseNum}
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Tipo de Servicio</span>
                <span className="text-base font-semibold text-slate-900 mt-0.5">{seleccionado.serviceTitle}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Horario Programado</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5">{seleccionado.time}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Duración Estimada</span>
                  <span className="text-sm font-semibold text-slate-900 mt-0.5">{seleccionado.duration}</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Espacio Asignado</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <DoorOpenIcon className="size-4 text-brand-500" />
                  <span className="text-sm text-slate-900 font-medium">{seleccionado.location}</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Asistencia Familiar</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <UserIcon className="size-4 text-slate-500" />
                  <span className="text-sm text-slate-900">{seleccionado.tutor}</span>
                </div>
              </div>

              <div className="flex flex-col p-3.5 rounded-lg bg-slate-50/70 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <InfoIcon className="size-4" />
                  <span className="text-xs font-semibold text-slate-900">Indicaciones para el Turno</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{seleccionado.notes}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-200">
              <Button
                variant="operational"
                className="w-full h-11"
                onClick={() =>
                  notifySuccess(`"${seleccionado.serviceTitle}" fue marcado como realizado.`)
                }
              >
                <CheckCircle2Icon className="size-5" />
                Marcar como Realizado
              </Button>
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => notifySuccess("Abriendo formulario de reprogramación de horario.")}
              >
                <ClockIcon className="size-4 text-slate-500" />
                Reprogramar Horario
              </Button>
              <Link
                to="/casos"
                className="text-center text-xs text-brand-500 hover:underline font-semibold mt-1"
              >
                Ver caso completo en Mesa de Trabajo →
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-white text-slate-500 border border-slate-200 shadow-xs">
            <LifeBuoyIcon className="size-5 text-brand-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm text-slate-900 font-semibold leading-tight">Guardia de Sala Serena</span>
              <span className="text-xs text-slate-500">Coordinador de turno: Carlos Vega (Anexo 104)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
