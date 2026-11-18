import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { ejecutar } from "@/shared/utils/ejecutar";
import { cn } from "@/lib/utils";
import { crearRuta, editarRuta, type Prioridad, type Ruta, type RutaCuerpo } from "../api";
import { COLORES_RUTA } from "../utils/formato";

type PrioridadOpcion = Prioridad | "SIN";

/** Alta y edición de una ruta: código, corredor, prioridad, color y notas. Las paradas se arman en el mapa. */
export function RutaForm({
  ruta,
  sugerido,
  onCerrar,
  onHecho,
}: {
  ruta: Ruta | null;
  /** Código y color sugeridos para una ruta nueva (siguiente R libre). */
  sugerido: { codigo: string; color: string };
  onCerrar: () => void;
  onHecho: (id: string) => void;
}) {
  const [codigo, setCodigo] = useState(ruta?.codigo ?? sugerido.codigo);
  const [nombre, setNombre] = useState(ruta?.nombre ?? "");
  const [prioridad, setPrioridad] = useState<PrioridadOpcion>(ruta?.prioridad ?? "SIN");
  const [color, setColor] = useState(ruta?.color ?? sugerido.color);
  const [notas, setNotas] = useState(ruta?.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!codigo.trim() || !nombre.trim()) return setError("Código y corredor son obligatorios.");
    const cuerpo: RutaCuerpo = {
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      prioridad: prioridad === "SIN" ? null : prioridad,
      color,
      notas: notas.trim() || null,
    };
    setGuardando(true);
    let id = ruta?.id ?? "";
    const ok = await ejecutar(
      async () => {
        const r = ruta ? await editarRuta(ruta.id, cuerpo) : await crearRuta(cuerpo);
        id = r.data.id;
      },
      ruta ? "Ruta actualizada." : "Ruta creada. Ahora agrega sus veterinarias desde el mapa.",
      "No se pudo guardar la ruta."
    );
    setGuardando(false);
    if (ok) {
      onHecho(id);
      onCerrar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ruta ? `Editar ruta ${ruta.codigo}` : "Nueva ruta"}</DialogTitle>
        <DialogDescription>Las veterinarias y su orden se arman en el mapa.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label htmlFor="ruta-codigo" className="text-xs">
            Código *
          </Label>
          <Input id="ruta-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="h-9 uppercase" />
        </div>
        <div className="col-span-3 space-y-1">
          <Label htmlFor="ruta-nombre" className="text-xs">
            Corredor *
          </Label>
          <Input id="ruta-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Guardia Civil – El Polo – Casuarinas" className="h-9" />
        </div>
        <div className="col-span-4 sm:col-span-2 space-y-1">
          <Label className="text-xs">Prioridad</Label>
          <BotonesOpcion<PrioridadOpcion>
            ariaLabel="Prioridad"
            value={prioridad}
            onChange={setPrioridad}
            columnas="grid-cols-4"
            opciones={[
              { value: "ALTA", label: "Alta" },
              { value: "MEDIA", label: "Media" },
              { value: "BAJA", label: "Baja" },
              { value: "SIN", label: "—" },
            ]}
          />
        </div>
        <div className="col-span-4 sm:col-span-2 space-y-1">
          <Label className="text-xs">Color en el mapa</Label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COLORES_RUTA.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setColor(c)}
                className={cn("size-7 rounded-full border-2", color === c ? "border-slate-900 scale-110" : "border-white shadow")}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div className="col-span-4 space-y-1">
          <Label htmlFor="ruta-notas" className="text-xs">
            Recomendación / notas
          </Label>
          <Textarea id="ruta-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Primera salida; varios hospitales 24 h" className="min-h-0" />
        </div>
      </div>
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
