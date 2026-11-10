import { useState } from "react";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { LINEA_LABEL, TAMANO_LABEL, type LineaUrna, type TamanoUrna } from "@/features/inventario/types";
import type { OpcionUrna } from "../types";

const TAMANOS = Object.keys(TAMANO_LABEL) as TamanoUrna[];

function Paso({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium leading-none">{label}</span>
      {children}
    </div>
  );
}

/**
 * Elige la urna en cascada con botones: línea → tamaño → forma → color (spec urnas-variantes).
 * Solo ofrece urnas con stock disponible. `actual` es la urna que el caso ya tiene:
 * se ofrece aunque su disponible sea 0, porque ese 0 es su propia reserva.
 * El tamaño sugerido por el peso se preselecciona, pero se puede cambiar.
 */
export function SelectorUrna({
  urnas,
  value,
  onChange,
  tamanoSugerido,
  actual,
}: {
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
  const lineas = [...new Set(vendibles.map((u) => u.linea))];
  const lineaV = elegida?.linea ?? (linea || (lineas.length === 1 ? lineas[0] : ""));
  const tamanoV = elegida?.tamano ?? (tamano || tamanoSugerido || "");
  const formaV = elegida?.forma ?? forma;

  if (vendibles.length === 0) {
    return <p className="text-xs text-amber-700">No hay urnas con stock disponible. Revisa Inventario → Urnas.</p>;
  }

  const enLinea = vendibles.filter((u) => u.linea === lineaV);
  const formas = [...new Set(enLinea.filter((u) => u.tamano === tamanoV).map((u) => u.forma))].sort();
  const colores = enLinea
    .filter((u) => u.tamano === tamanoV && u.forma === formaV)
    .sort((a, b) => a.color.localeCompare(b.color));

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Paso label="Línea">
        <BotonesOpcion
          ariaLabel="Línea de urna"
          columnas="grid-cols-2"
          value={lineaV}
          onChange={cambiarLinea}
          opciones={(Object.keys(LINEA_LABEL) as LineaUrna[]).map((l) => ({
            value: l,
            label: LINEA_LABEL[l],
            disabled: !lineas.includes(l),
          }))}
        />
      </Paso>
      <Paso label="Tamaño">
        <BotonesOpcion
          ariaLabel="Tamaño de urna"
          value={tamanoV}
          onChange={cambiarTamano}
          opciones={TAMANOS.map((t) => ({
            value: t,
            label: TAMANO_LABEL[t],
            detalle: t === tamanoSugerido ? "sugerido" : undefined,
            disabled: !!lineaV && !enLinea.some((u) => u.tamano === t),
          }))}
        />
      </Paso>
      <Paso label="Forma">
        {lineaV && tamanoV ? (
          formas.length ? (
            <BotonesOpcion ariaLabel="Forma de urna" value={formaV} onChange={cambiarForma} opciones={formas.map((f) => ({ value: f, label: f }))} />
          ) : (
            <p className="text-xs text-amber-700">Sin stock de este tamaño en esta línea.</p>
          )
        ) : (
          <p className="text-xs text-slate-400">Elige la línea y el tamaño.</p>
        )}
      </Paso>
      <Paso label="Color">
        {colores.length ? (
          <BotonesOpcion
            ariaLabel="Color de urna"
            value={value}
            onChange={onChange}
            opciones={colores.map((u) => ({
              value: u.id,
              label: u.color,
              detalle: u.id === actual?.id ? "elegida" : `${u.disponible} disp.`,
            }))}
          />
        ) : (
          <p className="text-xs text-slate-400">Elige la forma.</p>
        )}
      </Paso>
    </div>
  );
}
