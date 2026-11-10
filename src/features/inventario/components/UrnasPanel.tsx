import { Fragment, useState } from "react";
import { ArrowDownToLineIcon, LayoutGridIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
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

type Dialogo = "catalogo" | "carga";

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
        <Button variant="operational" className="gap-1.5" onClick={() => setDialogo("catalogo")} disabled={!datos}>
          <LayoutGridIcon className="size-4" />
          Catálogo de urnas
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
          Todavía no hay urnas. Abre “Catálogo de urnas”, escribe las formas de cada tamaño y los colores: se crean todas de una vez.
        </p>
      )}

      {datos &&
        LINEAS.map((linea) => {
          const filas = datos.filas.filter((f) => f.linea === linea);
          if (filas.length === 0) return null;
          return <TablaLinea key={linea} linea={linea} filas={filas} colores={datos.colores} />;
        })}

      <Modal open={dialogo !== null} onOpenChange={(o) => !o && cerrar()} ancho="sm:max-w-4xl">
        {dialogo === "catalogo" && datos && <CatalogoForm matriz={datos} onCerrar={cerrar} onHecho={hecho} />}
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

const claveModelo = (linea: LineaUrna, tamano: TamanoUrna) => `${linea}|${tamano}`;

/**
 * Todo el catálogo en un formulario: las formas de cada línea y tamaño, y los colores.
 * Al guardar se crean solo las urnas que faltan (formas × colores); las existentes no se tocan.
 */
function CatalogoForm({ matriz, onCerrar, onHecho }: { matriz: MatrizUrnas; onCerrar: () => void; onHecho: () => void }) {
  const [formas, setFormas] = useState<Record<string, string>>(() => {
    const inicial: Record<string, string> = {};
    for (const f of matriz.filas) {
      const k = claveModelo(f.linea, f.tamano);
      inicial[k] = inicial[k] ? `${inicial[k]}, ${f.forma}` : f.forma;
    }
    return inicial;
  });
  const [colores, setColores] = useState(matriz.colores.join(", "));
  const [minimo, setMinimo] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const c = lista(colores);
    const m = Number(minimo);
    if (c.length === 0) return setError("Escribe al menos un color.");
    if (!Number.isInteger(m) || m < 0) return setError("El mínimo debe ser un entero.");
    const pedidos = LINEAS.flatMap((linea) =>
      TAMANOS.map((tamano) => ({ linea, tamano, formas: lista(formas[claveModelo(linea, tamano)] ?? "") })).filter((p) => p.formas.length > 0)
    );
    if (pedidos.length === 0) return setError("Escribe las formas de al menos un tamaño.");
    setGuardando(true);
    let creadas = 0;
    const ok = await ejecutar(
      async () => {
        // Cada llamada solo crea lo que falta: si una falla, se puede volver a guardar sin duplicar.
        for (const p of pedidos) {
          creadas += (await I.generarModelos({ ...p, colores: c, stock_minimo: m })).creadas.length;
        }
      },
      "Catálogo de urnas guardado.",
      "No se pudo guardar el catálogo."
    );
    setGuardando(false);
    if (ok || creadas > 0) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Catálogo de urnas</DialogTitle>
        <DialogDescription>
          Escribe las formas de cada tamaño separadas por coma y los colores una sola vez. Se crea cada combinación con stock 0;
          las que ya existen no se tocan. Quitar una forma o un color de aquí no borra urnas: para dejar de usarlas, desactívalas.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cat-colores">Colores (para todas las formas)</Label>
          <Input id="cat-colores" placeholder="Gris, Crema" value={colores} onChange={(e) => setColores(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-minimo">Stock mínimo de cada urna nueva</Label>
          <Input id="cat-minimo" type="number" min={0} value={minimo} onChange={(e) => setMinimo(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LINEAS.map((linea) => (
          <div key={linea} className="rounded-lg border border-slate-200 dark:border-white/10 p-3 flex flex-col gap-2">
            <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500">{LINEA_LABEL[linea]}</h3>
            {TAMANOS.map((tamano) => {
              const k = claveModelo(linea, tamano);
              return (
                <div key={k} className="grid grid-cols-[7.5rem_1fr] items-center gap-2">
                  <Label htmlFor={`cat-${k}`} className="text-sm">{TAMANO_LABEL[tamano]}</Label>
                  <Input
                    id={`cat-${k}`}
                    placeholder="Casa, Rectangular"
                    value={formas[k] ?? ""}
                    onChange={(e) => setFormas((x) => ({ ...x, [k]: e.target.value }))}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <Pie onCerrar={onCerrar} onGuardar={guardar} guardando={guardando} error={error} texto="Guardar catálogo" />
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
