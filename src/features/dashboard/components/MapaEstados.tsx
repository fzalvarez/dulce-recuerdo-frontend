import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { listarSedesActivas } from "@/features/sedes/api";
import { capaSedes } from "@/features/sedes/mapa";
import { COLOR_ESTADO, ETIQUETA_ESTADO, type PuntoCrm } from "../comercial";

const CENTRO_LIMA: L.LatLngTuple = [-12.0464, -77.0428];

/**
 * Mapa de veterinarias del CRM: un punto por ficha, del color de su etapa. Las sedes activas van encima.
 * El contenedor de Leaflet no recibe className de React (ver MapaChico): sus clases no se borran.
 */
export function MapaEstados({ puntos, className }: { puntos: PuntoCrm[]; className?: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const sedes = useRecurso(listarSedesActivas);

  useEffect(() => {
    if (!contenedor.current) return;
    const m = L.map(contenedor.current, { zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);

    const grupo = L.featureGroup().addTo(m);
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
    if (grupo.getLayers().length > 0) m.fitBounds(grupo.getBounds(), { padding: [24, 24], maxZoom: 15 });
    else m.setView(CENTRO_LIMA, 11);

    // Dentro de una tarjeta el tamaño cambia al cargar y al cambiar de ancho: volver a medir.
    const obs = new ResizeObserver(() => m.invalidateSize());
    obs.observe(contenedor.current);
    const tras = window.setTimeout(() => m.invalidateSize(), 300);
    mapa.current = m;
    return () => {
      window.clearTimeout(tras);
      obs.disconnect();
      m.remove();
      mapa.current = null;
    };
  }, [puntos]);

  // Sedes del negocio encima del mapa. Al recrearse el mapa (cambian los puntos) se vuelven a dibujar.
  useEffect(() => {
    const m = mapa.current;
    if (!m || !sedes.data) return;
    const capa = capaSedes(sedes.data).addTo(m);
    return () => {
      capa.remove();
    };
  }, [sedes.data, puntos]);

  return (
    <div className={cn("relative isolate overflow-hidden rounded-lg border border-slate-200 dark:border-white/10", className)}>
      <div ref={contenedor} className="h-full w-full" />
    </div>
  );
}
