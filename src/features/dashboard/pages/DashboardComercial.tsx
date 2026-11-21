import { Link } from "react-router-dom";
import { MessageCircleIcon, PhoneIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { enlaceWhatsApp, fechaCorta } from "@/features/casos/utils/casos";
import { cargarDashboardComercial, COLOR_ESTADO, ETIQUETA_ESTADO, type PuntoCrm, type RutaAvance } from "../comercial";
import { MapaEstados } from "../components/MapaEstados";

/** Dashboard del comercial (propuesta "Mi ruta"): qué visitar, qué ya visitó y cómo va. */
export function DashboardComercial() {
  const recurso = useRecurso(cargarDashboardComercial);
  const d = recurso.data;

  if (recurso.error) return <p className="text-sm text-red-600">{recurso.error}</p>;
  if (!d) return <p className="text-sm text-slate-500">Cargando…</p>;

  const avance = d.total ? Math.round((d.visitadas / d.total) * 100) : 0;
  const alertas = [
    d.sin_ubicacion > 0 && `${d.sin_ubicacion} sin ubicación en el mapa`,
    d.sin_seguimiento > 0 && `${d.sin_seguimiento} visitadas hace más de 30 días sin seguimiento`,
    d.ya_no_existe > 0 && `${d.ya_no_existe} ya no existen`,
  ].filter(Boolean) as string[];

  return (
    <div className="dashboard-root flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />
      <ModuleHeader title="Mi ruta" description="Qué visitar, qué ya visitaste y cómo va cada ruta." />

      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Indicador titulo="Por visitar" valor={d.pendientes} pie={`de ${d.total} veterinarias`} />
        <Indicador titulo="Visitadas" valor={d.visitadas} pie={`${avance}% del total`} />
        <Indicador titulo="Esta semana" valor={d.visitas_semana} pie="visitas" />
        <Indicador titulo="Este mes" valor={d.visitas_mes} pie="visitas" />
        <Indicador titulo="Interesadas" valor={d.interesadas} pie={`${d.embudo.info_entregada} con información`} />
        <Indicador titulo="Aliadas" valor={d.aliadas} pie="con convenio" />
      </section>

      {alertas.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {alertas.map((texto) => (
            <span key={texto} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              {texto}
            </span>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Tarjeta className="lg:col-span-2" titulo="Mapa de veterinarias" subtitulo="El color muestra la etapa de cada una">
          <MapaEstados puntos={d.mapa} className="h-[420px]" />
          <Leyenda />
        </Tarjeta>

        <div className="flex flex-col gap-5">
          <Tarjeta titulo="Avance por ruta" subtitulo="Visitadas sobre el total de cada ruta">
            {d.rutas.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no hay veterinarias asignadas a una ruta.</p>
            ) : (
              <div className="flex flex-col gap-3">{d.rutas.map((r) => <BarraRuta key={r.id} ruta={r} />)}</div>
            )}
          </Tarjeta>

          <Tarjeta titulo="Embudo" subtitulo="Cuántas llegan a cada paso">
            <Embudo d={d} />
          </Tarjeta>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Tarjeta titulo="Próximas visitas" subtitulo="Por visitar, en el orden de la ruta">
          {d.proximas.length === 0 ? (
            <p className="text-sm text-slate-500">No quedan veterinarias por visitar.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {d.proximas.map((p) => (
                <FilaVeterinaria key={p.id} punto={p} />
              ))}
            </ul>
          )}
          <Link to="/crm/veterinarias" className="mt-3 inline-block text-xs font-semibold text-brand-600 hover:underline">
            Ver todas en CRM
          </Link>
        </Tarjeta>

        <Tarjeta titulo="Visitas recientes" subtitulo="Las últimas que registraste">
          {d.recientes.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay visitas registradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {d.recientes.map((p) => (
                <FilaVeterinaria key={p.id} punto={p} mostrarFecha />
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}

function Indicador({ titulo, valor, pie }: { titulo: string; valor: number; pie: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{valor.toLocaleString("es-PE")}</p>
      <p className="mt-0.5 text-xs text-slate-400">{pie}</p>
    </div>
  );
}

function Tarjeta({
  titulo,
  subtitulo,
  className,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-3", className)}>
      <header>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h2>
        {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
      </header>
      {children}
    </section>
  );
}

function Leyenda() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
      {(Object.keys(ETIQUETA_ESTADO) as (keyof typeof ETIQUETA_ESTADO)[]).map((estado) => (
        <span key={estado} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_ESTADO[estado] }} aria-hidden />
          {ETIQUETA_ESTADO[estado]}
        </span>
      ))}
    </div>
  );
}

function BarraRuta({ ruta }: { ruta: RutaAvance }) {
  const pct = ruta.total ? (ruta.visitadas / ruta.total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          <span className="mr-1.5 rounded px-1.5 py-0.5 text-[11px] text-white" style={{ background: ruta.color ?? "var(--serie-1)" }}>
            {ruta.codigo}
          </span>
          {ruta.nombre}
        </span>
        <span className="tabular-nums text-slate-500">
          {ruta.visitadas} de {ruta.total} · faltan {ruta.pendientes}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ruta.color ?? "var(--serie-1)" }} />
      </div>
    </div>
  );
}

function Embudo({ d }: { d: { embudo: { visitadas: number; info_entregada: number; interesadas: number; aliadas: number } } }) {
  const pasos = [
    { etiqueta: "Visitadas", valor: d.embudo.visitadas },
    { etiqueta: "Información entregada", valor: d.embudo.info_entregada },
    { etiqueta: "Interesadas", valor: d.embudo.interesadas },
    { etiqueta: "Aliadas", valor: d.embudo.aliadas },
  ];
  const base = Math.max(1, d.embudo.visitadas);
  return (
    <div className="flex flex-col gap-3">
      {pasos.map((paso, i) => {
        const anterior = i === 0 ? null : pasos[i - 1].valor;
        return (
          <div key={paso.etiqueta}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300">{paso.etiqueta}</span>
              <span className="tabular-nums text-slate-500">
                {paso.valor}
                {anterior ? ` · ${Math.round((paso.valor / anterior) * 100)}% del paso anterior` : ""}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${(paso.valor / base) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilaVeterinaria({ punto, mostrarFecha = false }: { punto: PuntoCrm; mostrarFecha?: boolean }) {
  return (
    <li className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{punto.nombre}</p>
        <p className="truncate text-xs text-slate-500">
          {[punto.distrito, punto.direccion].filter(Boolean).join(" · ") || "Sin dirección"}
          {mostrarFecha && punto.visitada_at ? ` · visitada el ${fechaCorta(punto.visitada_at)}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs">
        {punto.ruta_codigo && (
          <span className="rounded px-1.5 py-0.5 font-semibold text-white" style={{ background: punto.ruta_color ?? "var(--serie-1)" }}>
            {punto.ruta_codigo}
          </span>
        )}
        {punto.telefono && (
          <>
            <a href={`tel:${punto.telefono.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-brand-500 dark:text-slate-300">
              <PhoneIcon className="size-3.5" aria-hidden />
              {punto.telefono}
            </a>
            <a
              href={enlaceWhatsApp(punto.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escribir por WhatsApp"
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              <MessageCircleIcon className="size-3.5" aria-hidden />
              WhatsApp
            </a>
          </>
        )}
      </div>
    </li>
  );
}
