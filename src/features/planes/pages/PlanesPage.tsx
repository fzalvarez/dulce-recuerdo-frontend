import { useState, type ReactNode } from "react";
import {
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  HandshakeIcon,
  HistoryIcon,
  InfoIcon,
  PackageIcon,
  PauseCircleIcon,
  PawPrintIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusCircleIcon,
  ReceiptIcon,
  TruckIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

// TODO: reemplazar por datos reales del módulo `planes` cuando se exponga el endpoint.

/** Mismos rangos de peso que usan los reportes. */
const RANGOS = [
  { id: "0-5", etiqueta: "0 a 5 kg" },
  { id: "5-15", etiqueta: "5,1 a 15 kg" },
  { id: "15-25", etiqueta: "15,1 a 25 kg" },
  { id: "25-35", etiqueta: "25,1 a 35 kg" },
  { id: "35+", etiqueta: "35,1 kg o más" },
];

interface Precio {
  rangoId: string;
  precioVet: number;
  precioPublico: number;
}

interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  kit: string;
  activo: boolean;
  masSolicitado?: boolean;
  modif: string;
  casosDelMes: number;
  precios: Precio[];
  dotClass: string;
}

const PLANES_INICIALES: Plan[] = [
  {
    id: "clasico",
    nombre: "Dulce Recuerdo Clásico",
    descripcion:
      "Cremación individualizada, urna de roble seleccionada, certificado de autenticidad y acompañamiento en sala de despedida (30 min).",
    kit: "Urna Roble + Certificado Hilo",
    activo: true,
    masSolicitado: true,
    modif: "12 Oct 2025",
    casosDelMes: 142,
    dotClass: "bg-brand-400",
    precios: [
      { rangoId: "0-5", precioVet: 250, precioPublico: 340 },
      { rangoId: "5-15", precioVet: 290, precioPublico: 380 },
      { rangoId: "15-25", precioVet: 330, precioPublico: 420 },
      { rangoId: "25-35", precioVet: 390, precioPublico: 480 },
      { rangoId: "35+", precioVet: 460, precioPublico: 540 },
    ],
  },
  {
    id: "paz",
    nombre: "Dulce Recuerdo Paz",
    descripcion:
      "Cremación individual prioritaria, sala privada familiar asistida (60 min) con música sacra/zen, relicario y entrega en 24h garantizada.",
    kit: "Cofre Lacado + Dije Plata",
    activo: true,
    modif: "28 Sep 2025",
    casosDelMes: 68,
    dotClass: "bg-violet-400",
    precios: [
      { rangoId: "0-5", precioVet: 330, precioPublico: 450 },
      { rangoId: "5-15", precioVet: 380, precioPublico: 510 },
      { rangoId: "15-25", precioVet: 430, precioPublico: 570 },
      { rangoId: "25-35", precioVet: 490, precioPublico: 630 },
      { rangoId: "35+", precioVet: 560, precioPublico: 680 },
    ],
  },
  {
    id: "eco",
    nombre: "Dulce Recuerdo Eco",
    descripcion:
      "Cremación ecológica consciente, retorno simbólico de cenizas en urna biodegradable con semilla viva o esparcimiento en jardín memorial.",
    kit: "Urna Biodegradable + Semilla",
    activo: true,
    modif: "05 Nov 2025",
    casosDelMes: 39,
    dotClass: "bg-emerald-400",
    precios: [
      { rangoId: "0-5", precioVet: 210, precioPublico: 260 },
      { rangoId: "5-15", precioVet: 250, precioPublico: 300 },
      { rangoId: "15-25", precioVet: 290, precioPublico: 350 },
      { rangoId: "25-35", precioVet: 350, precioPublico: 410 },
      { rangoId: "35+", precioVet: 420, precioPublico: 460 },
    ],
  },
];

interface Complemento {
  id: string;
  nombre: string;
  descripcion: string;
  aviso: string;
  precioVet: number;
  precioPublico: number;
}

