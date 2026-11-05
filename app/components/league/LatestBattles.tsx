"use client";

import { useMemo } from "react";
import type { Battle, LeagueEvent } from "@/lib/domain/league/types";
import type { Section } from "@/app/hooks/useSectionRouter";
import { getYouTubeId } from "@/lib/shared/youtube";
import { YouTubeThumb } from "@/app/components/ui/YouTubeThumb";
import { ArrowRightIcon, PlayIcon } from "@/app/components/ui/icons";
import { btnOutline } from "@/app/components/ui/buttons";
import { useOverlays } from "./OverlayProvider";

type LatestBattlesProps = {
  battles: Battle[];
  latestEvent: LeagueEvent | null;
  onNavigate: (to: Section) => void;
};

/** Qué batallas se muestran primero: la final y lo que decide el campeonato. */
const PRIORITY = ["final", "semifinal", "tercer puesto", "cuartos", "octavos"];
const priority = (ronda: string) => {
  const i = PRIORITY.indexOf(ronda.trim().toLowerCase());
  return i === -1 ? PRIORITY.length : i;
};

/** Las batallas que más importan de la última fecha, con su foto y su video. */
export function LatestBattles({ battles, latestEvent, onNavigate }: LatestBattlesProps) {
  const { openVideo } = useOverlays();

  const picks = useMemo(() => {
    if (!latestEvent) return [];
    return battles
      .filter((b) => b.eventId === latestEvent.eventId && getYouTubeId(b.youtubeUrl))
      .sort((a, b) => priority(a.ronda) - priority(b.ronda) || a.orden - b.orden)
      .slice(0, 4);
  }, [battles, latestEvent]);

  return (
    <section aria-labelledby="ultimas-titulo" className="flex flex-col">
      <h2 id="ultimas-titulo" className="display text-4xl sm:text-5xl">Últimas batallas</h2>
      {latestEvent && <p className="mt-1 text-sm font-semibold text-muted">{latestEvent.titulo}</p>}

      {picks.length === 0 ? (
        <p className="mt-4 max-w-prose text-base text-muted">Los videos aparecen aquí apenas se suban.</p>
      ) : (
        <ul className="mt-4 divide-y-2 divide-ink border-y-2 border-ink">
          {picks.map((b) => {
            const id = getYouTubeId(b.youtubeUrl)!;
            const title = `${b.mc1} vs ${b.mc2}`;
            return (
              <li key={b.battleId}>
                <button type="button" onClick={() => openVideo({ id, title: `${title} · ${b.ronda}`, url: b.youtubeUrl, battleId: b.battleId })}
                  aria-label={`Ver ${title}, ${b.ronda}`}
                  className="group grid w-full grid-cols-[7.5rem_1fr] items-center gap-3 py-3 text-left sm:grid-cols-[9rem_1fr]">
                  <span className="relative block aspect-video overflow-hidden bg-ink">
                    <YouTubeThumb id={id} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/30 text-pila transition-colors group-hover:bg-ink/60">
                      <PlayIcon className="h-6 w-6" />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 break-words text-base font-bold uppercase">{title}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {b.ronda}
                      {b.ganador && <> · ganó <strong className="font-bold uppercase text-ink">{b.ganador}</strong></>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" onClick={() => onNavigate("batallas")} className={`${btnOutline} mt-4 self-start`}>
        Ver las llaves completas <ArrowRightIcon className="h-4 w-4" />
      </button>
    </section>
  );
}
