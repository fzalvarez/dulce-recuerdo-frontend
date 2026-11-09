import { useState, type ReactNode } from "react";
import { PencilIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import { soles } from "@/features/casos/utils/casos";
import * as T from "../api";

type Rango = { id: string; etiqueta: string };

/** Texto de un input → monto con dos decimales, null si está vacío, o "error". */
function leerMonto(texto: string): string | null | "error" {
  const t = texto.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return "error";
  return n.toFixed(2);
}

function montoTexto(v: string | null | undefined): string {
  return v == null ? "" : String(Number(v));
}

function verMonto(v: string | null | undefined) {
  return v == null ? <span className="text-amber-700 text-xs">Sin precio</span> : soles(v);
}

function Seccion({ titulo, descripcion, accion, children }: { titulo: string; descripcion: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h2>
          <p className="text-xs text-slate-500">{descripcion}</p>
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Tabla({ cabecera, children }: { cabecera: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[640px]">
        <thead className="text-label uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-white/5">
          <tr>
            {cabecera.map((c, i) => (
              <th key={i} className="px-3 py-2 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

function Acciones({ onEditar, onBorrar }: { onEditar: () => void; onBorrar?: () => void }) {
  return (
    <div className="inline-flex gap-1">
      <Button variant="ghost" size="icon-sm" title="Editar" onClick={onEditar}>
        <PencilIcon className="size-4" />
      </Button>
      {onBorrar && (
        <Button variant="ghost" size="icon-sm" title="Eliminar" className="text-slate-400 hover:text-red-600" onClick={onBorrar}>
          <Trash2Icon className="size-4" />
        </Button>
      )}
    </div>
  );
}

type Dialogo =
  | { tipo: "plan"; plan: T.Plan | null }
  | { tipo: "eutanasia" }
  | { tipo: "zona"; zona: T.Zona | null }
  | { tipo: "recargo" }
  | { tipo: "complemento"; complemento: T.Complemento | null }
  | { tipo: "convenio-nuevo" }
  | { tipo: "convenio-precios"; convenio: T.Convenio };

/** Planes y tarifas: la única fuente de precios del sistema (spec tarifas). */
export default function PlanesPage() {
  const recurso = useRecurso(T.cargarTodo);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const cerrar = () => setDialogo(null);
  const listo = () => {
    recurso.recargar();
    cerrar();
  };

  const data = recurso.data;
  if (recurso.error) return <p className="text-sm text-red-600">{recurso.error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Cargando tarifas…</p>;
  const { planes, tarifas } = data;
  const rangos = tarifas.rangos;

  const borrar = async (accion: () => Promise<unknown>, texto: string) => {
    if (await ejecutar(accion, texto, "No se pudo eliminar.")) recurso.recargar();
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Planes" }]} />
      <ModuleHeader
        title="Planes y tarifas"
        description="Los precios que usa el sistema para calcular cada caso. Sin precio cargado, el caso no se puede registrar."
      />

      <Seccion
        titulo="Planes de cremación"
        descripcion="Precio al público por rango de peso."
        accion={
          <Button variant="operational" size="sm" onClick={() => setDialogo({ tipo: "plan", plan: null })}>
            <PlusCircleIcon className="size-4" />
            Nuevo plan
          </Button>
        }
      >
        <Tabla cabecera={["Plan", ...rangos.map((r) => r.etiqueta), "Estado", ""]}>
          {planes.map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-2 font-medium">
                {p.nombre}
                {p.descripcion && <span className="block text-xs text-slate-500">{p.descripcion}</span>}
              </td>
              {rangos.map((r) => (
                <td key={r.id} className="px-3 py-2 whitespace-nowrap">{verMonto(tarifas.planes[p.id]?.[r.id])}</td>
              ))}
              <td className="px-3 py-2">
                <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", p.estado === "Activo" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {p.estado === "Activo" ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <Acciones onEditar={() => setDialogo({ tipo: "plan", plan: p })} onBorrar={() => borrar(() => T.eliminarPlan(p.id), "Plan eliminado.")} />
              </td>
            </tr>
          ))}
          {planes.length === 0 && (
            <tr>
              <td colSpan={rangos.length + 3} className="px-3 py-6 text-center text-slate-400">Aún no hay planes.</td>
            </tr>
          )}
        </Tabla>
      </Seccion>

      <Seccion
        titulo="Eutanasia"
        descripcion="Sola, o como extra de una cremación. Por rango de peso."
        accion={<Button variant="outline" size="sm" onClick={() => setDialogo({ tipo: "eutanasia" })}>Editar precios</Button>}
      >
        <Tabla cabecera={["", ...rangos.map((r) => r.etiqueta)]}>
          {(["sola", "extra"] as const).map((k) => (
            <tr key={k}>
              <td className="px-3 py-2 font-medium">{k === "sola" ? "Eutanasia sola" : "Extra en cremación"}</td>
              {rangos.map((r) => (
                <td key={r.id} className="px-3 py-2 whitespace-nowrap">{verMonto(tarifas.eutanasia[r.id]?.[k])}</td>
              ))}
            </tr>
          ))}
        </Tabla>
      </Seccion>

      <Seccion
        titulo="Zonas de traslado"
        descripcion="Precio del recojo a domicilio según el distrito. Cada distrito pertenece a una sola zona."
        accion={
          <Button variant="operational" size="sm" onClick={() => setDialogo({ tipo: "zona", zona: null })}>
            <PlusCircleIcon className="size-4" />
            Nueva zona
          </Button>
        }
      >
        <Tabla cabecera={["Zona", "Precio", "Distritos", ""]}>
          {tarifas.zonas.map((z) => (
            <tr key={z.id}>
              <td className="px-3 py-2 font-medium">{z.nombre}</td>
              <td className="px-3 py-2">{z.incluida ? "Incluido" : soles(z.precio)}</td>
              <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{z.distritos.join(", ") || "—"}</td>
              <td className="px-3 py-2 text-right">
                <Acciones onEditar={() => setDialogo({ tipo: "zona", zona: z })} onBorrar={() => borrar(() => T.eliminarZona(z.id), "Zona eliminada.")} />
              </td>
            </tr>
          ))}
        </Tabla>
      </Seccion>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Seccion
          titulo="Recargo de horario punta"
          descripcion="Se suma al traslado a domicilio si la hora cae en una franja."
          accion={<Button variant="outline" size="sm" onClick={() => setDialogo({ tipo: "recargo" })}>Editar</Button>}
        >
          <p className="text-sm">
            Monto: {verMonto(tarifas.recargo_punta.monto)} · Franjas:{" "}
            {tarifas.recargo_punta.franjas.map((f) => `${f.inicio.slice(0, 5)}–${f.fin.slice(0, 5)}`).join(", ") || "ninguna"}
          </p>
        </Seccion>

        <Seccion
          titulo="Complementos"
          descripcion="Extras que se suman al precio (por ejemplo, huella)."
          accion={
            <Button variant="operational" size="sm" onClick={() => setDialogo({ tipo: "complemento", complemento: null })}>
              <PlusCircleIcon className="size-4" />
              Nuevo
            </Button>
          }
        >
          <ul className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
            {tarifas.complementos.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className={cn(!c.activo && "text-slate-400")}>
                  {c.nombre} · {soles(c.precio)}
                  {!c.activo && " (inactivo)"}
                </span>
                <Acciones
                  onEditar={() => setDialogo({ tipo: "complemento", complemento: c })}
                  onBorrar={() => borrar(() => T.eliminarComplemento(c.id), "Complemento eliminado.")}
                />
              </li>
            ))}
            {tarifas.complementos.length === 0 && <li className="py-2 text-slate-400">Sin complementos.</li>}
          </ul>
        </Seccion>
      </div>

      <Seccion
        titulo="Convenios con veterinarias"
        descripcion="Precio menor por tipo de convenio. Cada veterinaria tiene un tipo; también puede tener un precio propio (en Veterinarias)."
        accion={
          <Button variant="operational" size="sm" onClick={() => setDialogo({ tipo: "convenio-nuevo" })}>
            <PlusCircleIcon className="size-4" />
            Nuevo tipo de convenio
          </Button>
        }
      >
        {tarifas.convenios.length === 0 && <p className="text-sm text-slate-400">Aún no hay tipos de convenio.</p>}
        {tarifas.convenios.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("font-medium", !c.activo && "text-slate-400")}>
                {c.nombre}
                {!c.activo && " (inactivo)"}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={async () => (await ejecutar(() => T.editarConvenio(c.id, { activo: !c.activo }), c.activo ? "Convenio desactivado." : "Convenio activado.", "No se pudo cambiar el convenio.")) && recurso.recargar()}>
                  {c.activo ? "Desactivar" : "Activar"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDialogo({ tipo: "convenio-precios", convenio: c })}>
                  Editar precios
                </Button>
              </div>
            </div>
            <Tabla cabecera={["Plan", ...rangos.map((r) => r.etiqueta)]}>
              {planes.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">{p.nombre}</td>
                  {rangos.map((r) => (
                    <td key={r.id} className="px-3 py-2 whitespace-nowrap">{verMonto(c.precios[p.id]?.[r.id])}</td>
                  ))}
                </tr>
              ))}
            </Tabla>
          </div>
        ))}
      </Seccion>

      <Modal open={dialogo !== null} onOpenChange={(o) => !o && cerrar()} ancho="sm:max-w-2xl">
        {dialogo?.tipo === "plan" && <PlanForm plan={dialogo.plan} rangos={rangos} precios={dialogo.plan ? tarifas.planes[dialogo.plan.id] ?? {} : {}} onCerrar={cerrar} onHecho={listo} />}
        {dialogo?.tipo === "eutanasia" && <EutanasiaForm rangos={rangos} actual={tarifas.eutanasia} onCerrar={cerrar} onHecho={listo} />}
        {dialogo?.tipo === "zona" && <ZonaForm zona={dialogo.zona} onCerrar={cerrar} onHecho={listo} />}
        {dialogo?.tipo === "recargo" && <RecargoForm actual={tarifas.recargo_punta} onCerrar={cerrar} onHecho={listo} />}
        {dialogo?.tipo === "complemento" && <ComplementoForm complemento={dialogo.complemento} onCerrar={cerrar} onHecho={listo} />}
        {dialogo?.tipo === "convenio-nuevo" && <ConvenioNuevoForm onCerrar={cerrar} onHecho={listo} />}
        {dialogo?.tipo === "convenio-precios" && <ConvenioPreciosForm convenio={dialogo.convenio} planes={planes} rangos={rangos} onCerrar={cerrar} onHecho={listo} />}
      </Modal>
    </>
  );
}

