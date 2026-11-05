import type { LeagueEvent, LeaguePayload } from "@/lib/domain/league/types";
import { getEventPlaylistUrl } from "@/lib/domain/league/rules";
import { fetchPlaylistCover } from "@/lib/infrastructure/youtube/playlistCover";

/**
 * Agrega a cada fecha la portada de su playlist (la foto grupal). Nunca
 * rompe la carga de la liga: si una portada no se consigue, esa fecha
 * simplemente se queda sin `coverUrl`.
 */
export async function attachPlaylistCovers(league: LeaguePayload): Promise<LeaguePayload> {
  const covers = new Map<string, string>();
  await Promise.all(
    league.events.map(async (ev) => {
      const playlist = getEventPlaylistUrl(ev, league.media);
      if (!playlist) return;
      const cover = await fetchPlaylistCover(playlist);
      if (cover) covers.set(ev.eventId, cover);
    })
  );
  if (covers.size === 0) return league;

  const withCover = (ev: LeagueEvent | null): LeagueEvent | null =>
    ev && covers.has(ev.eventId) ? { ...ev, coverUrl: covers.get(ev.eventId) } : ev;

  return {
    ...league,
    events: league.events.map((e) => withCover(e) as LeagueEvent),
    featuredEvent: withCover(league.featuredEvent),
    activeEvent: withCover(league.activeEvent),
    latestCompletedEvent: withCover(league.latestCompletedEvent),
  };
}
