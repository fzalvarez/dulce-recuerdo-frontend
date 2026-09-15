export function AppFooter() {
  return (
    <footer className="bg-footer text-slate-400 border-t border-black px-4 sm:px-6 py-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 select-none">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-500" />
        <span className="font-semibold text-slate-200">Dulce Recuerdo</span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400">Plataforma de Cremación y Gestión</span>
      </div>
      <div className="flex items-center gap-4 text-slate-400">
        <span className="hover:text-white transition-colors cursor-pointer">
          Protocolo de Operación
        </span>
        <span>•</span>
        <span className="hover:text-white transition-colors cursor-pointer">
          Soporte TI
        </span>
        <span>•</span>
        <span className="text-slate-500 font-mono text-label">
          © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
