import { useState, type ReactNode } from "react";
import {
  TruckIcon,
  ShieldCheckIcon,
  ClipboardCheckIcon,
  WrenchIcon,
  FuelIcon,
  PlusIcon,
  PlusCircleIcon,
  PrinterIcon,
  PencilIcon,
  BellRingIcon,
  DownloadIcon,
  FileTextIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  GaugeIcon,
  PiggyBankIcon,
  RefreshCwIcon,
  HeartHandshakeIcon,
  SnowflakeIcon,
  AccessibilityIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notifySuccess } from "@/shared/utils";

// TODO: reemplazar por datos reales del módulo `vehiculos` cuando se exponga el endpoint.
const FICHA = {
  placa: "BXY-842",
  codigoMovil: "Móvil 01",
  ciudad: "Lima, Perú",
  sede: "Sede San Borja, Lima",
  modelo: "Renault Kangoo Maxi 1.6",
  tipoUnidad: "Furgoneta de Custodia Especializada",
  anioFabricacion: 2022,
  estadoOperativo: "Operativo en Ruta / Sede",
};

const EQUIPAMIENTO = [
  { icon: SnowflakeIcon, label: "Cámara climatizada biocustodia (12°C - 16°C)" },
  { icon: AccessibilityIcon, label: "Rampa asistida de carga suave" },
  { icon: HeartHandshakeIcon, label: "Mantos térmicos dignos para traslado" },
];

const SOAT = {
  aseguradora: "Rímac Seguros",
  poliza: "N° 4029-881290",
  vigenciaHasta: "15 Noviembre 2025",
  diasParaVencer: 42,
};

const CITV = {
  certificado: "N° 99318-LIM",
  vigenteHasta: "Marzo 2026",
  planta: "Planta Autorizada Lince",
};

const MANTENIMIENTO = {
  proximoServicio: "Cambio de Aceite & Filtros (50,000 km)",
  faltanKm: 1750,
  taller: "Servicio Mecánico Automotriz San Borja",
  progresoPct: 65,
  ultimoHitoKm: "45k km",
  metaKm: "50k km",
  diasEstimados: 20,
  planKm: "5,000 km",
};

const HISTORIAL_MANTENIMIENTO = [
  { km: "45,000 km", detalle: "Preventivo General y Frenos", fecha: "12 Ago 2025 • Taller San Borja" },
  { km: "40,000 km", detalle: "Neumáticos Delanteros & Alineación", fecha: "24 Abr 2025 • Taller San Borja" },
  { km: "35,000 km", detalle: "Mantenimiento de Rutina 35k", fecha: "10 Ene 2025 • Taller San Borja" },
];

const COMBUSTIBLE = {
  rendimientoPromedio: "42 km / galón",
  gastoPromedioMensual: "S/ 680.00 PEN",
};

const REGISTROS_COMBUSTIBLE = [
  { fecha: "24 Octubre 2025", hora: "08:45 AM", estacion: "Grifo Primax (Av. Benavides)", tipo: "Gasolina 95", cantidad: "10.5 gal", km: "48,120 km", monto: "S/ 185.00" },
  { fecha: "18 Octubre 2025", hora: "05:15 PM", estacion: "Grifo Repsol (Surco)", tipo: "Gasolina 95", cantidad: "11.0 gal", km: "47,680 km", monto: "S/ 192.50" },
  { fecha: "10 Octubre 2025", hora: "09:30 AM", estacion: "Grifo Primax (San Isidro)", tipo: "Gasolina 95", cantidad: "9.8 gal", km: "47,250 km", monto: "S/ 171.50" },
];

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 lg:p-6 flex flex-col justify-between">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
              <Icon className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              <span className="text-xs text-slate-500">{subtitle}</span>
            </div>
          </div>
          {action}
        </div>
        {children}
      </div>
      {footer}
    </div>
  );
}

interface RegistroForm {
  tipo: string;
  kilometraje: string;
  monto: string;
  proveedor: string;
  notas: string;
}

const REGISTRO_INICIAL: RegistroForm = {
  tipo: "combustible",
  kilometraje: String(48250),
  monto: "",
  proveedor: "",
  notas: "",
};

