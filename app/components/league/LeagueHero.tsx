"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import type { Battle, LeaguePayload } from "@/lib/domain/league/types";
import type { Countdown } from "@/app/hooks/useEventCountdown";
import type { Section } from "@/app/hooks/useSectionRouter";
import { getFinalBattle } from "@/lib/domain/league/rounds";
import { formatEventDate } from "@/lib/shared/format";
import { getYouTubeId } from "@/lib/shared/youtube";
import { PilaMark } from "@/app/components/ui/PilaMark";
import { YouTubeThumb } from "@/app/components/ui/YouTubeThumb";
import { HeroVideo } from "./HeroVideo";
import { PlayIcon } from "@/app/components/ui/icons";
import { btnInk, btnOutline } from "@/app/components/ui/buttons";
import { AddToCalendar, MapLink } from "./EventActions";
import { EventStatusBadge } from "./EventStatusBadge";
import { VideoModal, type PlayPayload } from "./VideoModal";

type LeagueHeroProps = {
  league: LeaguePayload;
  battles: Battle[];
  timeLeft: Countdown;
  videoId: string | null;
  slogan: string;
  counts: { mcs: number; batallas: number; fechas: number };
  onNavigate: (to: Section) => void;
};

const UNITS: [keyof Countdown, string][] = [["d", "días"], ["h", "horas"], ["m", "min"], ["s", "seg"]];

/**
 * Lo primero que se ve: la foto de la última final y, en la losa amarilla,
 * quién ganó. Si hay una fecha por venir o en vivo, la losa cambia a lo que
 * importa en ese momento (cuenta regresiva, cupos, ver en vivo).
 */
