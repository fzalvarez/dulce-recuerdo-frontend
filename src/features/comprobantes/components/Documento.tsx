import { cn } from "@/lib/utils";
import { soles } from "@/features/casos/utils/casos";
import { TIPO_DOC_CLIENTE, type DocumentoComprobante, type TipoDocCliente } from "../api";
import { fechaDoc } from "../utils";

const esBoleta = (doc: DocumentoComprobante) => doc.tipo === "BOLETA" || doc.tipo_doc === "03";

/**
 * El comprobante dibujado como se imprime: cabecera con tipo y número, cliente, detalle y totales.
 * Sirve para la vista previa (antes de enviar) y para ver uno ya emitido.
 */
export function Documento({ doc, borrador }: { doc: DocumentoComprobante; borrador?: boolean }) {
  const boleta = esBoleta(doc);
  const descuento = Number(doc.descuento);
  const subtotal = doc.items.reduce((a, i) => a + Number(i.total), 0);
  return (
    <div className="relative rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-gray-950 p-4 text-[13px] text-slate-800 dark:text-slate-200 overflow-hidden">
      {borrador && (
        <span className="pointer-events-none absolute right-3 bottom-16 -rotate-12 select-none text-4xl font-black tracking-widest text-slate-200/70 dark:text-white/5">
          VISTA PREVIA
        </span>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900 dark:text-white">Dulce Recuerdo</p>
          <p className="text-xs text-slate-500">Fecha de emisión: {fechaDoc(doc.fecha_emision)}</p>
          <p className="text-xs text-slate-500">Moneda: Soles (PEN)</p>
        </div>
        <div className="rounded-md border-2 border-slate-800 dark:border-slate-300 px-4 py-2 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide">{boleta ? "Boleta de venta electrónica" : "Factura electrónica"}</p>
          <p className="font-mono text-base font-bold">{doc.numero}</p>
          {borrador && <p className="text-[10px] text-slate-500">número que tendrá al emitirse ahora</p>}
        </div>
      </div>

      {doc.ambiente === "test" && (
        <p className="mt-2 rounded bg-violet-50 px-2 py-1 text-xs font-medium text-violet-800 dark:bg-violet-500/10 dark:text-violet-300">
          Modo prueba (SUNAT beta): este comprobante no tiene valor fiscal.
        </p>
      )}

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-md bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs">
        <dt className="text-slate-500">{boleta ? "Cliente" : "Señor(es)"}</dt>
        <dd className="font-medium text-slate-900 dark:text-white">{doc.cliente_razon_social}</dd>
        <dt className="text-slate-500">{TIPO_DOC_CLIENTE[doc.cliente_tipo_doc as TipoDocCliente] ?? "Documento"}</dt>
        <dd className="tabular-nums">{doc.cliente_num_doc === "00000000" ? "— (consumidor final)" : doc.cliente_num_doc}</dd>
        {doc.cliente_direccion && (
          <>
            <dt className="text-slate-500">Dirección</dt>
            <dd>{doc.cliente_direccion}</dd>
          </>
        )}
      </dl>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="border-y border-slate-300 dark:border-white/15 text-slate-500">
            <tr>
              <th className="py-1.5 pr-2 text-right font-semibold">Cant.</th>
              <th className="py-1.5 px-2 text-left font-semibold">Descripción</th>
              <th className="py-1.5 px-2 text-right font-semibold whitespace-nowrap">V. unit.</th>
              <th className="py-1.5 px-2 text-right font-semibold whitespace-nowrap">P. unit.</th>
              <th className="py-1.5 pl-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {doc.items.map((i, n) => (
              <tr key={n}>
                <td className="py-1.5 pr-2 text-right tabular-nums">{i.cantidad}</td>
                <td className="py-1.5 px-2">{i.descripcion}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{Number(i.valor_unitario).toFixed(2)}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{Number(i.precio_unitario).toFixed(2)}</td>
                <td className="py-1.5 pl-2 text-right tabular-nums">{Number(i.total).toFixed(2)}</td>
              </tr>
            ))}
            {doc.items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-2 text-center text-slate-400">Detalle no guardado (comprobante anterior a esta versión).</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end">
        <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-0.5 text-xs">
          {descuento > 0 && (
            <>
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="text-right tabular-nums">{soles(subtotal)}</dd>
              <dt className="text-slate-500">Descuento</dt>
              <dd className="text-right tabular-nums">− {soles(descuento)}</dd>
            </>
          )}
          <dt className="text-slate-500">Op. gravada</dt>
          <dd className="text-right tabular-nums">{soles(doc.valor_venta)}</dd>
          <dt className="text-slate-500">IGV (18%)</dt>
          <dd className="text-right tabular-nums">{soles(doc.igv)}</dd>
          <dt className="font-bold text-slate-900 dark:text-white">Importe total</dt>
          <dd className="text-right tabular-nums font-bold text-slate-900 dark:text-white">{soles(doc.total)}</dd>
        </dl>
      </div>
      {doc.monto_en_letras && <p className="mt-2 text-xs"><span className="font-semibold">SON:</span> {doc.monto_en_letras}</p>}
      <p className={cn("mt-2 text-[11px] text-slate-500")}>
        {doc.precios_incluyen_igv
          ? "El precio del plan ya incluye IGV: se desglosa sin cambiar el total."
          : "El precio del plan no incluye IGV: se suma el 18%."}
      </p>
    </div>
  );
}
