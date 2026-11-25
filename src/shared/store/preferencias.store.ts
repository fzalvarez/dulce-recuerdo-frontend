import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Preferencias de visualización del panel. Se guardan en este navegador. */
interface PreferenciasState {
  /** Muestra el texto que describe cada módulo bajo su título. */
  mostrarDescripciones: boolean;
  setMostrarDescripciones: (v: boolean) => void;
}

export const usePreferenciasStore = create<PreferenciasState>()(
  persist(
    (set) => ({
      mostrarDescripciones: true,
      setMostrarDescripciones: (mostrarDescripciones) => set({ mostrarDescripciones }),
    }),
    { name: "preferencias" }
  )
);
