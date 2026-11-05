/** Iniciales para el avatar de un MC ("Bad Bunny" → "BB", "Residente" → "RE"). */
export function initials(alias: string): string {
  const parts = alias.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** 13 → "13", 13.5 → "13.5" (hay medios puntos heredados de la Fecha 1). */
export function formatPoints(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** "2026-11-02" → "lun 2 nov 2026" (sin saltos de zona horaria). */
export function formatEventDate(fechaEvento: string): string {
  const m = fechaEvento.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return fechaEvento;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Intl.DateTimeFormat("es-DO", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    .format(d)
    .replace(/\./g, "");
}