export function LeagueHero({ league, battles, timeLeft, videoId, slogan, counts, onNavigate }: LeagueHeroProps) {
  const [playing, setPlaying] = useState<PlayPayload>(null);
  const closeVideo = useCallback(() => setPlaying(null), []);

  const featured = league.featuredEvent;
  const last = league.latestCompletedEvent;
  const mode: "live" | "upcoming" | "result" =
    featured?.estado === "en_vivo" ? "live"
    : featured && (featured.estado === "inscripciones" || featured.estado === "anunciada") ? "upcoming"
    : "result";

  const resultEvent = mode === "result" ? (featured?.estado === "finalizada" ? featured : last ?? featured) : last;
  const photoSource = resultEvent;
  const finalBattle = photoSource ? getFinalBattle(battles, photoSource.eventId) : null;
  const finalId = finalBattle ? getYouTubeId(finalBattle.youtubeUrl) : null;
  const finalTitle = finalBattle ? `${finalBattle.mc1} vs ${finalBattle.mc2} · Final ${photoSource?.titulo ?? ""}`.trim() : "";

  const showCapacity = featured?.estado === "inscripciones";
  const pct = league.capacity.max > 0 ? Math.min(100, Math.round((league.capacity.total / league.capacity.max) * 100)) : 0;

  const headline =
    mode === "result" ? resultEvent?.campeon || resultEvent?.titulo || "La plaza sigue viva"
    : featured?.titulo || "Próxima fecha";

  const lead =
    mode === "result"
      ? resultEvent?.campeon ? `Campeón de la ${resultEvent.titulo}` : "Última fecha"
      : mode === "live" ? "Hoy se juega en la plaza"
      : featured?.estado === "inscripciones" ? "Ya puedes inscribirte" : "Fecha confirmada";

  return (
    <section aria-label="Última fecha" className="grid overflow-hidden border-2 border-ink bg-pila lg:grid-cols-[1.3fr_1fr]">
      {/* Foto real de la final (o la pila si todavía no hay video) */}
      <div className="relative min-h-60 bg-ink lg:min-h-[24rem]">
        {finalId ? (
          <button type="button" aria-label={"Ver la final: " + finalTitle}
            onClick={() => setPlaying({ id: finalId, title: finalTitle, url: finalBattle!.youtubeUrl })}
            className="group absolute inset-0 block h-full w-full cursor-pointer">
            <YouTubeThumb id={finalId} alt={"Final de " + (photoSource?.titulo ?? "la fecha") + ": " + finalBattle?.mc1 + " vs " + finalBattle?.mc2}
              eager className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
            <span className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/15" aria-hidden />
          </button>
        ) : (
          <div className="flex h-full min-h-60 items-center justify-center">
            <PilaMark height="9rem" priority />
          </div>
        )}
        {videoId && <HeroVideo id={videoId} />}
      </div>

      {/* Losa amarilla */}
      <div className="flex flex-col gap-5 p-5 text-ink sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {mode === "live" && <EventStatusBadge status="en_vivo" />}
          {mode === "upcoming" && featured && <EventStatusBadge status={featured.estado} />}
        </div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="display text-[clamp(2.75rem,9vw,5rem)] [overflow-wrap:anywhere]"
          >
            {headline}
          </motion.h1>
          <p className="mt-2 text-lg font-bold">{lead}</p>
          {mode === "result" && resultEvent && (
            <dl className="mt-3 space-y-1 text-base">
              {resultEvent.subcampeon && (
                <div className="flex gap-2"><dt className="font-semibold">Subcampeón</dt><dd className="font-bold uppercase">{resultEvent.subcampeon}</dd></div>
              )}
              {resultEvent.mvp && (
                <div className="flex gap-2"><dt className="font-semibold">MVP</dt><dd className="font-bold uppercase">{resultEvent.mvp}</dd></div>
              )}
              {resultEvent.fechaEvento && (
                <div className="flex gap-2"><dt className="font-semibold">Fecha</dt><dd>{formatEventDate(resultEvent.fechaEvento)}</dd></div>
              )}
            </dl>
          )}
        </div>

        {mode === "live" && featured && (
          <dl className="space-y-1 text-base">
            {featured.horaEvento && <div className="flex gap-2"><dt className="font-semibold">Hora</dt><dd className="font-bold">{featured.horaEvento}</dd></div>}
            {featured.ubicacion && <div className="flex gap-2"><dt className="font-semibold">Lugar</dt><dd className="font-bold">{featured.ubicacion}</dd></div>}
          </dl>
        )}

        {mode === "upcoming" && featured && (
          <>
            <dl className="space-y-1 text-base">
              {featured.fechaEvento && <div className="flex gap-2"><dt className="font-semibold">Día</dt><dd className="font-bold">{formatEventDate(featured.fechaEvento)}{featured.horaEvento ? ` · ${featured.horaEvento}` : ""}</dd></div>}
              {featured.ubicacion && <div className="flex gap-2"><dt className="font-semibold">Lugar</dt><dd className="font-bold">{featured.ubicacion}</dd></div>}
            </dl>
            <div role="timer" aria-label="Tiempo para la fecha" className="flex gap-2">
              {UNITS.map(([k, label]) => (
                <div key={k} className="w-[4.25rem] bg-ink px-1 py-2 text-center text-pila sm:w-20">
                  <div className="display num text-4xl sm:text-5xl">{String(timeLeft[k]).padStart(2, "0")}</div>
                  <div className="text-xs font-semibold text-paper">{label}</div>
                </div>
              ))}
            </div>
            {showCapacity && (
              <div>
                <p className="num text-base font-bold">{league.capacity.restantes} de {league.capacity.max} cupos libres</p>
                <div className="mt-1.5 h-2 bg-ink/20" role="presentation">
                  <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          {mode === "live" && featured && (
            <>
              <MapLink place={featured.ubicacion} className={btnInk} />
              <button type="button" onClick={() => onNavigate("ranking")} className={btnOutline}>Ver el ranking</button>
            </>
          )}
          {mode === "upcoming" && (
            <>
              <button type="button" onClick={() => onNavigate("inscripcion")} className={btnInk}>Quiero tirar</button>
              {featured && <AddToCalendar event={featured} />}
              {featured && <MapLink place={featured.ubicacion} />}
            </>
          )}
          {mode === "result" && finalId && finalBattle && (
            <button type="button" className={btnInk}
              onClick={() => setPlaying({ id: finalId, title: finalTitle, url: finalBattle.youtubeUrl })}>
              <PlayIcon className="h-4 w-4" />
              Ver la final
            </button>
          )}
          {mode === "result" && (
            <button type="button" onClick={() => onNavigate("ranking")} className={finalId ? btnOutline : btnInk}>Ver el ranking</button>
          )}
        </div>

        <p className="border-t-2 border-ink pt-3 text-sm font-semibold">
          {slogan} · <span className="num">{counts.mcs}</span> MCs · <span className="num">{counts.batallas}</span> batallas · <span className="num">{counts.fechas}</span> fechas
        </p>
      </div>

      <VideoModal video={playing} onClose={closeVideo} />
    </section>
  );
}
