import type { LeagueEvent } from "@/lib/domain/league/types";
import { parseEventDate } from "@/lib/domain/league/eventTime";

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha local "flotante" para iCalendar: 20261102T150000 (sin zona; el calendario la toma como hora local). */
function icsLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

const escapeIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Archivo .ics de una fecha de la liga, o null si la hoja no trae una fecha válida. */
export function buildEventIcs(ev: LeagueEvent): string | null {
  const start = parseEventDate(ev.fechaEvento, ev.horaEvento);
  if (!start) return null;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pila de Ra'//Liga//ES",
    "BEGIN:VEVENT",
    `UID:${ev.eventId}@piladerap.vercel.app`,
    `DTSTAMP:${icsLocal(new Date())}`,
    `DTSTART:${icsLocal(start)}`,
    "DURATION:PT4H",
    `SUMMARY:${escapeIcs(`Pila de Ra' · ${ev.titulo || ev.label || "Fecha"}`)}`,
    ev.ubicacion ? `LOCATION:${escapeIcs(ev.ubicacion)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

/** Enlace a Google Maps buscando el lugar de la fecha. */
export function mapsUrl(place: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, Santo Domingo`)}`;
}
