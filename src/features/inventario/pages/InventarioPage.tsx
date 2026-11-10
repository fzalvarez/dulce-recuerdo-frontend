import { useMemo, useState } from "react";
import { ArrowDownToLineIcon, ArrowUpFromLineIcon, HistoryIcon, PencilIcon, PlusCircleIcon, SearchIcon, ScaleIcon, TruckIcon } from "lucide-react";
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
import { fechaCorta, hoyISO, soles } from "@/features/casos/utils/casos";
import * as I from "../api";
import { LINEA_LABEL, TAMANO_LABEL, TIPO_LABEL, type Articulo, type Nivel, type TamanoUrna, type TipoArticulo } from "../types";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { ProveedoresContenido } from "../components/ProveedoresDialog";
import { UrnasPanel } from "../components/UrnasPanel";

const NIVEL: Record<Nivel, { label: string; clase: string; barra: string }> = {
  OPTIMO: { label: "Óptimo", clase: "bg-emerald-50 text-emerald-700", barra: "bg-emerald-500" },
  BAJO: { label: "Bajo", clase: "bg-amber-50 text-amber-700", barra: "bg-amber-500" },
  CRITICO: { label: "Crítico", clase: "bg-red-50 text-red-700", barra: "bg-red-500" },
};

type TipoMovimiento = "entrada" | "salida" | "ajuste";
type Dialogo =
  | { tipo: "articulo"; articulo: Articulo | null }
  | { tipo: "movimiento"; articulo: Articulo; movimiento: TipoMovimiento }
  | { tipo: "historial"; articulo: Articulo }
  | { tipo: "proveedores"; articulo: Articulo };

