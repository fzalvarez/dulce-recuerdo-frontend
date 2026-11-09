import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { cn } from "@/lib/utils";
import api from "@/shared/lib/axios";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { soles } from "@/features/casos/utils/casos";
import { BarraSegmentada, Dona, Leyenda, LineasDiarias, type Parte } from "../components/Graficos";
import "../dashboard.css";

type Nivel = "CRITICO" | "ATENCION" | "INFO";

interface Resumen {
  desde: string;
  hasta: string;
  cremaciones: number;
  particulares: number;
  veterinarias: number;
  cobrado: string;
}

interface Dashboard {
  hoy: string;
  dias_del_mes: number;
  agenda: { agenda_id: string; inicio: string; mascota: string; tutor: string; tipo_ubicacion: string; distrito: string | null; estado: string }[];
  semana_actual: Resumen;
  semana_previa: Resumen;
  mes: { actual: Resumen; previo: Resumen; proyeccion: number; serie_actual: number[]; serie_previa: number[] };
  pipeline: { agendados: number; por_entregar: number; entregados_mes: number; cancelados_mes: number };
  planes_mes: { plan: string; cremaciones: number }[];
  mensajes: { nivel: Nivel; titulo: string; detalle: string }[];
}

const NIVEL_CLASE: Record<Nivel, string> = {
  CRITICO: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
  ATENCION: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  INFO: "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20",
};

const NIVEL_TEXTO: Record<Nivel, string> = { CRITICO: "Urgente", ATENCION: "Revisar", INFO: "Para saber" };

/** Los tres planes más vendidos con color propio; el resto se agrupa en "Otros". */
const COLORES_PLAN = ["var(--serie-1)", "var(--serie-2)", "var(--serie-3)"];

