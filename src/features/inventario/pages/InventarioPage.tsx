import { useMemo, useState } from "react";
import {
  PackageIcon,
  BoxIcon,
  LeafIcon,
  PawPrintIcon,
  ImageIcon,
  GemIcon,
  ShieldIcon,
  SearchIcon,
  DownloadIcon,
  PlusCircleIcon,
  PlusIcon,
  MinusIcon,
  ArrowLeftRightIcon,
  PencilIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  CheckCircle2Icon,
  TruckIcon,
  ScanBarcodeIcon,
  ClipboardCheckIcon,
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

// TODO: reemplazar por datos reales del módulo `inventario` cuando se exponga el endpoint.
type Categoria = "urnas-clasicas" | "urnas-ecologicas" | "recuerdos" | "suministros";
type Nivel = "optimo" | "bajo" | "critico";

interface ItemInventario {
  id: string;
  sku: string;
  nombre: string;
  detalle: string;
  categoria: Categoria;
  categoriaLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  stock: number;
  minimo: number;
  nivel: Nivel;
}

const CATEGORIAS: { value: Categoria | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "urnas-clasicas", label: "Urnas de Madera y Cerámica" },
  { value: "urnas-ecologicas", label: "Urnas Ecológicas" },
  { value: "recuerdos", label: "Recuerdos & Huellas" },
  { value: "suministros", label: "Suministros Operativos" },
];

const ITEMS: ItemInventario[] = [
  {
    id: "urn-rob-01",
    sku: "URN-ROB-01",
    nombre: "Urna de Roble Natural Artesanal",
    detalle: "Acabado cera vegetal, mascotas hasta 45kg",
    categoria: "urnas-clasicas",
    categoriaLabel: "Urnas Clásicas",
    icon: BoxIcon,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    stock: 22,
    minimo: 8,
    nivel: "optimo",
  },
  {
    id: "urn-cao-02",
    sku: "URN-CAO-02",
    nombre: "Cofre Lacado Caoba Premium",
    detalle: "Herrajes de latón en bronce, terciopelo interior",
    categoria: "urnas-clasicas",
    categoriaLabel: "Urnas Clásicas",
    icon: BoxIcon,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    stock: 3,
    minimo: 5,
    nivel: "bajo",
  },
  {
    id: "rec-hue-01",
    sku: "REC-HUE-01",
    nombre: 'Kit Escultura en Arcilla "Mi Última Huella"',
    detalle: "Arcilla polimérica de secado suave, molde sellado",
    categoria: "recuerdos",
    categoriaLabel: "Recuerdos",
    icon: PawPrintIcon,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    stock: 18,
    minimo: 10,
    nivel: "optimo",
  },
  {
    id: "rec-por-03",
    sku: "REC-POR-03",
    nombre: "Portarretrato Conmemorativo de Nogal",
    detalle: "Marco doble para foto + certificado de despedida",
    categoria: "recuerdos",
    categoriaLabel: "Recuerdos",
    icon: ImageIcon,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    stock: 12,
    minimo: 6,
    nivel: "optimo",
  },
  {
    id: "rec-dij-02",
    sku: "REC-DIJ-02",
    nombre: "Dije Relicario Portacenizas en Plata 925",
    detalle: "Con cápsula hermética de rosca de precisión",
    categoria: "recuerdos",
    categoriaLabel: "Recuerdos",
    icon: GemIcon,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    stock: 1,
    minimo: 4,
    nivel: "critico",
  },
  {
    id: "sum-man-01",
    sku: "SUM-MAN-01",
    nombre: "Manto Térmico de Biocustodia Protocolar",
    detalle: "Tejido hidrófugo hipoalergénico con precinto inviolable",
    categoria: "suministros",
    categoriaLabel: "Suministro",
    icon: ShieldIcon,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    stock: 40,
    minimo: 15,
    nivel: "optimo",
  },
  {
    id: "urn-bio-03",
    sku: "URN-BIO-03",
    nombre: "Urna Biodegradable con Semilla de Árbol",
    detalle: "Sustrato orgánico compostable con semilla de ciprés",
    categoria: "urnas-ecologicas",
    categoriaLabel: "Urnas Ecológicas",
    icon: LeafIcon,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    stock: 9,
    minimo: 5,
    nivel: "optimo",
  },
];

const NIVEL_META: Record<Nivel, { label: string; badgeClass: string; barClass: string; dotClass: string }> = {
  optimo: {
    label: "Óptimo",
    badgeClass: "bg-emerald-50 text-emerald-700",
    barClass: "bg-emerald-500",
    dotClass: "bg-emerald-500",
  },
  bajo: {
    label: "Stock Bajo",
    badgeClass: "bg-amber-50 text-amber-700",
    barClass: "bg-amber-500",
    dotClass: "bg-amber-500",
  },
  critico: {
    label: "Crítico",
    badgeClass: "bg-red-50 text-red-700",
    barClass: "bg-red-500",
    dotClass: "bg-red-500",
  },
};

