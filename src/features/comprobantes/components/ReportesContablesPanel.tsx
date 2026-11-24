import { useState } from "react";
import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { notifyError } from "@/shared/utils";
import { soles } from "@/features/casos/utils/casos";
import * as C from "../api";

const COLUMNAS: { reporte: C.ReporteContable; titulo: string; detalle: string; habilitado: (m: C.MesContable) => boolean }[] = [
  { reporte: "resumen-totales", titulo: "Resumen de totales", detalle: "Excel", habilitado: () => true },
  { reporte: "resumen-facturas", titulo: "Resumen detallado", detalle: "Facturas · Excel", habilitado: (m) => m.facturas > 0 },
  { reporte: "compendio-boletas", titulo: "Compendio", detalle: "Boletas y notas · PDF", habilitado: (m) => m.boletas > 0 || m.anulados > 0 },
  { reporte: "compendio-facturas", titulo: "Compendio", detalle: "Facturas y notas · PDF", habilitado: (m) => m.facturas > 0 },
  { reporte: "registro-ventas", titulo: "Libro electrónico de ventas", detalle: "PLE 14.1 · txt", habilitado: () => true },
];

function nombreMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("es-PE", { month: "short", year: "numeric" });
}

/** Reportes para el contador, mes a mes: los mismos que entregaba el facturador anterior. */
export function ReportesContablesPanel() {
  const recurso = useRecurso(C.mesesContables);
  const [bajando, setBajando] = useState<string | null>(null);

  const bajar = async (mes: string, reporte: C.ReporteContable) => {
    const clave = `${mes}-${reporte}`;
    setBajando(clave);
    try {
      await C.descargarReporte(mes, reporte);
    } catch (e) {
      notifyError(getApiErrorMessage(e, "No se pudo generar el reporte."));
    } finally {
      setBajando(null);
    }
  };

  const meses = recurso.data ?? [];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 max-w-3xl">
        Lo que se le entrega al contador cada mes. Solo cuenta lo emitido desde esta app (los meses anteriores siguen en SUSII). Los
        rechazados por SUNAT no entran; los anulados van aparte y, en el libro de ventas, con estado 2.
      </p>
      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-sm min-w-240">
          <thead className="bg-slate-50 dark:bg-white/5 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left text-label uppercase tracking-wider font-semibold">Mes</th>
              <th className="px-4 py-3 text-right text-label uppercase tracking-wider font-semibold">Emitido</th>
              {COLUMNAS.map((c) => (
                <th key={c.reporte} className="px-3 py-3 text-center font-semibold text-xs">
                  {c.titulo}
                  <span className="block font-normal text-[11px] text-slate-400">{c.detalle}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-semibold text-xs">
                Ventas SIRE
                <span className="block font-normal text-[11px] text-slate-400">zip</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {meses.map((m) => (
              <tr key={m.mes}>
                <td className="px-4 py-3 font-medium capitalize whitespace-nowrap">{nombreMes(m.mes)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <p className="tabular-nums font-medium">{soles(m.total)}</p>
                  <p className="text-xs text-slate-500">
                    {m.boletas} B · {m.facturas} F{m.anulados ? ` · ${m.anulados} anul.` : ""}
                  </p>
                </td>
                {COLUMNAS.map((c) => {
                  const clave = `${m.mes}-${c.reporte}`;
                  const activo = c.habilitado(m);
                  return (
                    <td key={c.reporte} className="px-3 py-3 text-center">
                      {activo ? (
                        <button
                          type="button"
                          disabled={bajando !== null}
                          onClick={() => bajar(m.mes, c.reporte)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
                        >
                          {bajando === clave ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : <DownloadIcon className="size-3.5" />}
                          Descargar
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center text-xs text-slate-400" title="Se agrega con un archivo de ejemplo del contador">
                  Pendiente
                </td>
              </tr>
            ))}
            {!recurso.cargando && meses.length === 0 && (
              <tr>
                <td colSpan={COLUMNAS.length + 3} className="py-8 text-center text-slate-400">
                  Todavía no hay comprobantes emitidos desde la app.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
