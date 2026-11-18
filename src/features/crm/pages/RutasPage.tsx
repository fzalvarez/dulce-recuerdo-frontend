import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ExternalLinkIcon,
  MapPinOffIcon,
  PencilIcon,
  PlusCircleIcon,
  PlusIcon,
  RouteIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { cn } from "@/lib/utils";
import { Modal } from "@/features/casos/components/Dialogos";
import { DISTRITOS_CRM, eliminarRuta, fijarParadas, listar, listarRutas, type CrmVeterinaria, type Ruta } from "../api";
import { MapaRutas, type PuntoMapa } from "../components/MapaRutas";
import { RutaForm } from "../components/RutaForm";
import { COLORES_RUTA, formatoTelefono } from "../utils/formato";

const SIN_RUTA = "#94a3b8";
const TODOS = "todos";
const PRIORIDAD: Record<string, string> = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };
const MAX_GOOGLE = 10; // puntos por enlace de Google Maps

const iguales = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Enlaces de Google Maps del recorrido, en tramos de hasta 10 puntos (el último de un tramo abre el siguiente). */
function tramosGoogle(puntos: { latitud: number; longitud: number }[]): string[] {
  const tramos: string[] = [];
  for (let i = 0; i < puntos.length - 1; i += MAX_GOOGLE - 1) {
    const tramo = puntos.slice(i, i + MAX_GOOGLE);
    tramos.push(`https://www.google.com/maps/dir/${tramo.map((p) => `${p.latitud},${p.longitud}`).join("/")}`);
  }
  return tramos;
}

