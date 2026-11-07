import { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  ReceiptTextIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/shared/utils";
import {
  CATEGORIAS_GASTO_VARIABLE,
  GRUPOS_GASTO,
  type GastoFijo,
  type GastoVariable,
} from "../types";
import { INGRESOS_EJEMPLO } from "../data/finanzas.mock";
import { useFinanzasStore } from "../store/finanzas.store";
import { EditGastoFijoDialog } from "../components/EditGastoFijoDialog";
import { GastoVariableDialog, type GastoVariableData } from "../components/GastoVariableDialog";
import {
  desplazarMes,
  etiquetaMes,
  formatFechaCorta,
  formatSoles,
  ingresosDelMes,
  mesKey,
} from "../utils/periodo";

export default function FinanzasPage() {
  const gastosFijos = useFinanzasStore((s) => s.gastosFijos);
  const gastosVariables = useFinanzasStore((s) => s.gastosVariables);
  const updateGastoFijo = useFinanzasStore((s) => s.updateGastoFijo);
  const addGastoVariable = useFinanzasStore((s) => s.addGastoVariable);
  const updateGastoVariable = useFinanzasStore((s) => s.updateGastoVariable);
  const deleteGastoVariable = useFinanzasStore((s) => s.deleteGastoVariable);

  const [mes, setMes] = useState(() => mesKey(new Date()));
  const [gastoFijoEditando, setGastoFijoEditando] = useState<GastoFijo | null>(null);
  const [variableDialog, setVariableDialog] = useState<{
    open: boolean;
    gasto: GastoVariable | null;
  }>({ open: false, gasto: null });
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  // Ingresos y gastos variables dependen del mes; los fijos se aplican todos los meses.
  const ingresos = useMemo(() => ingresosDelMes(INGRESOS_EJEMPLO, mes), [mes]);
  const variables = useMemo(
    () =>
      gastosVariables
        .filter((g) => g.fecha.startsWith(mes))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [gastosVariables, mes]
  );

  const totalIngresos = sumar(ingresos.map((i) => i.monto));
  const totalFijos = sumar(gastosFijos.map((g) => g.montoMensual));
  const totalVariables = sumar(variables.map((g) => g.monto));
  const totalGastos = totalFijos + totalVariables;
  const resultado = totalIngresos - totalGastos;

  const gastosPorGrupo = GRUPOS_GASTO.map((grupo) => {
    const items = gastosFijos.filter((g) => g.grupo === grupo);
    return { grupo, items, subtotal: sumar(items.map((g) => g.montoMensual)) };
  });

  const totalesPorCategoria = CATEGORIAS_GASTO_VARIABLE.map((categoria) => ({
    categoria,
    total: sumar(variables.filter((g) => g.categoria === categoria).map((g) => g.monto)),
  })).filter((c) => c.total > 0);

  const handleSaveGastoFijo = (
    id: string,
    patch: { nombre: string; montoMensual: number; saldoPendiente?: number }
  ) => {
    updateGastoFijo(id, patch);
    notifySuccess("Gasto fijo actualizado");
  };

  const handleSaveVariable = (data: GastoVariableData) => {
    const editando = variableDialog.gasto;
    if (editando) {
      updateGastoVariable(editando.id, data);
      notifySuccess("Gasto actualizado");
    } else {
      addGastoVariable(data);
      notifySuccess("Gasto registrado");
    }
  };

  const handleDeleteVariable = (id: string) => {
    if (confirmandoId !== id) {
      setConfirmandoId(id);
      return;
    }
    deleteGastoVariable(id);
    setConfirmandoId(null);
    notifySuccess("Gasto eliminado");
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Finanzas" }, { label: "Ingresos y Gastos" }]} />

      <ModuleHeader
        title="Ingresos y Gastos"
        description="Ingresos por servicios realizados y gastos del mes."
        actions={
          <MesSelector
            label={etiquetaMes(mes)}
            onPrev={() => setMes((m) => desplazarMes(m, -1))}
            onNext={() => setMes((m) => desplazarMes(m, 1))}
          />
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Ingresos del mes"
          value={formatSoles(totalIngresos)}
          hint={`${ingresos.length} ${ingresos.length === 1 ? "servicio realizado" : "servicios realizados"}`}
          icon={TrendingUpIcon}
          tone="positive"
        />
        <KpiCard
          label="Gastos del mes"
          value={formatSoles(totalGastos)}
          hint={`Fijos ${formatSoles(totalFijos)} · Variables ${formatSoles(totalVariables)}`}
          icon={TrendingDownIcon}
          tone="negative"
        />
        <KpiCard
          label="Resultado del mes"
          value={formatSoles(resultado)}
          hint={resultado >= 0 ? "Superávit" : "Déficit"}
          icon={WalletIcon}
          tone={resultado >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col">
          <header className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Ingresos del mes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Se generan solos al realizar un servicio. No se ingresan a mano.
            </p>
          </header>

          {ingresos.length === 0 ? (
            <EmptyState text="Todavía no hay servicios realizados en este mes." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {ingresos.map((ing) => (
                <li key={ing.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-12 shrink-0">
                    <p className="text-xs font-semibold text-slate-700">
                      {formatFechaCorta(ing.fecha)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {ing.mascota}
                      <span className="ml-2 text-xs font-medium text-slate-400">
                        Caso #{ing.casoId}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 truncate">{ing.servicio}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">
                    {formatSoles(ing.monto)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Footer label="Total ingresos" value={formatSoles(totalIngresos)} tone="positive" />
        </section>

        {/* Gastos fijos */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col">
          <header className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Gastos fijos</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Se aplican cada mes. Edita un monto para cambiarlo de forma permanente.
            </p>
          </header>

          <div className="divide-y divide-slate-100">
            {gastosPorGrupo.map(({ grupo, items, subtotal }) => (
              <div key={grupo}>
                <div className="px-5 py-2 bg-slate-50/60 flex items-center justify-between">
                  <span className="text-label font-semibold uppercase tracking-wider text-slate-500">
                    {grupo}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {formatSoles(subtotal)}
                  </span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {items.map((g) => (
                    <li key={g.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{g.nombre}</p>
                        {g.saldoPendiente !== undefined && (
                          <p className="text-xs text-slate-400">
                            Saldo pendiente: {formatSoles(g.saldoPendiente)}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {formatSoles(g.montoMensual)}
                      </span>
                      <IconButton
                        label={`Editar ${g.nombre}`}
                        onClick={() => setGastoFijoEditando(g)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Footer label="Total gastos fijos" value={formatSoles(totalFijos)} tone="negative" />
        </section>

        {/* Gastos variables */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col">
          <header className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Gastos variables del mes</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Combustible, urnas, reparaciones, caja chica y otros que ocurren cuando se necesitan.
              </p>
            </div>
            <Button size="sm" onClick={() => setVariableDialog({ open: true, gasto: null })}>
              <PlusIcon className="w-4 h-4" />
              Registrar gasto
            </Button>
          </header>

          {variables.length === 0 ? (
            <EmptyState text="No hay gastos variables registrados en este mes." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {variables.map((g) => (
                <li key={g.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-12 shrink-0">
                    <p className="text-xs font-semibold text-slate-700">
                      {formatFechaCorta(g.fecha)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{g.categoria}</Badge>
                      {g.origen === "vehiculo" && <Badge variant="outline">Vehículo</Badge>}
                      <p className="text-sm font-medium text-slate-800 truncate">{g.concepto}</p>
                    </div>
                    {g.proveedor && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{g.proveedor}</p>
                    )}
                    {g.observaciones && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{g.observaciones}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {formatSoles(g.monto)}
                  </span>
                  <IconButton
                    label={`Editar ${g.concepto}`}
                    onClick={() => setVariableDialog({ open: true, gasto: g })}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    label={
                      confirmandoId === g.id
                        ? `Confirmar eliminar ${g.concepto}`
                        : `Eliminar ${g.concepto}`
                    }
                    danger
                    confirming={confirmandoId === g.id}
                    onClick={() => handleDeleteVariable(g.id)}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}

          {totalesPorCategoria.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-2">
              {totalesPorCategoria.map((c) => (
                <span
                  key={c.categoria}
                  className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1"
                >
                  {c.categoria}: <span className="font-semibold">{formatSoles(c.total)}</span>
                </span>
              ))}
            </div>
          )}

          <Footer label="Total gastos variables" value={formatSoles(totalVariables)} tone="negative" />
        </section>
      </div>

      <EditGastoFijoDialog
        gasto={gastoFijoEditando}
        onOpenChange={(open) => {
          if (!open) setGastoFijoEditando(null);
        }}
        onSave={handleSaveGastoFijo}
      />

      <GastoVariableDialog
        open={variableDialog.open}
        gasto={variableDialog.gasto}
        fechaDefault={`${mes}-01`}
        onOpenChange={(open) => {
          setVariableDialog((prev) => ({ ...prev, open }));
          if (!open) setConfirmandoId(null);
        }}
        onSave={handleSaveVariable}
      />
    </>
  );
}

function sumar(valores: number[]): number {
  return valores.reduce((acc, v) => acc + v, 0);
}

function IconButton({
  label,
  onClick,
  danger,
  confirming,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  confirming?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        confirming
          ? "bg-red-600 text-white hover:bg-red-700"
          : danger
            ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
            : "text-slate-400 hover:text-brand-500 hover:bg-brand-50"
      )}
    >
      {children}
    </button>
  );
}

function Footer({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative";
}) {
  return (
    <footer className="mt-auto px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between rounded-b-xl">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span
        className={cn("text-sm font-bold", tone === "positive" ? "text-emerald-700" : "text-red-700")}
      >
        {value}
      </span>
    </footer>
  );
}

function MesSelector({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
      <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Mes anterior">
        <ChevronLeftIcon className="w-4 h-4" />
      </Button>
      <span className="min-w-[10rem] text-center text-sm font-semibold text-slate-800">
        {label}
      </span>
      <Button variant="ghost" size="icon" onClick={onNext} aria-label="Mes siguiente">
        <ChevronRightIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "positive" | "negative";
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex items-start gap-4">
      <div
        className={cn(
          "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center",
          tone === "positive" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p
          className={cn(
            "text-xl font-bold mt-1",
            tone === "positive" ? "text-emerald-700" : "text-red-700"
          )}
        >
          {value}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
      <ReceiptTextIcon className="w-8 h-8 text-slate-300" />
      <p className="text-xs text-slate-400 max-w-xs">{text}</p>
    </div>
  );
}