// ---------- Formularios ----------

interface FormProps {
  onCerrar: () => void;
  onHecho: () => void;
}

function Pie({ onCerrar, onGuardar, guardando, error }: { onCerrar: () => void; onGuardar: () => void; guardando: boolean; error: string | null }) {
  return (
    <>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={onGuardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
}

function useGuardar(onHecho: () => void) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guardar = async (accion: () => Promise<unknown>, exito: string) => {
    setGuardando(true);
    const ok = await ejecutar(accion, exito, "No se pudo guardar.");
    setGuardando(false);
    if (ok) onHecho();
  };
  return { guardando, error, setError, guardar };
}

function FilaPrecios({ rangos, valores, onCambio, prefijo }: { rangos: Rango[]; valores: Record<string, string>; onCambio: (rango: string, v: string) => void; prefijo: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {rangos.map((r) => (
        <div key={r.id} className="space-y-1">
          <Label htmlFor={`${prefijo}-${r.id}`} className="text-xs">{r.etiqueta}</Label>
          <Input id={`${prefijo}-${r.id}`} type="number" min={0} step="0.01" placeholder="—" value={valores[r.id] ?? ""} onChange={(e) => onCambio(r.id, e.target.value)} />
        </div>
      ))}
    </div>
  );
}

/** Convierte los textos de una fila de precios. Devuelve null si alguno no es válido. */
function leerFila(rangos: Rango[], valores: Record<string, string>): T.PreciosRango | null {
  const out: T.PreciosRango = {};
  for (const r of rangos) {
    const v = leerMonto(valores[r.id] ?? "");
    if (v === "error") return null;
    out[r.id] = v;
  }
  return out;
}

function PlanForm({ plan, rangos, precios, onCerrar, onHecho }: FormProps & { plan: T.Plan | null; rangos: Rango[]; precios: Record<string, string> }) {
  const [nombre, setNombre] = useState(plan?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(plan?.descripcion ?? "");
  const [activo, setActivo] = useState(plan ? plan.estado === "Activo" : true);
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries(rangos.map((r) => [r.id, montoTexto(precios[r.id])])));
  const g = useGuardar(onHecho);

  const guardar = () => {
    if (!nombre.trim()) return g.setError("Escribe el nombre del plan.");
    const fila = leerFila(rangos, valores);
    if (!fila) return g.setError("Revisa los precios: deben ser números positivos.");
    const cuerpo = { nombre: nombre.trim(), descripcion: descripcion.trim() || null, estado: activo ? ("Activo" as const) : ("Inactivo" as const) };
    g.guardar(async () => {
      const p = plan ? await T.editarPlan(plan.id, cuerpo) : await T.crearPlan(cuerpo);
      await T.preciosPlan(p.id, fila);
    }, plan ? "Plan actualizado." : "Plan creado.");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{plan ? "Editar plan" : "Nuevo plan"}</DialogTitle>
        <DialogDescription>Deja vacío un rango para que no tenga precio.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pl-nombre">Nombre</Label>
          <Input id="pl-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pl-desc">Descripción</Label>
          <Input id="pl-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
      </div>
      <FilaPrecios rangos={rangos} valores={valores} onCambio={(r, v) => setValores((x) => ({ ...x, [r]: v }))} prefijo="pl" />
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Plan activo (se ofrece al registrar casos)
      </label>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={g.guardando} error={g.error} />
    </>
  );
}

function EutanasiaForm({ rangos, actual, onCerrar, onHecho }: FormProps & { rangos: Rango[]; actual: T.Tarifas["eutanasia"] }) {
  const [sola, setSola] = useState<Record<string, string>>(() => Object.fromEntries(rangos.map((r) => [r.id, montoTexto(actual[r.id]?.sola)])));
  const [extra, setExtra] = useState<Record<string, string>>(() => Object.fromEntries(rangos.map((r) => [r.id, montoTexto(actual[r.id]?.extra)])));
  const g = useGuardar(onHecho);

  const guardar = () => {
    const s = leerFila(rangos, sola);
    const e = leerFila(rangos, extra);
    if (!s || !e) return g.setError("Revisa los precios: deben ser números positivos.");
    g.guardar(() => T.preciosEutanasia(Object.fromEntries(rangos.map((r) => [r.id, { sola: s[r.id], extra: e[r.id] }]))), "Precios de eutanasia guardados.");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Precios de eutanasia</DialogTitle>
        <DialogDescription>Deja vacío lo que todavía no tenga precio.</DialogDescription>
      </DialogHeader>
      <span className="text-sm font-medium">Eutanasia sola</span>
      <FilaPrecios rangos={rangos} valores={sola} onCambio={(r, v) => setSola((x) => ({ ...x, [r]: v }))} prefijo="eu-sola" />
      <span className="text-sm font-medium">Extra en una cremación</span>
      <FilaPrecios rangos={rangos} valores={extra} onCambio={(r, v) => setExtra((x) => ({ ...x, [r]: v }))} prefijo="eu-extra" />
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={g.guardando} error={g.error} />
    </>
  );
}

function ZonaForm({ zona, onCerrar, onHecho }: FormProps & { zona: T.Zona | null }) {
  const [nombre, setNombre] = useState(zona?.nombre ?? "");
  const [precio, setPrecio] = useState(montoTexto(zona?.precio));
  const [incluida, setIncluida] = useState(zona?.incluida ?? false);
  const [orden, setOrden] = useState(String(zona?.orden ?? 0));
  const [distritos, setDistritos] = useState((zona?.distritos ?? []).join(", "));
  const g = useGuardar(onHecho);

  const guardar = () => {
    if (!nombre.trim()) return g.setError("Escribe el nombre de la zona.");
    const p = incluida ? "0.00" : leerMonto(precio);
    if (p === null || p === "error") return g.setError("Indica el precio del traslado.");
    const cuerpo: T.ZonaCuerpo = {
      nombre: nombre.trim(),
      precio: p,
      incluida,
      orden: Number(orden) || 0,
      distritos: distritos.split(",").map((d) => d.trim()).filter(Boolean),
    };
    g.guardar(() => (zona ? T.editarZona(zona.id, cuerpo) : T.crearZona(cuerpo)), "Zona guardada.");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{zona ? "Editar zona" : "Nueva zona"}</DialogTitle>
        <DialogDescription>Escribe los distritos separados por coma.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="zo-nombre">Nombre</Label>
          <Input id="zo-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zo-precio">Precio (S/)</Label>
          <Input id="zo-precio" type="number" min={0} step="0.01" value={precio} disabled={incluida} onChange={(e) => setPrecio(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zo-orden">Orden</Label>
          <Input id="zo-orden" type="number" value={orden} onChange={(e) => setOrden(e.target.value)} />
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={incluida} onChange={(e) => setIncluida(e.target.checked)} />
        Traslado incluido (sin costo)
      </label>
      <div className="space-y-1.5">
        <Label htmlFor="zo-distritos">Distritos</Label>
        <Input id="zo-distritos" value={distritos} onChange={(e) => setDistritos(e.target.value)} placeholder="Surco, San Borja, Miraflores" />
      </div>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={g.guardando} error={g.error} />
    </>
  );
}

function RecargoForm({ actual, onCerrar, onHecho }: FormProps & { actual: T.Tarifas["recargo_punta"] }) {
  const [monto, setMonto] = useState(montoTexto(actual.monto));
  const [franjas, setFranjas] = useState(actual.franjas.map((f) => ({ inicio: f.inicio.slice(0, 5), fin: f.fin.slice(0, 5) })));
  const g = useGuardar(onHecho);

  const guardar = () => {
    const m = leerMonto(monto);
    if (m === "error") return g.setError("El monto no es válido.");
    if (franjas.some((f) => !f.inicio || !f.fin || f.fin <= f.inicio)) return g.setError("Cada franja necesita inicio y fin, con fin posterior.");
    g.guardar(() => T.guardarRecargo({ monto: m, franjas: franjas.map((f) => ({ inicio: `${f.inicio}:00`, fin: `${f.fin}:00` })) }), "Recargo guardado.");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Recargo de horario punta</DialogTitle>
        <DialogDescription>Se aplica a servicios a domicilio cuya hora cae dentro de una franja.</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5 max-w-xs">
        <Label htmlFor="re-monto">Monto (S/)</Label>
        <Input id="re-monto" type="number" min={0} step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      {franjas.map((f, i) => (
        <div key={i} className="flex items-end gap-2">
          <Input aria-label="Inicio" type="time" value={f.inicio} onChange={(e) => setFranjas((l) => l.map((x, j) => (j === i ? { ...x, inicio: e.target.value } : x)))} />
          <Input aria-label="Fin" type="time" value={f.fin} onChange={(e) => setFranjas((l) => l.map((x, j) => (j === i ? { ...x, fin: e.target.value } : x)))} />
          <Button variant="ghost" size="icon-sm" title="Quitar" onClick={() => setFranjas((l) => l.filter((_, j) => j !== i))}>
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="self-start" onClick={() => setFranjas((l) => [...l, { inicio: "", fin: "" }])}>
        Agregar franja
      </Button>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={g.guardando} error={g.error} />
    </>
  );
}

function ComplementoForm({ complemento, onCerrar, onHecho }: FormProps & { complemento: T.Complemento | null }) {
  const [nombre, setNombre] = useState(complemento?.nombre ?? "");
  const [precio, setPrecio] = useState(montoTexto(complemento?.precio));
  const [activo, setActivo] = useState(complemento?.activo ?? true);
  const g = useGuardar(onHecho);

  const guardar = () => {
    const p = leerMonto(precio);
    if (!nombre.trim()) return g.setError("Escribe el nombre.");
    if (p === null || p === "error") return g.setError("Indica el precio.");
    const cuerpo = { nombre: nombre.trim(), precio: p, activo };
    g.guardar(() => (complemento ? T.editarComplemento(complemento.id, cuerpo) : T.crearComplemento(cuerpo)), "Complemento guardado.");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{complemento ? "Editar complemento" : "Nuevo complemento"}</DialogTitle>
        <DialogDescription>Se ofrece al registrar un caso y se suma al precio.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="co-nombre">Nombre</Label>
          <Input id="co-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-precio">Precio (S/)</Label>
          <Input id="co-precio" type="number" min={0} step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Activo
      </label>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={g.guardando} error={g.error} />
    </>
  );
}

function ConvenioNuevoForm({ onCerrar, onHecho }: FormProps) {
  const [nombre, setNombre] = useState("");
  const g = useGuardar(onHecho);
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nuevo tipo de convenio</DialogTitle>
        <DialogDescription>Después carga sus precios por plan.</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="cv-nombre">Nombre</Label>
        <Input id="cv-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Convenio A" />
      </div>
      <Pie
        onCerrar={onCerrar}
        onGuardar={() => (nombre.trim() ? g.guardar(() => T.crearConvenio(nombre.trim()), "Convenio creado.") : g.setError("Escribe el nombre."))}
        guardando={g.guardando}
        error={g.error}
      />
    </>
  );
}

function ConvenioPreciosForm({ convenio, planes, rangos, onCerrar, onHecho }: FormProps & { convenio: T.Convenio; planes: T.Plan[]; rangos: Rango[] }) {
  const [valores, setValores] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(planes.map((p) => [p.id, Object.fromEntries(rangos.map((r) => [r.id, montoTexto(convenio.precios[p.id]?.[r.id])]))]))
  );
  const g = useGuardar(onHecho);

  const guardar = () => {
    const precios: Record<string, T.PreciosRango> = {};
    for (const p of planes) {
      const fila = leerFila(rangos, valores[p.id]);
      if (!fila) return g.setError(`Revisa los precios de ${p.nombre}.`);
      precios[p.id] = fila;
    }
    g.guardar(() => T.preciosConvenio(convenio.id, precios), "Precios del convenio guardados.");
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Precios · {convenio.nombre}</DialogTitle>
        <DialogDescription>Lo que se factura a la veterinaria por cada plan y rango.</DialogDescription>
      </DialogHeader>
      {planes.map((p) => (
        <div key={p.id} className="flex flex-col gap-1">
          <span className="text-sm font-medium">{p.nombre}</span>
          <FilaPrecios
            rangos={rangos}
            valores={valores[p.id]}
            onCambio={(r, v) => setValores((x) => ({ ...x, [p.id]: { ...x[p.id], [r]: v } }))}
            prefijo={`cv-${p.id}`}
          />
        </div>
      ))}
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={g.guardando} error={g.error} />
    </>
  );
}
