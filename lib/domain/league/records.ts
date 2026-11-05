import type { Battle, LeagueEvent, RankingItem } from "./types";
import { chronological, eventPoints } from "./standings";

const norm = (s: string) => s.trim().toLowerCase();

export type SeasonRecord = { id: string; titulo: string; valor: string; quienes: string[]; detalle: string };

function topBy<T>(items: T[], value: (t: T) => number, min = 1): { max: number; winners: T[] } | null {
  if (items.length === 0) return null;
  const max = Math.max(...items.map(value));
  return max >= min ? { max, winners: items.filter((i) => value(i) === max) } : null;
}

/**
 * Récords de la temporada, calculados solo con lo que ya hay en las hojas.
 * Los que dependen de las batallas (rachas, mejor fecha) solo miran las
 * fechas que tienen batallas cargadas; los demás usan la tabla.
 */
export function getSeasonRecords(ranking: RankingItem[], battles: Battle[], events: LeagueEvent[]): SeasonRecord[] {
  const out: SeasonRecord[] = [];

  const victorias = topBy(ranking, (r) => r.victorias, 2);
  if (victorias)
    out.push({ id: "victorias", titulo: "Más victorias", valor: String(victorias.max), quienes: victorias.winners.map((w) => w.alias), detalle: "en toda la temporada" });

  const invictos = ranking.filter((r) => r.derrotas === 0 && r.victorias >= 3).sort((a, b) => b.victorias - a.victorias);
  if (invictos.length)
    out.push({ id: "invicto", titulo: "Sin perder", valor: `${invictos[0].victorias}-0`, quienes: invictos.map((i) => i.alias), detalle: "victorias sin una sola derrota" });

  const replicas = topBy(ranking, (r) => r.replicas, 2);
  if (replicas)
    out.push({ id: "replicas", titulo: "Más réplicas", valor: String(replicas.max), quienes: replicas.winners.map((w) => w.alias), detalle: "batallas que se fueron a réplica" });

  // Racha de victorias más larga, en el orden en que se pelearon las batallas
  const streak = new Map<string, number>();
  const best = new Map<string, number>();
  const names = new Map<string, string>();
  for (const b of chronological(battles, events)) {
    if (!b.ganador || !b.perdedor) continue;
    const w = norm(b.ganador);
    const l = norm(b.perdedor);
    names.set(w, b.ganador);
    names.set(l, b.perdedor);
    streak.set(w, (streak.get(w) ?? 0) + 1);
    streak.set(l, 0);
    best.set(w, Math.max(best.get(w) ?? 0, streak.get(w) ?? 0));
  }
  const racha = topBy([...best.entries()], (e) => e[1], 3);
  if (racha)
    out.push({ id: "racha", titulo: "Racha más larga", valor: String(racha.max), quienes: racha.winners.map((w) => names.get(w[0]) ?? w[0]), detalle: "victorias seguidas (fechas con batallas cargadas)" });

  // Mejor fecha individual
  let mejor: { alias: string; puntos: number; fecha: string } | null = null;
  for (const e of events)
    for (const [k, pts] of eventPoints(battles, e.eventId))
      if (!mejor || pts > mejor.puntos) mejor = { alias: names.get(k) ?? k, puntos: pts, fecha: e.titulo };
  if (mejor && mejor.puntos >= 6)
    out.push({ id: "mejor-fecha", titulo: "Mejor fecha", valor: `${mejor.puntos} pts`, quienes: [mejor.alias], detalle: mejor.fecha });

  // Más títulos de fecha
  const titles = new Map<string, number>();
  for (const e of events) if (e.estado === "finalizada" && e.campeon) titles.set(e.campeon, (titles.get(e.campeon) ?? 0) + 1);
  const titulos = topBy([...titles.entries()], (t) => t[1], 2);
  if (titulos)
    out.push({ id: "titulos", titulo: "Más fechas ganadas", valor: String(titulos.max), quienes: titulos.winners.map((w) => w[0]), detalle: "campeón de fecha" });

  return out;
}

export type ChampionEntry = { eventId: string; titulo: string; campeon: string; subcampeon: string; mvp: string };

/** Los campeones de cada fecha (la más reciente primero) y cuántas veces ganó cada uno. */
export function getChampionsHall(events: LeagueEvent[]): { fechas: ChampionEntry[]; titulos: { alias: string; veces: number }[] } {
  const fechas = [...events]
    .filter((e) => e.estado === "finalizada" && e.campeon)
    .sort((a, b) => b.orden - a.orden)
    .map((e) => ({ eventId: e.eventId, titulo: e.titulo, campeon: e.campeon, subcampeon: e.subcampeon, mvp: e.mvp }));
  const count = new Map<string, number>();
  for (const f of fechas) count.set(f.campeon, (count.get(f.campeon) ?? 0) + 1);
  const titulos = [...count.entries()]
    .map(([alias, veces]) => ({ alias, veces }))
    .sort((a, b) => b.veces - a.veces || a.alias.localeCompare(b.alias));
  return { fechas, titulos };
}
