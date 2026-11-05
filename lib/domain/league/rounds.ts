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