function fechaLarga(iso: string): string {
  const texto = new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function fechaCorta(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

function cambioTexto(actual: number, previo: number): { texto: string; sube: boolean | null } {
  if (!previo) return { texto: "sin período anterior para comparar", sube: null };
  const pct = Math.round(((actual - previo) / previo) * 100);
  if (pct === 0) return { texto: "igual que el período anterior", sube: null };
  return { texto: `${pct > 0 ? "+" : ""}${pct}% frente al período anterior`, sube: pct > 0 };
}

function partesCanal(r: Resumen): Parte[] {
  return [
    { etiqueta: "Particulares", valor: r.particulares, color: "var(--serie-1)" },
    { etiqueta: "Veterinarias aliadas", valor: r.veterinarias, color: "var(--serie-2)" },
  ];
}

function TarjetaPeriodo({ titulo, subtitulo, resumen, previo, comparadoCon, extra }: {
  titulo: string;
  subtitulo: string;
  resumen: Resumen;
  previo: number;
  comparadoCon: string;
  extra?: string;
}) {
  const cambio = cambioTexto(resumen.cremaciones, previo);
  const partes = partesCanal(resumen);
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
      <header>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{titulo}</h2>
        <p className="text-xs text-slate-500">{subtitulo}</p>
      </header>
      <div className="flex items-center gap-5">
        <Dona partes={partes} centro={String(resumen.cremaciones)} subcentro="cremaciones" />
        <div className="flex flex-col gap-3 min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className={cn("font-semibold", cambio.sube === true && "text-emerald-700", cambio.sube === false && "text-red-600")}>{cambio.texto}</span>
            <span className="block text-xs text-slate-500">{comparadoCon}</span>
          </p>
          <div>
            <p className="text-label font-semibold uppercase tracking-wider text-slate-500">Cobrado</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{soles(resumen.cobrado)}</p>
          </div>
          {extra && <p className="text-xs text-slate-500">{extra}</p>}
        </div>
      </div>
      <div className="border-t border-slate-100 dark:border-white/10 pt-3">
        <Leyenda partes={partes} />
      </div>
    </section>
  );
}

function TarjetaHoy({ datos }: { datos: Dashboard }) {
  const agenda = datos.agenda;
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
      <header>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Hoy</h2>
        <p className="text-xs text-slate-500">{fechaLarga(datos.hoy)}</p>
      </header>
      <div>
        <p className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">{agenda.length}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{agenda.length === 1 ? "servicio en agenda" : "servicios en agenda"}</p>
      </div>
      {agenda.length === 0 ? (
        <p className="text-sm text-slate-500">No hay servicios agendados para hoy.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {agenda.map((a) => (
            <li key={a.agenda_id} className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{a.inicio.slice(11, 16)}</span>
              <span className="text-sm text-slate-700 dark:text-slate-300 min-w-0 truncate">
                {a.mascota} · {a.tutor} · {a.tipo_ubicacion === "DOMICILIO" ? `Domicilio${a.distrito ? ` (${a.distrito})` : ""}` : "En local"}
                {a.estado === "REALIZADA" ? " · realizado" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const cargar = () => api.get<Dashboard>("/dashboard").then((r) => r.data);

/** Estado del día, la semana y el mes, calculado en el backend (spec reportes §4.4). */
export default function DashboardPage() {
  const recurso = useRecurso(cargar);
  const datos = recurso.data;

  if (recurso.error) return <p className="text-sm text-red-600">{recurso.error}</p>;
  if (!datos) return <p className="text-sm text-slate-500">Cargando…</p>;

  const { mes, pipeline } = datos;
  const hoyDia = Number(datos.hoy.slice(8, 10));
  const mesLabel = new Date(`${datos.hoy}T00:00:00`).toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const enCurso = pipeline.agendados + pipeline.por_entregar;

  const top = datos.planes_mes.slice(0, 3);
  const otros = datos.planes_mes.slice(3).reduce((acc, p) => acc + p.cremaciones, 0);
  const partesPlanes: Parte[] = [
    ...top.map((p, i) => ({ etiqueta: p.plan, valor: p.cremaciones, color: COLORES_PLAN[i] })),
    ...(otros > 0 ? [{ etiqueta: "Otros", valor: otros, color: "var(--baseline)" }] : []),
  ];
  const totalPlanes = datos.planes_mes.reduce((acc, p) => acc + p.cremaciones, 0);
  const partesPipeline: Parte[] = [
    { etiqueta: "Agendados", valor: pipeline.agendados, color: "var(--serie-1)" },
    { etiqueta: "Realizados, falta entregar", valor: pipeline.por_entregar, color: "var(--serie-3)" },
  ];

  return (
    <div className="dashboard-root flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />
      <ModuleHeader title="Estado de hoy" description="Hoy, la semana en curso y el mes en curso, todo en una vista." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TarjetaHoy datos={datos} />
        <TarjetaPeriodo
          titulo="Semana en curso"
          subtitulo={`${fechaCorta(datos.semana_actual.desde)} – ${fechaCorta(datos.semana_actual.hasta)}`}
          resumen={datos.semana_actual}
          previo={datos.semana_previa.cremaciones}
          comparadoCon={`Semana anterior completa: ${datos.semana_previa.cremaciones} cremaciones.`}
        />
        <TarjetaPeriodo
          titulo="Este mes"
          subtitulo={`${mesLabel}: del 1 al ${hoyDia}`}
          resumen={mes.actual}
          previo={mes.previo.cremaciones}
          comparadoCon={`Mismo tramo del mes anterior: ${mes.previo.cremaciones} cremaciones.`}
          extra={`A este ritmo, unas ${mes.proyeccion} cremaciones al cerrar el mes (estimado).`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
          <header>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Mensajes y alertas</h2>
            <p className="text-xs text-slate-500">Lo que conviene revisar hoy, con lo más urgente arriba.</p>
          </header>
          {datos.mensajes.length === 0 ? (
            <p className="text-sm text-slate-500">Sin alertas por ahora.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {datos.mensajes.map((m) => (
                <li key={`${m.titulo}-${m.detalle}`} className="flex items-start gap-3">
                  <span className={cn("px-2 py-0.5 rounded-full border text-label font-semibold whitespace-nowrap mt-0.5", NIVEL_CLASE[m.nivel])}>{NIVEL_TEXTO[m.nivel]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.titulo}</p>
                    <p className="text-xs text-slate-500">{m.detalle}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
          <header>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Casos abiertos</h2>
            <p className="text-xs text-slate-500">{enCurso} casos en curso, por etapa.</p>
          </header>
          <BarraSegmentada partes={partesPipeline} />
          <Leyenda partes={partesPipeline} />
          <p className="text-xs text-slate-500 mt-auto">
            Este mes: {pipeline.entregados_mes} entregados y {pipeline.cancelados_mes} cancelados.
          </p>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
          <header>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Cremaciones por día</h2>
            <p className="text-xs text-slate-500">Cada punto es un día del mes. Azul: este mes; naranja: el mismo tramo del mes anterior.</p>
          </header>
          <LineasDiarias
            actual={mes.serie_actual}
            previo={mes.serie_previa}
            etiquetaActual={`Este mes (1–${hoyDia})`}
            etiquetaPrevio="Mes anterior, mismo tramo"
          />
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
          <header>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Planes del mes</h2>
            <p className="text-xs text-slate-500">Qué planes se han realizado en lo que va del mes.</p>
          </header>
          <div className="flex items-center gap-5">
            <Dona partes={partesPlanes} centro={String(totalPlanes)} subcentro="servicios" />
            <div className="min-w-0 flex-1">
              <Leyenda partes={partesPlanes} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
