import { useEffect, useMemo, useState } from "react";
import {
  SearchIcon,
  XIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  ReceiptTextIcon,
  WalletIcon,
  CalendarClockIcon,
  ActivityIcon,
  TriangleAlertIcon,
  MessageCircleIcon,
  FileTextIcon,
  PlusIcon,
  DownloadIcon,
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
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/shared/utils";

// TODO: reemplazar por datos reales del módulo `casos` cuando se exponga el endpoint.
type EstadoId =
  | "pendiente-pago"
  | "agendado"
  | "en-proceso"
  | "realizado"
  | "entregado";

interface Caso {
  id: string;
  mascota: string;
  emoji: string;
  avatarBg: string;
  avatarText: string;
  especieRaza: string;
  tutor: string;
  telefono: string;
  servicio: string;
  servicioDetalle: string;
  canalTipo: "directo" | "veterinaria";
  canalLabel: string;
  canalClass: string;
  veterinariaId?: string;
  estado: EstadoId;
  estadoLabel: string;
  estadoClass: string;
  estadoDotClass: string;
  estadoPulse?: boolean;
  proximoPaso: string;
  atenuado?: boolean;
}

const CASOS: Caso[] = [
  {
    id: "000123",
    mascota: "Luna",
    emoji: "🐶",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-800",
    especieRaza: "Canino · Golden Ret. (26 kg)",
    tutor: "María Pérez",
    telefono: "+51 981 234 567",
    servicio: "Cremación Individual",
    servicioDetalle: "+ Urna Roble Natural",
    canalTipo: "veterinaria",
    canalLabel: "Veterinaria: PetCare Sur",
    canalClass: "bg-brand-100 text-brand-700",
    veterinariaId: "petcare-sur",
    estado: "pendiente-pago",
    estadoLabel: "Pendiente de pago",
    estadoClass: "bg-amber-100 text-amber-800 border-amber-200",
    estadoDotClass: "bg-amber-500",
    proximoPaso: "Validar transferencia o link de pago",
  },
  {
    id: "000124",
    mascota: "Thor",
    emoji: "🐱",
    avatarBg: "bg-slate-100",
    avatarText: "text-slate-700",
    especieRaza: "Felino · Siamés (4.2 kg)",
    tutor: "Carlos Mendoza",
    telefono: "+51 994 332 110",
    servicio: "Cremación + Sala Despedida",
    servicioDetalle: "15 min acompañamiento",
    canalTipo: "directo",
    canalLabel: "Directo (WhatsApp)",
    canalClass: "bg-slate-100 text-slate-600",
    estado: "agendado",
    estadoLabel: "Agendado",
    estadoClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    estadoDotClass: "bg-indigo-600",
    proximoPaso: "Recepción en Sede (Hoy 16:00 hrs)",
  },
  {
    id: "000122",
    mascota: "Rocky",
    emoji: "🐶",
    avatarBg: "bg-brand-100",
    avatarText: "text-brand-700",
    especieRaza: "Canino · Boxer (31 kg)",
    tutor: "Dra. Andrea Luján",
    telefono: "+51 977 121 909",
    servicio: "Cremación Individual Estándar",
    servicioDetalle: "Ánfora Ecológica",
    canalTipo: "veterinaria",
    canalLabel: "Veterinaria: Clínica San Borja",
    canalClass: "bg-brand-100 text-brand-700",
    veterinariaId: "san-borja",
    estado: "en-proceso",
    estadoLabel: "En proceso (Horno 850°C)",
    estadoClass: "bg-blue-100 text-blue-800 border-blue-200",
    estadoDotClass: "bg-blue-600",
    estadoPulse: true,
    proximoPaso: "Fin de ciclo térmico en 35 min",
  },
  {
    id: "000121",
    mascota: "Bony",
    emoji: "🐶",
    avatarBg: "bg-emerald-100",
    avatarText: "text-emerald-800",
    especieRaza: "Canino · Poodle (6 kg)",
    tutor: "Patricia Falconi",
    telefono: "+51 988 543 210",
    servicio: "Cremación + Urna Cerámica",
    servicioDetalle: "Grabado conmemorativo OK",
    canalTipo: "directo",
    canalLabel: "Directo (Recomendación)",
    canalClass: "bg-slate-100 text-slate-600",
    estado: "realizado",
    estadoLabel: "Realizado (Urna lista)",
    estadoClass: "bg-teal-100 text-teal-800 border-teal-200",
    estadoDotClass: "bg-teal-600",
    proximoPaso: "Asignar a Lote de Entrega (Ruta Sur)",
  },
  {
    id: "000120",
    mascota: "Max",
    emoji: "🐱",
    avatarBg: "bg-slate-100",
    avatarText: "text-slate-600",
    especieRaza: "Felino · Común (3.8 kg)",
    tutor: "Renzo Vega",
    telefono: "+51 966 453 129",
    servicio: "Cremación Individual",
    servicioDetalle: "Entrega en domicilio",
    canalTipo: "veterinaria",
    canalLabel: "Veterinaria: Animal Heart",
    canalClass: "bg-brand-50 text-brand-600",
    veterinariaId: "animal-heart",
    estado: "entregado",
    estadoLabel: "Entregado (Ciclo 48h OK)",
    estadoClass: "bg-slate-100 text-slate-600 border-slate-200",
    estadoDotClass: "bg-slate-400",
    proximoPaso: "Completado y archivado (26h totales)",
    atenuado: true,
  },
];

const TOTAL_CASOS_OPERATIVOS = 14;

type EtapaEstado = "done" | "active" | "pending";

interface CasoDetalle {
  urna: string;
  pesoEdad: string;
  direccion: string;
  canalAliado: string;
  cotizacion: { concepto: string; monto: string }[];
  cotizacionTotal: string;
  cotizacionAprobada: string;
  pagoMonto: string;
  pagoDetalle: string;
  saldoMonto: string;
  saldoDetalle: string;
  pagoEstadoLabel: string;
  pagoEstadoClass: string;
  fechaTurno: string;
  horario: string;
  logistica: string;
  llegada: string;
  horasTranscurridas: number;
  horasRestantes: number;
  progresoPct: number;
  compromisoLabel: string;
  compromisoClass: string;
  etapas: { label: string; estado: EtapaEstado }[];
  accionPrincipal: string;
  accionVariant: "operational" | "default" | "outline";
}

const DETALLES: Record<string, CasoDetalle> = {
  "000123": {
    urna: "Roble Natural Artesanal",
    pesoEdad: "26.4 kg · 11 años",
    direccion: "Av. Primavera 1024, Dpto 301, Surco",
    canalAliado: "PetCare Sur (15%)",
    cotizacion: [
      { concepto: "Cremación Individual Canino (25-35 kg)", monto: "S/ 480.00" },
      { concepto: "Urna de Roble Natural con placa grabada", monto: "S/ 120.00" },
      { concepto: "Traslado en furgoneta biocustodia (Surco)", monto: "Sin recargo (Zona Central)" },
    ],
    cotizacionTotal: "S/ 600.00 PEN",
    cotizacionAprobada: "Aprobada por Tutor vía WA",
    pagoMonto: "S/ 300.00",
    pagoDetalle: "Adelanto 50% vía Yape (Op. #849201)",
    saldoMonto: "S/ 300.00",
    saldoDetalle: "Contraentrega o previo a inicio de horno",
    pagoEstadoLabel: "Saldo Pendiente",
    pagoEstadoClass: "text-amber-700 bg-amber-50 border-amber-200",
    fechaTurno: "Hoy, 24 Octubre 2025",
    horario: "14:00 - 16:00 hrs (Horno #01)",
    logistica: "Móvil 01 (Roberto Díaz)",
    llegada: "Llegada a domicilio: 11:30 hrs",
    horasTranscurridas: 11,
    horasRestantes: 37,
    progresoPct: 23,
    compromisoLabel: "En Tiempo Digno",
    compromisoClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    etapas: [
      { label: "Recogido", estado: "done" },
      { label: "Esperando Pago", estado: "active" },
      { label: "Horno", estado: "pending" },
      { label: "Entrega", estado: "pending" },
    ],
    accionPrincipal: "Registrar Pago & Activar Horno",
    accionVariant: "operational",
  },
  "000124": {
    urna: "Urna Estándar Incluida",
    pesoEdad: "4.2 kg · 6 años",
    direccion: "Jr. Los Alisos 245, San Isidro",
    canalAliado: "Directo (sin comisión)",
    cotizacion: [
      { concepto: "Cremación Individual Felino (0-10 kg)", monto: "S/ 320.00" },
      { concepto: "Sala de Despedida Presencial (15 min)", monto: "S/ 60.00" },
      { concepto: "Traslado estándar", monto: "S/ 40.00" },
    ],
    cotizacionTotal: "S/ 420.00 PEN",
    cotizacionAprobada: "Aprobada por Tutor en Sede",
    pagoMonto: "S/ 420.00",
    pagoDetalle: "Pago completo vía tarjeta en sede",
    saldoMonto: "S/ 0.00",
    saldoDetalle: "Sin saldo pendiente",
    pagoEstadoLabel: "Pagado",
    pagoEstadoClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    fechaTurno: "Hoy, 24 Octubre 2025",
    horario: "16:00 - 17:00 hrs (Sala de Despedida)",
    logistica: "Recepción directa en sede",
    llegada: "Tutor llega por cuenta propia",
    horasTranscurridas: 1,
    horasRestantes: 47,
    progresoPct: 2,
    compromisoLabel: "En Tiempo Digno",
    compromisoClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    etapas: [
      { label: "Recogido", estado: "pending" },
      { label: "Pago", estado: "done" },
      { label: "Horno", estado: "pending" },
      { label: "Entrega", estado: "pending" },
    ],
    accionPrincipal: "Confirmar Recepción en Sede",
    accionVariant: "default",
  },
  "000122": {
    urna: "Ánfora Ecológica Biodegradable",
    pesoEdad: "31 kg · 5 años",
    direccion: "Clínica San Borja (recojo en sede)",
    canalAliado: "Clínica San Borja (12%)",
    cotizacion: [
      { concepto: "Cremación Individual Estándar Canino (26-40 kg)", monto: "S/ 540.00" },
      { concepto: "Ánfora Ecológica Biodegradable", monto: "S/ 70.00" },
      { concepto: "Traslado desde Clínica San Borja", monto: "S/ 40.00" },
    ],
    cotizacionTotal: "S/ 650.00 PEN",
    cotizacionAprobada: "Aprobada por Veterinaria",
    pagoMonto: "S/ 650.00",
    pagoDetalle: "Pago completo por transferencia BCP",
    saldoMonto: "S/ 0.00",
    saldoDetalle: "Sin saldo pendiente",
    pagoEstadoLabel: "Pagado",
    pagoEstadoClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    fechaTurno: "Hoy, 24 Octubre 2025",
    horario: "10:00 - 12:00 hrs (Horno #02)",
    logistica: "Móvil 01 (Roberto Díaz)",
    llegada: "Recogido de Clínica San Borja: 09:15 hrs",
    horasTranscurridas: 18,
    horasRestantes: 30,
    progresoPct: 38,
    compromisoLabel: "En Tiempo Digno",
    compromisoClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    etapas: [
      { label: "Recogido", estado: "done" },
      { label: "Pago", estado: "done" },
      { label: "Horno", estado: "active" },
      { label: "Entrega", estado: "pending" },
    ],
    accionPrincipal: "Marcar Ciclo Térmico Completado",
    accionVariant: "default",
  },
  "000121": {
    urna: "Urna Cerámica Grabada",
    pesoEdad: "6 kg · 14 años",
    direccion: "Calle Los Cipreses 512, La Molina",
    canalAliado: "Directo (Recomendación)",
    cotizacion: [
      { concepto: "Cremación Individual Canino (0-10 kg)", monto: "S/ 300.00" },
      { concepto: "Urna Cerámica con grabado conmemorativo", monto: "S/ 80.00" },
    ],
    cotizacionTotal: "S/ 380.00 PEN",
    cotizacionAprobada: "Aprobada por Tutor vía WA",
    pagoMonto: "S/ 380.00",
    pagoDetalle: "Pago completo vía Yape",
    saldoMonto: "S/ 0.00",
    saldoDetalle: "Sin saldo pendiente",
    pagoEstadoLabel: "Pagado",
    pagoEstadoClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    fechaTurno: "Ayer, 23 Octubre 2025",
    horario: "09:00 - 11:00 hrs (Horno #01)",
    logistica: "Móvil 01 (Roberto Díaz)",
    llegada: "Recogido a domicilio: 08:10 hrs",
    horasTranscurridas: 30,
    horasRestantes: 18,
    progresoPct: 62,
    compromisoLabel: "En Tiempo Digno",
    compromisoClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    etapas: [
      { label: "Recogido", estado: "done" },
      { label: "Pago", estado: "done" },
      { label: "Horno", estado: "done" },
      { label: "Entrega", estado: "active" },
    ],
    accionPrincipal: "Asignar a Lote de Entrega (Ruta Sur)",
    accionVariant: "operational",
  },
  "000120": {
    urna: "Urna Clásica Blanca",
    pesoEdad: "3.8 kg · 8 años",
    direccion: "Entrega en domicilio, Chorrillos",
    canalAliado: "Animal Heart Surco (18%)",
    cotizacion: [
      { concepto: "Cremación Individual Felino (0-10 kg)", monto: "S/ 300.00" },
      { concepto: "Entrega a domicilio", monto: "S/ 20.00" },
    ],
    cotizacionTotal: "S/ 320.00 PEN",
    cotizacionAprobada: "Aprobada por Veterinaria",
    pagoMonto: "S/ 320.00",
    pagoDetalle: "Pago completo vía transferencia",
    saldoMonto: "S/ 0.00",
    saldoDetalle: "Ciclo cerrado y archivado",
    pagoEstadoLabel: "Pagado",
    pagoEstadoClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    fechaTurno: "22 Octubre 2025",
    horario: "08:00 - 10:00 hrs (Horno #01)",
    logistica: "Móvil 01 (Roberto Díaz)",
    llegada: "Entregado en domicilio: 23 Oct, 10:20 hrs",
    horasTranscurridas: 26,
    horasRestantes: 0,
    progresoPct: 100,
    compromisoLabel: "Ciclo Completado",
    compromisoClass: "text-slate-600 bg-slate-100 border-slate-200",
    etapas: [
      { label: "Recogido", estado: "done" },
      { label: "Pago", estado: "done" },
      { label: "Horno", estado: "done" },
      { label: "Entrega", estado: "done" },
    ],
    accionPrincipal: "Ver Comprobante de Entrega",
    accionVariant: "outline",
  },
};

const ESTADO_OPTIONS: { value: "todos" | EstadoId; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "pendiente-pago", label: "Pendiente de pago" },
  { value: "agendado", label: "Agendado" },
  { value: "en-proceso", label: "En proceso" },
  { value: "realizado", label: "Realizado" },
  { value: "entregado", label: "Entregado" },
];

