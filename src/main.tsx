import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppLayout } from "./app/layouts/AppLayout";
import { ThemeHydrator } from "./shared/components/ThemeHydrator";
import { ToasterWithTheme } from "./shared/components/common/ToasterWithTheme";
import { AppErrorBoundary } from "./shared/components/common/AppErrorBoundary";
import { notifyError } from "./shared/utils";

// Promesas que nadie atrapó: se avisa al usuario y el detalle queda en consola.
window.addEventListener("unhandledrejection", (event) => {
  console.error("Promesa sin controlar:", event.reason);
  notifyError("Ocurrió un error inesperado. Si persiste, recarga la página.");
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeHydrator />
    <AppErrorBoundary>
      <AppLayout />
    </AppErrorBoundary>
    <ToasterWithTheme />
  </StrictMode>
);
