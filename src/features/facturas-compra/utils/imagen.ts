/**
 * Reduce una foto para enviarla a la lectura con IA: lado mayor de `ladoMax` px, JPEG.
 * Menos peso para subir y la IA lee igual el texto. PDF u otros archivos: sin cambio.
 */
export async function reducirParaIA(archivo: File, ladoMax = 2000): Promise<File> {
  if (!archivo.type.startsWith("image/")) return archivo;
  let mapa: ImageBitmap;
  try {
    mapa = await createImageBitmap(archivo);
  } catch {
    return archivo; // el navegador no la decodifica (p. ej. HEIC): se envía tal cual
  }
  const escala = Math.min(1, ladoMax / Math.max(mapa.width, mapa.height));
  if (escala === 1 && archivo.size < 1_500_000) {
    mapa.close();
    return archivo;
  }
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(mapa.width * escala);
  lienzo.height = Math.round(mapa.height * escala);
  const ctx = lienzo.getContext("2d");
  if (!ctx) {
    mapa.close();
    return archivo;
  }
  ctx.drawImage(mapa, 0, 0, lienzo.width, lienzo.height);
  mapa.close();
  const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/jpeg", 0.9));
  if (!blob) return archivo;
  return new File([blob], archivo.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