const CANAL_OPTIONS = [
  { value: "todos", label: "Todos los canales" },
  { value: "directo", label: "Directo (Tutor)" },
  { value: "veterinaria", label: "Veterinaria Aliada" },
] as const;

const VETERINARIA_OPTIONS = [
  { value: "todas", label: "Todas las aliadas" },
  { value: "petcare-sur", label: "PetCare Sur" },
  { value: "san-borja", label: "Clínica San Borja" },
  { value: "animal-heart", label: "Animal Heart Surco" },
];

function BloqueCard({
  icon: Icon,
  titulo,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Icon className="size-4 text-brand-500" />
          {titulo}
        </h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

function CampoDato({ label, value, destacado }: { label: string; value: string; destacado?: boolean }) {
  return (
    <div className="p-2.5 bg-slate-50 rounded-lg">
      <span className="text-xs text-slate-400 block">{label}</span>
      <span className={cn("font-bold text-slate-800", destacado && "text-brand-500")}>{value}</span>
    </div>
  );
}

function MesaTrabajoDrawer({
  caso,
  onClose,
}: {
  caso: Caso;
  onClose: () => void;
}) {
  const detalle = DETALLES[caso.id];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
      {/* Cabecera */}
      <div className="px-6 py-5 border-b border-slate-200 flex-none">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-2xl border flex items-center justify-center text-xl font-bold shadow-xs shrink-0",
                caso.avatarBg,
                caso.avatarText,
                "border-current/10"
              )}
            >
              {caso.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{caso.mascota}</h2>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  #{caso.id}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                    caso.estadoClass
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      caso.estadoDotClass,
                      caso.estadoPulse && "animate-pulse"
                    )}
                  />
                  {caso.estadoLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tutor: <strong className="text-slate-800 font-semibold">{caso.tutor}</strong> · ({caso.telefono}) ·
                Servicio: <span className="text-brand-500 font-semibold">{caso.servicio}</span>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            title="Cerrar mesa de trabajo"
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
          >
            <XIcon className="size-5" />
          </Button>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900">
          <TriangleAlertIcon className="size-4 text-amber-600 shrink-0" />
          <p className="flex-1">
            <strong>Regla Operativa:</strong> No se enciende el horno ni se despacha furgoneta sin comprobante
            verificado del 100% o abono pactado.
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        <BloqueCard
          icon={PencilIcon}
          titulo="1. Mascota & Cliente"
          badge={
            <button
              onClick={() => notifySuccess("Abriendo formulario de edición de datos del caso.")}
              className="text-label font-semibold text-brand-500 hover:underline"
            >
              Editar datos
            </button>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <CampoDato label="Especie & Raza" value={caso.especieRaza.split(" (")[0]} />
            <CampoDato label="Peso & Edad" value={detalle.pesoEdad} />
            <CampoDato label="Urna Requerida" value={detalle.urna} destacado />
            <div className="sm:col-span-2">
              <CampoDato label="Dirección / Recojo" value={detalle.direccion} />
            </div>
            <CampoDato label="Canal Aliado" value={detalle.canalAliado} />
          </div>
        </BloqueCard>

        <BloqueCard
          icon={ReceiptTextIcon}
          titulo="2. Cotización Económica"
          badge={
            <span className="text-label font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {detalle.cotizacionAprobada}
            </span>
          }
        >
          <div className="space-y-2 text-xs">
            {detalle.cotizacion.map((item) => (
              <div
                key={item.concepto}
                className="flex justify-between py-1 border-b border-slate-100 text-slate-600 gap-3"
              >
                <span>{item.concepto}</span>
                <span
                  className={cn(
                    "font-semibold shrink-0",
                    item.monto.startsWith("Sin") ? "text-emerald-600" : "text-slate-900"
                  )}
                >
                  {item.monto}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 text-sm font-bold text-slate-900">
              <span>Total Cotizado</span>
              <span className="text-base text-brand-500 font-extrabold">{detalle.cotizacionTotal}</span>
            </div>
          </div>
        </BloqueCard>

        <BloqueCard
          icon={WalletIcon}
          titulo="3. Estado de Pagos & Cobranza"
          badge={
            <span
              className={cn(
                "text-label font-bold px-2 py-0.5 rounded border",
                detalle.pagoEstadoClass
              )}
            >
              {detalle.pagoEstadoLabel}
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-label uppercase font-bold text-emerald-700 block">Monto Pagado</span>
              <span className="text-lg font-bold text-emerald-700">{detalle.pagoMonto}</span>
              <span className="text-xs text-slate-500 block mt-0.5">{detalle.pagoDetalle}</span>
            </div>
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
              <span className="text-label uppercase font-bold text-rose-700 block">Saldo Pendiente</span>
              <span className="text-lg font-bold text-rose-700">{detalle.saldoMonto}</span>
              <span className="text-xs text-slate-500 block mt-0.5">{detalle.saldoDetalle}</span>
            </div>
          </div>
          <button
            onClick={() => notifySuccess("Abriendo formulario de registro de abono.")}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="size-4 text-slate-500" />
            <span>Registrar Nuevo Abono / Saldo Completo</span>
          </button>
        </BloqueCard>

        <BloqueCard
          icon={CalendarClockIcon}
          titulo="4. Agenda & Ventana de Servicio"
          badge={
            <span className="text-label font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Bloqueo 2 Horas
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-400 block">Fecha & Turno</span>
              <span className="font-bold text-slate-800">{detalle.fechaTurno}</span>
              <span className="text-xs text-brand-500 font-semibold block">{detalle.horario}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-400 block">Logística de Recojo</span>
              <span className="font-bold text-slate-800">{detalle.logistica}</span>
              <span className="text-xs text-slate-500 block">{detalle.llegada}</span>
            </div>
          </div>
        </BloqueCard>

        <BloqueCard
          icon={ActivityIcon}
          titulo="5. Operación, Trazabilidad & Regla 48h"
          badge={
            <span
              className={cn(
                "text-label font-bold px-2 py-0.5 rounded border",
                detalle.compromisoClass
              )}
            >
              {detalle.compromisoLabel}
            </span>
          }
        >
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-600">
                  Compromiso Ético 48h:{" "}
                  <strong className="text-slate-900">{detalle.horasTranscurridas}h transcurridas</strong>
                </span>
                <span className="font-bold text-emerald-700">Restan {detalle.horasRestantes} horas</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${detalle.progresoPct}%` }}
                />
              </div>
            </div>

            <div className="pt-2 grid grid-cols-4 gap-2 text-label text-center">
              {detalle.etapas.map((etapa, i) => (
                <div
                  key={etapa.label}
                  className={cn(
                    "p-2 rounded-lg font-bold border",
                    etapa.estado === "done" && "bg-emerald-50 text-emerald-800 border-emerald-200",
                    etapa.estado === "active" && "bg-amber-50 text-amber-800 border-amber-200",
                    etapa.estado === "pending" && "bg-slate-100 text-slate-400 border-transparent font-medium"
                  )}
                >
                  {etapa.estado === "done" && "✓ "}
                  {etapa.estado === "active" && "⏳ "}
                  {etapa.estado === "pending" && `${i + 1}. `}
                  {etapa.label}
                </div>
              ))}
            </div>
          </div>
        </BloqueCard>
      </div>

      {/* Acciones contextuales */}
      <div className="p-4 px-6 border-t border-slate-200 bg-white flex-none flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => notifySuccess(`Recordatorio de cobro enviado a ${caso.tutor} por WhatsApp.`)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <MessageCircleIcon className="size-4 text-emerald-600" />
            <span>Enviar Cobro WA</span>
          </button>
          <button
            onClick={() => notifySuccess("Generando expediente PDF del caso...")}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <FileTextIcon className="size-4 text-slate-500" />
            <span>Ver Expediente PDF</span>
          </button>
        </div>

        <Button
          variant={detalle.accionVariant}
          className="w-full sm:w-auto"
          onClick={() => notifySuccess(`Acción "${detalle.accionPrincipal}" registrada.`)}
        >
          {detalle.accionVariant === "outline" ? (
            <DownloadIcon className="size-4" />
          ) : (
            <ChevronRightIcon className="size-4" />
          )}
          {detalle.accionPrincipal}
        </Button>
      </div>
    </aside>
  );
}

export default function CasosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoId>("todos");
  const [filtroCanal, setFiltroCanal] = useState<(typeof CANAL_OPTIONS)[number]["value"]>("todos");
  const [filtroVeterinaria, setFiltroVeterinaria] = useState("todas");
  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState<string | null>(null);

  const casosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return CASOS.filter((c) => {
      const coincideTexto =
        !query ||
        c.mascota.toLowerCase().includes(query) ||
        c.tutor.toLowerCase().includes(query) ||
        c.id.includes(query);
      const coincideEstado = filtroEstado === "todos" || c.estado === filtroEstado;
      const coincideCanal = filtroCanal === "todos" || c.canalTipo === filtroCanal;
      const coincideVeterinaria =
        filtroVeterinaria === "todas" || c.veterinariaId === filtroVeterinaria;
      return coincideTexto && coincideEstado && coincideCanal && coincideVeterinaria;
    });
  }, [busqueda, filtroEstado, filtroCanal, filtroVeterinaria]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroCanal("todos");
    setFiltroVeterinaria("todas");
  };

  const casoSeleccionado = CASOS.find((c) => c.id === casoSeleccionadoId) ?? null;

  return (
    <>
      <Breadcrumbs items={[{ label: "Módulos de Servicio" }, { label: "Casos & Servicios" }]} />

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
              Casos & Operaciones
            </h1>
            <span className="bg-brand-50 text-brand-500 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {TOTAL_CASOS_OPERATIVOS} Casos Activos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Control diario del flujo de cremación, estados éticos de 48h y mesa de trabajo para
            coordinaciones.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => notifySuccess('Exportando "Casos_Operativos_Octubre2025.xlsx"...')}
          >
            <DownloadIcon className="size-4" />
            Exportar Lista
          </Button>
          <Button
            variant="operational"
            className="gap-1.5"
            onClick={() => notifySuccess("Abriendo formulario de nuevo caso desde WhatsApp.")}
          >
            <PlusIcon className="size-4" />
            Nuevo Caso (WhatsApp)
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Filtrar por nombre de cliente, mascota o #..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Label htmlFor="filtro-estado" className="whitespace-nowrap">Estado:</Label>
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as typeof filtroEstado)}>
            <SelectTrigger id="filtro-estado" className="w-48 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADO_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Label htmlFor="filtro-canal" className="whitespace-nowrap">Canal:</Label>
          <Select value={filtroCanal} onValueChange={(v) => setFiltroCanal(v as typeof filtroCanal)}>
            <SelectTrigger id="filtro-canal" className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANAL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Label htmlFor="filtro-veterinaria" className="whitespace-nowrap">Veterinaria:</Label>
          <Select value={filtroVeterinaria} onValueChange={setFiltroVeterinaria}>
            <SelectTrigger id="filtro-veterinaria" className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VETERINARIA_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={limpiarFiltros}
          className="text-label text-slate-400 hover:text-brand-500 font-semibold px-2 py-1 transition-colors"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Tabla operativa */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-label font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Caso</th>
                <th className="py-3.5 px-4">Mascota</th>
                <th className="py-3.5 px-4">Cliente / Contacto</th>
                <th className="py-3.5 px-4">Servicio</th>
                <th className="py-3.5 px-4">Canal</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Próximo Paso</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {casosFiltrados.map((c) => {
                const activo = c.id === casoSeleccionadoId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setCasoSeleccionadoId(c.id)}
                    className={cn(
                      "transition-colors cursor-pointer",
                      activo
                        ? "bg-blue-50/50 hover:bg-blue-50/80 ring-1 ring-inset ring-brand-500/30"
                        : "hover:bg-slate-50/80",
                      c.atenuado && "opacity-75"
                    )}
                  >
                    <td className={cn("py-4 px-4 font-bold", activo ? "text-brand-500" : "text-slate-800")}>
                      <div className="flex items-center gap-1.5">
                        {activo && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                        <span>#{c.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0",
                            c.avatarBg,
                            c.avatarText
                          )}
                        >
                          {c.emoji}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{c.mascota}</span>
                          <span className="text-xs text-slate-400">{c.especieRaza}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800 block">{c.tutor}</span>
                      <span className="text-xs text-slate-400">{c.telefono}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-slate-700 block">{c.servicio}</span>
                      <span className="text-xs text-slate-400">{c.servicioDetalle}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-label font-semibold",
                          c.canalClass
                        )}
                      >
                        {c.canalLabel}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label font-bold border",
                          c.estadoClass
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            c.estadoDotClass,
                            c.estadoPulse && "animate-pulse"
                          )}
                        />
                        {c.estadoLabel}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{c.proximoPaso}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {activo && (
                          <Button
                            size="icon-sm"
                            title="Mesa de Trabajo Abierta"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCasoSeleccionadoId(c.id);
                            }}
                            className="shadow-xs"
                          >
                            <ChevronRightIcon className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Más acciones"
                          onClick={(e) => {
                            e.stopPropagation();
                            notifySuccess("Menú de acciones rápidas próximamente.");
                          }}
                        >
                          <EllipsisVerticalIcon className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {casosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    No se encontraron casos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando {casosFiltrados.length} de {TOTAL_CASOS_OPERATIVOS} casos operativos
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed" disabled>
              Anterior
            </button>
            <span className="font-bold text-brand-500 px-2">1</span>
            <button
              onClick={() => notifySuccess("Cargando la siguiente página de casos...")}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {casoSeleccionado && (
        <MesaTrabajoDrawer caso={casoSeleccionado} onClose={() => setCasoSeleccionadoId(null)} />
      )}
    </>
  );
}
