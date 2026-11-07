import { useState } from "react";
import { PackageIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  CATEGORIAS_ACTIVO,
  ESTADOS_ACTIVO,
  type Activo,
  type ActivoData,
  type CategoriaActivo,
  type EstadoActivo,
} from "../types";
import { ESTADO_BADGE, hoyISO } from "../utils/formato";

interface ActivoDialogProps {
  open: boolean;
  /** Activo a editar; null para registrar uno nuevo. */
  activo: Activo | null;
  /** Códigos de los demás activos, para evitar duplicados. */
  codigosOcupados: string[];
  onOpenChange: (open: boolean) => void;
  onGuardar: (datos: ActivoData) => void;
}

export function ActivoDialog({
  open,
  activo,
  codigosOcupados,
  onOpenChange,
  onGuardar,
}: ActivoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Radix desmonta el contenido al cerrar: el formulario se reinicia solo. */}
        <ActivoForm
          activo={activo}
          codigosOcupados={codigosOcupados}
          onCancel={() => onOpenChange(false)}
          onGuardar={(datos) => {
            onGuardar(datos);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ActivoForm({
  activo,
  codigosOcupados,
  onCancel,
  onGuardar,
}: {
  activo: Activo | null;
  codigosOcupados: string[];
  onCancel: () => void;
  onGuardar: (datos: ActivoData) => void;
}) {
  const esEdicion = activo !== null;
  const [codigo, setCodigo] = useState(activo?.codigo ?? "");
  const [nombre, setNombre] = useState(activo?.nombre ?? "");
  const [categoria, setCategoria] = useState<CategoriaActivo | "">(activo?.categoria ?? "");
  const [cantidad, setCantidad] = useState(activo ? String(activo.cantidad) : "1");
  const [fechaCompra, setFechaCompra] = useState(activo?.fechaCompra ?? hoyISO());
  const [costo, setCosto] = useState(activo ? String(activo.costo) : "0");
  const [estado, setEstado] = useState<EstadoActivo>(activo?.estado ?? "operativo");
  const [ubicacion, setUbicacion] = useState(activo?.ubicacion ?? "");
  const [proximaRevision, setProximaRevision] = useState(activo?.proximaRevision ?? "");
  const [observaciones, setObservaciones] = useState(activo?.observaciones ?? "");
  const [error, setError] = useState<string | null>(null);

  const codigoLimpio = codigo.trim().toUpperCase();
  const cantidadNum = Number(cantidad);
  const costoNum = Number(costo);

  const handleGuardar = () => {
    if (!codigoLimpio) return setError("El código es obligatorio.");
    if (codigosOcupados.includes(codigoLimpio)) {
      return setError(`El código ${codigoLimpio} ya está registrado.`);
    }
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!categoria) return setError("Elige una categoría.");
    if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
      return setError("La cantidad debe ser un número entero, 1 o mayor.");
    }
    if (!fechaCompra) return setError("Indica la fecha de compra.");
    if (!Number.isFinite(costoNum) || costoNum < 0) {
      return setError("El costo debe ser un número mayor o igual a 0.");
    }
    if (!ubicacion.trim()) return setError("Indica dónde está el activo.");
    if (proximaRevision && proximaRevision < fechaCompra) {
      return setError("La próxima revisión no puede ser anterior a la fecha de compra.");
    }
    onGuardar({
      codigo: codigoLimpio,
      nombre: nombre.trim(),
      categoria,
      cantidad: cantidadNum,
      fechaCompra,
      costo: costoNum,
      estado,
      ubicacion: ubicacion.trim(),
      proximaRevision: proximaRevision || undefined,
      observaciones: observaciones.trim() || undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
          <PackageIcon className="size-5" />
        </div>
        <DialogTitle>{esEdicion ? "Editar Activo" : "Nuevo Activo"}</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        {esEdicion
          ? "Revisa los datos antes de guardar los cambios."
          : "Registra un equipo durable. Revisa la vista previa antes de guardarlo."}
      </DialogDescription>

      <div className="flex flex-col gap-4">
        {/* Vista previa para verificar los datos */}
        <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
            <PackageIcon className="size-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {nombre.trim() || "Nombre del activo"}
            </span>
            <span className="text-xs text-slate-500">
              {codigoLimpio || "SIN CÓDIGO"} · {categoria || "Sin categoría"} · {cantidadNum || 0} ud.
            </span>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-label font-semibold whitespace-nowrap",
              ESTADO_BADGE[estado]
            )}
          >
            {ESTADOS_ACTIVO[estado]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="act-codigo">Código</Label>
            <Input
              id="act-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="ACT-TAP-01"
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-categoria">Categoría</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaActivo)}>
              <SelectTrigger id="act-categoria" className="w-full">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_ACTIVO.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="act-nombre">Nombre</Label>
          <Input
            id="act-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Taper de traslado de mascotas (mediano)"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="act-cantidad">Unidades</Label>
            <Input
              id="act-cantidad"
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-costo">Costo total (S/)</Label>
            <Input
              id="act-costo"
              type="number"
              min={0}
              step="0.01"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-estado">Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as EstadoActivo)}>
              <SelectTrigger id="act-estado" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ESTADOS_ACTIVO) as EstadoActivo[]).map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADOS_ACTIVO[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="act-fecha">Fecha de compra</Label>
            <DatePicker id="act-fecha" value={fechaCompra} onChange={setFechaCompra} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-revision">Próxima revisión (opcional)</Label>
            <DatePicker
              id="act-revision"
              value={proximaRevision}
              onChange={setProximaRevision}
              placeholder="Sin revisión programada"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="act-ubicacion">Ubicación</Label>
          <Input
            id="act-ubicacion"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Ej: Furgoneta, Sala de atención, Bodega"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="act-obs">Observaciones (opcional)</Label>
          <Textarea
            id="act-obs"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="operational" onClick={handleGuardar}>
          <CheckCircle2Icon className="size-4" />
          {esEdicion ? "Guardar cambios" : "Registrar activo"}
        </Button>
      </DialogFooter>
    </>
  );
}
