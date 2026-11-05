import type { Battle } from "./types";

const norm = (s: string) => s.trim().toLowerCase();

export type Rival = { alias: string; veces: number; ganadas: number; perdidas: number };

/** Con quién se ha cruzado un MC (batallas con resultado), de más a menos veces. */
export function getRivals(battles: Battle[], alias: string): Rival[] {
  const me = norm(alias);
  const map = new Map<string, Rival>();
  for (const b of battles) {
    if (b.estado === "oculta" || !b.ganador || !b.perdedor) continue;
    const won = norm(b.ganador) === me;
    const lost = norm(b.perdedor) === me;
    if (!won && !lost) continue;
    const rival = won ? b.perdedor : b.ganador;
    const k = norm(rival);
    const cur = map.get(k) ?? { alias: rival, veces: 0, ganadas: 0, perdidas: 0 };
    cur.veces++;
    if (won) cur.ganadas++;
    else cur.perdidas++;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => b.veces - a.veces || a.alias.localeCompare(b.alias));
}

/** Las batallas que tuvieron dos MCs entre sí. */
export function getHeadToHead(battles: Battle[], a: string, b: string): Battle[] {
  const x = norm(a);
  const y = norm(b);
  if (x === y) return [];
  return battles.filter((bt) => {
    if (bt.estado === "oculta" || !bt.ganador || !bt.perdedor) return false;
    const pair = [norm(bt.ganador), norm(bt.perdedor)];
    return pair.includes(x) && pair.includes(y);
  });
}
