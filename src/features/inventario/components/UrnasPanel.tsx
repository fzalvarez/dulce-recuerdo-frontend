import { Fragment, useState } from "react";
import { ArrowDownToLineIcon, PaletteIcon, PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import { hoyISO, soles } from "@/features/casos/utils/casos";
import * as I from "../api";
import { LINEA_LABEL, TAMANO_LABEL, type FilaUrna, type LineaUrna, type MatrizUrnas, type Nivel, type TamanoUrna } from "../types";

const LINEAS = Object.keys(LINEA_LABEL) as LineaUrna[];
const TAMANOS = Object.keys(TAMANO_LABEL) as TamanoUrna[];

const CELDA: Record<Nivel, string> = {
  OPTIMO: "text-slate-900 dark:text-white",
  BAJO: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  CRITICO: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

type Dialogo = "generar" | "color" | "carga";

/** Urnas como la planilla del negocio: filas tamaño y forma, columnas color (spec urnas-variantes). */
export function UrnasPanel({ onCambio }: { onCambio: () => void }) {
  const matriz = useRecurso(I.matrizUrnas);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const datos = matriz.data;
  const cerrar = () => setDialogo(null);
  const hecho = () => {
    matriz.recargar();
    onCambio();
    cerrar();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="operational" className="gap-1.5" onClick={() => setDialogo("generar")}>
          <PlusCircleIcon className="size-4" />
          Generar modelos
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => setDialogo("color")} disabled={!datos?.filas.length}>
          <PaletteIcon className="size-4" />
          Agregar color
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => setDialogo("carga")} disabled={!datos?.filas.length}>
          <ArrowDownToLineIcon className="size-4" />
          Cargar stock
        </Button>
      </div>

      {matriz.error && <p className="text-sm text-red-600">{matriz.error}</p>}
      {matriz.cargando && <p className="text-sm text-slate-400">Cargando urnas…</p>}
      {datos && datos.filas.length === 0 && (
        <p className="text-sm text-slate-500">
          Todavía no hay modelos de urna. Usa “Generar modelos” con cada línea y tamaño: se crean todas las formas y colores de una vez.
        </p>
      )}

      {datos &&
        LINEAS.map((linea) => {
          const filas = datos.filas.filter((f) => f.linea === linea);
          if (filas.length === 0) return null;
          return <TablaLinea key={linea} linea={linea} filas={filas} colores={datos.colores} />;
        })}

      <Modal open={dialogo !== null} onOpenChange={(o) => !o && cerrar()} ancho={dialogo === "carga" ? "sm:max-w-4xl" : "sm:max-w-2xl"}>
        {dialogo === "generar" && <GenerarForm colores={datos?.colores ?? []} onCerrar={cerrar} onHecho={hecho} />}
        {dialogo === "color" && <ColorForm onCerrar={cerrar} onHecho={hecho} />}
        {dialogo === "carga" && datos && <CargaForm matriz={datos} onCerrar={cerrar} onHecho={hecho} />}
      </Modal>
    </>
  );
}

