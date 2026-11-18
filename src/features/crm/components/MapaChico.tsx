import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Ubicacion } from "../api";

// Pin dibujado en SVG: no depende de las imágenes de Leaflet, que se rompen al empaquetar.
const PIN = L.divIcon({
  className: "",
  html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 24.3 14 36 14 36s14-11.7 14-22.1C28 6.2 21.7 0 14 0z" fill="#2563eb"/><circle cx="14" cy="14" r="5.5" fill="#fff"/></svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

/**
 * Mapa pequeño de OpenStreetMap con un punto. Con `onMover`, el punto se arrastra o se
 * mueve con un clic en el mapa.
 */
export function MapaChico({
  latitud,
  longitud,
  onMover,
  className,
}: Ubicacion & { onMover?: (p: Ubicacion) => void; className?: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const marcador = useRef<L.Marker | null>(null);
  const mover = useRef(onMover);
  mover.current = onMover;
  const editable = !!onMover;

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!contenedor.current) return;
    const m = L.map(contenedor.current, { zoomControl: true, attributionControl: true }).setView([latitud, longitud], 17);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(m);
    const mk = L.marker([latitud, longitud], { icon: PIN }).addTo(m);
    mk.on("dragend", () => {
      const p = mk.getLatLng();
      mover.current?.({ latitud: p.lat, longitud: p.lng });
    });
    m.on("click", (e: L.LeafletMouseEvent) => {
      if (!mover.current) return;
      mk.setLatLng(e.latlng);
      mover.current({ latitud: e.latlng.lat, longitud: e.latlng.lng });
    });
    // Dentro de un modal el tamaño cambia al abrir: recalcular.
    const obs = new ResizeObserver(() => m.invalidateSize());
    obs.observe(contenedor.current);
    mapa.current = m;
    marcador.current = mk;
    return () => {
      obs.disconnect();
      m.remove();
      mapa.current = null;
      marcador.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Punto nuevo desde afuera (otra búsqueda): mover el marcador y centrar.
  useEffect(() => {
    const mk = marcador.current;
    if (!mk || !mapa.current) return;
    const actual = mk.getLatLng();
    if (actual.lat !== latitud || actual.lng !== longitud) {
      mk.setLatLng([latitud, longitud]);
      mapa.current.setView([latitud, longitud], mapa.current.getZoom());
    }
  }, [latitud, longitud]);

  useEffect(() => {
    const mk = marcador.current;
    if (!mk?.dragging) return;
    if (editable) mk.dragging.enable();
    else mk.dragging.disable();
  }, [editable]);

  const enlace = `https://www.openstreetmap.org/?mlat=${latitud}&mlon=${longitud}#map=17/${latitud}/${longitud}`;
  return (
    <div className={cn("relative isolate overflow-hidden rounded-lg border border-slate-200", editable && "ring-2 ring-brand-500/40", className)}>
      <div ref={contenedor} className={cn("h-full w-full", editable && "cursor-crosshair")} />
      <a
        href={enlace}
        target="_blank"
        rel="noreferrer"
        className="absolute right-2 top-2 z-[1000] inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-xs hover:text-brand-600"
      >
        Abrir mapa
        <ExternalLinkIcon className="size-3" />
      </a>
    </div>
  );
}
