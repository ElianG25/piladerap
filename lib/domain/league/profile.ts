import type { Battle } from "./types";
import { battlePoints, isReplica } from "./scoring";
import { roundRank } from "./rounds";

const norm = (s: string) => s.trim().toLowerCase();

export type McBattleResult = {
  battle: Battle;
  rival: string;
  won: boolean;
  replica: boolean;
  puntos: number;
};

/** Batallas de un MC (1 vs 1 con ganador definido), de la fecha más reciente a la más vieja. */
export function getMcBattles(battles: Battle[], alias: string): McBattleResult[] {
  const me = norm(alias);
  const out: McBattleResult[] = [];
  for (const battle of battles) {
    if (battle.estado === "oculta" || !battle.ganador || !battle.perdedor) continue;
    const won = norm(battle.ganador) === me;
    const lost = norm(battle.perdedor) === me;
    if (!won && !lost) continue;
    out.push({
      battle,
      rival: won ? battle.perdedor : battle.ganador,
      won,
      replica: isReplica(battle.tipoResultado),
      puntos: battlePoints(battle.tipoResultado, won),
    });
  }
  return out.sort((a, b) => {
    if (a.battle.eventId !== b.battle.eventId) return b.battle.eventId.localeCompare(a.battle.eventId);
    return roundRank(b.battle.ronda) - roundRank(a.battle.ronda);
  });
}

export function summarizeMcBattles(results: McBattleResult[]) {
  return results.reduce(
    (acc, r) => ({
      puntos: acc.puntos + r.puntos,
      victorias: acc.victorias + (r.won ? 1 : 0),
      derrotas: acc.derrotas + (r.won ? 0 : 1),
      replicas: acc.replicas + (r.replica ? 1 : 0),
    }),
    { puntos: 0, victorias: 0, derrotas: 0, replicas: 0 }
  );
}
