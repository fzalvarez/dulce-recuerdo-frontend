import { useMemo, useState, type ReactNode } from "react";
import {
  PawPrintIcon,
  HeartPulseIcon,
  HeartIcon,
  ShieldPlusIcon,
  Building2Icon,
  PhoneIcon,
  IdCardIcon,
  TagIcon,
  HistoryIcon,
  PlusIcon,
  TableIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  BanknoteIcon,
  CalendarDaysIcon,
  MessageCircleIcon,
  DownloadIcon,
  InfoIcon,
  Building2 as ApartmentIcon,
  PercentIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/shared/utils";

// TODO: reemplazar por datos reales del módulo `veterinarias` cuando se exponga el endpoint.
type TipoConvenio = "nivel-2" | "nivel-1" | "comision";

interface Clinica {
  id: string;
  nombre: string;
  topAliado?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  direccion: string;
  ruc: string;
  razonSocial: string;
  medico: string;
  cmpv: string;
  telefono: string;
  central: string;
  correo: string;
  convenioLabel: string;
  convenioDesc: string;
  convenioBadgeClass: string;
  tipo: TipoConvenio;
  derivaciones: number;
  comision: string;
}

const CLINICAS: Clinica[] = [
  {
    id: "petcare-sur",
    nombre: "PetCare Sur",
    topAliado: true,
    icon: PawPrintIcon,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    direccion: "Av. Benavides 4120, Surco • Lima",
    ruc: "20601948271",
    razonSocial: "Servicios Veterinarios del Sur S.A.C.",
    medico: "Dr. Carlos Reátegui",
    cmpv: "CMPV 4821",
    telefono: "+51 984 123 456",
    central: "(01) 271-9898",
    correo: "administracion@petcaresur.pe",
    convenioLabel: "Tarifa Preferencial Nivel 2",
    convenioDesc: "Descuento 18% margen fijo",
    convenioBadgeClass: "bg-brand-100 text-brand-700",
    tipo: "nivel-2",
    derivaciones: 14,
    comision: "S/ 1,428.00",
  },
  {
    id: "san-borja",
    nombre: "Clínica Veterinaria San Borja",
    icon: HeartPulseIcon,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    direccion: "Av. San Luis 1420, San Borja • Lima",
    ruc: "20554189024",
    razonSocial: "Veterinaria San Borja Integral S.A.C.",
    medico: "Dra. Valeria Montes",
    cmpv: "CMPV 6120",
    telefono: "+51 993 781 204",
    central: "(01) 225-4433",
    correo: "gerencia@vetsanborja.com",
    convenioLabel: "Tarifa Preferencial Nivel 1",
    convenioDesc: "Descuento 12% por volumen",
    convenioBadgeClass: "bg-slate-100 text-slate-700",
    tipo: "nivel-1",
    derivaciones: 9,
    comision: "S/ 920.00",
  },
  {
    id: "miraflores-centro",
    nombre: "Veterinaria Miraflores Centro",
    icon: HeartIcon,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    direccion: "Calle Schell 380, Miraflores • Lima",
    ruc: "20491029411",
    razonSocial: "Miraflores Pet Care E.I.R.L.",
    medico: "Dr. Manuel Arana",
    cmpv: "CMPV 3982",
    telefono: "+51 971 654 321",
    central: "(01) 446-1200",
    correo: "recepcion@mirafloresvet.pe",
    convenioLabel: "Comisión Directa (15%)",
    convenioDesc: "Liquidación por derivación",
    convenioBadgeClass: "bg-slate-100 text-slate-700",
    tipo: "comision",
    derivaciones: 6,
    comision: "S/ 610.00",
  },
  {
    id: "animal-heart",
    nombre: "Animal Heart Surco",
    icon: ShieldPlusIcon,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    direccion: "Av. Primavera 650, Chacarilla • Surco",
    ruc: "20603819201",
    razonSocial: "Animal Heart Especialidades Veterinarias S.A.C.",
    medico: "Dra. Gabriela Paz",
    cmpv: "CMPV 7421",
    telefono: "+51 945 890 112",
    central: "(01) 372-9010",
    correo: "contacto@animalheart.pe",
    convenioLabel: "Tarifa Preferencial Nivel 2",
    convenioDesc: "Descuento 18% margen fijo",
    convenioBadgeClass: "bg-brand-100 text-brand-700",
    tipo: "nivel-2",
    derivaciones: 5,
    comision: "S/ 510.00",
  },
  {
    id: "pet-planet",
    nombre: "Clínica Pet Planet",
    icon: Building2Icon,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    direccion: "Av. La Encalada 920, Monterrico • Surco",
    ruc: "20501239851",
    razonSocial: "Pet Planet Corporación Veterinaria S.A.",
    medico: "Dr. Roberto Wong",
    cmpv: "CMPV 5118",
    telefono: "+51 988 334 556",
    central: "(01) 344-8800",
    correo: "rwong@petplanetlima.com",
    convenioLabel: "Tarifa Preferencial Nivel 1",
    convenioDesc: "Descuento 12% por volumen",
    convenioBadgeClass: "bg-slate-100 text-slate-700",
    tipo: "nivel-1",
    derivaciones: 4,
    comision: "S/ 652.00",
  },
];

const TOTAL_CLINICAS_REGISTRADAS = 8;

const TARIFAS = [
  { rango: "Hasta 10 kg", ejemplos: "Gatos, Caniches, Chihuahuas", publica: "S/ 380.00", convenio: "S/ 310.00", margen: "+ S/ 70.00 (18.4%)" },
  { rango: "11 a 25 kg", ejemplos: "Cocker, Beagle, Bulldog Francés", publica: "S/ 450.00", convenio: "S/ 370.00", margen: "+ S/ 80.00 (17.7%)" },
  { rango: "26 a 40 kg", ejemplos: "Golden Retriever, Labrador, Boxer", publica: "S/ 540.00", convenio: "S/ 440.00", margen: "+ S/ 100.00 (18.5%)" },
  { rango: "Más de 40 kg", ejemplos: "Rottweiler, Gran Danés, San Bernardo", publica: "S/ 650.00", convenio: "S/ 530.00", margen: "+ S/ 120.00 (18.4%)" },
];

const CASOS_DERIVADOS = [
  { caso: "#DR-408", fecha: "24 Oct, 14:30", mascota: "Luna", detalleMascota: "Golden, 29kg", tutor: "Mateo Calderón", servicio: "Individual + Despedida", detalleServicio: "Ánfora Caoba Tallada", estado: "En Custodia Sala", estadoClass: "bg-slate-100 text-slate-600", comision: "S/ 102.00" },
  { caso: "#DR-399", fecha: "21 Oct, 09:15", mascota: "Thor", detalleMascota: "Bulldog Francés, 12kg", tutor: "Pamela Ramos", servicio: "Individual Estándar", detalleServicio: "Urna Clásica Blanca", estado: "Entregado a Clínica", estadoClass: "bg-emerald-50 text-emerald-700", comision: "S/ 80.00" },
  { caso: "#DR-392", fecha: "18 Oct, 18:40", mascota: "Simba", detalleMascota: "Siamés, 4kg", tutor: "Andrea Belaunde", servicio: "Individual Estándar", detalleServicio: "Relicario Huella Incluido", estado: "Concluido y Facturado", estadoClass: "bg-emerald-50 text-emerald-700", comision: "S/ 70.00" },
];

function KpiCard({
  label,
  icon: Icon,
  iconColor,
  children,
  footer,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </span>
        <div className={cn("w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center", iconColor)}>
          <Icon className="size-5" />
        </div>
      </div>
      {children}
      <div className="mt-3 text-xs text-slate-500">{footer}</div>
    </div>
  );
}

function ActionIconButton({
  icon: Icon,
  title,
  onClick,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  variant?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg transition-colors",
        variant === "primary"
          ? "bg-brand-500 text-white hover:bg-brand-600"
          : "bg-slate-50 text-slate-500 hover:bg-brand-50 hover:text-brand-500"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function ContactoModal({
  clinica,
  open,
  onOpenChange,
}: {
  clinica: Clinica | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!clinica) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
            <ApartmentIcon className="size-5" />
          </div>
          <div>
            <DialogTitle>{clinica.nombre}</DialogTitle>
            <DialogDescription className="mt-0">
              Ficha Institucional &amp; Canales de Derivación
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
              Datos Fiscales y Jurídicos
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 block">Razón Social</span>
                <span className="text-sm font-semibold text-slate-900">{clinica.razonSocial}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">RUC</span>
                <span className="text-sm font-mono font-semibold text-slate-900">{clinica.ruc}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-400 block">Dirección Principal</span>
                <span className="text-sm text-slate-700">{clinica.direccion}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
              Responsable Médico y Guardia
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 block">Médico Veterinario Colegiado</span>
                <span className="text-sm font-semibold text-slate-900">{clinica.medico}</span>
                <span className="text-xs text-slate-400 block">{clinica.cmpv}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Celular Urgencias / Guardias 24h</span>
                <span className="text-sm font-semibold text-brand-500">{clinica.telefono}</span>
                <span className="text-xs text-slate-400 block">
                  Canal directo para coordinar traslados
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Central Telefónica / Recepción</span>
                <span className="text-sm text-slate-700">{clinica.central}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Correo Administrativo (Comisiones)</span>
                <span className="text-sm text-brand-500 font-medium">{clinica.correo}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-50 rounded-xl flex items-start gap-3">
            <InfoIcon className="size-5 text-brand-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700">
              <strong className="text-brand-700 font-semibold">Protocolo de Recojo en Clínica:</strong>{" "}
              Esta sede cuenta con congelador de custodia temporal. El chofer asignado de Dulce
              Recuerdo debe anunciarse en recepción secundaria para el retiro del cuerpo y firma de
              acta.
            </p>
          </div>
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <button
            type="button"
            onClick={() =>
              window.open(
                `https://wa.me/51${clinica.telefono.replace(/\D/g, "").slice(-9)}`,
                "_blank"
              )
            }
            className="inline-flex items-center gap-2 text-operational font-semibold text-sm hover:underline"
          >
            <MessageCircleIcon className="size-4" />
            Enviar WhatsApp a Clínica
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button onClick={() => notifySuccess("Se abrirá el editor de datos de la clínica.")}>
              Editar Datos
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TarifasModal({
  clinica,
  open,
  onOpenChange,
}: {
  clinica: Clinica | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!clinica) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <PercentIcon className="size-5" />
          </div>
          <div>
            <DialogTitle>{clinica.nombre} - Tabla de Tarifas Pactadas</DialogTitle>
            <DialogDescription className="mt-0">Convenio: {clinica.convenioLabel}</DialogDescription>
          </div>
        </DialogHeader>

        <p className="text-sm text-slate-500">
          Precios mayoristas netos aplicables para cremación individual con custodia digna,
          certificado de trazabilidad y ánfora de madera incluida. La clínica retiene de forma
          directa su margen pactado al cobrar al tutor o en su factura mensual.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-label uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Rango de Peso Mascota</th>
                <th className="py-3 px-4 font-semibold text-right">Tarifa Pública</th>
                <th className="py-3 px-4 font-semibold text-right text-brand-500">Tarifa Convenio</th>
                <th className="py-3 px-4 font-semibold text-right text-emerald-600">Margen Clínica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TARIFAS.map((t) => (
                <tr key={t.rango} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">
                    {t.rango} <span className="text-slate-400 font-normal">({t.ejemplos})</span>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-slate-400">{t.publica}</td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-brand-500">
                    {t.convenio}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-semibold text-emerald-600">
                    {t.margen}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 flex flex-col justify-between">
            <span className="text-sm font-semibold text-slate-900">
              Sala de Despedida Presencial
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Uso de sala privada por 45 min con asistencia tanatológica.
            </p>
            <span className="text-sm font-bold text-brand-500 mt-2">
              S/ 80.00 adicional{" "}
              <span className="text-xs font-normal text-slate-400">(Tarifa pública S/ 120)</span>
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 flex flex-col justify-between">
            <span className="text-sm font-semibold text-slate-900">
              Logística de Recojo en Clínica
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Unidad climatizada con personal con indumentaria de protocolo.
            </p>
            <span className="text-sm font-bold text-emerald-600 mt-2">
              Bonificado (S/ 0.00){" "}
              <span className="text-xs font-normal text-slate-400">dentro de radio 15 km</span>
            </span>
          </div>
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <span className="text-xs text-slate-400">
            Vigencia del convenio: Hasta 31 de Diciembre 2025
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                notifySuccess("Generando PDF oficial de tarifas con sello de Dulce Recuerdo...")
              }
            >
              <DownloadIcon className="size-4" />
              Descargar PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorialModal({
  clinica,
  open,
  onOpenChange,
}: {
  clinica: Clinica | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!clinica) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <ReceiptTextIcon className="size-5" />
          </div>
          <div>
            <DialogTitle>{clinica.nombre} - Casos Derivados (Octubre 2025)</DialogTitle>
            <DialogDescription className="mt-0">
              Control para conciliación y pago de comisión mensual
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="bg-slate-50 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
              Total a transferir al cierre de mes
            </span>
            <span className="text-2xl font-bold text-brand-500">{clinica.comision}</span>
            <span className="text-xs text-slate-500 mt-0.5">
              Liquidación bancaria programada para el 02 de Noviembre
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-white shadow-xs text-center">
              <span className="text-xs text-slate-400 block">Casos Totales</span>
              <span className="text-sm font-bold text-slate-900">{clinica.derivaciones}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white shadow-xs text-center">
              <span className="text-xs text-slate-400 block">Estatus</span>
              <span className="text-sm font-semibold text-emerald-600">Pre-aprobado</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-label uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Caso # / Fecha</th>
                <th className="py-3 px-4 font-semibold">Mascota &amp; Tutor</th>
                <th className="py-3 px-4 font-semibold">Servicio &amp; Detalles</th>
                <th className="py-3 px-4 font-semibold">Estado Crematorio</th>
                <th className="py-3 px-4 font-semibold text-right">Comisión Clínica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CASOS_DERIVADOS.map((c) => (
                <tr key={c.caso} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-sm text-slate-900">{c.caso}</span>
                    <span className="block text-xs text-slate-400">{c.fecha}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">
                        {c.mascota} <span className="font-normal text-slate-400">({c.detalleMascota})</span>
                      </span>
                      <span className="text-xs text-slate-400">Tutor: {c.tutor}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-700 block">{c.servicio}</span>
                    <span className="text-xs text-slate-400">{c.detalleServicio}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label font-semibold",
                        c.estadoClass
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {c.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-sm text-emerald-600">
                    {c.comision}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <button
            type="button"
            onClick={() =>
              notifySuccess("Generando pre-liquidación en PDF para envío a la clínica...")
            }
            className="inline-flex items-center gap-1.5 text-brand-500 font-semibold text-sm hover:underline"
          >
            <DownloadIcon className="size-4" />
            Exportar Estado de Cuenta del Periodo
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button
              variant="operational"
              onClick={() => {
                onOpenChange(false);
                notifySuccess(
                  "La pre-liquidación fue confirmada y enviada a tesorería para el corte bancario."
                );
              }}
            >
              Confirmar Pre-Liquidación
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NuevaClinicaForm {
  nombre: string;
  razonSocial: string;
  ruc: string;
  direccion: string;
  contacto: string;
  telefono: string;
  convenio: string;
}

const NUEVA_CLINICA_INICIAL: NuevaClinicaForm = {
  nombre: "",
  razonSocial: "",
  ruc: "",
  direccion: "",
  contacto: "",
  telefono: "",
  convenio: "nivel-2",
};

function NuevaVeterinariaModal({
  open,
  onOpenChange,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardado: () => void;
}) {
  const [form, setForm] = useState<NuevaClinicaForm>(NUEVA_CLINICA_INICIAL);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    setForm(NUEVA_CLINICA_INICIAL);
    onGuardado();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <PlusIcon className="size-5" />
          </div>
          <div>
            <DialogTitle>Registrar Nueva Veterinaria Aliada</DialogTitle>
            <DialogDescription className="mt-0">
              Incorporación a la red de convenios Dulce Recuerdo
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="nombre-clinica">Nombre Comercial de la Veterinaria</Label>
              <Input
                id="nombre-clinica"
                placeholder="Ej. Clínica Veterinaria San Miguel"
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="razon-social">Razón Social</Label>
              <Input
                id="razon-social"
                placeholder="Ej. San Miguel Pet Services S.A.C."
                required
                value={form.razonSocial}
                onChange={(e) => setForm((f) => ({ ...f, razonSocial: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ruc-clinica">RUC (11 dígitos)</Label>
              <Input
                id="ruc-clinica"
                placeholder="20XXXXXXXXX"
                maxLength={11}
                required
                value={form.ruc}
                onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="direccion-clinica">Dirección y Distrito</Label>
              <Input
                id="direccion-clinica"
                placeholder="Ej. Av. La Marina 2150, San Miguel • Lima"
                required
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contacto-clinica">Médico / Contacto Responsable</Label>
              <Input
                id="contacto-clinica"
                placeholder="Ej. Dra. Carmen Silva (CMPV 9102)"
                required
                value={form.contacto}
                onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono-clinica">Teléfono Directo / WhatsApp</Label>
              <Input
                id="telefono-clinica"
                type="tel"
                placeholder="+51 999 000 111"
                required
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="convenio-clinica">Tipo de Convenio Asignado</Label>
              <Select
                value={form.convenio}
                onValueChange={(v) => setForm((f) => ({ ...f, convenio: v }))}
              >
                <SelectTrigger id="convenio-clinica">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nivel-2">
                    Tarifa Preferencial Nivel 2 (18% margen pactado)
                  </SelectItem>
                  <SelectItem value="nivel-1">
                    Tarifa Preferencial Nivel 1 (12% volumen básico)
                  </SelectItem>
                  <SelectItem value="comision">
                    Comisión Directa 15% sobre tarifa de lista
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="operational">
              Guardar Convenio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VeterinariasPage() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | TipoConvenio>("todos");
  const [nuevaVeterinariaOpen, setNuevaVeterinariaOpen] = useState(false);
  const [clinicaSeleccionada, setClinicaSeleccionada] = useState<Clinica | null>(null);
  const [modal, setModal] = useState<"contacto" | "tarifas" | "historial" | null>(null);

  const clinicasFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return CLINICAS.filter((c) => {
      const coincideTexto =
        !query ||
        c.nombre.toLowerCase().includes(query) ||
        c.direccion.toLowerCase().includes(query) ||
        c.medico.toLowerCase().includes(query) ||
        c.ruc.includes(query);
      const coincideTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
      return coincideTexto && coincideTipo;
    });
  }, [busqueda, filtroTipo]);

  const abrirModal = (clinica: Clinica, tipo: "contacto" | "tarifas" | "historial") => {
    setClinicaSeleccionada(clinica);
    setModal(tipo);
  };

  const handleGuardadoClinica = () => {
    notifySuccess("¡Veterinaria aliada registrada con éxito en el sistema de convenios!");
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Convenios Veterinarios" }]} />

      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
              Convenios Veterinarios
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Corte mensual: en 6 días (31 de Octubre)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-500 text-xs font-medium">
              <PawPrintIcon className="size-3.5" />
              6 Clínicas con derivación activa
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            Gestión de veterinarias aliadas, tarifas preferenciales para cremación y control de
            derivaciones para la liquidación de comisiones periódica.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="operational"
            className="gap-1.5"
            onClick={() => setNuevaVeterinariaOpen(true)}
          >
            <PlusIcon className="size-4" />
            Nueva Veterinaria Aliada
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() =>
              notifySuccess(
                'Descargando archivo "Reporte_Comisiones_Veterinarias_Octubre2025.xlsx"...'
              )
            }
          >
            <TableIcon className="size-4" />
            <span className="hidden sm:inline">Descargar Reporte (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Clínicas Aliadas"
          icon={Building2Icon}
          iconColor="text-brand-500"
          footer={
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              6 activas con tarifa preferencial
            </span>
          }
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{TOTAL_CLINICAS_REGISTRADAS}</span>
            <span className="text-xs text-slate-500 font-medium">clínicas en red</span>
          </div>
        </KpiCard>

        <KpiCard
          label="Derivaciones del Mes"
          icon={PawPrintIcon}
          iconColor="text-brand-400"
          footer={<span>32 individuales • 6 con despedida</span>}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">38</span>
            <span className="text-xs text-emerald-600 font-semibold">+18% vs mes anterior</span>
          </div>
        </KpiCard>

        <KpiCard
          label="Comisiones por Liquidar"
          icon={BanknoteIcon}
          iconColor="text-emerald-600"
          footer={
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="size-3.5 text-slate-400" />
              Corte programado: 31 de Octubre
            </span>
          }
        >
          <span className="text-2xl font-bold text-slate-900">S/ 4,120.00</span>
        </KpiCard>

        <KpiCard
          label="Clínica Más Activa"
          icon={StarIcon}
          iconColor="text-brand-500"
          footer={<span>Convenio Nivel 2 • Dr. Carlos Reátegui</span>}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 truncate">PetCare Sur</span>
            <span className="text-xs text-brand-500 font-semibold">
              14 casos derivados (S/ 1,428 com.)
            </span>
          </div>
        </KpiCard>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre de clínica, distrito, veterinario o RUC..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Label htmlFor="filtro-convenio" className="whitespace-nowrap">Convenio:</Label>
          <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as typeof filtroTipo)}>
            <SelectTrigger id="filtro-convenio" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los Convenios</SelectItem>
              <SelectItem value="nivel-2">Tarifa Preferencial Nivel 2</SelectItem>
              <SelectItem value="nivel-1">Tarifa Preferencial Nivel 1</SelectItem>
              <SelectItem value="comision">Comisión Directa (15%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de convenios */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-label uppercase tracking-wider">
                <th className="py-3 px-5 font-semibold">Veterinaria Aliada</th>
                <th className="py-3 px-5 font-semibold">Contacto Médico / Admin</th>
                <th className="py-3 px-5 font-semibold">Convenio Pactado</th>
                <th className="py-3 px-5 font-semibold text-center">Derivaciones Mes</th>
                <th className="py-3 px-5 font-semibold text-right">Gestión &amp; Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clinicasFiltradas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                          c.iconBg,
                          c.iconColor
                        )}
                      >
                        <c.icon className="size-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 leading-tight">
                            {c.nombre}
                          </span>
                          {c.topAliado && (
                            <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-emerald-50 text-emerald-700">
                              Top Aliado
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 truncate">{c.direccion}</span>
                        <span className="text-xs text-slate-300 font-mono">RUC: {c.ruc}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{c.medico}</span>
                      <span className="text-xs text-brand-500 flex items-center gap-1 mt-0.5">
                        <PhoneIcon className="size-3.5" /> {c.telefono}
                      </span>
                      <span className="text-xs text-slate-400 truncate">{c.correo}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-label font-semibold",
                          c.convenioBadgeClass
                        )}
                      >
                        {c.convenioLabel}
                      </span>
                      <span className="text-xs text-slate-400">{c.convenioDesc}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-slate-900 leading-none">
                        {c.derivaciones}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">servicios en Octubre</span>
                      <span className="text-label font-semibold text-emerald-600 mt-0.5">
                        {c.comision} com.
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionIconButton
                        icon={IdCardIcon}
                        title="Ficha Institucional & Contacto"
                        onClick={() => abrirModal(c, "contacto")}
                      />
                      <ActionIconButton
                        icon={TagIcon}
                        title="Ver Esquema de Tarifas"
                        onClick={() => abrirModal(c, "tarifas")}
                      />
                      <ActionIconButton
                        icon={HistoryIcon}
                        title="Historial de Pedidos y Liquidación"
                        onClick={() => abrirModal(c, "historial")}
                        variant="primary"
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {clinicasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                    No se encontraron veterinarias con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Mostrando {clinicasFiltradas.length} de {TOTAL_CLINICAS_REGISTRADAS} veterinarias
            aliadas registradas
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-900 font-semibold">Página 1 de 2</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => notifySuccess("Ya te encuentras en la primera página.")}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => notifySuccess("Cargando la siguiente página de veterinarias...")}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <ContactoModal
        clinica={clinicaSeleccionada}
        open={modal === "contacto"}
        onOpenChange={(v) => setModal(v ? "contacto" : null)}
      />
      <TarifasModal
        clinica={clinicaSeleccionada}
        open={modal === "tarifas"}
        onOpenChange={(v) => setModal(v ? "tarifas" : null)}
      />
      <HistorialModal
        clinica={clinicaSeleccionada}
        open={modal === "historial"}
        onOpenChange={(v) => setModal(v ? "historial" : null)}
      />
      <NuevaVeterinariaModal
        open={nuevaVeterinariaOpen}
        onOpenChange={setNuevaVeterinariaOpen}
        onGuardado={handleGuardadoClinica}
      />
    </>
  );
}
