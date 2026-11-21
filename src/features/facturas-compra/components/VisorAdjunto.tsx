import { useEffect, useState } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/features/casos/components/Dialogos";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { cargarAdjunto, type FacturaCompra } from "../api";

/** Muestra el PDF o la foto de la factura dentro del sistema, en un modal. */
export function VisorAdjunto({ factura, onCerrar }: { factura: FacturaCompra | null; onCerrar: () => void }) {
  const [archivo, setArchivo] = useState<{ url: string; tipo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const id = factura?.id;

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    let url: string | null = null;
    cargarAdjunto(id)
      .then((a) => {
        url = a.url;
        if (vigente) setArchivo(a);
        else URL.revokeObjectURL(a.url);
      })
      .catch((e) => {
        if (vigente) setError(getApiErrorMessage(e, "No se pudo abrir el archivo."));
      });
    return () => {
      vigente = false;
      if (url) URL.revokeObjectURL(url);
      setArchivo(null);
      setError(null);
    };
  }, [id]);

  const esImagen = archivo?.tipo.startsWith("image/") ?? false;

  return (
    <Modal open={factura !== null} onOpenChange={(o) => !o && onCerrar()} ancho="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="truncate">{factura?.adjunto_nombre ?? "Archivo de la factura"}</DialogTitle>
        <DialogDescription>Factura {factura?.numero_serie}</DialogDescription>
      </DialogHeader>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !archivo && <p className="text-sm text-slate-500">Cargando archivo…</p>}
      {archivo && esImagen && <img src={archivo.url} alt={factura?.adjunto_nombre ?? "Factura"} className="mx-auto max-h-[70vh] w-auto rounded-md" />}
      {archivo && !esImagen && (
        <iframe src={archivo.url} title={factura?.adjunto_nombre ?? "Factura"} className="h-[70vh] w-full rounded-md border border-slate-200" />
      )}
      {archivo && (
        <a href={archivo.url} download={factura?.adjunto_nombre ?? "factura"} className="self-start text-xs text-brand-600 hover:underline">
          Descargar
        </a>
      )}
    </Modal>
  );
}
