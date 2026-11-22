import L from "leaflet";
import "./sedes.css";
import type { Sede } from "./api";

/** Logo de la cabecera del sistema: el mismo archivo que se sirve desde public/brand. */
const LOGO = "/brand/isotipo.webp";

/**
 * Capa con las sedes activas: el logo de Dulce Recuerdo y su nombre. Va en el panel de marcadores
 * con un zIndex alto, así queda encima de las veterinarias y de las rutas en cualquier mapa.
 */
export function capaSedes(sedes: Sede[]): L.LayerGroup {
  const capa = L.layerGroup();
  for (const sede of sedes) {
    const icono = L.divIcon({
      className: "",
      html: `<div class="sede-marcador"><img src="${LOGO}" alt="" /></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    L.marker([sede.latitud, sede.longitud], { icon: icono, zIndexOffset: 1000, title: sede.nombre, alt: `Sede ${sede.nombre}`, keyboard: false })
      .addTo(capa);
  }
  return capa;
}
