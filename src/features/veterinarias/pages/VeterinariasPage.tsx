import { useMemo, useState } from "react";
import { PencilIcon, PlusCircleIcon, ReceiptIcon, SearchIcon, TagIcon } from "lucide-react";
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
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import type { MetodoPago } from "@/features/casos/types";
import { fechaCorta, hoyISO, METODO_LABEL, soles } from "@/features/casos/utils/casos";
import * as V from "../api";

type Dialogo =
  | { tipo: "editar"; vet: V.Veterinaria | null }
  | { tipo: "precios"; vet: V.Veterinaria }
  | { tipo: "facturacion"; vet: V.Veterinaria };

const ESTADO_FACTURA: Record<V.Factura["estado"], string> = {
  EMITIDA: "bg-amber-50 text-amber-700",
  PAGADA: "bg-emerald-50 text-emerald-700",
  ANULADA: "bg-slate-100 text-slate-500",
};

/** Veterinarias aliadas: convenio, precio propio y facturación (specs tarifas y facturacion). */
export default function VeterinariasPage() {
  const recurso = useRecurso(V.cargar);
  const [busqueda, setBusqueda] = useState("");
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const cerrar = () => setDialogo(null);

  const datos = recurso.data;
  const convenios = useMemo(() => new Map((datos?.catalogo.convenios ?? []).map((c) => [c.id, c.nombre])), [datos]);
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (datos?.veterinarias ?? []).filter((v) => !q || v.nombre.toLowerCase().includes(q));
  }, [datos, busqueda]);
  const porCobrar = (datos?.porCobrar ?? []).reduce((acc, f) => acc + Number(f.total), 0);

  return (
    <>
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Convenios Veterinarios" }]} />
      <ModuleHeader
        title="Veterinarias aliadas"
        description="La veterinaria cobra al cliente; Dulce Recuerdo le factura a su precio de convenio cuando el admin decide."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setDialogo({ tipo: "editar", vet: null })}>
            <PlusCircleIcon className="size-4" />
            Nueva veterinaria
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi titulo="Veterinarias" valor={String(datos?.veterinarias.length ?? "—")} />
        <Kpi titulo="Activas" valor={String(datos?.veterinarias.filter((v) => v.estado === "ACTIVA").length ?? "—")} />
        <Kpi titulo="Facturas por cobrar" valor={datos ? `${datos.porCobrar.length} · ${soles(porCobrar)}` : "—"} />
      </section>

      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input className="pl-9" placeholder="Buscar veterinaria" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Veterinaria</th>
              <th className="px-5 py-3 font-semibold">Contacto</th>
              <th className="px-5 py-3 font-semibold">Convenio</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {visibles.map((v) => (
              <tr key={v.id}>
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {v.nombre}
                  {v.direccion && <span className="block text-xs text-slate-500">{v.direccion}</span>}
                </td>
                <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {[v.telefono, v.email].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-5 py-3">
                  {v.tipo_convenio_id ? convenios.get(v.tipo_convenio_id) ?? "—" : <span className="text-amber-700 text-xs">Sin convenio</span>}
                </td>
                <td className="px-5 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", v.estado === "ACTIVA" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                    {v.estado === "ACTIVA" ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setDialogo({ tipo: "editar", vet: v })}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Precio propio" onClick={() => setDialogo({ tipo: "precios", vet: v })}>
                      <TagIcon className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDialogo({ tipo: "facturacion", vet: v })}>
                      <ReceiptIcon className="size-4" />
                      Facturación
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!recurso.cargando && visibles.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">Sin veterinarias.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={dialogo !== null} onOpenChange={(o) => !o && cerrar()} ancho="sm:max-w-2xl">
        {dialogo?.tipo === "editar" && datos && (
          <VetForm vet={dialogo.vet} catalogo={datos.catalogo} onCerrar={cerrar} onHecho={() => { recurso.recargar(); cerrar(); }} />
        )}
        {dialogo?.tipo === "precios" && datos && <PreciosPropios vet={dialogo.vet} catalogo={datos.catalogo} onCerrar={cerrar} />}
        {dialogo?.tipo === "facturacion" && <Facturacion vet={dialogo.vet} onCambio={recurso.recargar} />}
      </Modal>
    </>
  );
}

function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5">
      <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">{titulo}</span>
      <span className="block text-2xl font-bold text-slate-900 dark:text-white mt-1">{valor}</span>
    </div>
  );
}

