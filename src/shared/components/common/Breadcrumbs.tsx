import { Link } from "react-router-dom";
import { ChevronRightIcon } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center flex-wrap text-xs font-medium text-slate-400 gap-2 select-none"
    >
      <span className="hover:text-slate-600 cursor-default">
        Sistema Dulce Recuerdo
      </span>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-2">
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300" />
            {isLast || !item.to ? (
              <span
                className={
                  isLast
                    ? "text-brand-500 font-semibold bg-brand-50 px-2 py-0.5 rounded border border-blue-100"
                    : "text-slate-500"
                }
              >
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="hover:text-slate-600">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
