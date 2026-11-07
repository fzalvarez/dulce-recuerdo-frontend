import { useState } from "react";
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
import { CATEGORIAS_GASTO_VARIABLE, type CategoriaGastoVariable, type GastoVariable } from "../types";

export type GastoVariableData = Omit<GastoVariable, "id">;

interface GastoVariableDialogProps {
  open: boolean;
  /** Gasto a editar; si es null, el diálogo registra uno nuevo. */
  gasto: GastoVariable | null;
  /** Fecha por defecto para un gasto nuevo (YYYY-MM-DD). */
  fechaDefault: string;
  onOpenChange: (open: boolean) => void;
  onSave: (data: GastoVariableData) => void;
}

export function GastoVariableDialog({
  open,
  gasto,
  fechaDefault,
  onOpenChange,
  onSave,
}: GastoVariableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Radix desmonta el contenido al cerrar, así el formulario se reinicia solo. */}
        <GastoVariableForm
          gasto={gasto}
          fechaDefault={fechaDefault}
          onCancel={() => onOpenChange(false)}
          onSave={(data) => {
            onSave(data);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function GastoVariableForm({
  gasto,
  fechaDefault,
  onCancel,
  onSave,
}: {
  gasto: GastoVariable | null;
  fechaDefault: string;
  onCancel: () => void;
  onSave: (data: GastoVariableData) => void;
}) {
  const esEdicion = gasto !== null;
  const [fecha, setFecha] = useState(gasto?.fecha ?? fechaDefault);
  const [categoria, setCategoria] = useState<CategoriaGastoVariable | "">(
    gasto?.categoria ?? ""
  );
  const [concepto, setConcepto] = useState(gasto?.concepto ?? "");
  const [monto, setMonto] = useState(gasto ? String(gasto.monto) : "");
  const [observaciones, setObservaciones] = useState(gasto?.observaciones ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const montoNum = Number(monto);
    if (!fecha) return setError("Elige la fecha del gasto.");
    if (!categoria) return setError("Elige una categoría.");
    if (!concepto.trim()) return setError("Describe en qué se gastó.");
    if (concepto.trim().length > 200) return setError("El concepto no puede pasar de 200 caracteres.");
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return setError("El monto debe ser mayor a 0.");
    }
    onSave({
      fecha,
      categoria,
      concepto: concepto.trim(),
      monto: montoNum,
      observaciones: observaciones.trim() || undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{esEdicion ? "Editar gasto" : "Registrar gasto"}</DialogTitle>
        <DialogDescription>
          Gastos que ocurren durante el mes y no se repiten todos los meses.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="gv-fecha">Fecha</Label>
            <DatePicker id="gv-fecha" value={fecha} onChange={setFecha} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gv-monto">Monto (S/)</Label>
            <Input
              id="gv-monto"
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gv-categoria">Categoría</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaGastoVariable)}>
            <SelectTrigger id="gv-categoria" className="w-full">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_GASTO_VARIABLE.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gv-concepto">Concepto</Label>
          <Input
            id="gv-concepto"
            placeholder="Ej. Gasolina furgoneta, urnas de roble x 3"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gv-obs">Observaciones (opcional)</Label>
          <Textarea
            id="gv-obs"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>{esEdicion ? "Guardar cambios" : "Registrar"}</Button>
      </DialogFooter>
    </>
  );
}
