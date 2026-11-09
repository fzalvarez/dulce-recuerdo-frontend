import { useMemo, useState } from "react";
import { PencilIcon, PlusCircleIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import api from "@/shared/lib/axios";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import { fechaCorta, hoyISO, soles } from "@/features/casos/utils/casos";
import { CATEGORIA_LABEL, ESTADO_LABEL, type Activo, type ActivoCuerpo, type CategoriaActivo, type EstadoActivo } from "../types";

const ESTADO_CLASE: Record<EstadoActivo, string> = {
  OPERATIVO: "bg-emerald-50 text-emerald-700",
  EN_REPARACION: "bg-amber-50 text-amber-700",
  DADO_DE_BAJA: "bg-slate-100 text-slate-500",
};

const listar = () => api.get<Activo[]>("/activos").then((r) => r.data);

/** Activos: equipos durables con estado, ubicación y próxima revisión. */
export default function ActivosPage() {
  const recurso = useRecurso(listar);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<CategoriaActivo | "todas">("todas");
  const [editando, setEditando] = useState<Activo | "nuevo" | null>(null);
  const hoy = hoyISO();

  const activos = useMemo(() => recurso.data ?? [], [recurso.data]);
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return activos.filter(
      (a) =>
        (categoria === "todas" || a.categoria === categoria) &&
        (!q || a.nombre.toLowerCase().includes(q) || a.codigo.toLowerCase().includes(q) || (a.ubicacion ?? "").toLowerCase().includes(q))
    );
  }, [activos, busqueda, categoria]);

  const valor = activos.filter((a) => a.estado !== "DADO_DE_BAJA").reduce((acc, a) => acc + Number(a.costo), 0);
  const revisionPendiente = activos.filter((a) => a.proxima_revision && a.proxima_revision <= hoy && a.estado !== "DADO_DE_BAJA").length;

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Activos" }]} />
      <ModuleHeader
        title="Activos"
        description="Equipos durables: tapers, camillas, mobiliario. Se controlan por estado y ubicación, no por stock."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nuevo")}>
            <PlusCircleIcon className="size-4" />
            Nuevo activo
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi titulo="Activos" valor={String(activos.length)} />
        <Kpi titulo="Valor (sin bajas)" valor={soles(valor)} />
        <Kpi titulo="Revisión vencida" valor={String(revisionPendiente)} alerta={revisionPendiente > 0} />
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input className="pl-9" placeholder="Nombre, código o ubicación" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Select value={categoria} onValueChange={(v) => setCategoria(v as typeof categoria)}>
          <SelectTrigger className="w-48" aria-label="Categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {(Object.keys(CATEGORIA_LABEL) as CategoriaActivo[]).map((c) => (
              <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[820px]">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Activo</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Cantidad</th>
              <th className="px-4 py-3 font-semibold">Costo</th>
              <th className="px-4 py-3 font-semibold">Ubicación</th>
              <th className="px-4 py-3 font-semibold">Próxima revisión</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {visibles.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2.5">
                  <span className="block font-medium">{a.nombre}</span>
                  <span className="text-xs font-mono text-slate-500">{a.codigo}</span>
                </td>
                <td className="px-4 py-2.5">{CATEGORIA_LABEL[a.categoria]}</td>
                <td className="px-4 py-2.5">{a.cantidad}</td>
                <td className="px-4 py-2.5">{soles(a.costo)}</td>
                <td className="px-4 py-2.5">{a.ubicacion ?? "—"}</td>
                <td className={cn("px-4 py-2.5", a.proxima_revision && a.proxima_revision <= hoy && "text-red-600 font-medium")}>
                  {a.proxima_revision ? fechaCorta(`${a.proxima_revision}T00:00:00`) : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", ESTADO_CLASE[a.estado])}>{ESTADO_LABEL[a.estado]}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="inline-flex gap-1">
                    <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setEditando(a)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Eliminar"
                      className="text-slate-400 hover:text-red-600"
                      onClick={async () => (await ejecutar(() => api.delete(`/activos/${a.id}`), "Activo eliminado.", "No se pudo eliminar.")) && recurso.recargar()}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!recurso.cargando && visibles.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">Sin activos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-2xl">
        {editando && (
          <ActivoForm
            activo={editando === "nuevo" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={() => {
              recurso.recargar();
              setEditando(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function Kpi({ titulo, valor, alerta }: { titulo: string; valor: string; alerta?: boolean }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5">
      <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">{titulo}</span>
      <span className={cn("block text-2xl font-bold mt-1", alerta ? "text-red-600" : "text-slate-900 dark:text-white")}>{valor}</span>
    </div>
  );
}

function ActivoForm({ activo, onCerrar, onHecho }: { activo: Activo | null; onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState({
    codigo: activo?.codigo ?? "",
    nombre: activo?.nombre ?? "",
    categoria: (activo?.categoria ?? "TRASLADO") as CategoriaActivo,
    cantidad: String(activo?.cantidad ?? 1),
    fecha_compra: activo?.fecha_compra ?? "",
    costo: activo ? String(Number(activo.costo)) : "0",
    estado: (activo?.estado ?? "OPERATIVO") as EstadoActivo,
    ubicacion: activo?.ubicacion ?? "",
    proxima_revision: activo?.proxima_revision ?? "",
    observaciones: activo?.observaciones ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const cantidad = Number(f.cantidad);
    const costo = Number(f.costo);
    if (!f.codigo.trim() || !f.nombre.trim()) return setError("Código y nombre son obligatorios.");
    if (!Number.isInteger(cantidad) || cantidad <= 0) return setError("La cantidad debe ser un entero mayor a 0.");
    if (!Number.isFinite(costo) || costo < 0) return setError("El costo no es válido.");
    const cuerpo: ActivoCuerpo = {
      codigo: f.codigo.trim(),
      nombre: f.nombre.trim(),
      categoria: f.categoria,
      cantidad,
      fecha_compra: f.fecha_compra || null,
      costo: costo.toFixed(2),
      estado: f.estado,
      ubicacion: f.ubicacion.trim() || null,
      proxima_revision: f.proxima_revision || null,
      observaciones: f.observaciones.trim() || null,
    };
    setGuardando(true);
    const ok = await ejecutar(
      () => (activo ? api.patch(`/activos/${activo.id}`, cuerpo) : api.post("/activos", cuerpo)),
      "Activo guardado.",
      "No se pudo guardar el activo."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  const texto = (k: "codigo" | "nombre" | "cantidad" | "costo" | "ubicacion" | "observaciones", label: string, tipo = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`ac-${k}`}>{label}</Label>
      <Input id={`ac-${k}`} type={tipo} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
    </div>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{activo ? "Editar activo" : "Nuevo activo"}</DialogTitle>
        <DialogDescription>El código no se puede repetir.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {texto("codigo", "Código")}
        {texto("nombre", "Nombre")}
        <div className="space-y-1.5">
          <Label htmlFor="ac-categoria">Categoría</Label>
          <Select value={f.categoria} onValueChange={(v) => setF((x) => ({ ...x, categoria: v as CategoriaActivo }))}>
            <SelectTrigger id="ac-categoria" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORIA_LABEL) as CategoriaActivo[]).map((c) => (
                <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ac-estado">Estado</Label>
          <Select value={f.estado} onValueChange={(v) => setF((x) => ({ ...x, estado: v as EstadoActivo }))}>
            <SelectTrigger id="ac-estado" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(ESTADO_LABEL) as EstadoActivo[]).map((e) => (
                <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {texto("cantidad", "Cantidad", "number")}
        {texto("costo", "Costo total (S/)", "number")}
        <div className="space-y-1.5">
          <Label htmlFor="ac-compra">Fecha de compra</Label>
          <DatePicker id="ac-compra" value={f.fecha_compra} onChange={(d) => setF((x) => ({ ...x, fecha_compra: d }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ac-revision">Próxima revisión</Label>
          <DatePicker id="ac-revision" value={f.proxima_revision} onChange={(d) => setF((x) => ({ ...x, proxima_revision: d }))} />
        </div>
        {texto("ubicacion", "Ubicación")}
        {texto("observaciones", "Observaciones")}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button>
      </DialogFooter>
    </>
  );
}