const COMPLEMENTO_INICIAL: Complemento = {
  id: "mi-ultima-huella",
  nombre: "Mi última huella",
  descripcion:
    "Impresión artesanal en relieve de la huella de la mascota en molde de arcilla blanca horneada, enmarcada en madera noble con placa de bronce personalizada.",
  aviso: "Se realiza estrictamente antes del ingreso al horno crematorio por protocolo de custodia.",
  precioVet: 90,
  precioPublico: 130,
};

interface Zona {
  id: string;
  nombre: string;
  distritos: string;
  precio: number;
  incluido?: boolean;
  dotClass: string;
}

const ZONAS_INICIALES: Zona[] = [
  {
    id: "z1",
    nombre: "Zona Central / Cobertura Base",
    distritos: "San Luis, San Borja, Surco, Miraflores, San Isidro, La Victoria.",
    precio: 0,
    incluido: true,
    dotClass: "bg-emerald-400",
  },
  {
    id: "z2",
    nombre: "Zona 2 / Distritos Cercanos",
    distritos: "Barranco, Jesús María, Lince, Magdalena, Pueblo Libre.",
    precio: 40,
    dotClass: "bg-brand-400",
  },
  {
    id: "z3",
    nombre: "Zona 3 / Distritos Intermedios",
    distritos: "La Molina, Chorrillos, San Miguel, Cercado de Lima, Rímac.",
    precio: 60,
    dotClass: "bg-brand-500",
  },
  {
    id: "z4",
    nombre: "Zona 4 / Distritos Periféricos",
    distritos: "San Juan de Lurigancho, Los Olivos, Comas, Independencia, Villa El Salvador, SJM, Ate.",
    precio: 90,
    dotClass: "bg-slate-400",
  },
  {
    id: "z5",
    nombre: "Zona 5 / Extrema Periferia o Balnearios",
    distritos: "Puente Piedra, Carabayllo, Lurín, Pachacámac, Ventanilla, Callao.",
    precio: 140,
    dotClass: "bg-red-400",
  },
];

interface Horario {
  inicioManana: string;
  finManana: string;
  inicioTarde: string;
  finTarde: string;
  recargo: number;
}

const HORARIO_INICIAL: Horario = {
  inicioManana: "07:30",
  finManana: "09:30",
  inicioTarde: "17:00",
  finTarde: "19:00",
  recargo: 35,
};

// ---------- Formato y cálculos ----------

const formatoSoles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

function soles(valor: number): string {
  return formatoSoles.format(valor);
}

function ganancia(precio: Pick<Precio, "precioVet" | "precioPublico">): number {
  return precio.precioPublico - precio.precioVet;
}

/** Porcentaje de ganancia de la veterinaria sobre el precio al público. */
function porcentajeGanancia(precio: Pick<Precio, "precioVet" | "precioPublico">): number {
  if (precio.precioPublico <= 0) return 0;
  return Math.round((ganancia(precio) / precio.precioPublico) * 100);
}

function numeroValido(texto: string, minimo: number): number | null {
  if (texto.trim() === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) && n >= minimo ? n : null;
}

// ---------- Componentes pequeños ----------

function Modal({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">{children}</DialogContent>
    </Dialog>
  );
}

function EstadoPill({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label font-semibold",
        activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", activo ? "bg-emerald-500" : "bg-slate-400")} />
      {activo ? "Activo" : "Pausado"}
    </span>
  );
}

// ---------- Plan: tarjeta ----------

