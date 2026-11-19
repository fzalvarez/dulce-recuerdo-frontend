import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ejecutar } from "@/shared/utils/ejecutar";
import { crearMarca, editarMarca, type Marca } from "../api";

/** Alta y edición de una sub-marca. Sus planes y precios se cargan en Planes. */
export function MarcaForm({ marca, onCerrar, onHecho }: { marca: Marca | null; onCerrar: () => void; onHecho: () => void }) {
  const [nombre, setNombre] = useState(marca?.nombre ?? "");
  const [activa, setActiva] = useState(marca ? marca.activa : true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!nombre.trim()) return setError("Escribe el nombre de la marca.");
    setError(null);
    setGuardando(true);
    const ok = marca
      ? await ejecutar(() => editarMarca(marca.id, { nombre: nombre.trim(), activa }), "Marca actualizada.", "No se pudo guardar la marca.")
      : await ejecutar(() => crearMarca(nombre.trim()), "Marca creada.", "No se pudo crear la marca.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{marca ? "Editar marca" : "Nueva marca"}</DialogTitle>
        <DialogDescription>
          {marca ? "Cambiar el nombre o desactivarla. Una marca inactiva no se asigna a veterinarias nuevas." : "Después crea sus planes en Planes."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="marca-nombre">Nombre</Label>
        <Input id="marca-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Latido Eterno" />
      </div>
      {marca && (
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-brand-500" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
          Activa
        </label>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
}
