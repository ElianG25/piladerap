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
  /** Si la tarjeta es de un MC, su alias (la ruta busca su foto). */
  mcAlias?: string;
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
export type ShareVariant = { mc?: string | null; view?: string | null; fecha?: string | null };

export function buildShareHighlights(league: LeaguePayload | null, variant: ShareVariant = {}): ShareHighlights {
  const featured = league?.featuredEvent ?? null;
  const latest = league?.latestCompletedEvent ?? null;
  const top3 = league ? rankLeague(league.ranking, league.battles).slice(0, 3) : [];
  const final = league && latest ? getFinalBattle(league.battles, latest.eventId) : null;
  const photoVideoId = final ? getYouTubeId(final.youtubeUrl) : null;
  const top = top3.map((mc) => ({ alias: mc.alias, puntos: formatPoints(mc.puntosLiga) }));

  // Tarjeta de un MC: ?mc=Reimy
  const ranked = league ? rankLeague(league.ranking, league.battles) : [];
  const mc = variant.mc ? ranked.find((r) => r.alias.trim().toLowerCase() === variant.mc!.trim().toLowerCase()) : null;
  if (mc) {
    return {
      headline: mc.alias,
      lead: mc.estado === "campeon" ? "Campeón de la última fecha" : `Posición ${mc.posicion} · ${formatPoints(mc.puntosLiga)} pts`,
      detail: `${mc.victorias}V · ${mc.derrotas}D · ${mc.replicas}R`,
      top3: top,
      photoVideoId,
      mcAlias: mc.alias,
    };
  }
  // Tarjeta de una fecha: ?fecha=fecha-4
  const target = variant.fecha ? league?.events.find((e) => e.eventId === variant.fecha) ?? null : null;
  if (target) {
    const targetFinal = league ? getFinalBattle(league.battles, target.eventId) : null;
    const targetPhoto = targetFinal ? getYouTubeId(targetFinal.youtubeUrl) : null;
    if (target.estado === "finalizada" && target.campeon)
      return { headline: target.campeon, lead: `Campeón de la ${target.titulo}`, detail: target.subcampeon ? `Subcampeón ${target.subcampeon}` : "", top3: top, photoVideoId: targetPhoto };
    const when = [target.fechaEvento ? formatEventDate(target.fechaEvento) : "", target.ubicacion].filter(Boolean).join("  ·  ");
    return { headline: target.titulo, lead: UPCOMING_LEAD[target.estado] ?? "Fecha de la liga", detail: when, top3: top, photoVideoId: targetPhoto ?? photoVideoId };
  }
  // Tarjeta del ranking: ?view=ranking
  if (variant.view === "ranking") {
    return { headline: "Ranking", lead: "Así va la liga", detail: latest ? `Después de la ${latest.titulo}` : "", top3: top, photoVideoId };
  }

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