function TablaLinea({ linea, filas, colores }: { linea: LineaUrna; filas: FilaUrna[]; colores: string[] }) {
  const total = (color: string) => filas.reduce((acc, f) => acc + (f.celdas[color]?.stock ?? 0), 0);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
      <h3 className="px-4 pt-3 text-label font-semibold uppercase tracking-wider text-slate-500">{LINEA_LABEL[linea]}</h3>
      <table className="w-full text-left text-sm">
        <thead className="text-label uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-2 font-semibold">Tamaño</th>
            <th className="px-4 py-2 font-semibold">Forma</th>
            {colores.map((c) => (
              <th key={c} className="px-4 py-2 font-semibold text-center">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {filas.map((f, i) => {
            const primera = i === 0 || filas[i - 1].tamano !== f.tamano;
            const span = filas.filter((x) => x.tamano === f.tamano).length;
            return (
              <tr key={`${f.tamano}-${f.forma}`}>
                {primera && (
                  <td rowSpan={span} className="px-4 py-2 align-top font-medium border-r border-slate-100 dark:border-white/5">
                    {TAMANO_LABEL[f.tamano]}
                  </td>
                )}
                <td className="px-4 py-2">{f.forma}</td>
                {colores.map((c) => {
                  const celda = f.celdas[c];
                  if (!celda) return <td key={c} className="px-4 py-2 text-center text-slate-300">—</td>;
                  return (
                    <td key={c} className={cn("px-4 py-2 text-center tabular-nums", CELDA[celda.nivel], !celda.activo && "opacity-50")}>
                      <span className="font-semibold">{celda.stock}</span>
                      {celda.disponible !== celda.stock && (
                        <span className="block text-[11px] font-normal">{celda.disponible} disp.</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-slate-200 dark:border-white/10 font-semibold">
          <tr>
            <td className="px-4 py-2" colSpan={2}>Total</td>
            {colores.map((c) => (
              <td key={c} className="px-4 py-2 text-center tabular-nums">{total(c)}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Pie({ onCerrar, onGuardar, guardando, error, texto }: { onCerrar: () => void; onGuardar: () => void; guardando: boolean; error: string | null; texto: string }) {
  return (
    <>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
        <Button variant="operational" onClick={onGuardar} disabled={guardando}>{guardando ? "Guardando…" : texto}</Button>
      </DialogFooter>
    </>
  );
}

/** "Casa, Rectangular H" → ["Casa", "Rectangular H"]. */
function lista(texto: string): string[] {
  return texto.split(",").map((t) => t.trim()).filter(Boolean);
}

function GenerarForm({ colores, onCerrar, onHecho }: { colores: string[]; onCerrar: () => void; onHecho: () => void }) {
  const [linea, setLinea] = useState<LineaUrna>("SIN_VIDRIO");
  const [tamano, setTamano] = useState<TamanoUrna>("PEQUENA");
  const [formas, setFormas] = useState("");
  const [coloresTxt, setColoresTxt] = useState("");
  const [minimo, setMinimo] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const f = lista(formas);
    const c = lista(coloresTxt);
    const m = Number(minimo);
    if (f.length === 0) return setError("Escribe al menos una forma.");
    if (c.length === 0 && colores.length === 0) return setError("Todavía no hay colores: escríbelos.");
    if (!Number.isInteger(m) || m < 0) return setError("El mínimo debe ser un entero.");
    setGuardando(true);
    const ok = await ejecutar(
      () => I.generarModelos({ linea, tamano, formas: f, colores: c.length ? c : null, stock_minimo: m }),
      "Modelos generados. Los que ya existían no se tocaron.",
      "No se pudieron generar los modelos."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Generar modelos de urna</DialogTitle>
        <DialogDescription>
          Crea todas las combinaciones de forma y color de una línea y un tamaño, con stock 0. Las que ya existen no se tocan.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="gm-linea">Línea</Label>
          <Select value={linea} onValueChange={(v) => setLinea(v as LineaUrna)}>
            <SelectTrigger id="gm-linea" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LINEAS.map((l) => <SelectItem key={l} value={l}>{LINEA_LABEL[l]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gm-tamano">Tamaño</Label>
          <Select value={tamano} onValueChange={(v) => setTamano(v as TamanoUrna)}>
            <SelectTrigger id="gm-tamano" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TAMANOS.map((t) => <SelectItem key={t} value={t}>{TAMANO_LABEL[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="gm-formas">Formas (separadas por coma)</Label>
          <Input id="gm-formas" placeholder="Casa, Rectangular, Cónica" value={formas} onChange={(e) => setFormas(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gm-colores">Colores (separados por coma)</Label>
          <Input
            id="gm-colores"
            placeholder={colores.length ? `Vacío: ${colores.join(", ")}` : "Gris, Crema"}
            value={coloresTxt}
            onChange={(e) => setColoresTxt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gm-minimo">Stock mínimo de cada urna</Label>
          <Input id="gm-minimo" type="number" min={0} value={minimo} onChange={(e) => setMinimo(e.target.value)} />
        </div>
      </div>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} texto="Generar" />
    </>
  );
}

function ColorForm({ onCerrar, onHecho }: { onCerrar: () => void; onHecho: () => void }) {
  const [color, setColor] = useState("");
  const [minimo, setMinimo] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const m = Number(minimo);
    if (!color.trim()) return setError("Escribe el color.");
    if (!Number.isInteger(m) || m < 0) return setError("El mínimo debe ser un entero.");
    setGuardando(true);
    const ok = await ejecutar(() => I.agregarColor({ color: color.trim(), stock_minimo: m }), "Color agregado a todos los modelos.", "No se pudo agregar el color.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agregar color</DialogTitle>
        <DialogDescription>Se crea en todos los modelos de urna que ya existen, con stock 0: es una columna más de la tabla.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="co-color">Color</Label>
          <Input id="co-color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-minimo">Stock mínimo de cada urna</Label>
          <Input id="co-minimo" type="number" min={0} value={minimo} onChange={(e) => setMinimo(e.target.value)} />
        </div>
      </div>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} texto="Agregar color" />
    </>
  );
}

const clave = (f: FilaUrna) => `${f.linea}|${f.tamano}|${f.forma}`;

/** Carga en bloque: cantidades por celda y un costo por fila (el costo no depende del color). */
function CargaForm({ matriz, onCerrar, onHecho }: { matriz: MatrizUrnas; onCerrar: () => void; onHecho: () => void }) {
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [costos, setCostos] = useState<Record<string, string>>({});
  const [fecha, setFecha] = useState(hoyISO());
  const [proveedor, setProveedor] = useState("");
  const [esCompra, setEsCompra] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cantidad = (f: FilaUrna, color: string) => Number(cantidades[`${clave(f)}|${color}`] || 0);
  const unidades = matriz.filas.reduce((acc, f) => acc + matriz.colores.reduce((a, c) => a + (cantidad(f, c) || 0), 0), 0);
  const total = matriz.filas.reduce(
    (acc, f) => acc + matriz.colores.reduce((a, c) => a + (cantidad(f, c) || 0), 0) * (Number(costos[clave(f)]) || 0),
    0
  );

  const guardar = async () => {
    const filas: Parameters<typeof I.entradaUrnas>[0]["filas"] = [];
    for (const f of matriz.filas) {
      const porColor: Record<string, number> = {};
      for (const c of matriz.colores) {
        const n = cantidad(f, c);
        if (!Number.isInteger(n) || n < 0) return setError(`Cantidad no válida en ${TAMANO_LABEL[f.tamano]} · ${f.forma} · ${c}.`);
        if (n > 0) porColor[c] = n;
      }
      if (Object.keys(porColor).length === 0) continue;
      const costo = Number(costos[clave(f)] ?? "");
      if (costos[clave(f)] === undefined || costos[clave(f)] === "" || !Number.isFinite(costo) || costo < 0) {
        return setError(`Indica el costo unitario de ${LINEA_LABEL[f.linea]} · ${TAMANO_LABEL[f.tamano]} · ${f.forma}.`);
      }
      filas.push({ linea: f.linea, tamano: f.tamano, forma: f.forma, costo_unitario: costo.toFixed(4), cantidades: porColor });
    }
    if (filas.length === 0) return setError("Escribe al menos una cantidad.");
    setGuardando(true);
    const ok = await ejecutar(
      () =>
        I.entradaUrnas({
          fecha: `${fecha}T12:00:00`,
          proveedor: proveedor.trim() || null,
          registrar_gasto: esCompra,
          motivo: esCompra ? null : "Stock inicial",
          filas,
        }),
      `Se cargaron ${unidades} urnas.`,
      "No se pudo cargar el stock."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cargar stock de urnas</DialogTitle>
        <DialogDescription>
          Escribe cuántas llegan de cada urna y el costo unitario de cada fila. Se guarda todo junto o nada.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cg-fecha">Fecha</Label>
          <DatePicker id="cg-fecha" value={fecha} onChange={setFecha} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cg-proveedor">Proveedor (opcional)</Label>
          <Input id="cg-proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={esCompra} onChange={(e) => setEsCompra(e.target.checked)} />
        Es una compra: registrar un gasto por cada urna (desmarcado = stock inicial, sin gasto)
      </label>
      <div className="overflow-x-auto max-h-[50vh] rounded-lg border border-slate-200 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-gray-900 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Urna</th>
              <th className="px-3 py-2 font-semibold">Costo unit. (S/)</th>
              {matriz.colores.map((c) => <th key={c} className="px-3 py-2 font-semibold text-center">{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {LINEAS.map((linea) => {
              const filas = matriz.filas.filter((f) => f.linea === linea);
              if (filas.length === 0) return null;
              return (
                <Fragment key={linea}>
                  <tr>
                    <td colSpan={2 + matriz.colores.length} className="px-3 pt-3 pb-1 text-label font-semibold uppercase tracking-wider text-slate-400">
                      {LINEA_LABEL[linea]}
                    </td>
                  </tr>
                  {filas.map((f) => (
                    <tr key={clave(f)}>
                      <td className="px-3 py-1.5 whitespace-nowrap">{TAMANO_LABEL[f.tamano]} · {f.forma}</td>
                      <td className="px-3 py-1.5">
                        <Input
                          aria-label={`Costo ${TAMANO_LABEL[f.tamano]} ${f.forma}`}
                          className="w-24 h-8"
                          type="number"
                          min={0}
                          step="0.01"
                          value={costos[clave(f)] ?? ""}
                          onChange={(e) => setCostos((x) => ({ ...x, [clave(f)]: e.target.value }))}
                        />
                      </td>
                      {matriz.colores.map((c) => (
                        <td key={c} className="px-3 py-1.5 text-center">
                          {f.celdas[c]?.activo ? (
                            <Input
                              aria-label={`${TAMANO_LABEL[f.tamano]} ${f.forma} ${c}`}
                              className="w-16 h-8 mx-auto text-center"
                              type="number"
                              min={0}
                              value={cantidades[`${clave(f)}|${c}`] ?? ""}
                              onChange={(e) => setCantidades((x) => ({ ...x, [`${clave(f)}|${c}`]: e.target.value }))}
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {unidades} urnas · {soles(total)}
      </p>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} texto="Cargar stock" />
    </>
  );
}
