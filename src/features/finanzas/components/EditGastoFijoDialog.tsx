import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GastoFijo } from "../types";

interface GastoPatch {
  nombre: string;
  monto: number;
  saldoPendiente?: number;
}

interface EditGastoFijoDialogProps {
  gasto: GastoFijo | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: GastoPatch) => void;
}

export function EditGastoFijoDialog({ gasto, onOpenChange, onSave }: EditGastoFijoDialogProps) {
  return (
    <Dialog open={gasto !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* La key reinicia el formulario cada vez que se abre otro gasto. */}
        {gasto && (
          <GastoFijoForm
            key={gasto.id}
            gasto={gasto}
            onCancel={() => onOpenChange(false)}
            onSave={(patch) => {
              onSave(gasto.id, patch);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GastoFijoForm({
  gasto,
  onCancel,
  onSave,
}: {
  gasto: GastoFijo;
  onCancel: () => void;
  onSave: (patch: GastoPatch) => void;
}) {
  const esPrestamo = gasto.grupo === "Préstamos";
  const [nombre, setNombre] = useState(gasto.nombre);
  const [monto, setMonto] = useState(String(gasto.monto));
  const [saldo, setSaldo] = useState(
    gasto.saldoPendiente !== undefined ? String(gasto.saldoPendiente) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const montoNum = Number(monto);
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!Number.isFinite(montoNum) || montoNum < 0) {
      return setError("El monto mensual debe ser un número mayor o igual a 0.");
    }
    let saldoNum: number | undefined;
    if (esPrestamo) {
      saldoNum = Number(saldo || 0);
      if (!Number.isFinite(saldoNum) || saldoNum < 0) {
        return setError("El saldo pendiente debe ser un número mayor o igual a 0.");
      }
    }
    onSave({ nombre: nombre.trim(), monto: montoNum, saldoPendiente: saldoNum });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar gasto fijo</DialogTitle>
        <DialogDescription>
          Este monto se aplica cada mes hasta que lo cambies.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="gf-nombre">Nombre</Label>
          <Input id="gf-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gf-monto">
            {esPrestamo ? "Cuota mensual (S/)" : "Monto mensual (S/)"}
          </Label>
          <Input
            id="gf-monto"
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        {esPrestamo && (
          <div className="space-y-1.5">
            <Label htmlFor="gf-saldo">Saldo pendiente (S/)</Label>
            <Input
              id="gf-saldo"
              type="number"
              min="0"
              step="0.01"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>Guardar</Button>
      </DialogFooter>
    </>
  );
}
