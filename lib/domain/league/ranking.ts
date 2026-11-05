import type { Battle, RankedItem, RankingItem } from "./types";

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Ordena la tabla de la liga. El criterio es puntosLiga; si hay empate se
 * resuelve por cruce directo (quién le ganó a quién entre los empatados).
 * Si no hubo cruce, el empate se mantiene: comparten posición (1, 2, 2, 4...).
 *
 * Con 3 o más empatados se arma una mini-tabla solo con las batallas entre
 * ellos; los que quedan igualados en esa mini-tabla siguen empatados.
 */
export function rankLeague(ranking: RankingItem[], battles: Battle[]): RankedItem[] {
  const base = [...ranking].sort((a, b) =>
    b.puntosLiga !== a.puntosLiga ? b.puntosLiga - a.puntosLiga : a.alias.localeCompare(b.alias)
  );

  const result: RankedItem[] = [];
  let i = 0;
  while (i < base.length) {
    let j = i;
    while (j + 1 < base.length && base[j + 1].puntosLiga === base[i].puntosLiga) j++;
    const group = base.slice(i, j + 1);

    const scores = headToHeadScores(group, battles);
    group.sort((a, b) => {
      const diff = (scores.get(norm(b.alias)) ?? 0) - (scores.get(norm(a.alias)) ?? 0);
      return diff !== 0 ? diff : a.alias.localeCompare(b.alias);
    });

    // Posiciones dentro del grupo: empatan los que tienen el mismo puntaje de cruce directo.
    let k = 0;
    while (k < group.length) {
      let m = k;
      const score = scores.get(norm(group[k].alias)) ?? 0;
      while (m + 1 < group.length && (scores.get(norm(group[m + 1].alias)) ?? 0) === score) m++;
      const tied = m > k;
      for (let n = k; n <= m; n++) {
        result.push({ ...group[n], posicion: i + k + 1, empatado: tied });
      }
      k = m + 1;
    }
    i = j + 1;
  }
  return result;
}

/** Victorias de cada MC del grupo contra otros miembros del mismo grupo. */
function headToHeadScores(group: RankingItem[], battles: Battle[]): Map<string, number> {
  const scores = new Map<string, number>();
  if (group.length < 2) return scores;
  const names = new Set(group.map((g) => norm(g.alias)));
  for (const b of battles) {
    if (b.estado === "oculta" || !b.ganador || !b.perdedor) continue;
    const w = norm(b.ganador);
    const l = norm(b.perdedor);
    if (w !== l && names.has(w) && names.has(l)) scores.set(w, (scores.get(w) ?? 0) + 1);
  }
  return scores;
}
