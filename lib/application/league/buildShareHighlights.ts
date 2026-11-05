import { rankLeague } from "@/lib/domain/league/ranking";
import type { LeaguePayload } from "@/lib/domain/league/types";

export type ShareHighlights = {
  badge: string;
  headline: string;
  sub: string;
  top3: { alias: string; puntosLiga: number }[];
  latestChampion: string | null;
};

function getBadge(estado?: string): string {
  if (estado === "en_vivo") return "HOY";
  if (estado === "inscripciones") return "INSCRIPCIONES ABIERTAS";
  if (estado === "anunciada") return "FECHA CONFIRMADA";
  return "TEMPORADA 2026";
}

/**
 * Caso de uso: elegir qué mostrar en la imagen social (`/api/og`) a partir
 * de la liga real — fecha destacada, top 3 del ranking o último campeón.
 * Puro: no hace fetch ni conoce `ImageResponse`/JSX, así que es trivial de
 * testear y de reusar si algún día se genera otro formato de imagen.
 */
export function buildShareHighlights(league: LeaguePayload | null): ShareHighlights {
  const featured = league?.featuredEvent ?? null;
  const latest = league?.latestCompletedEvent ?? null;
  const top3 = league ? rankLeague(league.ranking, league.battles).slice(0, 3) : [];

  const sub =
    featured && featured.estado !== "futura"
      ? [featured.fechaEvento, featured.ubicacion].filter(Boolean).join("  ·  ") ||
        "Freestyle, barras y competencia real en RD"
      : "Freestyle, barras y competencia real en República Dominicana";

  return {
    badge: getBadge(featured?.estado),
    headline: (featured?.titulo || "LA PLAZA SIGUE VIVA").toUpperCase(),
    sub,
    top3: top3.map((mc) => ({ alias: mc.alias, puntosLiga: mc.puntosLiga })),
    latestChampion: latest?.campeon || null,
  };
}
