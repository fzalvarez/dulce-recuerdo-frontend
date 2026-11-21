import { CatIcon, DogIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ícono compacto de la especie: felino naranja, canino marrón y cualquier otra
 * especie un elefante amarillo. El nombre completo queda en el tooltip.
 */
export function EspecieIcono({ especie, className }: { especie: string | null; className?: string }) {
  const texto = (especie ?? "").trim();
  const minusculas = texto.toLowerCase();
  const tipo = minusculas.includes("felin") || minusculas.includes("gato") ? "felino"
    : minusculas.includes("canin") || minusculas.includes("perro") ? "canino"
    : "otro";
  const titulo = texto || "Sin especie";
  const base = cn("size-5 shrink-0", className);

  if (tipo === "felino") {
    return <CatIcon role="img" aria-label={titulo} className={cn(base, "text-orange-500")} />;
  }
  if (tipo === "canino") {
    return <DogIcon role="img" aria-label={titulo} className={cn(base, "text-amber-800 dark:text-amber-600")} />;
  }
  return <ElefanteIcono titulo={titulo} className={base} />;
}

/** Elefante de perfil en amarillo (lucide no trae uno). */
function ElefanteIcono({ titulo, className }: { titulo: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={titulo} className={className}>
      <title>{titulo}</title>
      {/* patas */}
      <rect x="5.5" y="15" width="2.4" height="5.5" rx="1.1" fill="#eab308" />
      <rect x="10" y="15" width="2.4" height="5.5" rx="1.1" fill="#eab308" />
      <rect x="14.5" y="15" width="2.4" height="5.5" rx="1.1" fill="#eab308" />
      {/* cuerpo */}
      <ellipse cx="11" cy="12.5" rx="7.2" ry="4.6" fill="#facc15" />
      {/* cabeza */}
      <circle cx="18" cy="8.6" r="3.4" fill="#facc15" />
      {/* oreja */}
      <ellipse cx="16.2" cy="9" rx="2.4" ry="3.1" fill="#eab308" />
      {/* trompa */}
      <path d="M20.6 10.2c1.4.9 1.6 3 1 4.5-.3.8-1.4.6-1.3-.3.1-1-.4-2.1-1.3-2.7z" fill="#facc15" />
      {/* ojo */}
      <circle cx="18.6" cy="7.8" r="0.5" fill="#1f2937" />
      {/* cola */}
      <path d="M4 11.5c-1.2-.2-1.8 1.4-1 2.2" fill="none" stroke="#eab308" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
