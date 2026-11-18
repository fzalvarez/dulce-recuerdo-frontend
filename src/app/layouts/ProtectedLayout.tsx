import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { usuarioActual } from "@/features/auth/api";
import { useLoadingStore } from "@/shared/store/loading.store";
import LoadingOverlay from "@/shared/components/LoadingOverlay";
import SplashScreen from "@/shared/components/SplashScreen";

export function ProtectedLayout() {
  const token = useAuthStore((state) => state.token);
  const isTokenExpired = useAuthStore((state) => state.isTokenExpired);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setModulos = useAuthStore((state) => state.setModulos);
  const hideLoading = useLoadingStore((state) => state.hide);

  useEffect(() => {
    hideLoading();
  }, [hideLoading]);

  // Los módulos se guardan al iniciar sesión; se refrescan al abrir el panel para que un
  // módulo nuevo o un cambio de permisos se vea sin volver a entrar.
  useEffect(() => {
    if (!hasHydrated || !token) return;
    usuarioActual()
      .then((yo) => setModulos(yo.modulos))
      .catch(() => {});
  }, [hasHydrated, token, setModulos]);

  if (!hasHydrated) return <SplashScreen />;

  return token && !isTokenExpired() ? (
    <>
      <Outlet />
      <LoadingOverlay />
    </>
  ) : (
    <Navigate to="/auth/signin" replace />
  );
}
