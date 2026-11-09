import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
  sub?: string;
  name?: string;
  userId?: string;
  /** Rol del usuario: root | admin | operador1 | operador2. */
  rol?: string;
}

interface AuthState {
  token: string | null;
  hasHydrated: boolean;
  setToken: (token: string | null) => void;
  isTokenExpired: () => boolean;
  getUserEmail: () => string;
  getUserName: () => string;
  getUserRol: () => string;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
  clearStore: () => void;
}

function tokenTieneRol(token: string): boolean {
  try {
    return !!jwtDecode<JwtPayload>(token).rol;
  } catch {
    return false;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      hasHydrated: false,

      setToken: (token) => set({ token }),

      isTokenExpired: () => {
        const token = get().token;
        if (!token) return true;
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          return Date.now() >= decoded.exp * 1000;
        } catch {
          return true;
        }
      },

      getUserEmail: () => {
        const token = get().token;
        if (!token) return "";
        try {
          return jwtDecode<JwtPayload>(token).sub ?? "";
        } catch {
          return "";
        }
      },

      getUserName: () => {
        const token = get().token;
        if (!token) return "";
        try {
          return jwtDecode<JwtPayload>(token).name ?? "";
        } catch {
          return "";
        }
      },

      getUserRol: () => {
        const token = get().token;
        if (!token) return "";
        try {
          return jwtDecode<JwtPayload>(token).rol ?? "";
        } catch {
          return "";
        }
      },

      logout: () => get().clearStore(),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      clearStore: () => set({ token: null }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        // Un token sin claim `rol` es de antes de los roles: se cierra la sesión para
        // volver a iniciarla (spec roles.md, R7).
        if (state?.token && !tokenTieneRol(state.token)) state.setToken(null);
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ token: state.token }),
    }
  )
);
