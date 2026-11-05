/**
 * Reglas de puntos de la liga:
 *   victoria directa 3 · victoria con réplica 2 · derrota con réplica 1 · derrota directa 0.
 * (El jurado ya no suma puntos: cada uno puntuaba con criterio distinto.)
 */
export const SCORING_RULES = [
  { label: "Victoria directa", puntos: 3 },
  { label: "Victoria con réplica", puntos: 2 },
  { label: "Derrota con réplica", puntos: 1 },
  { label: "Derrota directa", puntos: 0 },
] as const;

export function isReplica(tipoResultado: string): boolean {
  return /r[eé]plica/i.test(tipoResultado);
}

export function battlePoints(tipoResultado: string, won: boolean): number {
  if (isReplica(tipoResultado)) return won ? 2 : 1;
  return won ? 3 : 0;
}