function PlanCard({
  plan,
  onEditar,
  onCambiarEstado,
}: {
  plan: Plan;
  onEditar: () => void;
  onCambiarEstado: () => void;
}) {
  return (
    <article className={cn("bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 lg:p-6 flex flex-col gap-4", !plan.activo && "opacity-80")}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
            <PawPrintIcon className="size-5" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{plan.nombre}</h3>
              {plan.masSolicitado && (
                <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-brand-100 text-brand-700">
                  El más solicitado
                </span>
              )}
              <EstadoPill activo={plan.activo} />
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">{plan.descripcion}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-slate-400">
              <span className="inline-flex items-center gap-1">
                <PackageIcon className="size-3.5" /> Incluye: {plan.kit}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <HistoryIcon className="size-3.5" /> Modificado: {plan.modif}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-brand-500 font-semibold">
                <ReceiptIcon className="size-3.5" /> {plan.casosDelMes} casos este mes
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onEditar}>
            <PencilIcon className="size-3.5" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={onCambiarEstado}>
            {plan.activo ? (
              <>
                <PauseCircleIcon className="size-3.5" />
                Pausar venta
              </>
            ) : (
              <>
                <PlayCircleIcon className="size-3.5" />
                Reactivar venta
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/60">
        <table className="w-full text-left min-w-[560px]">
          <thead>
            <tr className="text-slate-500 text-label uppercase tracking-wider">
              <th className="py-2.5 px-4 font-semibold">Peso de la mascota</th>
              <th className="py-2.5 px-4 text-right font-semibold">Precio veterinaria</th>
              <th className="py-2.5 px-4 text-right font-semibold">Precio al público</th>
              <th className="py-2.5 px-4 text-right font-semibold">Ganancia veterinaria</th>
              <th className="py-2.5 px-4 text-right font-semibold">% ganancia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {RANGOS.map((rango) => {
              const precio = plan.precios.find((p) => p.rangoId === rango.id);
              if (!precio) return null;
              return (
                <tr key={rango.id}>
                  <td className="py-2.5 px-4 text-sm font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", plan.dotClass)} />
                      {rango.etiqueta}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-sm font-semibold text-slate-900 tabular-nums">
                    {soles(precio.precioVet)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-sm text-slate-700 tabular-nums">
                    {soles(precio.precioPublico)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-sm font-semibold text-emerald-700 tabular-nums">
                    {soles(ganancia(precio))}
                  </td>
                  <td className="py-2.5 px-4 text-right text-xs font-semibold text-emerald-700 tabular-nums">
                    {porcentajeGanancia(precio)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

// ---------- Plan: formulario (nuevo o editar) ----------

interface PlanDatos {
  nombre: string;
  descripcion: string;
  kit: string;
  precios: Precio[];
}

function PlanDialog({
  open,
  plan,
  onOpenChange,
  onGuardar,
}: {
  open: boolean;
  plan: Plan | null;
  onOpenChange: (open: boolean) => void;
  onGuardar: (datos: PlanDatos) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {/* El formulario se monta al abrir: cada vez empieza con los datos del plan. */}
      <PlanForm
        plan={plan}
        onCancelar={() => onOpenChange(false)}
        onGuardar={(datos) => {
          onGuardar(datos);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}

function PlanForm({
  plan,
  onCancelar,
  onGuardar,
}: {
  plan: Plan | null;
  onCancelar: () => void;
  onGuardar: (datos: PlanDatos) => void;
}) {
  const esNuevo = plan === null;
  const [nombre, setNombre] = useState(plan?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(plan?.descripcion ?? "");
  const [kit, setKit] = useState(plan?.kit ?? "");
  const [textos, setTextos] = useState<Record<string, { vet: string; publico: string }>>(() =>
    Object.fromEntries(
      RANGOS.map((r) => {
        const p = plan?.precios.find((x) => x.rangoId === r.id);
        return [r.id, { vet: p ? String(p.precioVet) : "", publico: p ? String(p.precioPublico) : "" }];
      })
    )
  );
  const [error, setError] = useState<string | null>(null);

  const actualizarPrecio = (rangoId: string, campo: "vet" | "publico", valor: string) =>
    setTextos((prev) => ({ ...prev, [rangoId]: { ...prev[rangoId], [campo]: valor } }));

  const handleGuardar = () => {
    if (!nombre.trim()) return setError("Escribe el nombre del plan.");
    const precios: Precio[] = [];
    for (const r of RANGOS) {
      const vet = numeroValido(textos[r.id].vet, 0);
      const publico = numeroValido(textos[r.id].publico, 0);
      if (vet === null || publico === null) {
        return setError(`Completa los dos precios de ${r.etiqueta}.`);
      }
      if (publico <= 0 || publico < vet) {
        return setError(
          `En ${r.etiqueta}, el precio al público debe ser mayor que cero y no menor que el de la veterinaria.`
        );
      }
      precios.push({ rangoId: r.id, precioVet: vet, precioPublico: publico });
    }
    onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim(), kit: kit.trim(), precios });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{plan ? `Editar ${plan.nombre}` : "Nuevo plan de cremación"}</DialogTitle>
        <DialogDescription>
          Completa los precios de cada peso. La ganancia de la veterinaria se calcula sola.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="plan-nombre">Nombre del plan</Label>
          <Input id="plan-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-descripcion">Qué incluye</Label>
          <Textarea
            id="plan-descripcion"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-kit">Kit o urna</Label>
          <Input id="plan-kit" value={kit} onChange={(e) => setKit(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Precios por peso (S/)</Label>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-label uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold">Peso</th>
                  <th className="py-2 px-3 text-left font-semibold">Veterinaria</th>
                  <th className="py-2 px-3 text-left font-semibold">Público</th>
                  <th className="py-2 px-3 text-right font-semibold">Ganancia vet.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RANGOS.map((r) => {
                  const vet = numeroValido(textos[r.id].vet, 0) ?? 0;
                  const publico = numeroValido(textos[r.id].publico, 0) ?? 0;
                  const g = publico - vet;
                  return (
                    <tr key={r.id}>
                      <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">{r.etiqueta}</td>
                      <td className="py-1.5 px-3">
                        <Input
                          aria-label={`Precio veterinaria ${r.etiqueta}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={textos[r.id].vet}
                          onChange={(e) => actualizarPrecio(r.id, "vet", e.target.value)}
                          className="h-9"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <Input
                          aria-label={`Precio al público ${r.etiqueta}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={textos[r.id].publico}
                          onChange={(e) => actualizarPrecio(r.id, "publico", e.target.value)}
                          className="h-9"
                        />
                      </td>
                      <td
                        className={cn(
                          "py-2 px-3 text-right font-semibold tabular-nums",
                          g < 0 ? "text-red-600" : "text-emerald-700"
                        )}
                      >
                        {soles(g)} <span className="text-xs font-normal">({porcentajeGanancia({ precioVet: vet, precioPublico: publico })}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={handleGuardar}>
          {esNuevo ? "Crear plan" : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------- Complemento ----------

function ComplementoDialog({
  open,
  complemento,
  onOpenChange,
  onGuardar,
}: {
  open: boolean;
  complemento: Complemento;
  onOpenChange: (open: boolean) => void;
  onGuardar: (c: Complemento) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ComplementoForm
        complemento={complemento}
        onCancelar={() => onOpenChange(false)}
        onGuardar={(c) => {
          onGuardar(c);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}

function ComplementoForm({
  complemento,
  onCancelar,
  onGuardar,
}: {
  complemento: Complemento;
  onCancelar: () => void;
  onGuardar: (c: Complemento) => void;
}) {
  const [nombre, setNombre] = useState(complemento.nombre);
  const [descripcion, setDescripcion] = useState(complemento.descripcion);
  const [aviso, setAviso] = useState(complemento.aviso);
  const [vet, setVet] = useState(String(complemento.precioVet));
  const [publico, setPublico] = useState(String(complemento.precioPublico));
  const [error, setError] = useState<string | null>(null);

  const vetNum = numeroValido(vet, 0) ?? 0;
  const publicoNum = numeroValido(publico, 0) ?? 0;

  const handleGuardar = () => {
    if (!nombre.trim()) return setError("Escribe el nombre del complemento.");
    const v = numeroValido(vet, 0);
    const p = numeroValido(publico, 0);
    if (v === null || p === null) return setError("Completa los dos precios.");
    if (p <= 0 || p < v) {
      return setError("El precio al público debe ser mayor que cero y no menor que el de la veterinaria.");
    }
    onGuardar({
      ...complemento,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      aviso: aviso.trim(),
      precioVet: v,
      precioPublico: p,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar complemento</DialogTitle>
        <DialogDescription>Se vende solo junto con una cremación.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="comp-nombre">Nombre</Label>
          <Input id="comp-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="comp-descripcion">Descripción</Label>
          <Textarea id="comp-descripcion" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="comp-aviso">Aviso para el cliente (opcional)</Label>
          <Input id="comp-aviso" value={aviso} onChange={(e) => setAviso(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="comp-vet">Precio veterinaria (S/)</Label>
            <Input id="comp-vet" type="number" min={0} step="0.01" value={vet} onChange={(e) => setVet(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comp-publico">Precio al público (S/)</Label>
            <Input id="comp-publico" type="number" min={0} step="0.01" value={publico} onChange={(e) => setPublico(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Ganancia de la veterinaria: <strong className="text-emerald-700">{soles(publicoNum - vetNum)}</strong>
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={handleGuardar}>
          Guardar cambios
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------- Zona de traslado ----------

function ZonaDialog({
  open,
  zona,
  onOpenChange,
  onGuardar,
}: {
  open: boolean;
  zona: Zona | null;
  onOpenChange: (open: boolean) => void;
  onGuardar: (z: Zona) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {zona && (
        <ZonaForm
          zona={zona}
          onCancelar={() => onOpenChange(false)}
          onGuardar={(z) => {
            onGuardar(z);
            onOpenChange(false);
          }}
        />
      )}
    </Modal>
  );
}

function ZonaForm({
  zona,
  onCancelar,
  onGuardar,
}: {
  zona: Zona;
  onCancelar: () => void;
  onGuardar: (z: Zona) => void;
}) {
  const [precio, setPrecio] = useState(String(zona.precio));
  const [distritos, setDistritos] = useState(zona.distritos);
  const [error, setError] = useState<string | null>(null);

  const handleGuardar = () => {
    const p = numeroValido(precio, 0);
    if (p === null) return setError("El precio de traslado debe ser 0 o mayor.");
    if (!distritos.trim()) return setError("Escribe al menos un distrito.");
    onGuardar({ ...zona, precio: p, distritos: distritos.trim() });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{zona.nombre}</DialogTitle>
        <DialogDescription>Precio de traslado y distritos que incluye esta zona.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="zona-precio">Precio de traslado (S/)</Label>
          <Input id="zona-precio" type="number" min={0} step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          {zona.incluido && (
            <p className="text-xs text-slate-500">Esta es la zona incluida en el plan base: normalmente queda en 0.</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zona-distritos">Distritos (separados por coma)</Label>
          <Textarea id="zona-distritos" rows={3} value={distritos} onChange={(e) => setDistritos(e.target.value)} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={handleGuardar}>
          Guardar cambios
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------- Recargo horario punta ----------

function HorarioDialog({
  open,
  horario,
  onOpenChange,
  onGuardar,
}: {
  open: boolean;
  horario: Horario;
  onOpenChange: (open: boolean) => void;
  onGuardar: (h: Horario) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <HorarioForm
        horario={horario}
        onCancelar={() => onOpenChange(false)}
        onGuardar={(h) => {
          onGuardar(h);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}

function HorarioForm({
  horario,
  onCancelar,
  onGuardar,
}: {
  horario: Horario;
  onCancelar: () => void;
  onGuardar: (h: Horario) => void;
}) {
  const [h, setH] = useState(horario);
  const [recargo, setRecargo] = useState(String(horario.recargo));
  const [error, setError] = useState<string | null>(null);

  const handleGuardar = () => {
    const r = numeroValido(recargo, 0);
    if (r === null) return setError("El recargo debe ser 0 o mayor. Pon 0 para desactivarlo.");
    if (h.inicioManana >= h.finManana || h.inicioTarde >= h.finTarde) {
      return setError("Cada franja debe terminar después de empezar.");
    }
    onGuardar({ ...h, recargo: r });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Recargo por horario punta</DialogTitle>
        <DialogDescription>
          Se aplica a los traslados que caen dentro de estas dos franjas. Pon 0 en el recargo para desactivarlo.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="h-m-ini">Mañana: desde</Label>
            <Input id="h-m-ini" type="time" value={h.inicioManana} onChange={(e) => setH({ ...h, inicioManana: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="h-m-fin">Mañana: hasta</Label>
            <Input id="h-m-fin" type="time" value={h.finManana} onChange={(e) => setH({ ...h, finManana: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="h-t-ini">Tarde: desde</Label>
            <Input id="h-t-ini" type="time" value={h.inicioTarde} onChange={(e) => setH({ ...h, inicioTarde: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="h-t-fin">Tarde: hasta</Label>
            <Input id="h-t-fin" type="time" value={h.finTarde} onChange={(e) => setH({ ...h, finTarde: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="h-recargo">Recargo por traslado (S/)</Label>
          <Input id="h-recargo" type="number" min={0} step="0.01" value={recargo} onChange={(e) => setRecargo(e.target.value)} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={handleGuardar}>
          Guardar cambios
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------- Página ----------

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>(PLANES_INICIALES);
  const [complemento, setComplemento] = useState<Complemento>(COMPLEMENTO_INICIAL);
  const [zonas, setZonas] = useState<Zona[]>(ZONAS_INICIALES);
  const [horario, setHorario] = useState<Horario>(HORARIO_INICIAL);

  const [planDialog, setPlanDialog] = useState<{ open: boolean; plan: Plan | null }>({ open: false, plan: null });
  const [complementoAbierto, setComplementoAbierto] = useState(false);
  const [zonaDialog, setZonaDialog] = useState<{ open: boolean; zona: Zona | null }>({ open: false, zona: null });
  const [horarioAbierto, setHorarioAbierto] = useState(false);

  const planesActivos = planes.filter((p) => p.activo).length;

  const handleGuardarPlan = (datos: PlanDatos) => {
    const editando = planDialog.plan;
    if (editando) {
      setPlanes((prev) => prev.map((p) => (p.id === editando.id ? { ...p, ...datos } : p)));
      notifySuccess(`Plan "${datos.nombre}" actualizado.`);
    } else {
      const nuevo: Plan = {
        id: `plan-${Date.now()}`,
        ...datos,
        activo: true,
        modif: "Hoy",
        casosDelMes: 0,
        dotClass: "bg-slate-400",
      };
      setPlanes((prev) => [...prev, nuevo]);
      notifySuccess(`Plan "${datos.nombre}" creado y activo para la venta.`);
    }
  };

  const cambiarEstadoPlan = (plan: Plan) => {
    setPlanes((prev) => prev.map((p) => (p.id === plan.id ? { ...p, activo: !p.activo } : p)));
    notifySuccess(
      plan.activo
        ? `${plan.nombre} pausado: no aparecerá en nuevas cotizaciones.`
        : `${plan.nombre} reactivado para la venta.`
    );
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Planes" }]} />

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">Planes y precios</h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Planes de cremación, precios por peso, servicios complementarios y traslado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" className="gap-1.5 h-10" onClick={() => notifySuccess("Generando tarifario en PDF para compartir.")}>
            <DownloadIcon className="size-4" />
            Descargar tarifario
          </Button>
          <Button
            variant="operational"
            className="gap-1.5 h-10"
            onClick={() => setPlanDialog({ open: true, plan: null })}
          >
            <PlusCircleIcon className="size-4" />
            Nuevo plan
          </Button>
        </div>
      </div>

      {/* Vigencia y pacto */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-brand-500" />
          <span className="text-sm font-semibold text-slate-900">Vigencia: 2025 – 2026</span>
          <EstadoPill activo />
        </div>
        <div className="hidden lg:block h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <HandshakeIcon className="size-4 text-brand-400" />
          <span className="text-xs text-slate-500">
            Pacto con veterinarias: ganancia de <strong className="text-slate-900 font-semibold">25% a 35%</strong>
          </span>
        </div>
      </section>

      {/* Planes */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-900">Planes de cremación</h2>
          <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-slate-100 text-slate-500">
            {planesActivos} activos de {planes.length}
          </span>
        </div>
        <div className="flex flex-col gap-5">
          {planes.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEditar={() => setPlanDialog({ open: true, plan })}
              onCambiarEstado={() => cambiarEstadoPlan(plan)}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Los precios están en soles con IGV incluido. Un plan pausado no aparece para nuevas cotizaciones.
        </p>
      </section>

      {/* Complementos y traslado */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Complementos y traslado</h2>
          <p className="text-xs text-slate-500 mt-1">
            Servicios extra para la despedida y cobro del traslado por zona.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Complemento */}
          <div className="lg:col-span-5">
            <article className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-2">
                <PawPrintIcon className="size-5 text-brand-500" />
                <h3 className="text-sm font-semibold text-slate-900">{complemento.nombre}</h3>
                <span className="ml-auto text-label text-slate-400 inline-flex items-center gap-1">
                  <InfoIcon className="size-3.5" /> Solo con cremación
                </span>
              </div>
              <p className="text-xs text-slate-500">{complemento.descripcion}</p>
              <p className="text-xs text-red-600/90 bg-red-50/60 rounded-lg px-3 py-2">{complemento.aviso}</p>
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/70 rounded-lg text-center border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-label text-slate-500">Veterinaria</span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">{soles(complemento.precioVet)}</span>
                </div>
                <div className="flex flex-col border-x border-slate-200">
                  <span className="text-label text-slate-500">Público</span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">{soles(complemento.precioPublico)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-label text-slate-500">Ganancia vet.</span>
                  <span className="text-base font-bold text-emerald-700 tabular-nums">
                    {soles(complemento.precioPublico - complemento.precioVet)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
                <span className="text-label text-slate-400 inline-flex items-center gap-1">
                  <HistoryIcon className="size-3.5" /> Modificado hace 14 días
                </span>
                <Button variant="outline" size="sm" onClick={() => setComplementoAbierto(true)}>
                  <PencilIcon className="size-3.5" />
                  Editar
                </Button>
              </div>
            </article>
          </div>

          {/* Traslado y recargo */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <article className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
                  <TruckIcon className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Traslado por zona</h3>
                  <span className="text-xs text-slate-500">Cuánto se cobra según el distrito del servicio</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {zonas.map((zona) => (
                  <div
                    key={zona.id}
                    className="p-3 rounded-lg bg-slate-50/60 border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", zona.dotClass)} />
                        <span className="text-sm font-semibold text-slate-900">{zona.nombre}</span>
                        {zona.incluido && (
                          <span className="px-1.5 py-0.5 rounded text-label font-semibold bg-emerald-50 text-emerald-700">
                            Incluido en plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 pl-4 truncate">{zona.distritos}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {zona.precio === 0 ? "Sin cargo" : soles(zona.precio)}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setZonaDialog({ open: true, zona })}>
                        <PencilIcon className="size-3.5" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                  <ClockIcon className="size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-slate-900">Recargo por horario punta</h4>
                  <p className="text-xs text-slate-600">
                    {horario.recargo > 0 ? (
                      <>
                        Se cobra <strong>{soles(horario.recargo)}</strong> extra en las franjas{" "}
                        <strong>{horario.inicioManana}–{horario.finManana}</strong> y{" "}
                        <strong>{horario.inicioTarde}–{horario.finTarde}</strong>.
                      </>
                    ) : (
                      "Desactivado: no se cobra recargo por horario."
                    )}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setHorarioAbierto(true)}>
                <PencilIcon className="size-3.5" />
                Editar
              </Button>
            </article>
          </div>
        </div>
      </section>

      <PlanDialog
        open={planDialog.open}
        plan={planDialog.plan}
        onOpenChange={(open) => setPlanDialog((prev) => ({ ...prev, open }))}
        onGuardar={handleGuardarPlan}
      />

      <ComplementoDialog
        open={complementoAbierto}
        complemento={complemento}
        onOpenChange={setComplementoAbierto}
        onGuardar={(c) => {
          setComplemento(c);
          notifySuccess(`"${c.nombre}" actualizado.`);
        }}
      />

      <ZonaDialog
        open={zonaDialog.open}
        zona={zonaDialog.zona}
        onOpenChange={(open) => setZonaDialog((prev) => ({ ...prev, open }))}
        onGuardar={(z) => {
          setZonas((prev) => prev.map((x) => (x.id === z.id ? z : x)));
          notifySuccess(`${z.nombre}: traslado actualizado.`);
        }}
      />

      <HorarioDialog
        open={horarioAbierto}
        horario={horario}
        onOpenChange={setHorarioAbierto}
        onGuardar={(h) => {
          setHorario(h);
          notifySuccess("Recargo por horario punta actualizado.");
        }}
      />
    </>
  );
}
