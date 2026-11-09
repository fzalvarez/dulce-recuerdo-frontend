import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/shared/components/sidebar/AppSidebar";
import { AppHeader } from "@/shared/components/sidebar/AppHeader";
import { Backdrop } from "@/shared/components/sidebar/Backdrop";
import { AppFooter } from "@/shared/components/common/AppFooter";
import { ModuloGuard } from "@/features/roles/components/ModuloGuard";

export default function AdminLayout() {
  return (
    <div className="flex w-full min-h-screen bg-[#F6F8FB]">
      <AppSidebar />
      <Backdrop />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          <div className="w-full min-w-0 flex-1 flex flex-col gap-6">
            <ModuloGuard>
              <Outlet />
            </ModuloGuard>
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
