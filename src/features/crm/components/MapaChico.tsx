import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ubicacion } from "../api";

const DELTA = 0.004; // ~400 m alrededor del punto

/** Mapa pequeño de OpenStreetMap con un marcador. Sin librerías: el embed oficial en un iframe. */
export function MapaChico({ latitud, longitud, className }: Ubicacion & { className?: string }) {
  const bbox = [longitud - DELTA, latitud - DELTA, longitud + DELTA, latitud + DELTA].join(",");
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitud},${longitud}`;
  const enlace = `https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=17/${latitud}/${longitud}`;
  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-slate-200", className)}>
      <iframe title="Ubicación en el mapa" src={embed} className="h-full w-full" loading="lazy" />
      <a
        href={enlace}
        target="_blank"
        rel="noreferrer"
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-xs hover:text-brand-600"
      >
        Abrir mapa
        <ExternalLinkIcon className="size-3" />
      </a>
    </div>
  );
}
