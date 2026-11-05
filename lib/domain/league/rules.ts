import type { Battle, LeagueEvent, MediaItem, RankingItem } from "./types";
import { asHttpUrl } from "@/lib/shared/youtube";

export function getPublicEvents(events: LeagueEvent[]) {
  return events
    .filter((event) => event.visible && event.estado !== "oculta")
    .sort((a, b) => a.orden - b.orden);
}

export function getPublishedBattles(battles: Battle[]) {
  return battles
    .filter((battle) => battle.estado !== "oculta")
    .sort((a, b) => {
      if (a.eventId !== b.eventId) return a.eventId.localeCompare(b.eventId);
      return a.orden - b.orden;
    });
}

export function getEventById(events: LeagueEvent[], eventId: string) {
  return events.find((event) => event.eventId === eventId) || null;
}

export function getVisibleMedia(media: MediaItem[]) {
  return media
    .filter((item) => item.visible && item.url)
    .sort((a, b) => a.orden - b.orden);
}

/** Playlist de YouTube asociada a un evento (si existe). */
export function getEventPlaylist(media: MediaItem[], eventId: string): MediaItem | null {
  return media.find((item) => item.eventId === eventId && item.tipo === "playlist") ?? null;
}

/**
 * Enlace a la playlist de una fecha: primero la columna del evento, y si no es
 * una URL real (la hoja a veces trae texto pegado), la hoja Media.
 */
export function getEventPlaylistUrl(event: LeagueEvent, media: MediaItem[]): string | null {
  return asHttpUrl(event.youtubePlaylist) ?? asHttpUrl(getEventPlaylist(media, event.eventId)?.url);
}

/**
 * Flags de Config (showRanking, showBattles, showEvents, ...). El backend
 * (Apps Script) ya fusiona sus propios defaults, así que llegan siempre como
 * "TRUE"/"FALSE"; solo se consideran deshabilitados si dicen "FALSE" explícito.
 */
export function isSectionEnabled(config: Record<string, string> | undefined | null, key: string): boolean {
  return config?.[key] !== "FALSE";
}

/**
 * MCs recién agregados a la hoja Ranking a veces no traen todavía sus
 * estadísticas (mientras se cargan los resultados completos de la fecha) —
 * en ese caso todos los campos numéricos llegan en 0 a la vez, a diferencia
 * de alguien que ya compitió (que va a tener al menos algún campo distinto
 * de 0: una victoria, una derrota, una réplica...).
 */
export function hasNoStatsYet(mc: RankingItem): boolean {
  return (
    mc.puntosLiga === 0 &&
    mc.victorias === 0 &&
    mc.derrotas === 0 &&
    mc.replicas === 0
  );
}

/** Hay al menos un MC sin stats cargadas — el ranking completo es provisional. */
export function hasPendingResults(ranking: RankingItem[]): boolean {
  return ranking.some(hasNoStatsYet);
}
