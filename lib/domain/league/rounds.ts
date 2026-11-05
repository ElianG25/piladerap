import type { Battle } from "./types";

const ORDER = ["octavos", "cuartos", "semifinal", "final", "tercer puesto"];

/** Posición de una ronda dentro de la fecha (Octavos primero, Tercer puesto último). */
export function roundRank(ronda: string): number {
  const idx = ORDER.indexOf(ronda.trim().toLowerCase());
  return idx === -1 ? ORDER.length : idx;
}

/** Agrupa las batallas de una fecha por ronda, en el orden en que se juegan. */
export function groupByRound(battles: Battle[]): { ronda: string; battles: Battle[] }[] {
  const map = new Map<string, Battle[]>();
  for (const b of battles) {
    const key = b.ronda || "Sin ronda";
    map.set(key, [...(map.get(key) ?? []), b]);
  }
  return [...map.entries()]
    .map(([ronda, list]) => ({ ronda, battles: list.sort((a, b) => a.orden - b.orden) }))
    .sort((a, b) => roundRank(a.ronda) - roundRank(b.ronda));
}

/** La Final de una fecha (no confundir con la semifinal). */
export function getFinalBattle(battles: Battle[], eventId: string): Battle | null {
  return (
    battles.find(
      (b) => b.eventId === eventId && b.estado !== "oculta" && b.ronda.trim().toLowerCase() === "final"
    ) ?? null
  );
}

type Round = { ronda: string; battles: Battle[] };

const norm = (s: string) => s.trim().toLowerCase();
const playersOf = (b: Battle) => [b.mc1, b.mc2, b.mc3, b.mc4].filter(Boolean);

/**
 * Ordena las batallas de cada ronda para que cuadren como llaves: la batalla
 * en la posición i de una ronda es la que alimenta a la i/2 de la siguiente.
 * No confía en la columna `orden` de la hoja: parte de la Final y, hacia
 * atrás, ubica para cada MC la batalla de la ronda anterior donde peleó.
 *
 * `problems` lista lo que no cuadra (un MC que aparece en una ronda sin haber
 * peleado en la anterior, o una batalla que no alimenta a nadie); si no está
 * vacía, las llaves no se pueden dibujar con líneas confiables.
 */
export function orderBracketRounds(rounds: Round[]): { rounds: Round[]; problems: string[] } {
  const out = rounds.map((r) => ({ ...r, battles: [...r.battles] }));
  const problems: string[] = [];

  for (let k = out.length - 1; k >= 1; k--) {
    const later = out[k];
    const prev = out[k - 1];
    const used = new Set<Battle>();
    const ordered: Battle[] = [];

    for (const b of later.battles) {
      for (const p of [b.mc1, b.mc2].filter(Boolean)) {
        const feeder = prev.battles.find((x) => !used.has(x) && playersOf(x).some((n) => norm(n) === norm(p)));
        if (feeder) {
          used.add(feeder);
          ordered.push(feeder);
        } else {
          problems.push(`${later.ronda}: ${p} no peleó en ${prev.ronda}.`);
        }
      }
    }
    for (const x of prev.battles) {
      if (!used.has(x)) {
        ordered.push(x);
        problems.push(`${prev.ronda}: ${playersOf(x).join(" vs ")} no alimenta ninguna batalla de ${later.ronda}.`);
      }
    }
    prev.battles = ordered;
  }

  return { rounds: out, problems };
}
