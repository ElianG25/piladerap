/**
 * Reglas de puntos de la liga:
 *   victoria directa 3 · victoria con réplica 2 · derrota con réplica 1 · derrota directa 0.
 * Tercer puesto: no da esos puntos; el que gana recibe 1 punto extra y el otro 0. Esa batalla
 * tampoco cuenta como victoria, derrota ni réplica en el récord.
 * (El jurado ya no suma puntos: cada uno puntuaba con criterio distinto.)
 */
export const SCORING_RULES = [
  { label: "Victoria directa", puntos: 3 },
  { label: "Victoria con réplica", puntos: 2 },
  { label: "Derrota con réplica", puntos: 1 },
  { label: "Derrota directa", puntos: 0 },
] as const;

/** Punto extra para quien gana el tercer puesto. */
export const THIRD_PLACE_BONUS = 1;

export function isReplica(tipoResultado: string): boolean {
  return /r[eé]plica/i.test(tipoResultado);
}

/** ¿Es la batalla por el tercer puesto? (cuenta distinto: ver arriba). */
export function isThirdPlace(ronda: string): boolean {
  return ronda.trim().toLowerCase() === "tercer puesto";
}

/** Puntos que saca un MC en una batalla. En el tercer puesto: 1 para el ganador, 0 para el otro. */
export function battlePoints(tipoResultado: string, won: boolean, ronda = ""): number {
  if (isThirdPlace(ronda)) return won ? THIRD_PLACE_BONUS : 0;
  if (isReplica(tipoResultado)) return won ? 2 : 1;
  return won ? 3 : 0;
}
