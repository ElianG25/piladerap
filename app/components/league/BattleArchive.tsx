"use client";

import { useCallback, useMemo, useState } from "react";
import type { Battle, LeagueEvent, MediaItem } from "@/lib/domain/league/types";
import { getEventPlaylistUrl } from "@/lib/domain/league/rules";
import { groupByRound, orderBracketRounds } from "@/lib/domain/league/rounds";
import { isReplica } from "@/lib/domain/league/scoring";
import { getYouTubeId } from "@/lib/shared/youtube";
import { ExternalIcon, PlayIcon } from "@/app/components/ui/icons";
import { btnOutline } from "@/app/components/ui/buttons";
import { VideoModal, type PlayPayload } from "./VideoModal";

type BattleArchiveProps = {
  battles: Battle[];
  events: LeagueEvent[];
  media: MediaItem[];
};

type Round = { ronda: string; battles: Battle[] };

const norm = (s: string) => s.trim().toLowerCase();
const slug = (s: string) => norm(s).replace(/[^a-z0-9]+/g, "-");

/** Alto de la fila base del bracket: un Octavos ocupa 1 fila, un Cuartos 2, una Semifinal 4... */
const ROW = "8rem";

function MatchCard({ battle, onPlay }: { battle: Battle; onPlay: (v: NonNullable<PlayPayload>) => void }) {
  const players = [battle.mc1, battle.mc2, battle.mc3, battle.mc4].filter(Boolean);
  const id = getYouTubeId(battle.youtubeUrl);
  const title = `${players.join(" vs ")} · ${battle.ronda}`;
  const winner = battle.ganador ? norm(battle.ganador) : "";
  const replica = isReplica(battle.tipoResultado);

  return (
    <article className="grid w-full grid-cols-[1fr_auto] border-2 border-ink bg-paper">
      <div className="min-w-0">
        {players.map((p) => {
          const won = winner !== "" && norm(p) === winner;
          return (
            <p key={p} className={`break-words px-3 py-2 text-sm font-bold uppercase leading-tight ${won ? "bg-ink text-pila" : "text-muted"}`}>
              {p}
              {won && <span className="sr-only"> (ganó)</span>}
            </p>
          );
        })}
        <p className="border-t-2 border-ink px-3 py-1.5 text-sm font-semibold text-muted">
          {battle.ganador ? (replica ? "Ganó con réplica" : "Ganó directo") : "Sin resultado"}
        </p>
      </div>
      {id ? (
        <button type="button" onClick={() => onPlay({ id, title, url: battle.youtubeUrl })}
          aria-label={`Ver ${title}`}
          className="flex w-12 items-center justify-center border-l-2 border-ink bg-pila text-ink transition-colors hover:bg-ink hover:text-pila">
          <PlayIcon className="h-5 w-5" />
        </button>
      ) : (
        <span className="flex w-12 items-center justify-center border-l-2 border-ink text-sm font-semibold text-muted" role="img" aria-label="Sin video">—</span>
      )}
    </article>
  );
}

