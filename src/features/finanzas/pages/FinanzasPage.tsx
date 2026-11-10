import { useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusCircleIcon, SettingsIcon, Trash2Icon, Undo2Icon } from "lucide-react";
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
import { soles } from "@/features/casos/utils/casos";
import * as F from "../api";
import {
  CATEGORIA_LABEL,
  GRUPO_LABEL,
  type CategoriaGasto,
  type Frecuencia,
  type Gasto,
  type GastoFijo,
  type GastoFijoDelMes,
  type GrupoGastoFijo,
} from "../types";
import { desplazarMes, etiquetaMes, formatFechaCorta, hoyISO, mesKey } from "../utils/periodo";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";

const ORIGEN_LABEL = { MANUAL: "", VEHICULO: "Vehículo", INVENTARIO: "Inventario" } as const;
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

type Dialogo =
  | { tipo: "mes"; fila: GastoFijoDelMes }
  | { tipo: "fijos" }
  | { tipo: "gasto"; gasto: Gasto | null };

/** Ingresos y Gastos del mes (spec finanzas). Los ingresos salen de los casos realizados. */
export default function FinanzasPage() {
  const [mes, setMes] = useState(() => mesKey(new Date()));
  const recurso = useRecurso(() => F.cargarMes(mes), [mes]);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const cerrar = () => setDialogo(null);
  const hecho = () => {
    recurso.recargar();
    cerrar();
  };
  const d = recurso.data;
  const resultado = Number(d?.resumen.resultado ?? 0);

  const anular = async (fila: GastoFijoDelMes) => {
    if (await ejecutar(() => F.anularMes(fila.gasto_fijo_id, mes), "Registro anulado: vuelve al monto base.", "No se pudo anular.")) recurso.recargar();
  };
  const borrarGasto = async (g: Gasto) => {
    if (await ejecutar(() => F.eliminarGasto(g.id), "Gasto eliminado.", "No se pudo eliminar.")) recurso.recargar();
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Finanzas" }, { label: "Ingresos y Gastos" }]} />
      <ModuleHeader
        title="Ingresos y Gastos"
        description="Ingresos de los servicios realizados, gastos fijos (registrados o estimados) y gastos variables del mes."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" title="Mes anterior" onClick={() => setMes((m) => desplazarMes(m, -1))}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-semibold min-w-36 text-center">{etiquetaMes(mes)}</span>
            <Button variant="outline" size="icon-sm" title="Mes siguiente" onClick={() => setMes((m) => desplazarMes(m, 1))}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        }
      />

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi titulo="Ingresos" valor={soles(d?.resumen.ingresos.total)} pie={`${d?.resumen.ingresos.cantidad ?? 0} servicios realizados`} />
        <Kpi
          titulo="Gastos fijos"
          valor={soles(d?.resumen.gastos_fijos.total)}
          pie={`${soles(d?.resumen.gastos_fijos.registrado)} registrado · ${soles(d?.resumen.gastos_fijos.estimado)} estimado`}
        />
        <Kpi titulo="Gastos variables" valor={soles(d?.resumen.gastos_variables.total)} pie={`${d?.variables.length ?? 0} gastos`} />
        <Kpi titulo="Resultado" valor={soles(resultado)} pie="Ingresos − gastos" clase={resultado < 0 ? "text-red-600" : "text-emerald-600"} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel
          titulo="Gastos fijos del mes"
          descripcion="Sin registro se usa el monto base (estimado). Registra el monto real cuando cambie, por ejemplo en julio y diciembre."
          accion={
            <Button variant="outline" size="sm" onClick={() => setDialogo({ tipo: "fijos" })}>
              <SettingsIcon className="size-4" />
              Administrar
            </Button>
          }
        >
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {d?.fijos.map((f) => (
              <li key={f.gasto_fijo_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium truncate">{f.nombre}</span>
                  <span className="text-xs text-slate-500">
                    {GRUPO_LABEL[f.grupo]}
                    {f.frecuencia === "ANUAL" ? " · anual" : ""}
                    {f.saldo_pendiente != null ? ` · saldo ${soles(f.saldo_pendiente)}` : ""}
                    {f.observaciones ? ` · ${f.observaciones}` : ""}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 shrink-0">
                  <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", f.estado === "REGISTRADO" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                    {f.estado === "REGISTRADO" ? "Real" : "Estimado"}
                  </span>
                  <span className="font-semibold w-24 text-right">{soles(f.monto)}</span>
                  <Button variant="ghost" size="icon-sm" title="Registrar monto real" onClick={() => setDialogo({ tipo: "mes", fila: f })}>
                    <PencilIcon className="size-4" />
                  </Button>
                  {f.estado === "REGISTRADO" && (
                    <Button variant="ghost" size="icon-sm" title="Anular registro" onClick={() => anular(f)}>
                      <Undo2Icon className="size-4" />
                    </Button>
                  )}
                </span>
              </li>
            ))}
            {d && d.fijos.length === 0 && <li className="py-3 text-sm text-slate-400">No hay gastos fijos para este mes.</li>}
          </ul>
        </Panel>

        <Panel
          titulo="Gastos variables"
          descripcion="Los del vehículo y las compras de inventario se corrigen en su módulo."
          accion={
            <Button variant="operational" size="sm" onClick={() => setDialogo({ tipo: "gasto", gasto: null })}>
              <PlusCircleIcon className="size-4" />
              Nuevo gasto
            </Button>
          }
        >
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {d?.variables.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium truncate">{g.concepto}</span>
                  <span className="text-xs text-slate-500">
                    {formatFechaCorta(g.fecha.slice(0, 10))} · {CATEGORIA_LABEL[g.categoria]}
                    {g.proveedor ? ` · ${g.proveedor}` : ""}
                    {g.origen !== "MANUAL" ? ` · desde ${ORIGEN_LABEL[g.origen]}` : ""}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 shrink-0">
                  <span className="font-semibold w-24 text-right">{soles(g.monto)}</span>
                  {g.origen === "MANUAL" && (
                    <>
                      <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setDialogo({ tipo: "gasto", gasto: g })}>
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Eliminar" className="text-slate-400 hover:text-red-600" onClick={() => borrarGasto(g)}>
                        <Trash2Icon className="size-4" />
                      </Button>
                    </>
                  )}
                </span>
              </li>
            ))}
            {d && d.variables.length === 0 && <li className="py-3 text-sm text-slate-400">Sin gastos variables este mes.</li>}
          </ul>
        </Panel>
      </div>

      <Panel titulo="Ingresos del mes" descripcion="Cada servicio realizado, en la fecha del servicio, por su precio.">
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {d?.ingresos.map((i) => (
            <li key={i.caso_id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                <span className="font-medium">{i.mascota}</span>
                <span className="text-xs text-slate-500">
                  {" "}· {formatFechaCorta(i.fecha.slice(0, 10))} · {i.servicio}
                  {i.canal_origen === "VETERINARIA_REFERIDORA" ? " · veterinaria" : ""}
                </span>
              </span>
              <span className="font-semibold">{soles(i.monto)}</span>
            </li>
          ))}
          {d && d.ingresos.length === 0 && <li className="py-3 text-sm text-slate-400">Sin servicios realizados este mes.</li>}
        </ul>
      </Panel>

      <Modal open={dialogo !== null} onOpenChange={(o) => !o && cerrar()} ancho={dialogo?.tipo === "fijos" ? "sm:max-w-3xl" : "sm:max-w-lg"}>
        {dialogo?.tipo === "mes" && <MesForm fila={dialogo.fila} mes={mes} onCerrar={cerrar} onHecho={hecho} />}
        {dialogo?.tipo === "fijos" && <AdministrarFijos onCambio={recurso.recargar} />}
        {dialogo?.tipo === "gasto" && <GastoForm gasto={dialogo.gasto} onCerrar={cerrar} onHecho={hecho} />}
      </Modal>
    </>
  );
}

