import { rankLeague } from "@/lib/domain/league/ranking";
import { getFinalBattle } from "@/lib/domain/league/rounds";
import type { LeaguePayload } from "@/lib/domain/league/types";
import { formatEventDate, formatPoints } from "@/lib/shared/format";
import { getYouTubeId } from "@/lib/shared/youtube";

export type ShareHighlights = {
  /** Lo grande de la losa: el campeón de la última fecha, o la fecha que viene / se juega hoy. */
  headline: string;
  /** Una línea que dice qué es el titular ("Campeón de la Fecha 4", "Inscripciones abiertas"). */
  lead: string;
  /** Detalle corto: subcampeón, o día y lugar de la próxima fecha. Puede venir vacío. */
  detail: string;
  top3: { alias: string; puntos: string }[];
  /** Video de la final de la última fecha: de ahí sale la foto. */
  photoVideoId: string | null;
};

const UPCOMING = ["anunciada", "inscripciones", "en_vivo"];

const UPCOMING_LEAD: Record<string, string> = {
  en_vivo: "Hoy se juega en la plaza",
  inscripciones: "Inscripciones abiertas",
  anunciada: "Fecha confirmada",
};

/**
 * Caso de uso: elegir qué mostrar en la imagen social (`/api/og`) con el mismo
 * criterio que la portada de la web — campeón de la última fecha, o la fecha
 * que viene. Puro: no hace fetch ni conoce `ImageResponse`/JSX, así que es
 * trivial de testear y de reusar si algún día se genera otro formato.
 */
export function buildShareHighlights(league: LeaguePayload | null): ShareHighlights {
  const featured = league?.featuredEvent ?? null;
  const latest = league?.latestCompletedEvent ?? null;
  const top3 = league ? rankLeague(league.ranking, league.battles).slice(0, 3) : [];
  const final = league && latest ? getFinalBattle(league.battles, latest.eventId) : null;
  const photoVideoId = final ? getYouTubeId(final.youtubeUrl) : null;
  const top = top3.map((mc) => ({ alias: mc.alias, puntos: formatPoints(mc.puntosLiga) }));

  if (featured && UPCOMING.includes(featured.estado)) {
    const detail = [featured.fechaEvento ? formatEventDate(featured.fechaEvento) : "", featured.ubicacion]
      .filter(Boolean)
      .join("  ·  ");
    return { headline: featured.titulo || "Próxima fecha", lead: UPCOMING_LEAD[featured.estado], detail, top3: top, photoVideoId };
  }

  return {
    headline: latest?.campeon || latest?.titulo || "La plaza sigue viva",
    lead: latest?.campeon ? `Campeón de la ${latest.titulo}` : "Freestyle de plazas en RD",
    detail: latest?.subcampeon ? `Subcampeón ${latest.subcampeon}` : "",
    top3: top,
    photoVideoId,
  };
}