/** CRM › Rutas: corredores con veterinarias en orden, sobre el mapa de todos los puntos (spec crm-rutas). */
export default function RutasPage() {
  const vets = useRecurso(() => listar(""));
  const rutas = useRecurso(listarRutas);
  const [rutaId, setRutaId] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<string[] | null>(null);
  const [elegido, setElegido] = useState<string | null>(null);
  const [distrito, setDistrito] = useState(TODOS);
  const [soloSinRuta, setSoloSinRuta] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [editando, setEditando] = useState<Ruta | "nueva" | null>(null);
  const [borrando, setBorrando] = useState<Ruta | null>(null);
  const [guardando, setGuardando] = useState(false);

  const todas = vets.data ?? [];
  const listaRutas = rutas.data ?? [];
  const porId = new Map(todas.map((v) => [v.id, v]));
  const rutaPorId = new Map(listaRutas.map((r) => [r.id, r]));
  const ruta = rutaId ? rutaPorId.get(rutaId) ?? null : null;
  const original = ruta?.paradas.map((p) => p.id) ?? [];
  const paradas = borrador ?? original;
  const cambios = !!ruta && !iguales(paradas, original);

  /** Ruta de una veterinaria teniendo en cuenta el borrador de la ruta elegida. */
  const rutaDe = (v: CrmVeterinaria): string | null => {
    if (ruta && paradas.includes(v.id)) return ruta.id;
    if (ruta && v.ruta_id === ruta.id) return null;
    return v.ruta_id;
  };
  const colorDe = (id: string | null) => (id ? rutaPorId.get(id)?.color ?? SIN_RUTA : SIN_RUTA);

  const elegirRuta = (id: string | null) => {
    if (cambios && !window.confirm("Hay cambios sin guardar en la ruta. ¿Descartarlos?")) return;
    setRutaId(id);
    setBorrador(id ? rutaPorId.get(id)?.paradas.map((p) => p.id) ?? [] : null);
    setElegido(null);
  };
  const cambiarParadas = (f: (ids: string[]) => string[]) => setBorrador(f(paradas));
  const mover = (i: number, paso: number) =>
    cambiarParadas((ids) => {
      const j = i + paso;
      if (j < 0 || j >= ids.length) return ids;
      const copia = [...ids];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  const quitar = (id: string) => cambiarParadas((ids) => ids.filter((x) => x !== id));
  const agregar = (id: string) => cambiarParadas((ids) => (ids.includes(id) ? ids : [...ids, id]));

  const recargar = () => {
    vets.recargar();
    rutas.recargar();
  };
  const guardarParadas = async () => {
    if (!ruta) return;
    setGuardando(true);
    const ok = await ejecutar(() => fijarParadas(ruta.id, paradas), `Ruta ${ruta.codigo} guardada.`, "No se pudo guardar la ruta.");
    setGuardando(false);
    if (ok) {
      setBorrador(null);
      recargar();
    }
  };
  const borrar = async () => {
    if (!borrando) return;
    const ok = await ejecutar(() => eliminarRuta(borrando.id), "Ruta eliminada. Sus veterinarias quedaron sin ruta.", "No se pudo eliminar la ruta.");
    setBorrando(null);
    if (ok) {
      setRutaId(null);
      setBorrador(null);
      recargar();
    }
  };

  // Puntos del mapa: filtros de distrito y "solo sin ruta"; las paradas de la ruta elegida siempre se ven.
  const conPunto = todas.filter((v) => v.latitud != null && v.longitud != null);
  const puntos: PuntoMapa[] = conPunto
    .filter((v) => paradas.includes(v.id) || ((distrito === TODOS || v.distrito === distrito) && (!soloSinRuta || !rutaDe(v))))
    .map((v) => {
      const i = paradas.indexOf(v.id);
      return {
        id: v.id,
        latitud: v.latitud!,
        longitud: v.longitud!,
        color: colorDe(rutaDe(v)),
        aprox: v.ubicacion_aprox,
        numero: ruta && i >= 0 ? i + 1 : undefined,
        titulo: `${v.codigo} · ${v.nombre}`,
      };
    });
  const recorridoVets = paradas.map((id) => porId.get(id)).filter((v): v is CrmVeterinaria => !!v && v.latitud != null && v.longitud != null);
  const recorrido = recorridoVets.map((v) => [v.latitud!, v.longitud!] as [number, number]);
  const sinPunto = todas.length - conPunto.length;
  const encuadre = `${rutaId ?? "todas"}|${distrito}|${conPunto.length > 0}`;

  const siguiente = {
    codigo: `R${Math.max(0, ...listaRutas.map((r) => Number(r.codigo.replace(/\D/g, "")) || 0)) + 1}`,
    color: COLORES_RUTA[listaRutas.length % COLORES_RUTA.length],
  };
  const elegida = elegido ? porId.get(elegido) : undefined;
  const candidatas = buscar.trim()
    ? todas
        .filter((v) => !paradas.includes(v.id))
        .filter((v) => `${v.codigo} ${v.nombre} ${v.direccion ?? ""}`.toLowerCase().includes(buscar.trim().toLowerCase()))
        .slice(0, 8)
    : [];

  return (
    <>
      <Breadcrumbs items={[{ label: "CRM" }, { label: "Rutas" }]} />
      <ModuleHeader
        title="Rutas"
        description="Arma cada ruta sobre el mapa: elige una ruta y haz clic en los puntos para agregarlos en orden."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nueva")}>
            <PlusCircleIcon className="size-4" />
            Nueva ruta
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Panel: rutas y paradas */}
        <div className="flex flex-col gap-3 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
          {rutas.error && <p className="text-sm text-red-600">{rutas.error}</p>}
          {!rutas.cargando && listaRutas.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Todavía no hay rutas. Crea la primera con «Nueva ruta».</p>
          )}
          {listaRutas.map((r) => {
            const activa = r.id === rutaId;
            return (
              <div key={r.id} className={cn("rounded-xl border bg-white shadow-xs", activa ? "border-brand-500 ring-1 ring-brand-500/30" : "border-slate-200")}>
                <button type="button" className="flex w-full items-start gap-3 p-3 text-left" onClick={() => elegirRuta(activa ? null : r.id)}>
                  <span className="mt-1 size-3.5 shrink-0 rounded-full" style={{ background: r.color ?? SIN_RUTA }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{r.codigo}</span>
                      {r.prioridad && <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold uppercase text-slate-600">{PRIORIDAD[r.prioridad]}</span>}
                      <span className="ml-auto text-xs text-slate-500">{r.paradas.length} paradas</span>
                    </span>
                    <span className="block truncate text-sm text-slate-700">{r.nombre}</span>
                    {r.distritos.length > 0 && <span className="block truncate text-xs text-slate-500">{r.distritos.join(" · ")}</span>}
                  </span>
                </button>

                {activa && (
                  <div className="space-y-2 border-t border-slate-100 p-3">
                    {r.notas && <p className="text-xs text-slate-600">{r.notas}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => setEditando(r)}>
                        <PencilIcon className="size-3.5" />
                        Editar
                      </Button>
                      {tramosGoogle(recorridoVets.map((v) => ({ latitud: v.latitud!, longitud: v.longitud! }))).map((url, i, todos) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLinkIcon className="size-3.5" />
                            Google Maps{todos.length > 1 ? ` (tramo ${i + 1})` : ""}
                          </Button>
                        </a>
                      ))}
                      <Button variant="ghost" size="icon-sm" title="Eliminar ruta" className="ml-auto text-slate-400 hover:text-red-600" onClick={() => setBorrando(r)}>
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>

                    <ol className="space-y-1">
                      {paradas.map((id, i) => {
                        const v = porId.get(id);
                        if (!v) return null;
                        return (
                          <li
                            key={id}
                            className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50", elegido === id && "bg-brand-50")}
                            onClick={() => setElegido(id)}
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: r.color ?? SIN_RUTA }}>
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-slate-800">{v.nombre}</span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                {v.codigo} · {v.distrito}
                                {v.latitud == null && (
                                  <span className="inline-flex items-center gap-0.5 text-amber-600">
                                    · <MapPinOffIcon className="size-3" /> sin ubicación
                                  </span>
                                )}
                                {v.ubicacion_aprox && <span className="text-amber-600">· aprox.</span>}
                              </span>
                            </span>
                            <span className="flex shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm" title="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>
                                <ArrowUpIcon className="size-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" title="Bajar" disabled={i === paradas.length - 1} onClick={() => mover(i, 1)}>
                                <ArrowDownIcon className="size-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" title="Quitar de la ruta" className="text-slate-400 hover:text-red-600" onClick={() => quitar(id)}>
                                <XIcon className="size-3.5" />
                              </Button>
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    {paradas.length === 0 && <p className="text-xs text-slate-500">Haz clic en un punto del mapa para agregarlo, o búscalo aquí abajo.</p>}

                    <div className="relative">
                      <Input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Agregar por código o nombre (también sin ubicación)" className="h-8 text-xs" />
                      {candidatas.length > 0 && (
                        <ul className="absolute z-[1100] mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                          {candidatas.map((v) => (
                            <li key={v.id}>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-slate-50"
                                onClick={() => {
                                  agregar(v.id);
                                  setBuscar("");
                                }}
                              >
                                <PlusIcon className="size-3 text-brand-600" />
                                <span className="font-mono text-slate-500">{v.codigo}</span>
                                <span className="truncate">{v.nombre}</span>
                                {v.ruta && <span className="ml-auto text-amber-600">en {v.ruta}</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {cambios && (
                      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                        <span className="mr-auto text-xs text-amber-700">Cambios sin guardar</span>
                        <Button variant="ghost" size="sm" onClick={() => setBorrador(null)} disabled={guardando}>
                          Descartar
                        </Button>
                        <Button variant="operational" size="sm" onClick={guardarParadas} disabled={guardando}>
                          {guardando ? "Guardando…" : "Guardar ruta"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mapa */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Select value={distrito} onValueChange={setDistrito}>
              <SelectTrigger aria-label="Distrito" className="h-8 w-52 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los distritos</SelectItem>
                {DISTRITOS_CRM.filter((d) => todas.some((v) => v.distrito === d)).map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1.5 text-slate-600">
              <input type="checkbox" checked={soloSinRuta} onChange={(e) => setSoloSinRuta(e.target.checked)} />
              Solo sin ruta
            </label>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="inline-block size-2.5 rounded-full border-2 border-dashed border-slate-400" /> aproximada
              <span className="ml-2 inline-block size-2.5 rounded-full bg-slate-400" /> confirmada
            </span>
            {sinPunto > 0 && <span className="ml-auto text-amber-700">{sinPunto} sin ubicación (no aparecen en el mapa)</span>}
          </div>

          <div className="relative">
            <MapaRutas
              puntos={puntos}
              recorrido={recorrido}
              colorRecorrido={ruta?.color ?? SIN_RUTA}
              encuadre={encuadre}
              elegido={elegido}
              onElegir={setElegido}
              className="h-[calc(100vh-260px)] min-h-[460px]"
            />
            {elegida && (
              <div className="absolute bottom-3 left-3 z-[1000] w-80 max-w-[calc(100%-1.5rem)] rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
                <button type="button" className="absolute right-2 top-2 text-slate-400 hover:text-slate-700" onClick={() => setElegido(null)} title="Cerrar">
                  <XIcon className="size-4" />
                </button>
                <p className="font-mono text-[11px] text-slate-500">{elegida.codigo}</p>
                <p className="pr-5 font-semibold text-slate-900">{elegida.nombre}</p>
                <p className="text-xs text-slate-600">{[elegida.direccion, elegida.distrito].filter(Boolean).join(", ")}</p>
                {elegida.telefono && <p className="text-xs text-slate-600">{formatoTelefono(elegida.telefono)}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {elegida.prioridad ? `Prioridad ${PRIORIDAD[elegida.prioridad]}` : "Sin prioridad"}
                  {rutaDe(elegida) ? ` · Ruta ${rutaPorId.get(rutaDe(elegida)!)?.codigo}` : " · Sin ruta"}
                  {elegida.ubicacion_aprox && " · ubicación aproximada"}
                </p>
                {ruta ? (
                  paradas.includes(elegida.id) ? (
                    <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => quitar(elegida.id)}>
                      Quitar de {ruta.codigo}
                    </Button>
                  ) : (
                    <Button variant="operational" size="sm" className="mt-2 w-full gap-1" onClick={() => agregar(elegida.id)}>
                      <RouteIcon className="size-3.5" />
                      Agregar a {ruta.codigo} como parada {paradas.length + 1}
                      {elegida.ruta_id && elegida.ruta_id !== ruta.id ? ` (sale de ${elegida.ruta})` : ""}
                    </Button>
                  )
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">Elige una ruta a la izquierda para agregar este punto.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-2xl">
        {editando && (
          <RutaForm
            ruta={editando === "nueva" ? null : editando}
            sugerido={siguiente}
            onCerrar={() => setEditando(null)}
            onHecho={(id) => {
              rutas.recargar();
              if (editando === "nueva") {
                setRutaId(id);
                setBorrador([]);
              }
            }}
          />
        )}
      </Modal>

      <Modal open={borrando !== null} onOpenChange={(o) => !o && setBorrando(null)}>
        <DialogHeader>
          <DialogTitle>Eliminar ruta {borrando?.codigo}</DialogTitle>
          <DialogDescription>{borrando?.nombre}. Sus veterinarias no se borran: quedan sin ruta.</DialogDescription>
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
