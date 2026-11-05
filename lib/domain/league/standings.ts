import type { Battle, LeagueEvent, RankingItem } from "./types";
import { rankLeague } from "./ranking";
import { battlePoints } from "./scoring";
import { roundRank } from "./rounds";

const norm = (s: string) => s.trim().toLowerCase();

/** Puntos que cada MC sacó en una fecha, según sus batallas (clave: alias en minúsculas). */
export function eventPoints(battles: Battle[], eventId: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const b of battles) {
    if (b.eventId !== eventId || b.estado === "oculta" || !b.ganador || !b.perdedor) continue;
    if (norm(b.ganador) === norm(b.perdedor)) continue;
    const w = norm(b.ganador);
    const l = norm(b.perdedor);
    out.set(w, (out.get(w) ?? 0) + battlePoints(b.tipoResultado, true));
    out.set(l, (out.get(l) ?? 0) + battlePoints(b.tipoResultado, false));
  }
  return out;
}

export type Movement = {
  /** Lugares que subió (+) o bajó (−) con la última fecha; null si debutó o no peleó en ella. */
  delta: number | null;
  /** Puntos que sumó en la última fecha (0 si no jugó). */
  puntosFecha: number;
  debut: boolean;
  /** Peleó en esa fecha. Quien no peleó no "sube" ni "baja": solo lo rebasan o rebasa a otros. */
  jugo: boolean;
};

/**
 * Movimiento de cada MC con la última fecha: compara la tabla de hoy contra la
 * de antes de esa fecha (a los puntos de hoy se les restan los de esa fecha).
 * Solo usa batallas de la fecha indicada, así que funciona aunque la Fecha 1
 * no tenga batallas cargadas.
 */
export function computeMovement(
  ranking: RankingItem[],
  battles: Battle[],
  eventId: string | null
): Map<string, Movement> {
  const out = new Map<string, Movement>();
  if (!eventId) return out;
  const latest = eventPoints(battles, eventId);
  if (latest.size === 0) return out;

  const before = ranking.map((r) => ({ ...r, puntosLiga: Math.max(0, r.puntosLiga - (latest.get(norm(r.alias)) ?? 0)) }));
  const prevPos = new Map(
    rankLeague(before, battles.filter((b) => b.eventId !== eventId)).map((r) => [norm(r.alias), r.posicion])
  );
  const played = new Map<string, number>();
  for (const b of battles) {
    if (b.eventId !== eventId || b.estado === "oculta") continue;
    for (const n of [b.ganador, b.perdedor].filter(Boolean)) played.set(norm(n), (played.get(norm(n)) ?? 0) + 1);
  }

  for (const r of rankLeague(ranking, battles)) {
    const k = norm(r.alias);
    const jugo = (played.get(k) ?? 0) > 0;
    const debut = jugo && r.victorias + r.derrotas === played.get(k);
    const prev = prevPos.get(k);
    out.set(k, {
      delta: !jugo || debut || prev == null ? null : prev - r.posicion,
      puntosFecha: latest.get(k) ?? 0,
      debut,
      jugo,
    });
  }
  return out;
}

/** Puntos, victorias y derrotas de un MC en cada fecha en que peleó, de la más reciente a la más vieja. */
export function mcHistory(battles: Battle[], events: LeagueEvent[], alias: string) {
  const me = norm(alias);
  return [...events]
    .sort((a, b) => b.orden - a.orden)
    .map((e) => {
      const mine = battles.filter(
        (b) =>
          b.eventId === e.eventId &&
          b.estado !== "oculta" &&
          b.ganador &&
          b.perdedor &&
          [b.ganador, b.perdedor].some((n) => norm(n) === me)
      );
      const wins = mine.filter((b) => norm(b.ganador) === me).length;
      return {
        event: e,
        puntos: eventPoints(battles, e.eventId).get(me) ?? 0,
        victorias: wins,
        derrotas: mine.length - wins,
        jugo: mine.length > 0,
      };
    })
    .filter((h) => h.jugo);
}

/** Todas las batallas de la temporada en el orden en que se pelearon. */
export function chronological(battles: Battle[], events: LeagueEvent[]): Battle[] {
  const orden = new Map(events.map((e) => [e.eventId, e.orden]));
  return battles
    .filter((b) => b.estado !== "oculta")
    .sort(
      (a, b) =>
        (orden.get(a.eventId) ?? 999) - (orden.get(b.eventId) ?? 999) ||
        roundRank(a.ronda) - roundRank(b.ronda) ||
        a.orden - b.orden
    );
}
