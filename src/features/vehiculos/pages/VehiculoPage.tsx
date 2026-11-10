import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  CalendarCheckIcon,
  DropletsIcon,
  FileCheckIcon,
  FuelIcon,
  PencilIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  TicketIcon,
  Trash2Icon,
  TruckIcon,
  WrenchIcon,
} from "lucide-react";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
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
import { formatFechaLarga, hoyISO } from "@/features/finanzas/utils/periodo";
import * as V from "../api";

function diasHasta(fecha: string | null): number | null {
  if (!fecha) return null;
  const hoy = new Date(`${hoyISO()}T00:00:00`).getTime();
  return Math.round((new Date(`${fecha}T00:00:00`).getTime() - hoy) / 86_400_000);
}

function Vence({ fecha }: { fecha: string | null }) {
  const dias = diasHasta(fecha);
  if (dias === null) return <span className="text-xs text-slate-400">Sin fecha registrada</span>;
  const clase = dias < 0 ? "bg-red-50 text-red-700" : dias <= 30 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  const texto = dias < 0 ? `Vencido hace ${-dias} días` : `Vence en ${dias} días`;
  return <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", clase)}>{texto}</span>;
}

/** Vehículo: ficha, documentos y bitácora. Cada registro crea su gasto (spec finanzas §2.4). */
export default function VehiculoPage() {
  const vehiculos = useRecurso(V.listar);
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const lista = vehiculos.data ?? [];
  const vehiculo = lista.find((v) => v.id === elegidoId) ?? lista[0] ?? null;
  const [dialogo, setDialogo] = useState<"ficha" | "nuevo" | "evento" | null>(null);

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Vehículo" }]} />
      <ModuleHeader
        title="Vehículo"
        description="Ficha, SOAT, CITV y bitácora. Cada carga o mantenimiento aparece también en Ingresos y Gastos."
        actions={
          <div className="flex items-center gap-2">
            {lista.length > 1 && (
              <Select value={vehiculo?.id ?? ""} onValueChange={setElegidoId}>
                <SelectTrigger className="w-44" aria-label="Vehículo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lista.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.codigo_movil ?? v.placa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={() => setDialogo("nuevo")}>
              <PlusCircleIcon className="size-4" />
              Agregar vehículo
            </Button>
          </div>
        }
      />

      {vehiculos.error && <p className="text-sm text-red-600">{vehiculos.error}</p>}
      {!vehiculos.cargando && !vehiculo && <p className="text-sm text-slate-500">Aún no hay vehículos registrados.</p>}

      {vehiculo && <Panel key={vehiculo.id} vehiculo={vehiculo} onEditar={() => setDialogo("ficha")} onRegistrar={() => setDialogo("evento")} recargarVehiculo={vehiculos.recargar} dialogoEvento={dialogo === "evento"} cerrarEvento={() => setDialogo(null)} />}

      <Modal open={dialogo === "ficha" || dialogo === "nuevo"} onOpenChange={(o) => !o && setDialogo(null)} ancho="sm:max-w-2xl">
        {(dialogo === "ficha" || dialogo === "nuevo") && (
          <FichaForm
            vehiculo={dialogo === "ficha" ? vehiculo : null}
            onCerrar={() => setDialogo(null)}
            onHecho={() => {
              vehiculos.recargar();
              setDialogo(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function Tarjeta({ icono: Icono, titulo, accion, children }: { icono: typeof TruckIcon; titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
            <Icono className="size-5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{titulo}</h2>
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{etiqueta}</span>
      <span className="font-medium text-right">{valor ?? "—"}</span>
    </div>
  );
}

function Panel({
  vehiculo: v,
  onEditar,
  onRegistrar,
  recargarVehiculo,
  dialogoEvento,
  cerrarEvento,
}: {
  vehiculo: V.Vehiculo;
  onEditar: () => void;
  onRegistrar: () => void;
  recargarVehiculo: () => void;
  dialogoEvento: boolean;
  cerrarEvento: () => void;
}) {
  const eventos = useRecurso(() => V.eventos(v.id), [v.id]);
  const [ahora] = useState(() => Date.now());
  const lista = useMemo(() => eventos.data ?? [], [eventos.data]);

  const combustible = useMemo(() => {
    const cargas = lista.filter((e) => e.tipo === "COMBUSTIBLE").sort((a, b) => a.kilometraje - b.kilometraje);
    let km = 0;
    let gal = 0;
    for (let i = 1; i < cargas.length; i++) {
      km += cargas[i].kilometraje - cargas[i - 1].kilometraje;
      gal += Number(cargas[i].galones ?? 0);
    }
    const hace30 = new Date(ahora - 30 * 86_400_000).toISOString().slice(0, 10);
    const gasto30 = cargas.filter((c) => c.fecha >= hace30).reduce((a, c) => a + Number(c.monto), 0);
    return { rendimiento: gal > 0 ? km / gal : null, gasto30 };
  }, [lista, ahora]);

  const recargar = () => {
    eventos.recargar();
    recargarVehiculo();
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tarjeta icono={TruckIcon} titulo={`${v.codigo_movil ?? "Vehículo"} · ${v.placa}`} accion={<Button variant="ghost" size="icon-sm" title="Editar ficha" onClick={onEditar}><PencilIcon className="size-4" /></Button>}>
          <Dato etiqueta="Modelo" valor={v.modelo} />
          <Dato etiqueta="Tipo de unidad" valor={v.tipo_unidad} />
          <Dato etiqueta="Año" valor={v.anio_fabricacion} />
          <Dato etiqueta="Kilometraje" valor={v.kilometraje_actual != null ? `${v.kilometraje_actual.toLocaleString("es-PE")} km` : null} />
          <Dato etiqueta="Estado" valor={v.estado === "ACTIVO" ? "Operativo" : "Inactivo"} />
        </Tarjeta>
        <Tarjeta icono={ShieldCheckIcon} titulo="SOAT" accion={<Vence fecha={v.soat_vence} />}>
          <Dato etiqueta="Aseguradora" valor={v.soat_aseguradora} />
          <Dato etiqueta="Póliza" valor={v.soat_poliza} />
          <Dato etiqueta="Vigencia hasta" valor={v.soat_vence ? formatFechaLarga(v.soat_vence) : null} />
        </Tarjeta>
        <Tarjeta icono={FileCheckIcon} titulo="Inspección técnica (CITV)" accion={<Vence fecha={v.citv_vence} />}>
          <Dato etiqueta="Certificado" valor={v.citv_certificado} />
          <Dato etiqueta="Planta" valor={v.citv_planta} />
          <Dato etiqueta="Vigente hasta" valor={v.citv_vence ? formatFechaLarga(v.citv_vence) : null} />
        </Tarjeta>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Tarjeta icono={FuelIcon} titulo="Combustible">
          <Dato etiqueta="Rendimiento promedio" valor={combustible.rendimiento ? `${combustible.rendimiento.toFixed(1)} km / galón` : "Faltan cargas para calcularlo"} />
          <Dato etiqueta="Gasto en los últimos 30 días" valor={soles(combustible.gasto30)} />
        </Tarjeta>
        <Tarjeta icono={WrenchIcon} titulo="Últimos mantenimientos">
          {lista.filter((e) => e.tipo.startsWith("MANTENIMIENTO")).slice(0, 3).map((e) => (
            <Dato key={e.id} etiqueta={`${formatFechaLarga(e.fecha)} · ${e.kilometraje.toLocaleString("es-PE")} km`} valor={`${V.TIPO_EVENTO_LABEL[e.tipo]} · ${soles(e.monto)}`} />
          ))}
          {!lista.some((e) => e.tipo.startsWith("MANTENIMIENTO")) && <p className="text-sm text-slate-400">Sin mantenimientos registrados.</p>}
        </Tarjeta>
      </div>

      <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Bitácora</h2>
            <p className="text-xs text-slate-500">El kilometraje debe respetar el orden de las fechas. Borrar un registro borra su gasto.</p>
          </div>
          <Button variant="operational" onClick={onRegistrar}>
            <PlusCircleIcon className="size-4" />
            Registrar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 font-semibold">Fecha</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold">Kilometraje</th>
                <th className="py-3 px-4 font-semibold">Galones</th>
                <th className="py-3 px-4 font-semibold">Proveedor</th>
                <th className="py-3 px-4 font-semibold text-right">Monto</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {lista.map((e) => (
                <tr key={e.id}>
                  <td className="py-2.5 px-4 whitespace-nowrap">{formatFechaLarga(e.fecha)}</td>
                  <td className="py-2.5 px-4">{V.TIPO_EVENTO_LABEL[e.tipo]}</td>
                  <td className="py-2.5 px-4">{e.kilometraje.toLocaleString("es-PE")} km</td>
                  <td className="py-2.5 px-4">{e.galones ? Number(e.galones) : "—"}</td>
                  <td className="py-2.5 px-4">{e.proveedor}</td>
                  <td className="py-2.5 px-4 text-right font-semibold">{soles(e.monto)}</td>
                  <td className="py-2.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Eliminar registro"
                      className="text-slate-400 hover:text-red-600"
                      onClick={async () => (await ejecutar(() => V.eliminarEvento(v.id, e.id), "Registro y su gasto eliminados.", "No se pudo eliminar.")) && recargar()}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!eventos.cargando && lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Sin registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={dialogoEvento} onOpenChange={(o) => !o && cerrarEvento()} ancho="sm:max-w-2xl">
        {dialogoEvento && (
          <EventoForm
            vehiculo={v}
            onCerrar={cerrarEvento}
            onHecho={() => {
              recargar();
              cerrarEvento();
            }}
          />
        )}
      </Modal>
    </>
  );
}

const ICONO_EVENTO: Record<V.TipoEvento, ComponentType<{ className?: string }>> = {
  COMBUSTIBLE: FuelIcon,
  MANTENIMIENTO_PROGRAMADO: CalendarCheckIcon,
  MANTENIMIENTO_CORRECTIVO: WrenchIcon,
  LAVADO: DropletsIcon,
  PEAJES: TicketIcon,
};

function EventoForm({ vehiculo, onCerrar, onHecho }: { vehiculo: V.Vehiculo; onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState({
    tipo: "COMBUSTIBLE" as V.TipoEvento,
    fecha: hoyISO(),
    kilometraje: vehiculo.kilometraje_actual != null ? String(vehiculo.kilometraje_actual) : "",
    galones: "",
    monto: "",
    proveedor: "",
    observaciones: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const esCombustible = f.tipo === "COMBUSTIBLE";

  const guardar = async () => {
    const km = Number(f.kilometraje);
    const monto = Number(f.monto);
    const galones = Number(f.galones);
    if (!Number.isInteger(km) || km <= 0) return setError("Ingresa el kilometraje actual (entero).");
    if (esCombustible && (!Number.isFinite(galones) || galones <= 0)) return setError("Ingresa los galones cargados.");
    if (!Number.isFinite(monto) || monto <= 0) return setError("El monto debe ser mayor a 0.");
    if (!f.proveedor.trim()) return setError("Indica el establecimiento o taller.");
    setGuardando(true);
    const ok = await ejecutar(
      () =>
        V.registrarEvento(vehiculo.id, {
          tipo: f.tipo,
          fecha: f.fecha,
          kilometraje: km,
          galones: esCombustible ? galones.toFixed(2) : null,
          monto: monto.toFixed(2),
          proveedor: f.proveedor.trim(),
          observaciones: f.observaciones.trim() || null,
        }),
      "Registro guardado. También aparece en Ingresos y Gastos.",
      "No se pudo registrar."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  const campo = (k: "kilometraje" | "galones" | "monto" | "proveedor" | "observaciones", label: string, tipo = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`ev-${k}`}>{label}</Label>
      <Input id={`ev-${k}`} type={tipo} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
    </div>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar · {vehiculo.codigo_movil ?? vehiculo.placa}</DialogTitle>
        <DialogDescription>Se guarda en la bitácora y en Gastos.</DialogDescription>
      </DialogHeader>
      <BotonesOpcion
        ariaLabel="Tipo de registro"
        columnas="grid-cols-3 sm:grid-cols-5"
        value={f.tipo}
        onChange={(t) => setF((x) => ({ ...x, tipo: t }))}
        opciones={(Object.keys(V.TIPO_EVENTO_LABEL) as V.TipoEvento[]).map((t) => ({
          value: t,
          label: V.TIPO_EVENTO_LABEL[t],
          icon: ICONO_EVENTO[t],
        }))}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ev-fecha">Fecha</Label>
          <DatePicker id="ev-fecha" value={f.fecha} onChange={(d) => setF((x) => ({ ...x, fecha: d }))} />
        </div>
        {campo("kilometraje", "Kilometraje", "number")}
        {esCombustible && campo("galones", "Galones", "number")}
        {campo("monto", "Monto (S/)", "number")}
        {campo("proveedor", "Establecimiento o taller")}
        <div className="sm:col-span-2">{campo("observaciones", "Notas")}</div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Registrar"}</Button>
      </DialogFooter>
    </>
  );
}

function FichaForm({ vehiculo, onCerrar, onHecho }: { vehiculo: V.Vehiculo | null; onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState(() => ({
    placa: vehiculo?.placa ?? "",
    codigo_movil: vehiculo?.codigo_movil ?? "",
    modelo: vehiculo?.modelo ?? "",
    tipo_unidad: vehiculo?.tipo_unidad ?? "",
    anio_fabricacion: vehiculo?.anio_fabricacion != null ? String(vehiculo.anio_fabricacion) : "",
    kilometraje_actual: vehiculo?.kilometraje_actual != null ? String(vehiculo.kilometraje_actual) : "",
    soat_aseguradora: vehiculo?.soat_aseguradora ?? "",
    soat_poliza: vehiculo?.soat_poliza ?? "",
    soat_vence: vehiculo?.soat_vence ?? "",
    citv_certificado: vehiculo?.citv_certificado ?? "",
    citv_planta: vehiculo?.citv_planta ?? "",
    citv_vence: vehiculo?.citv_vence ?? "",
    activo: vehiculo ? vehiculo.estado === "ACTIVO" : true,
  }));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  type Clave = Exclude<keyof typeof f, "activo" | "soat_vence" | "citv_vence">;
  const campo = (k: Clave, label: string, tipo = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`fi-${k}`}>{label}</Label>
      <Input id={`fi-${k}`} type={tipo} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
    </div>
  );
  const fecha = (k: "soat_vence" | "citv_vence", label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`fi-${k}`}>{label}</Label>
      <DatePicker id={`fi-${k}`} value={f[k]} onChange={(d) => setF((x) => ({ ...x, [k]: d }))} />
    </div>
  );

  const guardar = async () => {
    if (!f.placa.trim()) return setError("La placa es obligatoria.");
    const t = (s: string) => s.trim() || null;
    const n = (s: string) => (s.trim() === "" ? null : Number(s));
    const cuerpo: V.VehiculoCuerpo = {
      placa: f.placa.trim(),
      descripcion: vehiculo?.descripcion ?? null,
      estado: f.activo ? "ACTIVO" : "INACTIVO",
      codigo_movil: t(f.codigo_movil),
      modelo: t(f.modelo),
      tipo_unidad: t(f.tipo_unidad),
      anio_fabricacion: n(f.anio_fabricacion),
      kilometraje_actual: n(f.kilometraje_actual),
      soat_aseguradora: t(f.soat_aseguradora),
      soat_poliza: t(f.soat_poliza),
      soat_vence: f.soat_vence || null,
      citv_certificado: t(f.citv_certificado),
      citv_planta: t(f.citv_planta),
      citv_vence: f.citv_vence || null,
    };
    setGuardando(true);
    const ok = await ejecutar(() => (vehiculo ? V.editar(vehiculo.id, cuerpo) : V.crear(cuerpo)), "Vehículo guardado.", "No se pudo guardar.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{vehiculo ? "Editar ficha" : "Nuevo vehículo"}</DialogTitle>
        <DialogDescription>El kilometraje no puede quedar por debajo del último registro de la bitácora.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {campo("placa", "Placa")}
        {campo("codigo_movil", "Código (Móvil 01)")}
        {campo("modelo", "Modelo")}
        {campo("tipo_unidad", "Tipo de unidad")}
        {campo("anio_fabricacion", "Año", "number")}
        {campo("kilometraje_actual", "Kilometraje", "number")}
        {campo("soat_aseguradora", "SOAT · aseguradora")}
        {campo("soat_poliza", "SOAT · póliza")}
        {fecha("soat_vence", "SOAT · vence")}
        {campo("citv_certificado", "CITV · certificado")}
        {campo("citv_planta", "CITV · planta")}
        {fecha("citv_vence", "CITV · vence")}
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={f.activo} onChange={(e) => setF((x) => ({ ...x, activo: e.target.checked }))} />
        Operativo
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button>
      </DialogFooter>
    </>
  );
}
