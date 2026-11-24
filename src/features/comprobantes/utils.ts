/** Fecha DD/MM/AAAA. Las fechas sin hora (AAAA-MM-DD) se leen en Lima, no en UTC. */
export function fechaDoc(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
