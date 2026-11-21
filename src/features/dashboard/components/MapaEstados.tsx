import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { COLOR_ESTADO, ETIQUETA_ESTADO, type PuntoCrm } from "../comercial";

const CENTRO_LIMA: L.LatLngTuple = [-12.0464, -77.0428];

/**
 * Mapa de veterinarias del CRM: un punto por ficha, del color de su etapa.
 * El contenedor de Leaflet no recibe className de React (ver MapaChico): sus clases no se borran.
 */
export function MapaEstados({ puntos, className }: { puntos: PuntoCrm[]; className?: string }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contenedor.current) return;
    const mapa = L.map(contenedor.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(mapa);

    const grupo = L.featureGroup().addTo(mapa);
    for (const p of puntos) {
      if (p.latitud == null || p.longitud == null) continue;
      L.circleMarker([p.latitud, p.longitud], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: COLOR_ESTADO[p.estado],
        fillOpacity: 1,
      })
        .bindTooltip(`${p.nombre} · ${ETIQUETA_ESTADO[p.estado]}`)
        .addTo(grupo);
    }
    if (grupo.getLayers().length > 0) mapa.fitBounds(grupo.getBounds(), { padding: [24, 24], maxZoom: 15 });
    else mapa.setView(CENTRO_LIMA, 11);

    // Dentro de una tarjeta el tamaño cambia al cargar y al cambiar de ancho: volver a medir.
    const obs = new ResizeObserver(() => mapa.invalidateSize());
    obs.observe(contenedor.current);
    const tras = window.setTimeout(() => mapa.invalidateSize(), 300);
    return () => {
      window.clearTimeout(tras);
      obs.disconnect();
      mapa.remove();
    };
  }, [puntos]);

  return (
    <div className={cn("relative isolate overflow-hidden rounded-lg border border-slate-200 dark:border-white/10", className)}>
      <div ref={contenedor} className="h-full w-full" />
    </div>
  );
}