function RegistroModal({
  open,
  onOpenChange,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardado: () => void;
}) {
  const [form, setForm] = useState<RegistroForm>(REGISTRO_INICIAL);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    setForm(REGISTRO_INICIAL);
    onGuardado();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="w-8 h-8 rounded-lg bg-operational/10 text-operational flex items-center justify-center shrink-0">
            <PlusCircleIcon className="size-5" />
          </div>
          <DialogTitle>Registrar Evento de {FICHA.codigoMovil}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Ingresa el comprobante o servicio para actualizar el odómetro y el balance operativo.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tipo-registro">Tipo de Registro</Label>
            <Select
              value={form.tipo}
              onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
            >
              <SelectTrigger id="tipo-registro">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combustible">Combustible (Gasolina 95)</SelectItem>
                <SelectItem value="mantenimiento-programado">Mantenimiento Preventivo Programado</SelectItem>
                <SelectItem value="mantenimiento-correctivo">Mantenimiento Correctivo / Imprevisto</SelectItem>
                <SelectItem value="lavado">Lavado y Desinfección Biocida</SelectItem>
                <SelectItem value="peajes">Peajes y Estacionamientos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="km-actual">Kilometraje Actual</Label>
              <Input
                id="km-actual"
                type="number"
                placeholder="Ej: 48250"
                required
                value={form.kilometraje}
                onChange={(e) => setForm((f) => ({ ...f, kilometraje: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monto-total">Monto Total (S/.)</Label>
              <Input
                id="monto-total"
                type="number"
                step="0.5"
                placeholder="0.00"
                required
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proveedor">Establecimiento / Taller / Proveedor</Label>
            <Input
              id="proveedor"
              placeholder="Ej: Primax Benavides o Taller San Borja"
              required
              value={form.proveedor}
              onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas u Observaciones</Label>
            <Textarea
              id="notas"
              rows={2}
              placeholder="Detalles adicionales del comprobante o estado del móvil..."
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="operational">
              Guardar en Bitácora
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VehiculoPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const handleGuardado = () => {
    notifySuccess(
      "El comprobante y kilometraje fueron actualizados en la ficha y módulo de gastos."
    );
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Vehículo" }]} />

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-xs font-semibold tracking-wide">
              {FICHA.codigoMovil}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{FICHA.estadoOperativo}</span>
            </div>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-xs">{FICHA.sede}</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Vehículo de Operaciones y Traslado
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl">
            Ficha técnica de la unidad única de custodia y logística digna. Monitoreo de estado
            mecánico, SOAT y consumos operativos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-1.5 h-10"
            onClick={() =>
              notifySuccess("Generando expediente técnico vehicular en PDF...")
            }
          >
            <PrinterIcon className="size-4" />
            Exportar Ficha
          </Button>
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setModalOpen(true)}>
            <PlusCircleIcon className="size-4" />
            Registrar Mantenimiento / Gasto
          </Button>
        </div>
      </div>

      {/* Ficha del vehículo (hero) */}
      <section className="relative overflow-hidden bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 lg:p-8">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-gradient-to-tl from-brand-100/60 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 max-w-xl">
            <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 text-brand-500">
              <TruckIcon className="size-8" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {FICHA.placa}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-label font-semibold uppercase">
                  {FICHA.ciudad}
                </span>
              </div>
              <span className="text-sm text-brand-500 font-semibold mt-0.5 truncate">
                {FICHA.modelo}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {FICHA.tipoUnidad} • Fabricación {FICHA.anioFabricacion}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 shrink-0">
            <div className="flex flex-col p-3 rounded-lg bg-slate-50 min-w-[220px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Kilometraje Actual</span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hace 2h
                </span>
              </div>
              <span className="text-lg font-bold text-slate-900 mt-0.5">48,250 km</span>
              <Button
                variant="outline-brand"
                size="sm"
                className="mt-2 w-full"
                onClick={() =>
                  notifySuccess("Apertura de formulario rápido de odómetro manual.")
                }
              >
                <PencilIcon className="size-3.5" />
                Actualizar Kilometraje
              </Button>
            </div>
            <Button className="gap-1.5 h-11 shrink-0" onClick={() => setModalOpen(true)}>
              <FuelIcon className="size-4" />
              Registrar Consumo de Combustible
            </Button>
          </div>
        </div>

        {/* Equipamiento de custodia */}
        <div className="mt-6 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60 rounded-lg p-4">
          <div className="flex items-center gap-2 text-brand-500 shrink-0">
            <HeartHandshakeIcon className="size-5" />
            <span className="text-sm font-semibold text-slate-900">Equipamiento de Custodia:</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            {EQUIPAMIENTO.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-slate-600">
                <Icon className="size-4 text-brand-400" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Documentación legal + Mantenimiento */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: SOAT + CITV */}
        <div className="flex flex-col gap-6">
          <SectionCard
            icon={ShieldCheckIcon}
            title="SOAT (Seguro Obligatorio)"
            subtitle="Regulación MTC / Cobertura de Accidentes"
            action={
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Vence en {SOAT.diasParaVencer} días
                </div>
                <Button
                  variant="outline-brand"
                  size="sm"
                  onClick={() =>
                    notifySuccess("Formulario para ingresar póliza y comprobante de renovación.")
                  }
                >
                  <PlusIcon className="size-4" />
                  Registrar SOAT / Renovar
                </Button>
              </div>
            }
            footer={
              <div className="mt-4 pt-2">
                <Button
                  variant="soft"
                  className="w-full"
                  onClick={() =>
                    notifySuccess("Abriendo visualizador seguro de PDF oficial Rímac.")
                  }
                >
                  <DownloadIcon className="size-4" />
                  Ver Certificado Digital SOAT (PDF)
                </Button>
              </div>
            }
          >
            <div className="space-y-3 my-1">
              <div className="p-3 rounded-lg bg-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Póliza SOAT Electrónica</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {SOAT.aseguradora} • {SOAT.poliza}
                  </span>
                  <span className="text-xs text-slate-500">Vigencia: {SOAT.vigenciaHasta}</span>
                </div>
                <CheckCircle2Icon className="size-6 text-brand-500 shrink-0" />
              </div>
              <div className="p-3 rounded-lg bg-brand-50 flex items-start gap-3">
                <BellRingIcon className="size-5 text-brand-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    Alerta preventiva configurada
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alarma automática programada a 30 días del vencimiento (16 Octubre) para
                    renovación directa sin paralizar traslados.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={ClipboardCheckIcon}
            title="Inspección Técnica Vehicular (CITV)"
            subtitle="Certificación mecánica y de gases (MTC)"
            action={
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  Al día / Vigente
                </span>
                <Button
                  variant="outline-brand"
                  size="sm"
                  onClick={() =>
                    notifySuccess("Apertura de carga de certificado de revisión técnica.")
                  }
                >
                  <PlusIcon className="size-4" />
                  Registrar Inspección
                </Button>
              </div>
            }
            footer={
              <div className="mt-4 pt-2">
                <Button
                  variant="soft"
                  className="w-full"
                  onClick={() =>
                    notifySuccess("Abriendo visualizador de certificado técnico vehicular.")
                  }
                >
                  <FileTextIcon className="size-4" />
                  Ver Certificado CITV (PDF)
                </Button>
              </div>
            }
          >
            <div className="space-y-3 my-1">
              <div className="p-3 rounded-lg bg-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">
                    Certificado de Inspección Técnica Vigente
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    Certificado {CITV.certificado}
                  </span>
                  <span className="text-xs text-slate-500">
                    Vigente hasta {CITV.vigenteHasta} • {CITV.planta}
                  </span>
                </div>
                <ClipboardCheckIcon className="size-6 text-brand-500 shrink-0" />
              </div>
              <p className="text-xs text-slate-500 px-1">
                Revisión reglamentaria obligatoria anual conforme a la normativa del MTC para
                vehículos de transporte de servicios fúnebres.
              </p>
            </div>
          </SectionCard>
        </div>

        {/* Columna derecha: Mantenimientos preventivos */}
        <SectionCard
          icon={WrenchIcon}
          title="Mantenimientos Preventivos"
          subtitle="Ciclo de vida y afinamiento del motor"
          action={<span className="text-xs text-brand-500 font-semibold">Plan {MANTENIMIENTO.planKm}</span>}
          footer={
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() =>
                  notifySuccess("Mostrando todos los registros de taller de la unidad.")
                }
                className="text-xs text-brand-500 font-semibold hover:underline inline-flex items-center gap-1"
              >
                Ver historial mecánico completo
                <ArrowRightIcon className="size-3.5" />
              </button>
            </div>
          }
        >
          <div className="p-4 rounded-xl bg-brand-500 text-white mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-label uppercase tracking-wider font-semibold text-brand-100">
                Próximo Servicio Recomendado
              </span>
              <span className="text-label bg-white/15 px-2 py-0.5 rounded">
                En ~{MANTENIMIENTO.diasEstimados} días
              </span>
            </div>
            <h3 className="text-sm font-bold">{MANTENIMIENTO.proximoServicio}</h3>
            <p className="text-xs text-brand-100 mt-1">
              Faltan {MANTENIMIENTO.faltanKm.toLocaleString("es-PE")} km • Taller:{" "}
              <strong className="text-white">{MANTENIMIENTO.taller}</strong>
            </p>
            <div className="w-full bg-white/15 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-300 h-2 rounded-full"
                style={{ width: `${MANTENIMIENTO.progresoPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-brand-100 mt-1">
              <span>Último: {MANTENIMIENTO.ultimoHitoKm}</span>
              <span>Meta: {MANTENIMIENTO.metaKm}</span>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-2">
            Últimas Intervenciones Conformes
          </span>
          <div className="space-y-2">
            {HISTORIAL_MANTENIMIENTO.map((item) => (
              <div
                key={item.km}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2Icon className="size-5 text-emerald-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.km} • {item.detalle}
                    </span>
                    <span className="text-xs text-slate-500">{item.fecha}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 shrink-0">
                  Conforme
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Bitácora de combustible */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500">
                <FuelIcon className="size-5" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">
                Bitácora de Consumo de Combustible
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sincronizado en tiempo real con el libro de gastos operativos del crematorio. No
              requiere doble registro contable.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
              <GaugeIcon className="size-4 text-brand-400" />
              <div className="flex flex-col leading-tight">
                <span className="text-label text-slate-500">Rendimiento Promedio</span>
                <span className="text-sm font-bold text-slate-900">
                  {COMBUSTIBLE.rendimientoPromedio}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
              <PiggyBankIcon className="size-4 text-emerald-600" />
              <div className="flex flex-col leading-tight">
                <span className="text-label text-slate-500">Gasto Promedio Mensual</span>
                <span className="text-sm font-bold text-brand-500">
                  {COMBUSTIBLE.gastoPromedioMensual}
                </span>
              </div>
            </div>
            <Button className="gap-1.5 h-11" onClick={() => setModalOpen(true)}>
              <FuelIcon className="size-4" />
              Registrar Consumo
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-label uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-lg font-semibold">Fecha</th>
                <th className="py-3 px-4 font-semibold">Estación de Servicio</th>
                <th className="py-3 px-4 font-semibold">Tipo &amp; Cantidad</th>
                <th className="py-3 px-4 font-semibold">Kilometraje Registrado</th>
                <th className="py-3 px-4 text-right rounded-r-lg font-semibold">Importe Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REGISTROS_COMBUSTIBLE.map((r) => (
                <tr key={r.fecha + r.estacion} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-slate-900">
                    {r.fecha}
                    <span className="block text-xs text-slate-500 font-normal">{r.hora}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <FuelIcon className="size-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-900">{r.estacion}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {r.tipo}
                    </span>
                    <span className="text-slate-500 ml-1.5">{r.cantidad}</span>
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-500">{r.km}</td>
                  <td className="py-4 px-4 text-right text-sm font-bold text-brand-500">
                    {r.monto}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 text-slate-500 text-xs">
          <span className="flex items-center gap-1.5">
            <RefreshCwIcon className="size-3.5 text-brand-400" />
            Último ticket sincronizado automáticamente desde la App de Conductor Móvil.
          </span>
          <button
            type="button"
            onClick={() =>
              notifySuccess("Exportando historial de combustible en formato Excel.")
            }
            className="hover:text-brand-500 font-semibold transition-colors"
          >
            Exportar Libro de Combustible (.CSV)
          </button>
        </div>
      </section>

      <RegistroModal open={modalOpen} onOpenChange={setModalOpen} onGuardado={handleGuardado} />
    </>
  );
}
