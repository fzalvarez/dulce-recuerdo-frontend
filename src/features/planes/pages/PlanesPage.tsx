import {
  DownloadIcon,
  PlusCircleIcon,
  CalendarIcon,
  HandshakeIcon,
  ArrowUpDownIcon,
  PackageIcon,
  HistoryIcon,
  ReceiptIcon,
  PencilIcon,
  CopyIcon,
  PauseCircleIcon,
  InfoIcon,
  TruckIcon,
  ClockIcon,
  SlidersHorizontalIcon,
  PawPrintIcon,
  PlusIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/shared/utils";

// TODO: reemplazar por datos reales del módulo `planes` cuando se exponga el endpoint.
interface RangoPeso {
  rango: string;
  precioVet: string;
  precioSugerido: string;
  margen: string;
  tasaMargen: string;
}

interface Plan {
  id: string;
  nombre: string;
  badge: string;
  badgeClass: string;
  dotClass: string;
  descripcion: string;
  kit: string;
  modif: string;
  casosDelMes: number;
  rangos: RangoPeso[];
}

const PLANES: Plan[] = [
  {
    id: "clasico",
    nombre: "Dulce Recuerdo Clásico",
    badge: "El más solicitado",
    badgeClass: "bg-brand-100 text-brand-700",
    dotClass: "bg-brand-400",
    descripcion:
      "Cremación individualizada, urna de roble seleccionada, certificado de autenticidad y acompañamiento en sala de despedida (30 min).",
    kit: "Urna Roble + Certificado Hilo",
    modif: "12 Oct 2025",
    casosDelMes: 142,
    rangos: [
      { rango: "0 - 5 kg", precioVet: "S/ 250.00", precioSugerido: "S/ 340.00", margen: "+S/ 90.00", tasaMargen: "26%" },
      { rango: "5.1 - 15 kg", precioVet: "S/ 290.00", precioSugerido: "S/ 380.00", margen: "+S/ 90.00", tasaMargen: "24%" },
      { rango: "15.1 - 25 kg", precioVet: "S/ 330.00", precioSugerido: "S/ 420.00", margen: "+S/ 90.00", tasaMargen: "21%" },
      { rango: "25.1 - 35 kg", precioVet: "S/ 390.00", precioSugerido: "S/ 480.00", margen: "+S/ 90.00", tasaMargen: "19%" },
      { rango: "35.1 kg a más", precioVet: "S/ 460.00", precioSugerido: "S/ 540.00", margen: "+S/ 80.00", tasaMargen: "15%" },
    ],
  },
  {
    id: "paz",
    nombre: "Dulce Recuerdo Paz",
    badge: "Servicio Premium",
    badgeClass: "bg-violet-100 text-violet-700",
    dotClass: "bg-violet-400",
    descripcion:
      "Cremación individual prioritaria, sala privada familiar asistida (60 min) con música sacra/zen, relicario y entrega en 24h garantizada.",
    kit: "Cofre Lacado + Dije Plata",
    modif: "28 Sep 2025",
    casosDelMes: 68,
    rangos: [
      { rango: "0 - 5 kg", precioVet: "S/ 330.00", precioSugerido: "S/ 450.00", margen: "+S/ 120.00", tasaMargen: "27%" },
      { rango: "5.1 - 15 kg", precioVet: "S/ 380.00", precioSugerido: "S/ 510.00", margen: "+S/ 130.00", tasaMargen: "25%" },
      { rango: "15.1 - 25 kg", precioVet: "S/ 430.00", precioSugerido: "S/ 570.00", margen: "+S/ 140.00", tasaMargen: "25%" },
      { rango: "25.1 - 35 kg", precioVet: "S/ 490.00", precioSugerido: "S/ 630.00", margen: "+S/ 140.00", tasaMargen: "22%" },
      { rango: "35.1 kg a más", precioVet: "S/ 560.00", precioSugerido: "S/ 680.00", margen: "+S/ 120.00", tasaMargen: "18%" },
    ],
  },
  {
    id: "eco",
    nombre: "Dulce Recuerdo Eco",
    badge: "Comunitaria & Ecológica",
    badgeClass: "bg-emerald-100 text-emerald-700",
    dotClass: "bg-emerald-400",
    descripcion:
      "Cremación ecológica consciente, retorno simbólico de cenizas en urna biodegradable con semilla viva o esparcimiento en jardín memorial.",
    kit: "Urna Biodegradable + Semilla",
    modif: "05 Nov 2025",
    casosDelMes: 39,
    rangos: [
      { rango: "0 - 5 kg", precioVet: "S/ 210.00", precioSugerido: "S/ 260.00", margen: "+S/ 50.00", tasaMargen: "19%" },
      { rango: "5.1 - 15 kg", precioVet: "S/ 250.00", precioSugerido: "S/ 300.00", margen: "+S/ 50.00", tasaMargen: "17%" },
      { rango: "15.1 - 25 kg", precioVet: "S/ 290.00", precioSugerido: "S/ 350.00", margen: "+S/ 60.00", tasaMargen: "17%" },
      { rango: "25.1 - 35 kg", precioVet: "S/ 350.00", precioSugerido: "S/ 410.00", margen: "+S/ 60.00", tasaMargen: "15%" },
      { rango: "35.1 kg a más", precioVet: "S/ 420.00", precioSugerido: "S/ 460.00", margen: "+S/ 40.00", tasaMargen: "9%" },
    ],
  },
];

interface Zona {
  nombre: string;
  distritos: string;
  precio: string;
  incluido?: boolean;
  dotClass: string;
}

const ZONAS: Zona[] = [
  {
    nombre: "Zona Central / Cobertura Base",
    distritos: "San Luis, San Borja, Surco, Miraflores, San Isidro, La Victoria.",
    precio: "S/ 0.00",
    incluido: true,
    dotClass: "bg-emerald-400",
  },
  {
    nombre: "Zona 2 / Distritos Cercanos",
    distritos: "Barranco, Jesús María, Lince, Magdalena, Pueblo Libre.",
    precio: "S/ 40.00",
    dotClass: "bg-brand-400",
  },
  {
    nombre: "Zona 3 / Distritos Intermedios",
    distritos: "La Molina, Chorrillos, San Miguel, Cercado de Lima, Rímac.",
    precio: "S/ 60.00",
    dotClass: "bg-brand-500",
  },
  {
    nombre: "Zona 4 / Distritos Periféricos",
    distritos: "San Juan de Lurigancho, Los Olivos, Comas, Independencia, Villa El Salvador, SJM, Ate.",
    precio: "S/ 90.00",
    dotClass: "bg-slate-400",
  },
  {
    nombre: "Zona 5 / Extrema Periferia o Balnearios",
    distritos: "Puente Piedra, Carabayllo, Lurín, Pachacámac, Ventanilla, Callao.",
    precio: "S/ 140.00",
    dotClass: "bg-red-400",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 lg:p-6 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
            <PawPrintIcon className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{plan.nombre}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", plan.badgeClass)}>
                {plan.badge}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label font-semibold bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo en Tarifario
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">{plan.descripcion}</p>
            <div className="flex flex-wrap items-center gap-3 text-label text-slate-400 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <PackageIcon className="size-3.5" /> Kit: {plan.kit}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <HistoryIcon className="size-3.5" /> Última modif.: {plan.modif}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-brand-500 font-semibold">
                <ReceiptIcon className="size-3.5" /> {plan.casosDelMes} casos este mes
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="soft"
            size="sm"
            onClick={() => notifySuccess(`Abriendo edición de tarifas de ${plan.nombre}.`)}
          >
            <PencilIcon className="size-3.5" />
            Editar Tarifas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => notifySuccess(`${plan.nombre} duplicado como borrador.`)}
          >
            <CopyIcon className="size-3.5" />
            Duplicar
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Desactivar temporalmente"
            onClick={() => notifySuccess(`${plan.nombre} desactivado temporalmente.`)}
          >
            <PauseCircleIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-slate-50/60 border border-slate-100 p-1">
        <table className="w-full text-left min-w-[620px]">
          <thead>
            <tr className="text-slate-500 text-label uppercase tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Rango de Peso</th>
              <th className="py-2.5 px-3 text-right font-semibold">Precio Vet (Aliado)</th>
              <th className="py-2.5 px-3 text-right font-semibold">Precio Sugerido</th>
              <th className="py-2.5 px-3 text-right font-semibold">Margen Vet.</th>
              <th className="py-2.5 px-3 text-right font-semibold">Tasa</th>
              <th className="py-2.5 px-3 text-center font-semibold">Ajuste</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plan.rangos.map((r) => (
              <tr key={r.rango} className="hover:bg-white transition-colors">
                <td className="py-2 px-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", plan.dotClass)} />
                  {r.rango}
                </td>
                <td className="py-2 px-3 text-right text-sm font-bold text-brand-500">{r.precioVet}</td>
                <td className="py-2 px-3 text-right text-xs text-slate-500 font-medium">{r.precioSugerido}</td>
                <td className="py-2 px-3 text-right text-xs text-emerald-700 font-bold">{r.margen}</td>
                <td className="py-2 px-3 text-right text-xs text-emerald-700 font-semibold">{r.tasaMargen}</td>
                <td className="py-2 px-3 text-center">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-brand-500 transition-colors p-1"
                    onClick={() => notifySuccess(`Ajuste manual de ${r.rango} para ${plan.nombre}.`)}
                  >
                    <SlidersHorizontalIcon className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default function PlanesPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Planes" }]} />

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Planes y Tarifario Oficial
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Gestión de planes de cremación, rangos de peso y precios especiales para veterinarias
            aliadas y público final.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-1.5 h-10"
            onClick={() => notifySuccess("Generando tarifario oficial en PDF...")}
          >
            <DownloadIcon className="size-4" />
            Descargar Tarifario PDF
          </Button>
          <Button
            variant="operational"
            className="gap-1.5 h-10"
            onClick={() => notifySuccess("Abriendo formulario de nuevo plan de cremación.")}
          >
            <PlusCircleIcon className="size-4" />
            Editar Tarifario / Nuevo Plan
          </Button>
        </div>
      </div>

      {/* Barra informativa de vigencia */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-brand-500" />
            <span className="text-sm font-semibold text-slate-900">
              Vigencia actual: Periodo 2025 - 2026
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label font-semibold bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Activo
            </span>
          </div>
          <div className="hidden sm:block h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <HandshakeIcon className="size-4 text-brand-400" />
            <span className="text-xs text-slate-500">
              Margen pactado con veterinarias:{" "}
              <strong className="text-slate-900 font-semibold">25% - 35% de beneficio aliado</strong>
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start lg:self-auto px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500">
          <ArrowUpDownIcon className="size-3.5 text-slate-400" />
          Orden: Por prioridad
        </div>
      </section>

      {/* Planes de cremación */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Planes Estándar de Cremación</h2>
            <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-slate-100 text-slate-500">
              {PLANES.length} configurados
            </span>
          </div>
          <span className="text-xs text-slate-500">Precios en PEN (S/) con IGV incluido</span>
        </div>
        <div className="flex flex-col gap-4">
          {PLANES.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      {/* Complementos y logística */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Servicios Complementarios & Adicionales
              </h2>
              <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-slate-100 text-slate-500">
                Catálogo Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Artículos conmemorativos y logística por distritos para enriquecer el homenaje de
              despedida.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label font-medium bg-slate-50 text-slate-500">
              <InfoIcon className="size-3.5 text-slate-400" />
              Solo en conjunto con cremación
            </span>
            <Button
              variant="soft"
              size="sm"
              onClick={() => notifySuccess("Abriendo formulario de nuevo complemento.")}
            >
              <PlusIcon className="size-3.5" />
              Agregar Complemento
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Complemento destacado */}
          <div className="lg:col-span-5">
            <article className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <PawPrintIcon className="size-5 text-brand-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Mi última huella</h3>
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label font-semibold bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Impresión artesanal en relieve de la huella de la mascota en molde de arcilla
                  blanca horneada, enmarcada en madera noble con placa de bronce personalizada.
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-start gap-2 text-xs text-slate-500 border border-slate-100">
                  <span className="text-red-500 shrink-0 font-semibold">Aviso:</span>
                  <span>
                    Se realiza estrictamente antes del ingreso al horno crematorio por protocolo
                    de custodia.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/70 rounded-lg text-center border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-label text-slate-500">Precio Vet</span>
                    <span className="text-lg font-bold text-brand-500">S/ 90.00</span>
                  </div>
                  <div className="flex flex-col border-x border-slate-200">
                    <span className="text-label text-slate-500">Sugerido</span>
                    <span className="text-lg font-bold text-slate-900">S/ 130.00</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label text-emerald-700 font-semibold">Margen</span>
                    <span className="text-lg font-bold text-emerald-700">+S/ 40.00</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <span className="text-label text-slate-400 flex items-center gap-1">
                  <HistoryIcon className="size-3.5" /> Modif. hace 14 días
                </span>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => notifySuccess("Abriendo configuración del complemento.")}
                >
                  <SlidersHorizontalIcon className="size-3.5" />
                  Configurar
                </Button>
              </div>
            </article>
          </div>

          {/* Logística por distritos + recargo horario punta */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <article className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
                    <TruckIcon className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Traslado Logístico por Distritos
                    </h3>
                    <span className="text-xs text-slate-500">
                      Agrupaciones zonales por cercanía a sede central
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-label font-semibold bg-slate-100 text-slate-600 self-start sm:self-auto">
                  {ZONAS.length} Zonas Oficiales
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {ZONAS.map((zona) => (
                  <div
                    key={zona.nombre}
                    className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", zona.dotClass)} />
                        <span className="text-sm font-semibold text-slate-900">{zona.nombre}</span>
                        {zona.incluido && (
                          <span className="px-1.5 py-0.5 rounded text-label font-semibold bg-emerald-50 text-emerald-700">
                            Incluido en Plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 pl-4">{zona.distritos}</p>
                    </div>
                    <div className="flex items-center gap-2 pl-4 sm:pl-0 shrink-0">
                      <span className="text-sm font-bold text-slate-900">{zona.precio}</span>
                      <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-brand-500 transition-colors"
                        title="Editar distritos"
                        onClick={() => notifySuccess(`Editando distritos de ${zona.nombre}.`)}
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Tarifas fijadas con choferes certificados y furgón refrigerado
                </span>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => notifySuccess("Abriendo gestión de zonas y distritos.")}
                >
                  <SlidersHorizontalIcon className="size-3.5" />
                  Gestionar Zonas
                </Button>
              </div>
            </article>

            <article className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 flex items-center justify-center">
                  <ClockIcon className="size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Recargo Horario Punta (Tráfico Crítico)
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label font-semibold bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo (+S/ 35.00)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-medium">
                      <ClockIcon className="size-3.5 text-slate-400" /> Mañana: <strong>07:30 - 09:30</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-medium">
                      <ClockIcon className="size-3.5 text-slate-400" /> Tarde/Noche: <strong>17:00 - 19:00</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Se aplica sobre traslados y recojos programados o de urgencia dentro de estas
                    ventanas críticas de tráfico.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 self-start sm:self-center"
                onClick={() => notifySuccess("Abriendo ajuste de franjas y tarifa punta.")}
              >
                <ClockIcon className="size-3.5" />
                Ajustar Franjas
              </Button>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