function Kpi({ titulo, valor, pie, clase }: { titulo: string; valor: string; pie: string; clase?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5">
      <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">{titulo}</span>
      <span className={cn("block text-2xl font-bold text-slate-900 dark:text-white mt-1", clase)}>{valor}</span>
      <span className="block text-xs text-slate-500 mt-1">{pie}</span>
    </div>
  );
}

function Panel({ titulo, descripcion, accion, children }: { titulo: string; descripcion: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
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

function Pie({ onCerrar, onGuardar, guardando, error, texto = "Guardar" }: { onCerrar: () => void; onGuardar: () => void; guardando: boolean; error: string | null; texto?: string }) {
  return (
    <>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={onGuardar} disabled={guardando}>
          {guardando ? "Guardando…" : texto}
        </Button>
      </DialogFooter>
    </>
  );
}

function leerMonto(t: string): string | null {
  const n = Number(t.trim().replace(",", "."));
  return t.trim() !== "" && Number.isFinite(n) && n > 0 ? n.toFixed(2) : null;
}

function MesForm({ fila, mes, onCerrar, onHecho }: { fila: GastoFijoDelMes; mes: string; onCerrar: () => void; onHecho: () => void }) {
  const [monto, setMonto] = useState(String(Number(fila.monto)));
  const [obs, setObs] = useState(fila.observaciones ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const m = leerMonto(monto);
    if (!m) return setError("El monto debe ser mayor a 0.");
    setGuardando(true);
    const ok = await ejecutar(() => F.registrarMes(fila.gasto_fijo_id, mes, m, obs.trim() || null), "Monto del mes registrado.", "No se pudo registrar.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{fila.nombre} · {etiquetaMes(mes)}</DialogTitle>
        <DialogDescription>
          Monto base: {soles(fila.monto_base)}.
          {fila.saldo_pendiente != null ? ` El pago descuenta el saldo del préstamo (${soles(fila.saldo_pendiente)}).` : ""}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="me-monto">Monto real (S/)</Label>
          <Input id="me-monto" type="number" min={0} step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="me-obs">Nota (opcional)</Label>
          <Input id="me-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Gratificación" />
        </div>
      </div>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} texto="Registrar" />
    </>
  );
}

function AdministrarFijos({ onCambio }: { onCambio: () => void }) {
  const fijos = useRecurso(F.listarFijos);
  const [editando, setEditando] = useState<GastoFijo | "nuevo" | null>(null);
  const recargar = () => {
    fijos.recargar();
    onCambio();
  };

  if (editando) {
    return (
      <FijoForm
        fijo={editando === "nuevo" ? null : editando}
        onCerrar={() => setEditando(null)}
        onHecho={() => {
          setEditando(null);
          recargar();
        }}
      />
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Gastos fijos</DialogTitle>
        <DialogDescription>Monto base, frecuencia y saldo de préstamos. Un gasto con meses registrados no se borra: se desactiva.</DialogDescription>
      </DialogHeader>
      {fijos.error && <p className="text-sm text-red-600">{fijos.error}</p>}
      <ul className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
        {fijos.data?.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 py-2">
            <span className={cn(!f.activo && "text-slate-400")}>
              <span className="font-medium">{f.nombre}</span>
              <span className="text-xs text-slate-500">
                {" "}· {GRUPO_LABEL[f.grupo]} · {soles(f.monto)} {f.frecuencia === "ANUAL" ? `anual (${MESES[(f.mes_pago ?? 1) - 1]})` : "mensual"}
                {f.saldo_pendiente != null ? ` · saldo ${soles(f.saldo_pendiente)}` : ""}
                {!f.activo ? " · inactivo" : ""}
              </span>
            </span>
            <span className="inline-flex gap-1">
              <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setEditando(f)}>
                <PencilIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Eliminar"
                className="text-slate-400 hover:text-red-600"
                onClick={async () => (await ejecutar(() => F.eliminarFijo(f.id), "Gasto fijo eliminado.", "No se pudo eliminar.")) && recargar()}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </span>
          </li>
        ))}
      </ul>
      <DialogFooter>
        <Button variant="operational" onClick={() => setEditando("nuevo")}>
          <PlusCircleIcon className="size-4" />
          Nuevo gasto fijo
        </Button>
      </DialogFooter>
    </>
  );
}

