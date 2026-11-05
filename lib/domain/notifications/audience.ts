import type { NotificationEvent } from "./types";

const MAX_TARGETED = 3;

/**
 * Qué avisos le tocan a una suscripción: todos los generales, más los de los
 * MCs que sigue. Si en una sola pasada le salen demasiados de sus MCs (p. ej.
 * se cargó una fecha entera de golpe), se le manda un resumen en vez de una lluvia.
 */
export function selectForSubscription(notifications: NotificationEvent[], followed: string[]): NotificationEvent[] {
  const follows = new Set(followed.map((f) => f.trim().toLowerCase()));
  const general = notifications.filter((n) => !n.audience);
  const targeted = notifications.filter((n) => n.audience && n.audience.aliases.some((a) => follows.has(a)));

  if (targeted.length <= MAX_TARGETED) return [...general, ...targeted];
  const resumen: NotificationEvent = {
    kind: "mc_result",
    title: `📣 ${targeted.length} novedades de tus MCs`,
    body: "Hubo varios resultados de los MCs que sigues. Entra a ver cómo quedó todo.",
    url: "/?s=ranking",
  };
  return [...general, ...targeted.slice(0, MAX_TARGETED - 1), resumen];
}

/** Limpia la lista de MCs que manda un navegador: sin vacíos ni repetidos, con límites razonables. */
export function sanitizeFollowAliases(input: unknown, max = 5): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const alias = raw.trim().slice(0, 40);
    const key = alias.toLowerCase();
    if (!alias || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
    if (out.length >= max) break;
  }
  return out;
}