/** Inventario: stock y costo cambian solo con movimientos (spec inventario). */
export default function InventarioPage() {
  const recurso = useRecurso(I.listar);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState<TipoArticulo | "todos">("todos");
  const [nivel, setNivel] = useState<Nivel | "todos">("todos");
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [vista, setVista] = useState<"articulos" | "urnas">("articulos");
  const cerrar = () => setDialogo(null);
  const hecho = () => {
    recurso.recargar();
    cerrar();
  };

  const articulos = useMemo(() => recurso.data ?? [], [recurso.data]);
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return articulos.filter(
      (a) =>
        (tipo === "todos" || a.tipo === tipo) &&
        (nivel === "todos" || a.nivel === nivel) &&
        (!q || `${a.nombre} ${a.sku} ${a.modelo ?? ""} ${a.tamano ?? ""}`.toLowerCase().includes(q))
    );
  }, [articulos, busqueda, tipo, nivel]);

  const valor = articulos.reduce((acc, a) => acc + Number(a.valor_stock), 0);
  const enAlerta = articulos.filter((a) => a.activo && a.nivel !== "OPTIMO").length;

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Inventario" }]} />
      <ModuleHeader
        title="Inventario"
        description="Urnas, marcos, placas, recuerdos, suministros y medicamentos. Cada urna (línea, tamaño, forma y color) es un artículo con su costo promedio."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setDialogo({ tipo: "articulo", articulo: null })}>
            <PlusCircleIcon className="size-4" />
            Nuevo artículo
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi titulo="Artículos" valor={String(articulos.length)} />
        <Kpi titulo="Valor del stock" valor={soles(valor)} />
        <Kpi titulo="Bajo el mínimo" valor={String(enAlerta)} alerta={enAlerta > 0} />
      </section>

      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
        {(
          [
            ["articulos", "Artículos"],
            ["urnas", "Urnas por modelo y color"],
          ] as const
        ).map(([clave, texto]) => (
          <button
            key={clave}
            type="button"
            onClick={() => setVista(clave)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
              vista === clave ? "border-brand-500 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {texto}
          </button>
        ))}
      </div>

      {vista === "urnas" && <UrnasPanel onCambio={recurso.recargar} />}

      {vista === "articulos" && (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input className="pl-9" placeholder="Nombre, SKU, modelo o tamaño" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger className="w-48" aria-label="Tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {(Object.keys(TIPO_LABEL) as TipoArticulo[]).map((t) => (
                  <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={nivel} onValueChange={(v) => setNivel(v as typeof nivel)}>
              <SelectTrigger className="w-44" aria-label="Nivel"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                {(Object.keys(NIVEL) as Nivel[]).map((n) => (
                  <SelectItem key={n} value={n}>{NIVEL[n].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[920px]">
              <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Artículo</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Costo promedio</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold text-right">Movimientos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {visibles.map((a) => {
                  const pct = a.stock_minimo > 0 ? Math.min(100, (a.stock / (a.stock_minimo * 2)) * 100) : a.stock > 0 ? 100 : 0;
                  return (
                    <tr key={a.id} className={cn(!a.activo && "opacity-60")}>
                      <td className="px-4 py-2.5">
                        <button type="button" className="text-left" onClick={() => setDialogo({ tipo: "articulo", articulo: a })}>
                          <span className="block font-medium hover:text-brand-500">{a.nombre}</span>
                          <span className="text-xs text-slate-500">
                            {a.sku}
                            {!a.linea && a.tamano ? ` · ${a.tamano}` : ""}
                            {a.modelo ? ` · ${a.modelo}` : ""}
                            {!a.activo ? " · inactivo" : ""}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-2.5">{TIPO_LABEL[a.tipo]}</td>
                      <td className="px-4 py-2.5 min-w-[160px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white">{a.stock} <span className="font-normal text-slate-500">/ mín. {a.stock_minimo}</span></span>
                          <span className={cn("px-1.5 py-0.5 rounded-full text-[11px] font-semibold", NIVEL[a.nivel].clase)}>{NIVEL[a.nivel].label}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <div className={cn("h-full", NIVEL[a.nivel].barra)} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">{soles(a.costo_promedio)}</td>
                      <td className="px-4 py-2.5">{soles(a.valor_stock)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon-sm" title="Entrada (compra)" onClick={() => setDialogo({ tipo: "movimiento", articulo: a, movimiento: "entrada" })}>
                            <ArrowDownToLineIcon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Salida (consumo)" onClick={() => setDialogo({ tipo: "movimiento", articulo: a, movimiento: "salida" })}>
                            <ArrowUpFromLineIcon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Ajuste por conteo" onClick={() => setDialogo({ tipo: "movimiento", articulo: a, movimiento: "ajuste" })}>
                            <ScaleIcon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Historial" onClick={() => setDialogo({ tipo: "historial", articulo: a })}>
                            <HistoryIcon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Proveedores" onClick={() => setDialogo({ tipo: "proveedores", articulo: a })}>
                            <TruckIcon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setDialogo({ tipo: "articulo", articulo: a })}>
                            <PencilIcon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!recurso.cargando && visibles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Sin artículos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={dialogo !== null} onOpenChange={(o) => !o && cerrar()} ancho="sm:max-w-2xl">
        {dialogo?.tipo === "articulo" && <ArticuloForm articulo={dialogo.articulo} onCerrar={cerrar} onHecho={hecho} />}
        {dialogo?.tipo === "movimiento" && <MovimientoForm articulo={dialogo.articulo} tipo={dialogo.movimiento} onCerrar={cerrar} onHecho={hecho} />}
        {dialogo?.tipo === "historial" && <Historial articulo={dialogo.articulo} onCambio={recurso.recargar} />}
        {dialogo?.tipo === "proveedores" && <ProveedoresContenido articulo={dialogo.articulo} />}
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

function Pie({ onCerrar, onGuardar, guardando, error, texto = "Guardar" }: { onCerrar: () => void; onGuardar: () => void; guardando: boolean; error: string | null; texto?: string }) {
  return (
    <>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
        <Button variant="operational" onClick={onGuardar} disabled={guardando}>{guardando ? "Guardando…" : texto}</Button>
      </DialogFooter>
    </>
  );
}

function ArticuloForm({ articulo, onCerrar, onHecho }: { articulo: Articulo | null; onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState({
    sku: articulo?.sku ?? "",
    nombre: articulo?.nombre ?? "",
    detalle: articulo?.detalle ?? "",
    tipo: (articulo?.tipo ?? "MARCO") as TipoArticulo,
    tamano: articulo?.tamano ?? "",
    modelo: articulo?.modelo ?? "",
    stock_minimo: String(articulo?.stock_minimo ?? 0),
    activo: articulo?.activo ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Las urnas se crean en su pestaña; aquí solo se editan sus datos generales.
  const esUrna = articulo?.linea != null;
  const tiposNuevos = (Object.keys(TIPO_LABEL) as TipoArticulo[]).filter((t) => t !== "URNA" || articulo?.tipo === "URNA");

  type Texto = "sku" | "nombre" | "detalle" | "tamano" | "modelo" | "stock_minimo";
  const campo = (k: Texto, label: string, tipo = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`ar-${k}`}>{label}</Label>
      <Input id={`ar-${k}`} type={tipo} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
    </div>
  );

  const guardar = async () => {
    const minimo = Number(f.stock_minimo);
    if (!f.sku.trim() || !f.nombre.trim()) return setError("SKU y nombre son obligatorios.");
    if (!Number.isInteger(minimo) || minimo < 0) return setError("El mínimo debe ser un entero.");
    const t = (s: string) => s.trim() || null;
    const cuerpo: I.ArticuloCuerpo = {
      sku: f.sku.trim(),
      nombre: f.nombre.trim(),
      detalle: t(f.detalle),
      tipo: f.tipo,
      tamano: t(f.tamano),
      modelo: t(f.modelo),
      stock_minimo: minimo,
      activo: f.activo,
    };
    setGuardando(true);
    const ok = await ejecutar(() => (articulo ? I.editar(articulo.id, cuerpo) : I.crear(cuerpo)), "Artículo guardado.", "No se pudo guardar.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{articulo ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
        <DialogDescription>
          {articulo ? "El stock y el costo cambian solo con entradas, salidas y ajustes." : "Nace con stock 0. Carga el stock inicial con una entrada sin gasto."}
          {!articulo && " Las urnas se crean en la pestaña “Urnas por modelo y color”."}
        </DialogDescription>
      </DialogHeader>
      {esUrna && articulo ? (
        <p className="rounded-lg bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm">
          {LINEA_LABEL[articulo.linea!]} · {TAMANO_LABEL[articulo.tamano as TamanoUrna]} · {articulo.forma} · {articulo.color}
          <span className="block text-xs text-slate-500">La línea, el tamaño, la forma y el color de una urna no se cambian: desactívala y genera la correcta.</span>
        </p>
      ) : (
        <div className="space-y-1.5">
          <span className="text-sm font-medium leading-none">Tipo</span>
          <BotonesOpcion
            ariaLabel="Tipo de artículo"
            value={f.tipo}
            onChange={(v) => setF((x) => ({ ...x, tipo: v }))}
            opciones={tiposNuevos.map((t) => ({ value: t, label: TIPO_LABEL[t] }))}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campo("sku", "SKU")}
        {campo("nombre", "Nombre")}
        {campo("stock_minimo", "Stock mínimo", "number")}
        {!esUrna && campo("tamano", "Tamaño")}
        <div className={esUrna ? "" : "sm:col-span-2"}>{campo("modelo", "Modelo")}</div>
        <div className="sm:col-span-2">{campo("detalle", "Detalle")}</div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={f.activo} onChange={(e) => setF((x) => ({ ...x, activo: e.target.checked }))} />
        Activo (se ofrece al marcar un caso realizado)
      </label>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} />
    </>
  );
}

const MOVIMIENTO_TITULO: Record<TipoMovimiento, string> = { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste por conteo" };

function MovimientoForm({ articulo, tipo, onCerrar, onHecho }: { articulo: Articulo; tipo: TipoMovimiento; onCerrar: () => void; onHecho: () => void }) {
  const [cantidad, setCantidad] = useState(tipo === "ajuste" ? String(articulo.stock) : "1");
  const [costo, setCosto] = useState(Number(articulo.costo_promedio) > 0 ? String(Number(articulo.costo_promedio)) : "");
  const [fecha, setFecha] = useState(hoyISO());
  const [proveedor, setProveedor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [registrarGasto, setRegistrarGasto] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const n = Number(cantidad);
    const fechaIso = `${fecha}T12:00:00`;
    let accion: () => Promise<unknown>;
    if (tipo === "entrada") {
      const c = Number(costo);
      if (!Number.isInteger(n) || n <= 0) return setError("La cantidad debe ser un entero mayor a 0.");
      if (!Number.isFinite(c) || c < 0) return setError("Indica el costo unitario.");
      accion = () => I.entrada(articulo.id, { cantidad: n, costo_unitario: c.toFixed(4), fecha: fechaIso, proveedor: proveedor.trim() || null, registrar_gasto: registrarGasto, motivo: motivo.trim() || null });
    } else if (tipo === "salida") {
      if (!Number.isInteger(n) || n <= 0) return setError("La cantidad debe ser un entero mayor a 0.");
      if (!motivo.trim()) return setError("Indica el motivo.");
      accion = () => I.salida(articulo.id, { cantidad: n, fecha: fechaIso, motivo: motivo.trim() });
    } else {
      if (!Number.isInteger(n) || n < 0) return setError("El conteo debe ser un entero.");
      if (!motivo.trim()) return setError("Indica el motivo del ajuste.");
      accion = () => I.ajuste(articulo.id, { stock_contado: n, fecha: fechaIso, motivo: motivo.trim() });
    }
    setGuardando(true);
    const ok = await ejecutar(accion, `${MOVIMIENTO_TITULO[tipo]} registrada.`, "No se pudo registrar.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{MOVIMIENTO_TITULO[tipo]} · {articulo.nombre}</DialogTitle>
        <DialogDescription>
          Stock actual: {articulo.stock} · costo promedio {soles(articulo.costo_promedio)}.
          {tipo === "entrada" && " Si es una compra, crea su gasto en Ingresos y Gastos."}
          {tipo === "salida" && " Para lo usado en un servicio, marca el caso como realizado."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="mv-cantidad">{tipo === "ajuste" ? "Stock contado" : "Cantidad"}</Label>
          <Input id="mv-cantidad" type="number" min={0} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mv-fecha">Fecha</Label>
          <DatePicker id="mv-fecha" value={fecha} onChange={setFecha} />
        </div>
        {tipo === "entrada" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="mv-costo">Costo unitario (S/)</Label>
              <Input id="mv-costo" type="number" min={0} step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mv-proveedor">Proveedor</Label>
              <Input id="mv-proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
            </div>
          </>
        )}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="mv-motivo">{tipo === "entrada" ? "Nota (opcional)" : "Motivo"}</Label>
          <Input id="mv-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
      </div>
      {tipo === "entrada" && (
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-brand-500" checked={registrarGasto} onChange={(e) => setRegistrarGasto(e.target.checked)} />
          Es una compra: registrar el gasto (desmarca para stock inicial o donaciones)
        </label>
      )}
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} texto="Registrar" />
    </>
  );
}

function Historial({ articulo, onCambio }: { articulo: Articulo; onCambio: () => void }) {
  const lista = useRecurso(() => I.movimientos(articulo.id), [articulo.id]);
  const ultimo = lista.data?.[0];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Movimientos · {articulo.nombre}</DialogTitle>
        <DialogDescription>Solo se puede anular el último movimiento que no sea de un caso. Para corregir otros, usa un ajuste.</DialogDescription>
      </DialogHeader>
      {lista.error && <p className="text-sm text-red-600">{lista.error}</p>}
      <div className="overflow-x-auto max-h-[50vh]">
        <table className="w-full text-left text-sm">
          <thead className="text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-2 pr-3 font-semibold">Fecha</th>
              <th className="py-2 px-3 font-semibold">Tipo</th>
              <th className="py-2 px-3 text-right font-semibold">Cantidad</th>
              <th className="py-2 px-3 text-right font-semibold">Costo</th>
              <th className="py-2 px-3 text-right font-semibold">Stock</th>
              <th className="py-2 pl-3 font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {lista.data?.map((m) => (
              <tr key={m.id}>
                <td className="py-2 pr-3 whitespace-nowrap">{fechaCorta(m.fecha)}</td>
                <td className="py-2 px-3">{m.tipo === "ENTRADA" ? "Entrada" : m.tipo === "SALIDA" ? "Salida" : "Ajuste"}</td>
                <td className="py-2 px-3 text-right tabular-nums">{m.tipo === "SALIDA" ? -m.cantidad : m.cantidad > 0 && m.tipo === "AJUSTE" ? `+${m.cantidad}` : m.cantidad}</td>
                <td className="py-2 px-3 text-right tabular-nums">{soles(m.costo_total)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{m.stock_resultante}</td>
                <td className="py-2 pl-3 text-xs text-slate-500">
                  {m.caso_id ? "Uso en servicio" : m.motivo ?? m.proveedor ?? ""}
                  {m.gasto_id ? " · con gasto" : ""}
                </td>
              </tr>
            ))}
            {lista.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400">Sin movimientos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {ultimo && !ultimo.caso_id && (
        <DialogFooter>
          <Button
            variant="outline"
            className="text-red-600"
            onClick={async () => {
              if (await ejecutar(() => I.anularMovimiento(ultimo.id), "Movimiento anulado.", "No se pudo anular.")) {
                lista.recargar();
                onCambio();
              }
            }}
          >
            Anular el último movimiento
          </Button>
        </DialogFooter>
      )}
    </>
  );
}