function FijoForm({ fijo, onCerrar, onHecho }: { fijo: GastoFijo | null; onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState({
    nombre: fijo?.nombre ?? "",
    grupo: (fijo?.grupo ?? "SERVICIOS") as GrupoGastoFijo,
    monto: fijo ? String(Number(fijo.monto)) : "",
    frecuencia: (fijo?.frecuencia ?? "MENSUAL") as Frecuencia,
    mes_pago: String(fijo?.mes_pago ?? 1),
    saldo: fijo?.saldo_pendiente != null ? String(Number(fijo.saldo_pendiente)) : "",
    activo: fijo?.activo ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const esPrestamo = f.grupo === "PRESTAMOS";

  const guardar = async () => {
    const monto = leerMonto(f.monto);
    if (!f.nombre.trim()) return setError("Escribe el nombre.");
    if (!monto) return setError("El monto base debe ser mayor a 0.");
    let saldo: string | null = null;
    if (esPrestamo && f.saldo.trim() !== "") {
      const n = Number(f.saldo);
      if (!Number.isFinite(n) || n < 0) return setError("El saldo no es válido.");
      saldo = n.toFixed(2);
    }
    const cuerpo: F.GastoFijoCuerpo = {
      nombre: f.nombre.trim(),
      grupo: f.grupo,
      monto,
      frecuencia: f.frecuencia,
      mes_pago: f.frecuencia === "ANUAL" ? Number(f.mes_pago) : null,
      saldo_pendiente: saldo,
      activo: f.activo,
      observaciones: null,
    };
    setGuardando(true);
    const ok = await ejecutar(() => (fijo ? F.editarFijo(fijo.id, cuerpo) : F.crearFijo(cuerpo)), "Gasto fijo guardado.", "No se pudo guardar.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{fijo ? "Editar gasto fijo" : "Nuevo gasto fijo"}</DialogTitle>
        <DialogDescription>Cambiar el monto base no altera los meses ya registrados.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="gf-nombre">Nombre</Label>
          <Input id="gf-nombre" value={f.nombre} onChange={(e) => setF((x) => ({ ...x, nombre: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium leading-none">Grupo</span>
          <BotonesOpcion ariaLabel="Grupo" value={f.grupo} onChange={(v) => setF((x) => ({ ...x, grupo: v }))} opciones={(Object.keys(GRUPO_LABEL) as GrupoGastoFijo[]).map((g) => ({ value: g, label: GRUPO_LABEL[g] }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gf-monto">{esPrestamo ? "Cuota (S/)" : "Monto base (S/)"}</Label>
          <Input id="gf-monto" type="number" min={0} step="0.01" value={f.monto} onChange={(e) => setF((x) => ({ ...x, monto: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium leading-none">Frecuencia</span>
          <BotonesOpcion ariaLabel="Frecuencia" columnas="grid-cols-2" value={f.frecuencia} onChange={(v) => setF((x) => ({ ...x, frecuencia: v }))} opciones={[{ value: "MENSUAL" as Frecuencia, label: "Mensual" }, { value: "ANUAL" as Frecuencia, label: "Anual" }]} />
        </div>
        {f.frecuencia === "ANUAL" && (
          <div className="space-y-1.5">
            <Label htmlFor="gf-mes">Mes de pago</Label>
            <Select value={f.mes_pago} onValueChange={(v) => setF((x) => ({ ...x, mes_pago: v }))}>
              <SelectTrigger id="gf-mes" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {esPrestamo && (
          <div className="space-y-1.5">
            <Label htmlFor="gf-saldo">Saldo pendiente (S/)</Label>
            <Input id="gf-saldo" type="number" min={0} step="0.01" value={f.saldo} onChange={(e) => setF((x) => ({ ...x, saldo: e.target.value }))} />
          </div>
        )}
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={f.activo} onChange={(e) => setF((x) => ({ ...x, activo: e.target.checked }))} />
        Activo (se estima en los meses sin registro)
      </label>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} />
    </>
  );
}

function GastoForm({ gasto, onCerrar, onHecho }: { gasto: Gasto | null; onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState({
    fecha: gasto?.fecha.slice(0, 10) ?? hoyISO(),
    concepto: gasto?.concepto ?? "",
    categoria: (gasto?.categoria ?? "COMPRAS_VARIAS") as CategoriaGasto,
    monto: gasto ? String(Number(gasto.monto)) : "",
    proveedor: gasto?.proveedor ?? "",
    observaciones: gasto?.observaciones ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const monto = leerMonto(f.monto);
    if (!f.concepto.trim()) return setError("Escribe el concepto.");
    if (!monto) return setError("El monto debe ser mayor a 0.");
    const cuerpo: F.GastoCuerpo = {
      fecha: `${f.fecha}T12:00:00`,
      concepto: f.concepto.trim(),
      categoria: f.categoria,
      monto,
      proveedor: f.proveedor.trim() || null,
      observaciones: f.observaciones.trim() || null,
    };
    setGuardando(true);
    const ok = await ejecutar(() => (gasto ? F.editarGasto(gasto.id, cuerpo) : F.crearGasto(cuerpo)), "Gasto guardado.", "No se pudo guardar.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{gasto ? "Editar gasto" : "Nuevo gasto variable"}</DialogTitle>
        <DialogDescription>Combustible y mantenimiento se registran mejor desde Vehículo; las compras de urnas, desde Inventario.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ga-fecha">Fecha</Label>
          <DatePicker id="ga-fecha" value={f.fecha} onChange={(v) => setF((x) => ({ ...x, fecha: v }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ga-categoria">Categoría</Label>
          <Select value={f.categoria} onValueChange={(v) => setF((x) => ({ ...x, categoria: v as CategoriaGasto }))}>
            <SelectTrigger id="ga-categoria" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORIA_LABEL) as CategoriaGasto[]).map((c) => (
                <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ga-concepto">Concepto</Label>
          <Input id="ga-concepto" value={f.concepto} onChange={(e) => setF((x) => ({ ...x, concepto: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ga-monto">Monto (S/)</Label>
          <Input id="ga-monto" type="number" min={0} step="0.01" value={f.monto} onChange={(e) => setF((x) => ({ ...x, monto: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ga-proveedor">Proveedor (opcional)</Label>
          <Input id="ga-proveedor" value={f.proveedor} onChange={(e) => setF((x) => ({ ...x, proveedor: e.target.value }))} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ga-obs">Observaciones</Label>
          <Input id="ga-obs" value={f.observaciones} onChange={(e) => setF((x) => ({ ...x, observaciones: e.target.value }))} />
        </div>
      </div>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} />
    </>
  );
}
