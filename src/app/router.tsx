import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedLayout } from "./layouts/ProtectedLayout";
import AdminLayout from "./layouts/AdminLayout";
import AuthLayout from "./layouts/AuthLayout";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import CasosPage from "@/features/casos/pages/CasosPage";
import AgendaPage from "@/features/agenda/pages/AgendaPage";
import MascotasPage from "@/features/mascotas/pages/MascotasPage";
import ClientesPage from "@/features/clientes/pages/ClientesPage";
import VeterinariasPage from "@/features/veterinarias/pages/VeterinariasPage";
import PlanesPage from "@/features/planes/pages/PlanesPage";
import InventarioPage from "@/features/inventario/pages/InventarioPage";
import UsuariosPage from "@/features/usuarios/pages/UsuariosPage";
import ServiciosPage from "@/features/servicios/pages/ServiciosPage";
import VehiculoPage from "@/features/vehiculos/pages/VehiculoPage";
import EntregasPage from "@/features/entregas/pages/EntregasPage";
import FinanzasPage from "@/features/finanzas/pages/FinanzasPage";
import ActivosPage from "@/features/activos/pages/ActivosPage";
import ReportesPage from "@/features/reportes/pages/ReportesPage";
import ConfiguracionPage from "@/features/configuracion/pages/ConfiguracionPage";
import SignInPage from "@/features/auth/pages/SignInPage";
import Error404 from "@/features/error-pages/pages/Error404";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedLayout />,
    errorElement: <Error404 />,
    children: [
      {
        path: "",
        element: <AdminLayout />,
        errorElement: <Error404 />,
        children: [
          { path: "", element: <DashboardPage /> },
          { path: "casos", element: <CasosPage /> },
          { path: "agenda", element: <AgendaPage /> },
          { path: "mascotas", element: <MascotasPage /> },
          { path: "clientes", element: <ClientesPage /> },
          { path: "veterinarias", element: <VeterinariasPage /> },
          { path: "planes", element: <PlanesPage /> },
          { path: "inventario", element: <InventarioPage /> },
          { path: "usuarios", element: <UsuariosPage /> },
          { path: "servicios", element: <ServiciosPage /> },
          { path: "vehiculos", element: <VehiculoPage /> },
          { path: "entregas", element: <EntregasPage /> },
          { path: "finanzas", element: <FinanzasPage /> },
          { path: "activos", element: <ActivosPage /> },
          { path: "reportes", element: <Navigate to="/reportes/cremaciones-mes" replace /> },
          { path: "reportes/:reporte", element: <ReportesPage /> },
          { path: "configuracion", element: <ConfiguracionPage /> },
        ],
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    errorElement: <Error404 />,
    children: [
      {
        path: "signin",
        element: <SignInPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Error404 />,
  },
]);
