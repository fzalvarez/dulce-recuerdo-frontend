import { useState } from "react";
import { Link } from "react-router-dom";
import { ReceiptIcon, WalletIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Modal } from "@/features/casos/components/Dialogos";
import { GastoForm } from "@/features/finanzas/pages/FinanzasPage";

/**
 * Registro de gastos para el operador: crear gastos variables y facturas de compra.
 * No muestra listados ni montos acumulados (eso es de finanzas).
 */
export default function RegistrarGastoPage() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Finanzas" }, { label: "Registrar gastos" }]} />
      <ModuleHeader title="Registrar gastos" description="Carga los gastos variables y las facturas de compra." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-6 flex flex-col gap-4">
          <WalletIcon className="size-6 text-brand-500" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nuevo gasto variable</h2>
            <p className="mt-1 text-sm text-slate-500">Compras del día a día: fecha, categoría, concepto y monto.</p>
          </div>
          <Button variant="operational" className="self-start" onClick={() => setAbierto(true)}>
            Registrar gasto
          </Button>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-6 flex flex-col gap-4">
          <ReceiptIcon className="size-6 text-brand-500" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Factura de compra</h2>
            <p className="mt-1 text-sm text-slate-500">Sube el PDF o la foto de la factura. La IA sugiere los datos y tú los confirmas.</p>
          </div>
          <Button asChild variant="outline" className="self-start">
            <Link to="/gastos/facturas">Ir a facturas de compra</Link>
          </Button>
        </section>
      </div>

      <Modal open={abierto} onOpenChange={setAbierto}>
        {abierto && <GastoForm gasto={null} onCerrar={() => setAbierto(false)} onHecho={() => setAbierto(false)} />}
      </Modal>
    </div>
  );
}