/** Rondas en lista vertical (móvil, o fechas con una estructura distinta a 8-4-2-1). */
function StackedRounds({ rounds, onPlay, className = "" }: { rounds: Round[]; onPlay: (v: NonNullable<PlayPayload>) => void; className?: string }) {
  return (
    <div className={`space-y-8 ${className}`}>
      {rounds.map((g) => (
        <section key={g.ronda} id={`ronda-${slug(g.ronda)}`} className="scroll-mt-20" aria-label={g.ronda}>
          <h3 className="display mb-2 text-3xl">{g.ronda}</h3>
          <div className="flex flex-col gap-3">
            {g.battles.map((b) => <MatchCard key={b.battleId} battle={b} onPlay={onPlay} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Llaves reales: cada ronda ocupa el doble de filas que la anterior y se unen con líneas. */
function Bracket({ rounds, connectors, onPlay }: { rounds: Round[]; connectors: boolean; onPlay: (v: NonNullable<PlayPayload>) => void }) {
  const base = rounds[0].battles.length;
  return (
    <div className="hidden gap-x-12 lg:grid" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
      {rounds.map((g, col) => {
        const span = base / g.battles.length;
        const isLast = col === rounds.length - 1;
        return (
          <div key={g.ronda}>
            <h3 className="display mb-2 text-3xl">{g.ronda}</h3>
            <div className="grid" style={{ gridTemplateRows: `repeat(${base}, ${ROW})` }}>
              {g.battles.map((b, i) => (
                <div key={b.battleId} className="relative flex items-center" style={{ gridRow: `span ${span}` }}>
                  <MatchCard battle={b} onPlay={onPlay} />
                  {connectors && col > 0 && <span aria-hidden className="absolute right-full top-1/2 w-6 border-t-2 border-ink" />}
                  {connectors && !isLast && (
                    <>
                      <span aria-hidden className="absolute left-full top-1/2 w-6 border-t-2 border-ink" />
                      <span aria-hidden
                        className={`absolute left-[calc(100%+1.5rem)] h-1/2 border-l-2 border-ink ${i % 2 === 0 ? "top-1/2" : "bottom-1/2"}`} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Archivo de batallas por fecha, armadas como llaves: Octavos → Cuartos → Semifinal → Final. */
export function BattleArchive({ battles, events, media }: BattleArchiveProps) {
  const eventsWithBattles = useMemo(() => {
    const ids = new Set(battles.map((b) => b.eventId));
    return [...events].filter((e) => ids.has(e.eventId)).sort((a, b) => b.orden - a.orden);
  }, [battles, events]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState<PlayPayload>(null);
  const closeVideo = useCallback(() => setPlaying(null), []);

  const current = eventsWithBattles.find((e) => e.eventId === selectedId) ?? eventsWithBattles[0] ?? null;
  const playlistUrl = current ? getEventPlaylistUrl(current, media) : null;

  const { main, bracketRounds, connectors, third, isBracket } = useMemo(() => {
    const all = current ? groupByRound(battles.filter((b) => b.eventId === current.eventId)) : [];
    const mainRounds = all.filter((g) => norm(g.ronda) !== "tercer puesto");
    const thirdRound = all.find((g) => norm(g.ronda) === "tercer puesto") ?? null;
    const counts = mainRounds.map((g) => g.battles.length);
    const bracket = counts.length >= 2 && counts.every((c, i) => i === 0 || c * 2 === counts[i - 1]);
    // Las llaves se ordenan por quién peleó contra quién, no por el orden de la hoja.
    const aligned = bracket ? orderBracketRounds(mainRounds) : { rounds: mainRounds, problems: [] as string[] };
    return { main: mainRounds, bracketRounds: aligned.rounds, connectors: aligned.problems.length === 0, third: thirdRound, isBracket: bracket };
  }, [battles, current]);

  const stacked = [...main, ...(third ? [third] : [])];

  return (
    <section aria-labelledby="batallas-titulo">
      <VideoModal video={playing} onClose={closeVideo} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="batallas-titulo" className="display text-5xl sm:text-6xl">Batallas</h2>
        {playlistUrl && current && (
          <a href={playlistUrl} target="_blank" rel="noreferrer" className={btnOutline}>
            Playlist de {current.titulo}
            <ExternalIcon className="h-4 w-4" />
          </a>
        )}
      </div>

      {current ? (
        <>
          <div role="group" aria-label="Elegir fecha" className="mt-4 flex flex-wrap gap-2">
            {eventsWithBattles.map((e) => (
              <button key={e.eventId} type="button" aria-pressed={e.eventId === current.eventId}
                onClick={() => setSelectedId(e.eventId)}
                className={`min-h-11 border-2 border-ink px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                  e.eventId === current.eventId ? "bg-ink text-pila" : "hover:bg-ink hover:text-pila"
                }`}>
                {e.titulo}
              </button>
            ))}
          </div>

          <nav aria-label="Ir a una ronda" className={`mt-4 flex flex-wrap gap-2 ${isBracket ? "lg:hidden" : ""}`}>
            {stacked.map((g) => (
              <a key={g.ronda} href={`#ronda-${slug(g.ronda)}`}
                className="flex min-h-11 items-center border-2 border-ink px-3 text-sm font-bold uppercase hover:bg-ink hover:text-pila">
                {g.ronda}
              </a>
            ))}
          </nav>

          <div className="mt-6">
            {isBracket ? (
              <>
                <Bracket rounds={bracketRounds} connectors={connectors} onPlay={setPlaying} />
                {third && (
                  <section className="mt-8 hidden max-w-sm lg:ml-auto lg:block" aria-label={third.ronda}>
                    <h3 className="display mb-2 text-3xl">{third.ronda}</h3>
                    {third.battles.map((b) => <MatchCard key={b.battleId} battle={b} onPlay={setPlaying} />)}
                  </section>
                )}
                <StackedRounds rounds={stacked} onPlay={setPlaying} className="lg:hidden" />
              </>
            ) : (
              <StackedRounds rounds={stacked} onPlay={setPlaying} />
            )}
          </div>
        </>
      ) : (
        <p className="mt-6 max-w-prose text-base text-muted">
          Todavía no hay batallas publicadas. Aparecen aquí apenas se suban los videos de la fecha.
        </p>
      )}
    </section>
  );
}
