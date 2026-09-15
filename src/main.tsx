import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppLayout } from "./app/layouts/AppLayout";
import { ThemeHydrator } from "./shared/components/ThemeHydrator";
import { ToasterWithTheme } from "./shared/components/common/ToasterWithTheme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeHydrator />
    <AppLayout />
    <ToasterWithTheme />
  </StrictMode>
);
