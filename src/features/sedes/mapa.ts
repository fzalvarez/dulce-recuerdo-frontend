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
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    const etiqueta = document.createElement("span");
    etiqueta.textContent = sede.nombre; // texto, no HTML: el nombre viene de configuración
    L.marker([sede.latitud, sede.longitud], { icon: icono, zIndexOffset: 1000, alt: `Sede ${sede.nombre}`, keyboard: false })
      .bindTooltip(etiqueta, { permanent: true, direction: "bottom", offset: [0, 22], className: "sede-etiqueta" })
      .addTo(capa);
  }
  return capa;
}