function pctStock(stock: number, minimo: number) {
  const meta = Math.max(minimo * 3, 1);
  return Math.max(6, Math.min(100, Math.round((stock / meta) * 100)));
}

const TOTAL_CATALOGO = 28;
const STOCK_CRITICO = ITEMS.filter((i) => i.nivel === "critico").length;
const URNAS_DISPONIBLES = ITEMS.filter((i) => i.categoria === "urnas-clasicas" || i.categoria === "urnas-ecologicas").reduce(
  (acc, i) => acc + i.stock,
  0
);
const KITS_RECUERDO = ITEMS.filter((i) => i.categoria === "recuerdos").reduce((acc, i) => acc + i.stock, 0);
const VALORIZACION = "S/ 28,450.00";

const TIPOS_MOVIMIENTO = [
  { value: "ingreso", label: "Ingreso por Compra", icon: TruckIcon },
  { value: "merma", label: "Merma / Daño / Rotura", icon: AlertTriangleIcon },
  { value: "conteo", label: "Ajuste por Conteo Físico", icon: ClipboardCheckIcon },
] as const;

function MovimientoModal({
  item,
  onOpenChange,
  onConfirmar,
}: {
  item: ItemInventario | null;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (item: ItemInventario, cantidad: number) => void;
}) {
  const [tipo, setTipo] = useState<(typeof TIPOS_MOVIMIENTO)[number]["value"]>("ingreso");
  const [cantidad, setCantidad] = useState(10);
  const [proveedor, setProveedor] = useState("");
  const [nota, setNota] = useState("");

  if (!item) return null;

  const proyectado = tipo === "merma" ? Math.max(0, item.stock - cantidad) : item.stock + cantidad;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmar(item, cantidad);
    onOpenChange(false);
    setTipo("ingreso");
    setCantidad(10);
    setProveedor("");
    setNota("");
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <ArrowLeftRightIcon className="size-5" />
          </div>
          <DialogTitle>Movimiento de Stock Físico</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Registro de ingresos, mermas o recuentos en almacén.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
            <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center shrink-0", item.iconBg, item.iconColor)}>
              <item.icon className="size-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 truncate">{item.nombre}</span>
              <span className="text-xs text-slate-500">SKU: {item.sku}</span>
              {item.nivel !== "optimo" && (
                <span className="text-label text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                  <AlertTriangleIcon className="size-3" /> Stock Actual: {item.stock} unidades (Bajo Mínimo)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Razón del Movimiento</Label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_MOVIMIENTO.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipo(value)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg text-center gap-1 border transition-colors",
                    tipo === value
                      ? "bg-brand-50 text-brand-700 border-brand-200 font-semibold shadow-xs"
                      : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100 font-medium"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-xs leading-tight">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 text-xs text-slate-500">
              <InfoIcon className="size-3.5 text-brand-500 shrink-0" />
              Las salidas por servicio se descuentan automáticamente al registrar cada caso.
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Cantidad de Unidades</Label>
              <span className="text-xs text-emerald-700 font-semibold">
                Nuevo Stock Proyectado: <strong>{proyectado}</strong> unidades
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="soft"
                size="icon"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              >
                <MinusIcon className="size-4" />
              </Button>
              <Input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                className="text-center font-bold text-slate-900"
              />
              <Button
                type="button"
                variant="soft"
                size="icon"
                onClick={() => setCantidad((c) => c + 1)}
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proveedor-inv">Proveedor / Guía o Motivo del Ajuste</Label>
            <Input
              id="proveedor-inv"
              placeholder="Ej: Factura F001-4921 o justificación de auditoría..."
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nota-inv">Nota de Registro (Opcional)</Label>
            <Input
              id="nota-inv"
              placeholder="Ej: Verificado en recepción de almacén..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="operational">
              <CheckCircle2Icon className="size-4" />
              Confirmar Movimiento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventarioPage() {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "todos">("todos");
  const [nivelFiltro, setNivelFiltro] = useState<Nivel | "todos">("todos");
  const [itemEnMovimiento, setItemEnMovimiento] = useState<ItemInventario | null>(null);

  const itemsFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return ITEMS.filter((i) => {
      const coincideTexto =
        !query || i.nombre.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query);
      const coincideCategoria = categoria === "todos" || i.categoria === categoria;
      const coincideNivel = nivelFiltro === "todos" || i.nivel === nivelFiltro;
      return coincideTexto && coincideCategoria && coincideNivel;
    });
  }, [busqueda, categoria, nivelFiltro]);

  const handleConfirmarMovimiento = (item: ItemInventario, cantidad: number) => {
    notifySuccess(`Movimiento de ${cantidad} unidades registrado para ${item.nombre}.`);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Inventario" }]} />

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
              Inventario y Elementos
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-label font-semibold">
              Sede Central Lima
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Control de stock de urnas, cuadros, recuerdos conmemorativos y suministros operativos
            del crematorio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-1.5 h-10"
            onClick={() => notifySuccess("Exportando catálogo de inventario en Excel...")}
          >
            <DownloadIcon className="size-4" />
            Exportar (.xlsx)
          </Button>
          <Button
            variant="operational"
            className="gap-1.5 h-10"
            onClick={() => notifySuccess("Abriendo formulario de nuevo elemento de catálogo.")}
          >
            <PlusCircleIcon className="size-4" />
            Nuevo Elemento
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
                Stock Crítico / Por Agotar
              </span>
              <span className="text-2xl font-bold text-red-600 mt-1">
                {STOCK_CRITICO} <span className="text-sm font-normal text-slate-500">ítems</span>
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangleIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="px-2.5 py-1 rounded-full text-label font-semibold bg-red-50 text-red-700 inline-flex items-center gap-1">
              <AlertTriangleIcon className="size-3" /> Requiere reposición inmediata
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
                Urnas Disponibles
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1">
                {URNAS_DISPONIBLES} <span className="text-sm font-normal text-slate-500">uds</span>
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
              <BoxIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span className="text-emerald-700 font-semibold">3 modelos</span> · Madera, cerámica &
            ecológicas
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
                Kits de Recuerdos
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1">
                {KITS_RECUERDO} <span className="text-sm font-normal text-slate-500">uds</span>
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
              <PawPrintIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <span className="text-emerald-700 font-semibold">Huellas & Cuadros</span> listos para
            entrega
          </div>
        </div>
      </section>

      {/* Categorías + valorización */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {CATEGORIAS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategoria(c.value)}
              className={cn(
                "px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                categoria === c.value
                  ? "bg-brand-500 text-white shadow-sm font-semibold"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              {c.label}
              {c.value === "todos" && (
                <span className="ml-1 opacity-80">({ITEMS.length})</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg self-start lg:self-auto">
          <PackageIcon className="size-4 text-brand-500 shrink-0" />
          <div className="flex flex-col">
            <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
              Valorización de Almacén
            </span>
            <span className="text-sm font-bold text-slate-900">{VALORIZACION} PEN</span>
          </div>
        </div>
      </section>

      {/* Búsqueda + filtro de estado */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre, SKU o proveedor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="filtro-nivel" className="whitespace-nowrap">Estado:</Label>
          <Select value={nivelFiltro} onValueChange={(v) => setNivelFiltro(v as typeof nivelFiltro)}>
            <SelectTrigger id="filtro-nivel" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los Estados</SelectItem>
              <SelectItem value="optimo">Stock Óptimo (&gt; 10 uds)</SelectItem>
              <SelectItem value="bajo">Stock Bajo (&lt; 5 uds)</SelectItem>
              <SelectItem value="critico">Crítico (&lt; 2 uds)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Tabla de inventario */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-label uppercase tracking-wider">
                <th className="py-3 px-5 font-semibold">Elemento / Producto</th>
                <th className="py-3 px-4 font-semibold">Categoría</th>
                <th className="py-3 px-4 font-semibold">Stock Actual & Nivel</th>
                <th className="py-3 px-4 font-semibold">Mínimo Sugerido</th>
                <th className="py-3 px-5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsFiltrados.map((item) => {
                const meta = NIVEL_META[item.nivel];
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "transition-colors",
                      item.nivel === "critico"
                        ? "bg-red-50/40 hover:bg-red-50/70"
                        : "hover:bg-slate-50/70"
                    )}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center shrink-0", item.iconBg, item.iconColor)}>
                          <item.icon className="size-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {item.nombre}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-label font-semibold text-slate-600">
                              {item.sku}
                            </span>
                            <span className="truncate">· {item.detalle}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-label font-semibold text-slate-600">
                        {item.categoriaLabel}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 w-44">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{item.stock} uds</span>
                          <span className={cn("px-2 py-0.5 rounded-full text-label font-bold flex items-center gap-1", meta.badgeClass)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dotClass)} />
                            {meta.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", meta.barClass)}
                            style={{ width: `${pctStock(item.stock, item.minimo)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                      Min: {item.minimo} uds
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant={item.nivel === "critico" ? "default" : "soft"}
                          size="sm"
                          onClick={() => setItemEnMovimiento(item)}
                        >
                          <ArrowLeftRightIcon className="size-3.5" />
                          Movimiento
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => notifySuccess(`Abriendo edición de ${item.nombre}.`)}
                        >
                          <PencilIcon className="size-3.5" />
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                    <ScanBarcodeIcon className="size-6 mx-auto mb-2 text-slate-300" />
                    No se encontraron elementos con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Mostrando <strong className="text-slate-900">{itemsFiltrados.length}</strong> de{" "}
            <strong className="text-slate-900">{TOTAL_CATALOGO}</strong> elementos de catálogo
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" disabled>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button variant="default" size="sm" className="h-7 px-3">
              1
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3">
              2
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-3">
              3
            </Button>
            <Button variant="ghost" size="icon-sm">
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <MovimientoModal
        item={itemEnMovimiento}
        onOpenChange={(open) => !open && setItemEnMovimiento(null)}
        onConfirmar={handleConfirmarMovimiento}
      />
    </>
  );
}
