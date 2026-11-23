import { useState } from "react";
import { PencilIcon, PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import { crearSerie, editarSerie, listarSeries, type Serie } from "@/features/comprobantes/api";

const PREFIJO = { BOLETA: "B", FACTURA: "F" } as const;

/**
 * Series de boletas y facturas electrónicas. Una activa por tipo: con ella se emite.
 * El correlativo inicial permite seguir una serie usada en otro sistema sin repetir números.
 */
export function SeriesPanel() {
  const recurso = useRecurso(listarSeries);
  const [editando, setEditando] = useState<Serie | "nueva" | null>(null);
  const series = recurso.data ?? [];
  const faltan = (["BOLETA", "FACTURA"] as const).filter((t) => !series.some((s) => s.tipo === t && s.activa));

  const activar = async (s: Serie) => {
    const ok = await ejecutar(
      () => editarSerie(s.id, { activa: !s.activa }),
      s.activa ? `Serie ${s.serie} desactivada.` : `Las ${s.tipo === "BOLETA" ? "boletas" : "facturas"} se emiten ahora con ${s.serie}.`,
      "No se pudo cambiar la serie."
    );
    if (ok) recurso.recargar();
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Series de comprobantes</h2>
          <p className="text-sm text-slate-500">
            Serie y correlativo de las boletas y facturas electrónicas. Usa una serie distinta a la de SUSII (por
            ejemplo B002 y F002) o, si sigues la misma, pon como inicial el último número de SUSII + 1.
          </p>
        </div>
        <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nueva")}>
          <PlusCircleIcon className="size-4" />
          Nueva serie
        </Button>
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}
      {!recurso.cargando && !recurso.error && faltan.length > 0 && (
        <p className="text-sm rounded-lg bg-amber-50 text-amber-800 px-3 py-2 dark:bg-amber-500/10 dark:text-amber-300">
          Sin serie activa de {faltan.map((t) => (t === "BOLETA" ? "boletas" : "facturas")).join(" ni de ")}: no se
          pueden emitir hasta configurarla.
        </p>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-140">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Serie</th>
              <th className="px-5 py-3 font-semibold">Tipo</th>
              <th className="px-5 py-3 font-semibold text-right">Inicial</th>
              <th className="px-5 py-3 font-semibold text-right">Último emitido</th>
              <th className="px-5 py-3 font-semibold text-right">Siguiente</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {series.map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3 font-mono font-semibold text-slate-900 dark:text-white">{s.serie}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.tipo === "BOLETA" ? "Boleta" : "Factura"}</td>
                <td className="px-5 py-3 text-right tabular-nums">{s.correlativo_inicial}</td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {s.ultimo ?? "—"}
                  {s.emitidos > 0 && <span className="block text-xs text-slate-400">{s.emitidos} emitidos</span>}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium">
                  {s.serie}-{s.siguiente}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-label font-semibold",
                        s.activa ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {s.activa ? "En uso" : "Inactiva"}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => activar(s)}>
                      {s.activa ? "Desactivar" : "Usar"}
                    </Button>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setEditando(s)}>
                    <PencilIcon className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!recurso.cargando && series.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Todavía no hay series. Crea una para boletas y otra para facturas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        El número que se usa es el mayor entre el inicial, el último emitido + 1 y el que conoce el proveedor de
        facturación: nunca se repite ni retrocede. Los números se cuentan por separado en modo prueba y en producción.
      </p>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-md">
        {editando && (
          <SerieForm
            serie={editando === "nueva" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={() => {
              recurso.recargar();
              setEditando(null);
            }}
          />
        )}
      </Modal>
    </section>
  );
}

function SerieForm({ serie, onCerrar, onHecho }: { serie: Serie | null; onCerrar: () => void; onHecho: () => void }) {
  const [tipo, setTipo] = useState<Serie["tipo"]>(serie?.tipo ?? "BOLETA");
  const [codigo, setCodigo] = useState(serie?.serie ?? "");
  const [inicial, setInicial] = useState(String(serie?.correlativo_inicial ?? 1));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const bloqueada = (serie?.emitidos ?? 0) > 0;

  const guardar = async () => {
    const valor = codigo.trim().toUpperCase();
    const numero = Number(inicial);
    if (!new RegExp(`^${PREFIJO[tipo]}[A-Z0-9]{3}$`).test(valor))
      return setError(`La serie tiene 4 caracteres y empieza con ${PREFIJO[tipo]} (por ejemplo ${PREFIJO[tipo]}002).`);
    if (!Number.isInteger(numero) || numero < 1) return setError("El correlativo inicial es un número desde 1.");
    setError(null);
    setGuardando(true);
    const ok = await ejecutar(
      () =>
        serie
          ? editarSerie(serie.id, { ...(bloqueada ? {} : { serie: valor }), correlativo_inicial: numero })
          : crearSerie({ tipo, serie: valor, correlativo_inicial: numero, activa: true }),
      "Serie guardada.",
      "No se pudo guardar la serie."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{serie ? `Editar serie ${serie.serie}` : "Nueva serie"}</DialogTitle>
        <DialogDescription>
          {serie ? "El correlativo inicial puede cambiar en cualquier momento." : "La serie nueva pasa a ser la que se usa para su tipo."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!serie && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              {(["BOLETA", "FACTURA"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={tipo === t ? "operational" : "outline"}
                  size="sm"
                  onClick={() => setTipo(t)}
                >
                  {t === "BOLETA" ? "Boleta" : "Factura"}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="serie-codigo">Serie</Label>
          <Input
            id="serie-codigo"
            value={codigo}
            maxLength={4}
            disabled={bloqueada}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder={`${PREFIJO[tipo]}002`}
            className="font-mono"
          />
          {bloqueada && <p className="text-xs text-slate-500">Ya tiene comprobantes: no se renombra.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="serie-inicial">Correlativo inicial</Label>
          <Input
            id="serie-inicial"
            type="number"
            min={1}
            value={inicial}
            onChange={(e) => setInicial(e.target.value)}
            className="tabular-nums"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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
