import { create } from "zustand";
import type { GastoFijo, GastoVariable } from "../types";
import { GASTOS_FIJOS_INICIALES, GASTOS_VARIABLES_EJEMPLO } from "../data/finanzas.mock";

type GastoFijoPatch = Partial<Pick<GastoFijo, "nombre" | "montoMensual" | "saldoPendiente">>;
type GastoVariableData = Omit<GastoVariable, "id">;

interface FinanzasState {
  gastosFijos: GastoFijo[];
  gastosVariables: GastoVariable[];
  updateGastoFijo: (id: string, patch: GastoFijoPatch) => void;
  addGastoVariable: (data: GastoVariableData) => void;
  updateGastoVariable: (id: string, data: GastoVariableData) => void;
  deleteGastoVariable: (id: string) => void;
}

// Estado en memoria: se reinicia al recargar hasta que exista API.
export const useFinanzasStore = create<FinanzasState>((set) => ({
  gastosFijos: GASTOS_FIJOS_INICIALES,
  gastosVariables: GASTOS_VARIABLES_EJEMPLO,
  updateGastoFijo: (id, patch) =>
    set((state) => ({
      gastosFijos: state.gastosFijos.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    })),
  addGastoVariable: (data) =>
    set((state) => ({
      gastosVariables: [
        ...state.gastosVariables,
        { ...data, id: `gv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
      ],
    })),
  updateGastoVariable: (id, data) =>
    set((state) => ({
      gastosVariables: state.gastosVariables.map((g) => (g.id === id ? { ...g, ...data } : g)),
    })),
  deleteGastoVariable: (id) =>
    set((state) => ({
      gastosVariables: state.gastosVariables.filter((g) => g.id !== id),
    })),
}));
