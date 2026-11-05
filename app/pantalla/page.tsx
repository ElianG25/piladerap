"use client";

import { useMemo } from "react";
import { getPublishedBattles, getPublicEvents } from "@/lib/domain/league/rules";
import { rankLeague } from "@/lib/domain/league/ranking";
import { computeMovement } from "@/lib/domain/league/standings";
import { formatEventDate, formatPoints } from "@/lib/shared/format";
import { roundRank } from "@/lib/domain/league/rounds";
import { useLeagueData } from "@/app/hooks/useLeagueData";
import { useEventCountdown } from "@/app/hooks/useEventCountdown";
import { PilaMark } from "@/app/components/ui/PilaMark";
import { ArrowDownIcon, ArrowUpIcon } from "@/app/components/ui/icons";

const REFRESH_MS = 30_000;
const UNITS = [["d", "días"], ["h", "horas"], ["m", "min"], ["s", "seg"]] as const;

/**
 * Vista para proyectar en la plaza: ranking grande a la izquierda y, a la
 * derecha, la fecha que viene (o los resultados de la última). Se actualiza
 * sola cada 30 segundos y no tiene nada que tocar.
 */
export default function PantallaPage() {
  const { league, loading, error } = useLeagueData({ refreshMs: REFRESH_MS });
  const timeLeft = useEventCountdown(league?.featuredEvent);

  const battles = useMemo(() => getPublishedBattles(league?.battles ?? []), [league?.battles]);
  const ranking = useMemo(() => rankLeague(league?.ranking ?? [], battles), [league?.ranking, battles]);
  const events = useMemo(() => getPublicEvents(league?.events ?? []), [league?.events]);
  const movement = useMemo(
    () => computeMovement(ranking, battles, league?.latestCompletedEvent?.eventId ?? null),
    [ranking, battles, league?.latestCompletedEvent?.eventId]
  );

  if (loading || !league) {
    return (
      <main className="on-ink flex min-h-svh items-center justify-center bg-ink text-paper">
        <p className="display text-5xl">{error ? "Sin conexión con la liga" : "Cargando…"}</p>
      </main>
    );
  }

  const featured = league.featuredEvent;
  const upcoming = featured && ["anunciada", "inscripciones", "en_vivo"].includes(featured.estado) ? featured : null;
  const last = league.latestCompletedEvent;
  const lastBattles = last
    ? battles
        .filter((b) => b.eventId === last.eventId && b.ganador)
        .sort((a, b) => roundRank(b.ronda) - roundRank(a.ronda) || b.orden - a.orden)
        .slice(0, 6)
    : [];
  const top = ranking.slice(0, 12);

  return (
    <main className="on-ink min-h-svh bg-ink p-6 text-paper lg:p-10">
      <header className="flex items-center justify-between gap-4 border-b-2 border-ink-line pb-5">
        <div className="flex items-center gap-4">
          <PilaMark height="4.5rem" />
          <h1 className="display text-6xl lg:text-7xl">Pila de Ra&apos;</h1>
        </div>
        <p className="num text-lg font-semibold text-muted-ink">{events.length} fechas · {ranking.length} MCs</p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <section aria-labelledby="p-ranking">
          <h2 id="p-ranking" className="display text-5xl lg:text-6xl text-pila">Ranking</h2>
          <ol className="mt-4 divide-y-2 divide-ink-line border-y-2 border-ink-line">
            {top.map((mc) => {
              const m = movement.get(mc.alias.trim().toLowerCase());
              return (
                <li key={mc.alias} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-3">
                  <span className={`display num text-6xl ${mc.posicion === 1 ? "text-pila" : ""}`}>{mc.posicion}</span>
                  <span className="min-w-0">
                    <span className={`block break-words text-3xl font-bold uppercase lg:text-4xl ${mc.posicion === 1 ? "text-pila" : ""}`}>{mc.alias}</span>
                    <span className="num block text-lg text-muted-ink">
                      {mc.victorias}V · {mc.derrotas}D · {mc.replicas}R
                      {m && m.delta ? (
                        <span className={`ml-3 inline-flex items-center font-bold ${m.delta > 0 ? "text-pila" : "text-[#ff7a5c]"}`}>
                          {m.delta > 0 ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}{Math.abs(m.delta)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="display num text-6xl lg:text-7xl">{formatPoints(mc.puntosLiga)}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="p-lado" className="space-y-8">
          {upcoming ? (
            <>
              <h2 id="p-lado" className="display text-5xl lg:text-6xl text-pila">{upcoming.estado === "en_vivo" ? "Hoy" : "Próxima fecha"}</h2>
              <p className="display text-7xl lg:text-8xl">{upcoming.titulo}</p>
              <p className="text-2xl font-semibold">
                {upcoming.fechaEvento ? formatEventDate(upcoming.fechaEvento) : ""}{upcoming.horaEvento ? ` · ${upcoming.horaEvento}` : ""}
              </p>
              {upcoming.ubicacion && <p className="text-2xl text-muted-ink">{upcoming.ubicacion}</p>}
              {upcoming.estado !== "en_vivo" && (
                <div role="timer" className="flex gap-3">
                  {UNITS.map(([k, label]) => (
                    <div key={k} className="w-28 bg-pila px-2 py-3 text-center text-ink">
                      <div className="display num text-6xl">{String(timeLeft[k]).padStart(2, "0")}</div>
                      <div className="text-base font-bold">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : last ? (
            <>
              <h2 id="p-lado" className="display text-5xl lg:text-6xl text-pila">{last.titulo}</h2>
              <p className="display text-7xl lg:text-8xl">{last.campeon || "—"}</p>
              <p className="text-2xl font-semibold">Campeón{last.subcampeon ? ` · Subcampeón ${last.subcampeon}` : ""}</p>
            </>
          ) : null}

          {lastBattles.length > 0 && (
            <div>
              <h3 className="display text-4xl">Últimos resultados</h3>
              <ul className="mt-3 divide-y-2 divide-ink-line border-y-2 border-ink-line">
                {lastBattles.map((b) => (
                  <li key={b.battleId} className="py-2.5 text-2xl">
                    <span className="font-bold uppercase text-pila">{b.ganador}</span>
                    <span className="text-muted-ink"> le ganó a </span>
                    <span className="font-bold uppercase">{b.perdedor}</span>
                    <span className="block text-base text-muted-ink">{b.ronda}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
