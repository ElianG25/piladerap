"use client";

import type { LeagueEvent } from "@/lib/domain/league/types";
import { buildEventIcs, mapsUrl } from "@/lib/shared/calendar";
import { CalendarIcon, PinIcon } from "@/app/components/ui/icons";
import { btnOutline } from "@/app/components/ui/buttons";

/** Descarga un .ics de la fecha para agregarla al calendario del teléfono. */
export function AddToCalendar({ event, className = btnOutline }: { event: LeagueEvent; className?: string }) {
  const ics = buildEventIcs(event);
  if (!ics) return null;

  function download() {
    const blob = new Blob([ics!], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pila-de-ra-${event.eventId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={download} className={className}>
      <CalendarIcon className="h-4 w-4" />
      Agregar al calendario
    </button>
  );
}

export function MapLink({ place, className = btnOutline }: { place: string; className?: string }) {
  if (!place) return null;
  return (
    <a href={mapsUrl(place)} target="_blank" rel="noreferrer" className={className}>
      <PinIcon className="h-4 w-4" />
      Cómo llegar
    </a>
  );
}
