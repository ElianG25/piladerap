import { getLeague } from "@/lib/application/league/getLeague";
import { buildCalendarIcs } from "@/lib/shared/calendar";

export const revalidate = 3600;

/** Calendario de la liga: se agrega una vez al teléfono y las fechas nuevas aparecen solas. */
export async function GET() {
  const league = await getLeague(3600).catch(() => null);
  return new Response(buildCalendarIcs(league?.events ?? []), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="pila-de-ra.ics"',
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
