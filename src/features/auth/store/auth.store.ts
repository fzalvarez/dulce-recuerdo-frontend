import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
  /** Correo del usuario. */
  sub?: string;
  name?: string;
  uid?: string;
  /** Rol del usuario: root | admin | operador1 | operador2. */
  rol?: string;
}

interface AuthState {
  token: string | null;
  /** Módulos que el backend permite al rol del usuario (`GET /auth/me`). */
  modulos: string[];
  hasHydrated: boolean;
  setToken: (token: string | null) => void;
  setSesion: (token: string, modulos: string[]) => void;
  setModulos: (modulos: string[]) => void;
  isTokenExpired: () => boolean;
  getUserEmail: () => string;
  getUserName: () => string;
  getUserRol: () => string;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
  clearStore: () => void;
}

function leer(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      modulos: [],
      hasHydrated: false,

      setToken: (token) => set({ token }),
      setSesion: (token, modulos) => set({ token, modulos }),
      setModulos: (modulos) => set({ modulos }),

      isTokenExpired: () => {
        const payload = leer(get().token);
        return !payload || Date.now() >= payload.exp * 1000;
      },

      getUserEmail: () => leer(get().token)?.sub ?? "",
      getUserName: () => leer(get().token)?.name ?? "",
      getUserRol: () => leer(get().token)?.rol ?? "",

      logout: () => get().clearStore(),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      clearStore: () => set({ token: null, modulos: [] }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        // Un token sin `rol` o sin módulos guardados es de la etapa de datos de ejemplo:
        // se cierra la sesión para volver a iniciarla contra el backend.
        const payload = leer(state?.token ?? null);
        if (state?.token && (!payload?.rol || !state.modulos?.length)) state.clearStore();
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ token: state.token, modulos: state.modulos }),
    }
  )
);
