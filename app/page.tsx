"use client";

import { useMemo } from "react";
import { getPublicEvents, getPublishedBattles, getVisibleMedia, isSectionEnabled } from "@/lib/domain/league/rules";
import { rankLeague } from "@/lib/domain/league/ranking";
import { useLeagueData } from "@/app/hooks/useLeagueData";
import { useSectionRouter } from "@/app/hooks/useSectionRouter";
import { useEventCountdown } from "@/app/hooks/useEventCountdown";
import { HomeView } from "@/app/components/home/HomeView";
import { LoadingScreen } from "@/app/components/home/LoadingScreen";
import { ErrorScreen } from "@/app/components/home/ErrorScreen";

export default function Home() {
  const { league, loading, error, refreshing } = useLeagueData();

  const { section, visibleSections, direction, navigate, onTouchStart, onTouchEnd } =
    useSectionRouter(league?.config, Boolean(league));

  const timeLeft = useEventCountdown(league?.featuredEvent);

  const battles = useMemo(() => getPublishedBattles(league?.battles ?? []), [league?.battles]);
  const ranking = useMemo(() => rankLeague(league?.ranking ?? [], battles), [league?.ranking, battles]);
  const events = useMemo(() => getPublicEvents(league?.events ?? []), [league?.events]);
  const media = useMemo(() => getVisibleMedia(league?.media ?? []), [league?.media]);
  const showRanking = isSectionEnabled(league?.config, "showRanking");

  if (loading) return <LoadingScreen />;
  if (error || !league) return <ErrorScreen message={error} />;

  return (
    <HomeView
      league={league}
      section={section}
      visibleSections={visibleSections}
      direction={direction}
      onNavigate={navigate}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      timeLeft={timeLeft}
      ranking={ranking}
      events={events}
      battles={battles}
      media={media}
      showRanking={showRanking}
      refreshing={refreshing}
    />
  );
}
