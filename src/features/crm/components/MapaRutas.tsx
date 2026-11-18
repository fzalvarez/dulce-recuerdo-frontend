import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

export interface PuntoMapa {
  id: string;
  latitud: number;
  longitud: number;
  /** Color de su ruta; sin ruta, gris. */
  color: string;
  /** Punto aproximado (sin confirmar): se dibuja hueco. */
  aprox: boolean;
  /** Número de parada en la ruta elegida; sin número, punto chico. */
  numero?: number;
  titulo: string;
}

const LIMA: L.LatLngTuple = [-12.1, -77.0];

function iconoNumero(numero: number, color: string, aprox: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:${aprox ? "#fff" : color};color:${aprox ? color : "#fff"};border:2px solid ${color};display:flex;align-items:center;justify-content:center;font:600 11px/1 system-ui;box-shadow:0 1px 3px rgba(0,0,0,.35)">${numero}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/**
 * Mapa de todos los puntos del CRM (spec crm-rutas). Los de la ruta elegida van numerados y
 * unidos por una línea en orden de visita. Clic en un punto → `onElegir(id)`.
 * `encuadre` cambia cuando hay que volver a centrar (otra ruta, otro filtro).
 */
export function MapaRutas({
  puntos,
  recorrido,
  colorRecorrido,
  encuadre,
  elegido,
  onElegir,
  className,
}: {
  puntos: PuntoMapa[];
  recorrido: L.LatLngTuple[];
  colorRecorrido: string;
  encuadre: string;
  elegido: string | null;
  onElegir: (id: string) => void;
  className?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const elegir = useRef(onElegir);
  elegir.current = onElegir;

  useEffect(() => {
    if (!contenedor.current) return;
    const m = L.map(contenedor.current).setView(LIMA, 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    capa.current = L.layerGroup().addTo(m);
    const obs = new ResizeObserver(() => m.invalidateSize());
    obs.observe(contenedor.current);
    mapa.current = m;
    return () => {
      obs.disconnect();
      m.remove();
      mapa.current = null;
      capa.current = null;
    };
  }, []);

  // Redibujar puntos y recorrido.
  useEffect(() => {
    const grupo = capa.current;
    if (!grupo) return;
    grupo.clearLayers();
    if (recorrido.length > 1) {
      L.polyline(recorrido, { color: colorRecorrido, weight: 4, opacity: 0.7 }).addTo(grupo);
    }
    // Primero los chicos, encima los numerados.
    const ordenados = [...puntos].sort((a, b) => (a.numero ? 1 : 0) - (b.numero ? 1 : 0));
    for (const p of ordenados) {
      const marca = p.numero
        ? L.marker([p.latitud, p.longitud], { icon: iconoNumero(p.numero, p.color, p.aprox), zIndexOffset: 500 })
        : L.circleMarker([p.latitud, p.longitud], {
            radius: p.id === elegido ? 9 : 6,
            color: p.id === elegido ? "#0f172a" : p.color,
            weight: p.id === elegido ? 3 : 2,
            fillColor: p.color,
            fillOpacity: p.aprox ? 0.15 : 0.85,
            dashArray: p.aprox ? "3 3" : undefined,
          });
      marca.bindTooltip(p.titulo, { direction: "top", offset: [0, -6] });
      marca.on("click", () => elegir.current(p.id));
      marca.addTo(grupo);
    }
  }, [puntos, recorrido, colorRecorrido, elegido]);

  // Encuadrar solo cuando cambia lo que se mira, no en cada redibujo.
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const objetivo = recorrido.length ? recorrido : puntos.map((p) => [p.latitud, p.longitud] as L.LatLngTuple);
    if (objetivo.length === 1) m.setView(objetivo[0], 16);
    else if (objetivo.length > 1) m.fitBounds(L.latLngBounds(objetivo), { padding: [30, 30], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuadre]);

  return <div ref={contenedor} className={cn("isolate overflow-hidden rounded-xl border border-slate-200", className)} />;
}
