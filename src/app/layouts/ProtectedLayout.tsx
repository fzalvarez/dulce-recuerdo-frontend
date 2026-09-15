import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLoadingStore } from "@/shared/store/loading.store";
import LoadingOverlay from "@/shared/components/LoadingOverlay";
import SplashScreen from "@/shared/components/SplashScreen";

export function ProtectedLayout() {
  const token = useAuthStore((state) => state.token);
  const isTokenExpired = useAuthStore((state) => state.isTokenExpired);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hideLoading = useLoadingStore((state) => state.hide);

  useEffect(() => {
    hideLoading();
  }, [hideLoading]);

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
