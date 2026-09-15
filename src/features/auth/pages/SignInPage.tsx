import { SignInForm } from "../components/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 flex items-center justify-center p-1 rounded-xl bg-white border border-slate-200 shadow-xs">
          <img
            alt="Isotipo Dulce Recuerdo"
            src="/brand/isotipo.webp"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="font-bold text-lg text-slate-900 tracking-tight">
          Dulce Recuerdo
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-110 bg-white rounded-xl border border-slate-200 p-8 md:p-10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Bienvenido
          </h1>
          <p className="text-sm text-slate-500">
            Inicie sesión para acceder a la plataforma de gestión.
          </p>
        </div>

        <SignInForm />
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-label font-semibold text-slate-400">
          Versión 1.0 © {new Date().getFullYear()} Dulce Recuerdo
        </p>
      </div>
    </div>
  );
}
