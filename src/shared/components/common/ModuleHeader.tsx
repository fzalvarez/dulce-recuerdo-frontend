import type { ReactNode } from "react";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function ModuleHeader({ title, description, actions }: ModuleHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