function VetForm({ vet, catalogo, onCerrar, onHecho }: { vet: V.Veterinaria | null; catalogo: V.Catalogo; onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState({
    nombre: vet?.nombre ?? "",
    telefono: vet?.telefono ?? "",
    email: vet?.email ?? "",
    direccion: vet?.direccion ?? "",
    observaciones: vet?.observaciones ?? "",
    tipo_convenio_id: vet?.tipo_convenio_id ?? "",
    activa: vet ? vet.estado === "ACTIVA" : true,
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const texto = (k: "nombre" | "telefono" | "email" | "direccion" | "observaciones", label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`vt-${k}`}>{label}</Label>
      <Input id={`vt-${k}`} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
    </div>
  );

  const guardar = async () => {
    if (!f.nombre.trim()) return setError("Escribe el nombre.");
    const cuerpo: V.VeterinariaCuerpo = {
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim() || null,
      email: f.email.trim() || null,
      direccion: f.direccion.trim() || null,
      observaciones: f.observaciones.trim() || null,
      tipo_convenio_id: f.tipo_convenio_id || null,
      estado: f.activa ? "ACTIVA" : "INACTIVA",
    };
    setGuardando(true);
    const ok = await ejecutar(() => (vet ? V.editar(vet.id, cuerpo) : V.crear(cuerpo)), "Veterinaria guardada.", "No se pudo guardar.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{vet ? "Editar veterinaria" : "Nueva veterinaria"}</DialogTitle>
        <DialogDescription>Sin tipo de convenio no se puede calcular el precio de sus casos.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {texto("nombre", "Nombre")}
        <div className="space-y-1.5">
          <Label htmlFor="vt-convenio">Tipo de convenio</Label>
          <Select value={f.tipo_convenio_id || "ninguno"} onValueChange={(v) => setF((x) => ({ ...x, tipo_convenio_id: v === "ninguno" ? "" : v }))}>
            <SelectTrigger id="vt-convenio" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguno">Sin convenio</SelectItem>
              {catalogo.convenios.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                  {!c.activo ? " (inactivo)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {texto("telefono", "Teléfono")}
        {texto("email", "Correo")}
        {texto("direccion", "Dirección")}
        {texto("observaciones", "Observaciones")}
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={f.activa} onChange={(e) => setF((x) => ({ ...x, activa: e.target.checked }))} />
        Activa (sus casos se agendan sin pago del cliente)
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
}

function PreciosPropios({ vet, catalogo, onCerrar }: { vet: V.Veterinaria; catalogo: V.Catalogo; onCerrar: () => void }) {
  const actual = useRecurso(() => V.preciosPropios(vet.id), [vet.id]);
  if (actual.error) return <p className="text-sm text-red-600">{actual.error}</p>;
  if (!actual.data) return <p className="text-sm text-slate-500">Cargando…</p>;
  return <PreciosPropiosForm vet={vet} catalogo={catalogo} actual={actual.data} onCerrar={onCerrar} />;
}

function PreciosPropiosForm({ vet, catalogo, actual, onCerrar }: { vet: V.Veterinaria; catalogo: V.Catalogo; actual: Record<string, Record<string, string>>; onCerrar: () => void }) {
  const [valores, setValores] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(catalogo.planes.map((p) => [p.id, Object.fromEntries(catalogo.rangos.map((r) => [r.id, actual[p.id]?.[r.id] != null ? String(Number(actual[p.id][r.id])) : ""]))]))
  );
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const precios: Record<string, Record<string, string | null>> = {};
    for (const p of catalogo.planes) {
      precios[p.id] = {};
      for (const r of catalogo.rangos) {
        const t = valores[p.id][r.id].trim();
        if (t === "") {
          precios[p.id][r.id] = null;
          continue;
        }
        const n = Number(t);
        if (!Number.isFinite(n) || n < 0) return setError(`Precio inválido en ${p.nombre}.`);
        precios[p.id][r.id] = n.toFixed(2);
      }
    }
    setGuardando(true);
    const ok = await ejecutar(() => V.guardarPreciosPropios(vet.id, precios), "Precio propio guardado.", "No se pudo guardar.");
    setGuardando(false);
    if (ok) onCerrar();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Precio propio · {vet.nombre}</DialogTitle>
        <DialogDescription>Opcional. Donde quede vacío se usa el precio de su tipo de convenio.</DialogDescription>
      </DialogHeader>
      {catalogo.planes.map((p) => (
        <div key={p.id} className="flex flex-col gap-1">
          <span className="text-sm font-medium">{p.nombre}</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {catalogo.rangos.map((r) => (
              <div key={r.id} className="space-y-1">
                <Label htmlFor={`pp-${p.id}-${r.id}`} className="text-xs">{r.etiqueta}</Label>
                <Input
                  id={`pp-${p.id}-${r.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="convenio"
                  value={valores[p.id][r.id]}
                  onChange={(e) => setValores((x) => ({ ...x, [p.id]: { ...x[p.id], [r.id]: e.target.value } }))}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
}

function Facturacion({ vet, onCambio }: { vet: V.Veterinaria; onCambio: () => void }) {
  const datos = useRecurso(() => V.facturacion(vet.id), [vet.id]);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [numero, setNumero] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [cobro, setCobro] = useState<{ id: string; metodo: MetodoPago; fecha: string } | null>(null);
  const [anulando, setAnulando] = useState<{ id: string; motivo: string } | null>(null);

  const recargar = () => {
    datos.recargar();
    onCambio();
  };
  const pendientes = datos.data?.pendientes ?? [];
  const totalElegido = pendientes.filter((p) => elegidos.includes(p.caso_id)).reduce((a, p) => a + Number(p.monto), 0);

  const emitir = async () => {
    const ok = await ejecutar(
      () => V.emitir({ veterinaria_id: vet.id, caso_ids: elegidos, fecha_emision: fecha, numero_comprobante: numero.trim() || undefined }),
      "Factura emitida.",
      "No se pudo emitir la factura."
    );
    if (ok) {
      setElegidos([]);
      setNumero("");
      recargar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Facturación · {vet.nombre}</DialogTitle>
        <DialogDescription>Elige los casos realizados que quieres facturar ahora.</DialogDescription>
      </DialogHeader>
      {datos.error && <p className="text-sm text-red-600">{datos.error}</p>}

      <section className="flex flex-col gap-2">
        <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500">Casos por facturar</h3>
        {pendientes.length === 0 && <p className="text-sm text-slate-400">No hay casos pendientes.</p>}
        {pendientes.map((p) => (
          <label key={p.caso_id} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 dark:border-white/5 py-1.5">
            <span className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-brand-500"
                checked={elegidos.includes(p.caso_id)}
                onChange={(e) => setElegidos((l) => (e.target.checked ? [...l, p.caso_id] : l.filter((x) => x !== p.caso_id)))}
              />
              {p.mascota} · {p.tutor} · {fechaCorta(p.fecha_realizado)}
            </span>
            <span className="font-medium">{soles(p.monto)}</span>
          </label>
        ))}
        {pendientes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="fa-numero">N.º de comprobante (opcional)</Label>
              <Input id="fa-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fa-fecha">Fecha de emisión</Label>
              <DatePicker id="fa-fecha" value={fecha} onChange={setFecha} />
            </div>
            <Button variant="operational" disabled={elegidos.length === 0} onClick={emitir}>
              Emitir {elegidos.length ? `(${soles(totalElegido)})` : ""}
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500">Facturas</h3>
        {datos.data?.facturas.length === 0 && <p className="text-sm text-slate-400">Sin facturas.</p>}
        {datos.data?.facturas.map((f) => (
          <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-slate-100 dark:border-white/5 py-1.5">
            <span>
              {f.numero_comprobante ?? `#${f.id.slice(0, 8)}`} · {fechaCorta(f.fecha_emision)} · <strong>{soles(f.total)}</strong>
              {f.estado === "PAGADA" && f.metodo_pago && ` · cobrada ${fechaCorta(f.fecha_pago)} (${METODO_LABEL[f.metodo_pago]})`}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", ESTADO_FACTURA[f.estado])}>{f.estado.toLowerCase()}</span>
              {f.estado === "EMITIDA" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setCobro({ id: f.id, metodo: "TRANSFERENCIA", fecha: hoyISO() })}>
                    Registrar cobro
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setAnulando({ id: f.id, motivo: "" })}>
                    Anular
                  </Button>
                </>
              )}
            </span>
          </div>
        ))}
      </section>

      {cobro && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end rounded-lg border border-slate-200 dark:border-white/10 p-3">
          <div className="space-y-1.5">
            <Label htmlFor="fa-metodo">Forma de pago</Label>
            <Select value={cobro.metodo} onValueChange={(v) => setCobro((c) => c && { ...c, metodo: v as MetodoPago })}>
              <SelectTrigger id="fa-metodo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(METODO_LABEL) as MetodoPago[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {METODO_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fa-fcobro">Fecha del cobro</Label>
            <DatePicker id="fa-fcobro" value={cobro.fecha} onChange={(v) => setCobro((c) => c && { ...c, fecha: v })} />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setCobro(null)}>Cancelar</Button>
            <Button
              variant="operational"
              onClick={async () => {
                if (await ejecutar(() => V.cobrar(cobro.id, cobro.metodo, cobro.fecha), "Cobro registrado: los casos quedan pagados.", "No se pudo registrar el cobro.")) {
                  setCobro(null);
                  recargar();
                }
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}

      {anulando && (
        <div className="flex flex-col sm:flex-row gap-3 items-end rounded-lg border border-red-200 p-3">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="fa-motivo">Motivo de la anulación</Label>
            <Input id="fa-motivo" value={anulando.motivo} onChange={(e) => setAnulando((a) => a && { ...a, motivo: e.target.value })} />
          </div>
          <Button variant="ghost" onClick={() => setAnulando(null)}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={!anulando.motivo.trim()}
            onClick={async () => {
              if (await ejecutar(() => V.anular(anulando.id, anulando.motivo.trim()), "Factura anulada: sus casos vuelven a pendientes.", "No se pudo anular.")) {
                setAnulando(null);
                recargar();
              }
            }}
          >
            Anular
          </Button>
        </div>
      )}
    </>
  );
}
