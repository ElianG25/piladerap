"use client";

import { useState } from "react";
import { shareUrl } from "@/app/lib/share";
import type { Battle, LeagueEvent, MediaItem } from "@/lib/domain/league/types";
import { getEventPlaylistUrl } from "@/lib/domain/league/rules";
import { getFinalBattle } from "@/lib/domain/league/rounds";
import { formatEventDate } from "@/lib/shared/format";
import { getYouTubeId } from "@/lib/shared/youtube";
import { YouTubeThumb } from "@/app/components/ui/YouTubeThumb";
import { PilaMark } from "@/app/components/ui/PilaMark";
import { ExternalIcon, PlayIcon, ShareIcon } from "@/app/components/ui/icons";
import { btnInk, btnOutline } from "@/app/components/ui/buttons";
import { AddToCalendar, CalendarFeedButton, MapLink } from "./EventActions";
import { EventStatusBadge } from "./EventStatusBadge";
import { useOverlays } from "./OverlayProvider";

/** Foto de la fecha: portada de su playlist; si falla, la foto de su final; si no hay, la pila. */
function EventCover({ event, finalId, finalAlt }: { event: LeagueEvent; finalId: string | null; finalAlt: string }) {
  const [coverFailed, setCoverFailed] = useState(false);
  if (event.coverUrl && !coverFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- portada firmada de YouTube, no se puede optimizar
      <img src={event.coverUrl} alt={"Foto de grupo de la " + event.titulo} loading="lazy" decoding="async"
        onError={() => setCoverFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  if (finalId) return <YouTubeThumb id={finalId} alt={finalAlt} className="absolute inset-0 h-full w-full object-cover" />;
  return <div className="absolute inset-0 flex items-center justify-center"><PilaMark height="8rem" /></div>;
}

type EventTimelineProps = { events: LeagueEvent[]; battles: Battle[]; media: MediaItem[] };

/** Las fechas de la temporada, la más reciente primero, con la foto de su final. */
export function EventTimeline({ events, battles, media }: EventTimelineProps) {
  const { openVideo } = useOverlays();
  const ordered = [...events].sort((a, b) => b.orden - a.orden);

  return (
    <section aria-labelledby="fechas-titulo">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="fechas-titulo" className="display text-5xl sm:text-6xl">Fechas</h2>
        <CalendarFeedButton />
      </div>

      {ordered.length === 0 ? (
        <p className="mt-6 max-w-prose text-base text-muted">Todavía no hay fechas publicadas.</p>
      ) : (
        <ol className="mt-5 grid gap-6 sm:grid-cols-2">
          {ordered.map((ev) => {
            const done = ev.estado === "finalizada";
            const final = getFinalBattle(battles, ev.eventId);
            const finalId = final ? getYouTubeId(final.youtubeUrl) : null;
            const playlist = getEventPlaylistUrl(ev, media);
            const upcoming = !done && ev.estado !== "oculta";

            return (
              <li key={ev.eventId} className="flex flex-col border-2 border-ink bg-paper">
                <div className="relative aspect-video bg-ink">
                  <EventCover event={ev} finalId={finalId} finalAlt={"Final de " + ev.titulo + ": " + final?.mc1 + " vs " + final?.mc2} />
                  <div className="absolute left-3 top-3"><EventStatusBadge status={ev.estado} /></div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="display text-4xl">{ev.titulo}</h3>
                  <dl className="space-y-1 text-sm">
                    {ev.fechaEvento && <div className="flex gap-2"><dt className="font-semibold text-muted">Día</dt><dd className="font-bold">{formatEventDate(ev.fechaEvento)}{ev.horaEvento ? ` · ${ev.horaEvento}` : ""}</dd></div>}
                    {ev.ubicacion && <div className="flex gap-2"><dt className="font-semibold text-muted">Lugar</dt><dd className="font-bold">{ev.ubicacion}</dd></div>}
                    {done && ev.campeon && <div className="flex gap-2"><dt className="font-semibold text-muted">Campeón</dt><dd className="font-bold uppercase">{ev.campeon}</dd></div>}
                    {done && ev.subcampeon && <div className="flex gap-2"><dt className="font-semibold text-muted">Subcampeón</dt><dd className="font-bold uppercase">{ev.subcampeon}</dd></div>}
                    {done && ev.mvp && <div className="flex gap-2"><dt className="font-semibold text-muted">MVP</dt><dd className="font-bold uppercase">{ev.mvp}</dd></div>}
                  </dl>
                  {ev.resumen && <p className="text-sm leading-relaxed text-muted">{ev.resumen}</p>}

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {finalId && final && (
                      <button type="button" className={btnInk}
                        onClick={() => openVideo({ id: finalId, title: `${final.mc1} vs ${final.mc2} · Final ${ev.titulo}`, url: final.youtubeUrl, battleId: final.battleId })}>
                        <PlayIcon className="h-4 w-4" />
                        Ver la final
                      </button>
                    )}
                    {playlist && (
                      <a href={playlist} target="_blank" rel="noreferrer" className={btnOutline}>
                        Playlist <ExternalIcon className="h-4 w-4" />
                      </a>
                    )}
                    <button type="button" className={btnOutline}
                      onClick={async () => { await shareUrl(`${ev.titulo} · Pila de Ra'`, `${window.location.origin}/fecha/${encodeURIComponent(ev.eventId)}`); }}>
                      <ShareIcon className="h-4 w-4" />
                      Compartir
                    </button>
                    {upcoming && <AddToCalendar event={ev} />}
                    {upcoming && <MapLink place={ev.ubicacion} />}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
