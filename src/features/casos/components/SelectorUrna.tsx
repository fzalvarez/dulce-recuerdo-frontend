import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LINEA_LABEL, TAMANO_LABEL, type LineaUrna, type TamanoUrna } from "@/features/inventario/types";
import type { OpcionUrna } from "../types";

const TAMANOS = Object.keys(TAMANO_LABEL) as TamanoUrna[];

/**
 * Elige la urna en cascada: línea → tamaño → forma → color (spec urnas-variantes).
 * Solo ofrece urnas con stock disponible. `actual` es la urna que el caso ya tiene:
 * se ofrece aunque su disponible sea 0, porque ese 0 es su propia reserva.
 * El tamaño sugerido por el peso se preselecciona, pero se puede cambiar.
 */
export function SelectorUrna({
  id,
  urnas,
  value,
  onChange,
  tamanoSugerido,
  actual,
}: {
  id: string;
  urnas: OpcionUrna[];
  value: string;
  onChange: (urnaId: string) => void;
  tamanoSugerido?: TamanoUrna | null;
  actual?: OpcionUrna | null;
}) {
  const vendibles = urnas.filter((u) => u.disponible > 0 || u.id === actual?.id);
  if (actual && !vendibles.some((u) => u.id === actual.id)) vendibles.push(actual);
  const elegida = vendibles.find((u) => u.id === value) ?? null;

  const [linea, setLinea] = useState<LineaUrna | "">(elegida?.linea ?? "");
  const [tamano, setTamano] = useState<TamanoUrna | "">(elegida?.tamano ?? "");
  const [forma, setForma] = useState(elegida?.forma ?? "");

  // Con una urna elegida, la cascada muestra sus datos; sin ella, lo que se va eligiendo.
  const lineaV = elegida?.linea ?? linea;
  const tamanoV = elegida?.tamano ?? (tamano || tamanoSugerido || "");
  const formaV = elegida?.forma ?? forma;

  if (vendibles.length === 0) {
    return <p className="text-xs text-amber-700">No hay urnas con stock disponible. Revisa Inventario → Urnas.</p>;
  }

  const lineas = [...new Set(vendibles.map((u) => u.linea))];
  const enLinea = vendibles.filter((u) => u.linea === lineaV);
  const formas = [...new Set(enLinea.filter((u) => u.tamano === tamanoV).map((u) => u.forma))].sort();
  const colores = enLinea.filter((u) => u.tamano === tamanoV && u.forma === formaV).sort((a, b) => a.color.localeCompare(b.color));

  const cambiarLinea = (v: LineaUrna) => {
    setLinea(v);
    setTamano(tamanoV);
    setForma("");
    onChange("");
  };
  const cambiarTamano = (v: TamanoUrna) => {
    setLinea(lineaV);
    setTamano(v);
    setForma("");
    onChange("");
  };
  const cambiarForma = (v: string) => {
    setLinea(lineaV);
    setTamano(tamanoV);
    setForma(v);
    const opciones = enLinea.filter((u) => u.tamano === tamanoV && u.forma === v);
    onChange(opciones.length === 1 ? opciones[0].id : "");
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-linea`}>Línea</Label>
        <Select value={lineaV} onValueChange={(v) => cambiarLinea(v as LineaUrna)}>
          <SelectTrigger id={`${id}-linea`} className="w-full">
            <SelectValue placeholder="Elegir" />
          </SelectTrigger>
          <SelectContent>
            {lineas.map((l) => (
              <SelectItem key={l} value={l}>
                {LINEA_LABEL[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-tamano`}>Tamaño</Label>
        <Select value={tamanoV} onValueChange={(v) => cambiarTamano(v as TamanoUrna)}>
          <SelectTrigger id={`${id}-tamano`} className="w-full">
            <SelectValue placeholder="Elegir" />
          </SelectTrigger>
          <SelectContent>
            {TAMANOS.map((t) => (
              <SelectItem key={t} value={t} disabled={!!lineaV && !enLinea.some((u) => u.tamano === t)}>
                {TAMANO_LABEL[t]}
                {t === tamanoSugerido ? " (sugerido)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-forma`}>Forma</Label>
        <Select value={formaV} onValueChange={cambiarForma} disabled={!lineaV || formas.length === 0}>
          <SelectTrigger id={`${id}-forma`} className="w-full">
            <SelectValue placeholder={lineaV && tamanoV && formas.length === 0 ? "Sin stock" : "Elegir"} />
          </SelectTrigger>
          <SelectContent>
            {formas.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-color`}>Color</Label>
        <Select value={value} onValueChange={onChange} disabled={colores.length === 0}>
          <SelectTrigger id={`${id}-color`} className="w-full">
            <SelectValue placeholder="Elegir" />
          </SelectTrigger>
          <SelectContent>
            {colores.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.color} · {u.id === actual?.id ? "elegida" : `${u.disponible} disp.`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
