import { useState } from "react";
import { ExternalLinkIcon, FilterXIcon, MapPinIcon, PencilIcon, PlusCircleIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { ColumnaOrdenable, Paginacion } from "@/shared/components/common/Tabla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { useTabla } from "@/shared/hooks/useTabla";
import { ejecutar } from "@/shared/utils/ejecutar";
import { cn } from "@/lib/utils";
import { Modal } from "@/features/casos/components/Dialogos";
import { DISTRITOS_CRM, eliminar, listar, TIPOS, type CrmVeterinaria, type Prioridad } from "../api";
import { CrmVeterinariaForm } from "../components/CrmVeterinariaForm";
import { MapaChico } from "../components/MapaChico";
import { formatoTelefono, nombreTipo, resumenHorario } from "../utils/formato";

const TODOS = "todos";
const VACIO = "vacio";

const PRIORIDAD: Record<Prioridad, { label: string; clase: string; rango: number }> = {
  ALTA: { label: "Alta", clase: "bg-red-100 text-red-700", rango: 1 },
  MEDIA: { label: "Media", clase: "bg-amber-100 text-amber-700", rango: 2 },
  BAJA: { label: "Baja", clase: "bg-slate-100 text-slate-600", rango: 3 },
};

const enlaceWeb = (web: string) => (/^https?:\/\//i.test(web) ? web : `https://${web}`);

type Filtros = { distrito: string; ruta: string; tipo: string; prioridad: string; urgencias: string; ubicacion: string };
const SIN_FILTROS: Filtros = { distrito: TODOS, ruta: TODOS, tipo: TODOS, prioridad: TODOS, urgencias: TODOS, ubicacion: TODOS };

/** Valor de un campo para filtrar: lo vacío se compara como VACIO. */
const coincide = (filtro: string, valor: string | null | undefined) => filtro === TODOS || filtro === (valor || VACIO);

function aplicar(v: CrmVeterinaria, f: Filtros): boolean {
  return (
    coincide(f.distrito, v.distrito) &&
    coincide(f.ruta, v.ruta) &&
    coincide(f.tipo, v.tipo) &&
    coincide(f.prioridad, v.prioridad) &&
    coincide(f.urgencias, v.urgencias_24h == null ? null : v.urgencias_24h ? "si" : "no") &&
    coincide(f.ubicacion, v.latitud != null ? "con" : "sin")
  );
}

function Filtro({
  label,
  value,
  onChange,
  opciones,
  ancho = "w-40",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opciones: { value: string; label: string }[];
  ancho?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={cn("h-9 bg-white", ancho, value !== TODOS && "border-brand-500 text-brand-700")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{label}: todos</SelectItem>
        {opciones.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** CRM › Veterinarias: la lista que el comercial visita, ordenada por ruta (spec crm-veterinarias). */
export default function CrmVeterinariasPage() {
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  const recurso = useRecurso(() => listar(q), [q]);
  const [editando, setEditando] = useState<CrmVeterinaria | "nuevo" | null>(null);
  const [borrando, setBorrando] = useState<CrmVeterinaria | null>(null);
  const [enMapa, setEnMapa] = useState<CrmVeterinaria | null>(null);

  const todas = recurso.data ?? [];
  const filtradas = todas.filter((v) => aplicar(v, filtros));
  const tabla = useTabla(filtradas, {
    codigo: (v) => v.codigo,
    ruta: (v) => (v.ruta ? `${v.ruta}-${String(v.ruta_orden ?? 0).padStart(3, "0")}` : null),
    nombre: (v) => v.nombre,
    distrito: (v) => v.distrito,
    urgencias: (v) => (v.urgencias_24h == null ? null : v.urgencias_24h ? 0 : 1),
    prioridad: (v) => (v.prioridad ? PRIORIDAD[v.prioridad].rango : null),
  });
  const columna = (id: Parameters<typeof tabla.alternar>[0], titulo: string, className?: string) => (
    <ColumnaOrdenable
      activa={tabla.orden?.columna === id}
      direccion={tabla.orden?.direccion}
      onClick={() => tabla.alternar(id)}
      className={className}
    >
      {titulo}
    </ColumnaOrdenable>
  );

  const presentes = (leer: (v: CrmVeterinaria) => string | null) => [...new Set(todas.map(leer).filter((x): x is string => !!x))];
  const distritos = DISTRITOS_CRM.filter((d) => presentes((v) => v.distrito).includes(d));
  const rutas = presentes((v) => v.ruta).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const filtrar = (k: keyof Filtros) => (valor: string) => {
    setFiltros((f) => ({ ...f, [k]: valor }));
    tabla.setPagina(1);
  };
  const hayFiltros = Object.values(filtros).some((v) => v !== TODOS);

  const borrar = async () => {
    if (!borrando) return;
    const ok = await ejecutar(() => eliminar(borrando.id), "Veterinaria eliminada.", "No se pudo eliminar la veterinaria.");
    setBorrando(null);
    if (ok) recurso.recargar();
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "CRM" }, { label: "Veterinarias" }]} />
      <ModuleHeader
        title="Veterinarias a visitar"
        description="Ordenadas por ruta y distrito. Haz clic en un encabezado para ordenar por esa columna."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nuevo")}>
            <PlusCircleIcon className="size-4" />
            Nueva veterinaria
          </Button>
        }
      />

      <div className="flex flex-col gap-2">
        <form
          className="relative w-full md:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(texto.trim());
          }}
        >
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input className="pl-9" placeholder="Código, nombre, RUC, teléfono, dirección o distrito (Enter)" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Filtro label="Distrito" value={filtros.distrito} onChange={filtrar("distrito")} ancho="w-48" opciones={distritos.map((d) => ({ value: d, label: d }))} />
          <Filtro
            label="Ruta"
            value={filtros.ruta}
            onChange={filtrar("ruta")}
            ancho="w-32"
            opciones={[...rutas.map((r) => ({ value: r, label: r })), { value: VACIO, label: "Sin ruta" }]}
          />
          <Filtro
            label="Tipo"
            value={filtros.tipo}
            onChange={filtrar("tipo")}
            ancho="w-44"
            opciones={[...TIPOS.map((t) => ({ value: t.value, label: t.label })), { value: VACIO, label: "Sin definir" }]}
          />
          <Filtro
            label="Prioridad"
            value={filtros.prioridad}
            onChange={filtrar("prioridad")}
            opciones={[
              { value: "ALTA", label: "Alta" },
              { value: "MEDIA", label: "Media" },
              { value: "BAJA", label: "Baja" },
              { value: VACIO, label: "Sin prioridad" },
            ]}
          />
          <Filtro
            label="24H"
            value={filtros.urgencias}
            onChange={filtrar("urgencias")}
            ancho="w-32"
            opciones={[
              { value: "si", label: "24H: sí" },
              { value: "no", label: "24H: no" },
              { value: VACIO, label: "24H: sin dato" },
            ]}
          />
          <Filtro
            label="Ubicación"
            value={filtros.ubicacion}
            onChange={filtrar("ubicacion")}
            ancho="w-44"
            opciones={[
              { value: "con", label: "Con ubicación" },
              { value: "sin", label: "Sin ubicación" },
            ]}
          />
          {hayFiltros && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500" onClick={() => setFiltros(SIN_FILTROS)}>
              <FilterXIcon className="size-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-240">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                {columna("codigo", "Código")}
                {columna("ruta", "Ruta")}
                {columna("nombre", "Veterinaria")}
                {columna("distrito", "Distrito / Dirección")}
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Horario</th>
                {columna("urgencias", "24H")}
                {columna("prioridad", "Prioridad")}
                <th className="px-4 py-3 font-semibold">Estado del dato</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {tabla.visibles.map((v) => (
                <tr key={v.id} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{v.codigo}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.ruta ? (
                      <span className="font-semibold text-brand-600">
                        {v.ruta}
                        <span className="ml-1 text-xs font-normal text-slate-500">· {v.ruta_orden}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {v.tipo && <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{nombreTipo(v.tipo)}</div>}
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                      {v.nombre}
                      {v.web && (
                        <a href={enlaceWeb(v.web)} target="_blank" rel="noreferrer" title={v.web} className="text-slate-400 hover:text-brand-500">
                          <ExternalLinkIcon className="size-3.5" />
                        </a>
                      )}
                    </div>
                    {(v.razon_social || v.ruc) && (
                      <div className="text-xs text-slate-600">{[v.razon_social, v.ruc && `RUC ${v.ruc}`].filter(Boolean).join(" · ")}</div>
                    )}
                    {v.contacto && <div className="text-xs text-slate-600">Contacto: {v.contacto}</div>}
                    {v.perfil && <div className="text-xs text-slate-500 line-clamp-2">{v.perfil}</div>}
                    {v.fuente && (
                      <div className="max-w-65 truncate text-[11px] text-slate-400" title={v.fuente}>
                        Fuente: {v.fuente}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-1.5">
                      <div className="min-w-0">
                        <div>{v.distrito ?? "—"}</div>
                        {v.direccion && <div className="text-xs text-slate-500">{v.direccion}</div>}
                      </div>
                      {v.latitud != null && v.longitud != null && (
                        <button type="button" title="Ver en el mapa" className="mt-0.5 text-brand-500 hover:text-brand-700" onClick={() => setEnMapa(v)}>
                          <MapPinIcon className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.telefono || v.telefono2
                      ? [v.telefono, v.telefono2].filter(Boolean).map((t) => (
                          <a key={t} href={`tel:${t}`} className="block hover:text-brand-500">
                            {formatoTelefono(t)}
                          </a>
                        ))
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-50">{resumenHorario(v.horario) ?? <span className="text-slate-400">Sin publicar</span>}</td>
                  <td className="px-4 py-3 text-xs">{v.urgencias_24h == null ? "—" : v.urgencias_24h ? "Sí" : "No"}</td>
                  <td className="px-4 py-3">
                    {v.prioridad ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORIDAD[v.prioridad].clase)}>
                        {PRIORIDAD[v.prioridad].label}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-55">
                    <span className="line-clamp-3">{v.estado_dato ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => setEditando(v)}>
                        <PencilIcon className="size-3.5" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Eliminar" className="text-slate-400 hover:text-red-600" onClick={() => setBorrando(v)}>
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {recurso.error && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-red-600">{recurso.error}</td>
                </tr>
              )}
              {!recurso.cargando && !recurso.error && tabla.total === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-slate-400">
                    {hayFiltros ? "Ninguna veterinaria cumple los filtros." : "Sin veterinarias."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacion
          pagina={tabla.pagina}
          totalPaginas={tabla.totalPaginas}
          total={tabla.total}
          tamano={tabla.tamano}
          onPagina={tabla.setPagina}
          onTamano={tabla.setTamano}
        />
      </div>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-5xl">
        {editando && (
          <CrmVeterinariaForm
            veterinaria={editando === "nuevo" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={recurso.recargar}
          />
        )}
      </Modal>

      <Modal open={enMapa !== null} onOpenChange={(o) => !o && setEnMapa(null)}>
        {enMapa && enMapa.latitud != null && enMapa.longitud != null && (
          <>
            <DialogHeader>
              <DialogTitle>{enMapa.nombre}</DialogTitle>
              <DialogDescription>{[enMapa.direccion, enMapa.distrito].filter(Boolean).join(", ")}</DialogDescription>
            </DialogHeader>
            <MapaChico latitud={enMapa.latitud} longitud={enMapa.longitud} className="h-64" />
          </>
        )}
      </Modal>

      <Modal open={borrando !== null} onOpenChange={(o) => !o && setBorrando(null)}>
        <DialogHeader>
          <DialogTitle>Eliminar veterinaria</DialogTitle>
          <DialogDescription>{borrando?.nombre}. Se quita de la lista del CRM.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setBorrando(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={borrar}>
            Eliminar
          </Button>
        </DialogFooter>
      </Modal>
    </>
  );
}
