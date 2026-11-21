import { useState, type FormEvent } from "react";
import { PaperclipIcon, PencilIcon, PlusCircleIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import { fechaCorta, soles } from "@/features/casos/utils/casos";
import { eliminarFactura, listarFacturas, type FacturaCompra } from "../api";
import { VisorAdjunto } from "../components/VisorAdjunto";
import { FacturaCompraForm } from "../components/FacturaCompraForm";

/** Facturas de compra registradas: comprobantes de proveedores con su archivo (dentro de Ingresos y Gastos). */
export default function FacturasCompraPage() {
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const recurso = useRecurso(
    () => listarFacturas({ q: q || undefined, desde: desde || undefined, hasta: hasta || undefined }),
    [q, desde, hasta]
  );
  const [editando, setEditando] = useState<FacturaCompra | "nueva" | null>(null);
  const [borrando, setBorrando] = useState<FacturaCompra | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [visor, setVisor] = useState<FacturaCompra | null>(null);

  const facturas = recurso.data ?? [];
  const totalListado = facturas.reduce((acc, f) => acc + Number(f.total), 0);
  const igvListado = facturas.reduce((acc, f) => acc + Number(f.igv), 0);

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    setQ(texto.trim());
  };

  const borrar = async () => {
    if (!borrando) return;
    setTrabajando(true);
    const ok = await ejecutar(
      () => eliminarFactura(borrando.id),
      "Factura eliminada. El gasto vinculado, si existe, se conserva.",
      "No se pudo eliminar la factura."
    );
    setTrabajando(false);
    setBorrando(null);
    if (ok) recurso.recargar();
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Finanzas" }, { label: "Facturas de compra" }]} />
      <ModuleHeader
        title="Facturas de compra"
        description="Comprobantes de proveedores con su PDF o foto. Cada factura puede vincularse con un gasto."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nueva")}>
            <PlusCircleIcon className="size-4" />
            Nueva factura
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <form onSubmit={buscar} className="relative w-full max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Serie, RUC, proveedor o concepto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              aria-label="Buscar factura"
            />
          </form>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Desde</span>
            <DatePicker id="fc-desde" value={desde || undefined} onChange={setDesde} />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hasta</span>
            <DatePicker id="fc-hasta" value={hasta || undefined} onChange={setHasta} />
          </div>
        </div>
        {!recurso.cargando && (
          <p className="text-sm text-slate-600">
            {facturas.length} factura{facturas.length === 1 ? "" : "s"} · total {soles(totalListado)} · IGV {soles(igvListado)}
          </p>
        )}
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[960px]">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">N.º serie</th>
              <th className="px-4 py-3 font-semibold">Proveedor</th>
              <th className="px-4 py-3 font-semibold">Concepto</th>
              <th className="px-4 py-3 font-semibold text-right">Base</th>
              <th className="px-4 py-3 font-semibold text-right">IGV</th>
              <th className="px-4 py-3 font-semibold text-right">Total</th>
              <th className="px-4 py-3 font-semibold">Gasto</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {facturas.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3 whitespace-nowrap">{fechaCorta(f.fecha)}</td>
                <td className="px-4 py-3 font-mono text-xs">{f.numero_serie}</td>
                <td className="px-4 py-3">
                  <span className="block font-medium text-slate-900 dark:text-white">{f.razon_social}</span>
                  <span className="block font-mono text-xs text-slate-500">RUC {f.ruc_proveedor}</span>
                </td>
                <td className="px-4 py-3 max-w-[260px] truncate" title={f.concepto}>
                  {f.concepto}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{soles(f.base)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{soles(f.igv)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">{soles(f.total)}</td>
                <td className="px-4 py-3">
                  {f.gasto_id ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-label font-semibold text-emerald-700">Vinculada</span>
                  ) : (
                    <span className="text-xs text-slate-400">Sin gasto</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    {f.tiene_adjunto && (
                      <Button variant="ghost" size="icon-sm" title={`Ver ${f.adjunto_nombre ?? "archivo"}`} onClick={() => setVisor(f)}>
                        <PaperclipIcon className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setEditando(f)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Eliminar" onClick={() => setBorrando(f)}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!recurso.cargando && facturas.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  {q || desde || hasta ? "Ninguna factura coincide con el filtro." : "Todavía no hay facturas de compra. Registra la primera con «Nueva factura»."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <VisorAdjunto factura={visor} onCerrar={() => setVisor(null)} />

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-2xl">
        {editando && (
          <FacturaCompraForm
            factura={editando === "nueva" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={() => {
              recurso.recargar();
              setEditando(null);
            }}
          />
        )}
      </Modal>

      <Modal open={borrando !== null} onOpenChange={(o) => !o && setBorrando(null)}>
        <DialogHeader>
          <DialogTitle>Eliminar factura {borrando?.numero_serie}</DialogTitle>
          <DialogDescription>
            {borrando?.razon_social}. Se borra también su archivo. Si tiene un gasto vinculado, el gasto se conserva.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setBorrando(null)} disabled={trabajando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={borrar} disabled={trabajando}>
            Eliminar
          </Button>
        </DialogFooter>
      </Modal>
    </>
  );
}
