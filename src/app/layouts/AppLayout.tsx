import { RouterProvider } from "react-router-dom";
import { router } from "../router";

export function AppLayout() {
  return <RouterProvider router={router} />;
}
