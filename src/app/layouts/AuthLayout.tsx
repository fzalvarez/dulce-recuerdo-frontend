import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function AuthLayout() {
  const token = useAuthStore((state) => state.token);
  const isTokenExpired = useAuthStore((state) => state.isTokenExpired);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) return null;

  if (token && !isTokenExpired()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Outlet />
    </div>
  );
}
