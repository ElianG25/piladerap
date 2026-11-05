"use client";

import type { TouchEvent } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import type { Battle, LeagueEvent, LeaguePayload, MediaItem, RankedItem } from "@/lib/domain/league/types";
import type { Countdown } from "@/app/hooks/useEventCountdown";
import type { Section } from "@/app/hooks/useSectionRouter";
import { asHttpUrl } from "@/lib/shared/youtube";
import { LeagueHero } from "@/app/components/league/LeagueHero";
import { EventTimeline } from "@/app/components/league/EventTimeline";
import { Scoreboard } from "@/app/components/league/Scoreboard";
import { ScoringRules } from "@/app/components/league/ScoringRules";
import { LatestBattles } from "@/app/components/league/LatestBattles";
import { BattleArchive } from "@/app/components/league/BattleArchive";
import { RegistrationCard } from "@/app/components/league/RegistrationCard";
import { PilaMark } from "@/app/components/ui/PilaMark";
import { NavIcon } from "@/app/components/home/NavIcon";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";
import { NotificationBanner } from "@/app/components/notifications/NotificationBanner";

const YOUTUBE_CHANNEL = "https://www.youtube.com/@Piladerap";

const pageVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -24 : 24, opacity: 0 }),
};
const pageTrans = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

type HomeViewProps = {
  league: LeaguePayload;
  section: Section;
  visibleSections: { id: Section; label: string }[];
  direction: number;
  onNavigate: (to: Section) => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  timeLeft: Countdown;
  ranking: RankedItem[];
  events: LeagueEvent[];
  battles: Battle[];
  media: MediaItem[];
  showRanking: boolean;
  refreshing: boolean;
};

/** Vista pura de la home: toma datos ya resueltos por hooks y solo renderiza. */
export function HomeView({
  league, section, visibleSections, direction, onNavigate, onTouchStart, onTouchEnd,
  timeLeft, ranking, events, battles, media, showRanking, refreshing,
}: HomeViewProps) {
  const slogan = league.config?.brandSlogan || "Vamo' a prender la plaza";
  const instagramUrl = asHttpUrl(league.config?.instagramUrl);
  const videoId = league.config?.backgroundVideoId?.trim() || null;

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-[100svh] bg-concrete pb-[calc(5rem+env(safe-area-inset-bottom))] text-ink md:pb-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {refreshing && (
          <div role="status" className="fixed inset-x-0 top-0 z-[70] h-1 animate-pulse bg-pila motion-reduce:animate-none">
            <span className="sr-only">Actualizando datos</span>
          </div>
        )}

        {/* Barra superior: marca + navegación (escritorio) + avisos */}
        <header className="on-ink sticky top-0 z-40 bg-ink text-paper">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
            <button type="button" onClick={() => onNavigate("inicio")} className="flex items-center gap-3" aria-label="Pila de Ra', ir al inicio">
              <PilaMark height="2.25rem" priority />
              <span className="display text-3xl leading-none">Pila de Ra&apos;</span>
            </button>

            <nav aria-label="Secciones" className="ml-6 hidden h-full md:flex">
              {visibleSections.map((s) => (
                <button key={s.id} type="button" onClick={() => onNavigate(s.id)}
                  aria-current={section === s.id ? "page" : undefined}
                  className={`flex h-full items-center border-b-4 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                    section === s.id ? "border-pila text-pila" : "border-transparent hover:text-pila"
                  }`}>
                  {s.label}
                </button>
              ))}
            </nav>

            <div className="ml-auto"><NotificationBell /></div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={section} custom={direction} variants={pageVariants}
              initial="enter" animate="center" exit="exit" transition={pageTrans}>
              {section === "inicio" && (
                <div className="space-y-8">
                  <LeagueHero
                    league={league} battles={battles} timeLeft={timeLeft} videoId={videoId} slogan={slogan}
                    counts={{ mcs: ranking.length, batallas: battles.length, fechas: events.length }}
                    onNavigate={onNavigate}
                  />
                  <NotificationBanner />
                  <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
                    {showRanking && <Scoreboard ranking={ranking} battles={battles} events={events} />}
                    <LatestBattles battles={battles} latestEvent={league.latestCompletedEvent} onNavigate={onNavigate} />
                  </div>
                  <ScoringRules />
                </div>
              )}
              {section === "ranking" && (
                <div className="grid gap-8 lg:grid-cols-[minmax(0,44rem)_1fr] lg:items-start">
                  <Scoreboard ranking={ranking} battles={battles} events={events} limit={ranking.length} variant="full" />
                  <ScoringRules narrow />
                </div>
              )}
              {section === "fechas" && <EventTimeline events={events} battles={battles} media={media} />}
              {section === "batallas" && <BattleArchive battles={battles} events={events} media={media} />}
              {section === "inscripcion" && <RegistrationCard activeEvent={league.activeEvent} capacity={league.capacity} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="border-t-2 border-ink">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-sm font-semibold sm:px-6">
            <p>Pila de Ra&apos; · Temporada {new Date().getFullYear()}</p>
            <p className="flex flex-wrap gap-x-5 gap-y-1">
              {instagramUrl && <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-block py-2 underline decoration-2 underline-offset-4 hover:bg-pila">Instagram</a>}
              <a href={YOUTUBE_CHANNEL} target="_blank" rel="noreferrer" className="inline-block py-2 underline decoration-2 underline-offset-4 hover:bg-pila">YouTube</a>
              <a href="https://t.me/Ztyl3" target="_blank" rel="noreferrer" className="inline-block py-2 underline decoration-2 underline-offset-4 hover:bg-pila">Hecho por Elian Gomez</a>
            </p>
          </div>
        </footer>

        {/* Navegación inferior (móvil) */}
        <nav aria-label="Secciones" className="on-ink fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink-line bg-ink md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${visibleSections.length}, 1fr)` }}>
            {visibleSections.map((s) => {
              const active = section === s.id;
              return (
                <button key={s.id} type="button" onClick={() => onNavigate(s.id)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center gap-1 text-[13px] font-bold transition-colors ${
                    active ? "text-pila" : "text-muted-ink"
                  }`}>
                  {active && <span className="absolute inset-x-3 top-0 h-1 bg-pila" aria-hidden />}
                  <NavIcon id={s.id} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </MotionConfig>
  );
}
