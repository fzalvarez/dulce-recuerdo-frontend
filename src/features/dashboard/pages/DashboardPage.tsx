import { useMemo } from "react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { cn } from "@/lib/utils";
import { hoyISO, MODALIDAD_LABEL, SERVICIO_LABEL, soles } from "../../casos/legacy/casos";
import type { Caso, EstadoMostrado } from "../../casos/legacy/types";
import type { PlanId } from "../../reportes/types";
import { calcularDashboard, type Mensaje, type Resumen } from "../utils/dashboard";
import { BarraSegmentada, Dona, Leyenda, LineasDiarias, type Parte } from "../components/Graficos";
import "../dashboard.css";

const NIVEL_CLASE: Record<Mensaje["nivel"], string> = {
  critico: "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
  atencion: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  info: "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20",
};

const NIVEL_TEXTO: Record<Mensaje["nivel"], string> = {
  critico: "Urgente",
  atencion: "Revisar",
  info: "Para saber",
};

const PLAN_NOMBRE: Record<PlanId, string> = {
  clasico: "Clásico",
  paz: "Paz",
  eco: "Eco",
  "sin-clasificar": "Sin clasificar",
};

const PLAN_COLOR: Record<PlanId, string> = {
  clasico: "var(--serie-1)",
  paz: "var(--serie-2)",
  eco: "var(--serie-3)",
  "sin-clasificar": "var(--baseline)",
};

const ESTADO_PIPELINE: { estado: EstadoMostrado; etiqueta: string; color: string }[] = [
  { estado: "EN_CONVERSACION", etiqueta: "En conversación", color: "var(--baseline)" },
  { estado: "AGENDADO", etiqueta: "Agendado", color: "var(--serie-1)" },
  { estado: "REALIZADO", etiqueta: "Realizado, falta entregar", color: "var(--serie-3)" },
  { estado: "ENTREGADO", etiqueta: "Entregado", color: "var(--ink-2)" },
];

function fechaLarga(iso: string): string {
  const texto = new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function TarjetaPeriodo({
  titulo,
  subtitulo,
  resumen,
  previo,
  comparadoCon,
  extra,
}: {
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
            <span className={cn("font-semibold", cambio.sube === true && "text-emerald-700", cambio.sube === false && "text-red-600")}>
              {cambio.texto}
            </span>
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

function TarjetaHoy({ agenda, hoy }: { agenda: Caso[]; hoy: string }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
      <header>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Hoy</h2>
        <p className="text-xs text-slate-500">{fechaLarga(hoy)}</p>
      </header>

      <div>
        <p className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">{agenda.length}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {agenda.length === 1 ? "servicio agendado" : "servicios agendados"}
        </p>
      </div>

      {agenda.length === 0 ? (
        <p className="text-sm text-slate-500">No hay servicios agendados para hoy.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {agenda.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{c.horaServicio}</span>
              <span className="text-sm text-slate-700 dark:text-slate-300 min-w-0 truncate">
                {c.mascota} · {SERVICIO_LABEL[c.servicio]} · {MODALIDAD_LABEL[c.modalidad]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500 mt-auto">
        Las cremaciones de hoy se cuentan al cierre del día. Los datos de Reportes llegan hasta el 7 de noviembre.
      </p>
    </section>
  );
}

export default function DashboardPage() {
  const datos = useMemo(() => calcularDashboard(hoyISO()), []);
  const { hoy, mes, semana, pipeline, planesMes, mensajes, dia } = datos;
  const mesLabel = new Date(`${hoy}T00:00:00`).toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const enCurso = pipeline.EN_CONVERSACION + pipeline.AGENDADO + pipeline.REALIZADO;

  const partesPlanes: Parte[] = planesMes.map((p) => ({
    etiqueta: PLAN_NOMBRE[p.plan],
    valor: p.cremaciones,
    color: PLAN_COLOR[p.plan],
  }));
  const totalPlanes = planesMes.reduce((acc, p) => acc + p.cremaciones, 0);
  const partesPipeline: Parte[] = ESTADO_PIPELINE.map((e) => ({
    etiqueta: e.etiqueta,
    valor: pipeline[e.estado],
    color: e.color,
  }));

  return (
    <div className="dashboard-root flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      <ModuleHeader
        title="Estado de hoy"
        description={`Hoy, la semana en curso y el mes en curso, todo en una vista.`}
      />

      {/* Hoy, semana y mes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TarjetaHoy agenda={dia.agenda} hoy={hoy} />
        <TarjetaPeriodo
          titulo="Semana en curso"
          subtitulo={`${fechaCorta(semana.ini)} – ${fechaCorta(semana.fin)}`}
          resumen={semana.actual}
          previo={semana.previa.cremaciones}
          comparadoCon={`Semana anterior completa: ${semana.previa.cremaciones} cremaciones.`}
        />
        <TarjetaPeriodo
          titulo="Este mes"
          subtitulo={`${mesLabel}: del 1 al ${datos.hoyDia}`}
          resumen={mes.actual}
          previo={mes.previo.cremaciones}
          comparadoCon={`Mismo tramo del mes anterior: ${mes.previo.cremaciones} cremaciones.`}
          extra={`A este ritmo, unas ${mes.proyeccion} cremaciones al cerrar el mes (estimado).`}
        />
      </div>

      {/* Alertas y pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
          <header>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Mensajes y alertas</h2>
            <p className="text-xs text-slate-500">Lo que conviene revisar hoy, con lo más urgente arriba.</p>
          </header>
          {mensajes.length === 0 ? (
            <p className="text-sm text-slate-500">Sin alertas por ahora.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {mensajes.map((m) => (
                <li key={`${m.titulo}-${m.detalle}`} className="flex items-start gap-3">
                  <span className={cn("px-2 py-0.5 rounded-full border text-label font-semibold whitespace-nowrap mt-0.5", NIVEL_CLASE[m.nivel])}>
                    {NIVEL_TEXTO[m.nivel]}
                  </span>
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
            <p className="text-xs text-slate-500">
              {enCurso} casos en curso. Cada tramo muestra en qué etapa están.
            </p>
          </header>
          <BarraSegmentada partes={partesPipeline} />
          <Leyenda partes={partesPipeline} />
          <p className="text-xs text-slate-500 mt-auto">
            Un caso pasa a abandonado solo cuando lleva 7 días sin mensajes y sin pagos.
          </p>
        </section>
      </div>

      {/* Tendencia y planes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
          <header>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Cremaciones por día</h2>
            <p className="text-xs text-slate-500">
              Cada punto es un día del mes. La línea azul es este mes; la naranja, el mismo tramo del mes anterior.
            </p>
          </header>
          <LineasDiarias
            actual={mes.serie.actual}
            previo={mes.serie.previo}
            etiquetaActual={`Este mes (1–${datos.hoyDia})`}
            etiquetaPrevio="Mes anterior, mismo tramo"
          />
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
          <header>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Planes del mes</h2>
            <p className="text-xs text-slate-500">Qué planes se han vendido en lo que va del mes.</p>
          </header>
          <div className="flex items-center gap-5">
            <Dona partes={partesPlanes} centro={String(totalPlanes)} subcentro="ventas" />
            <div className="min-w-0 flex-1">
              <Leyenda partes={partesPlanes} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
