import { saveSubscription, removeSubscription, hasSubscription, setFollows } from "@/lib/infrastructure/push/subscriptionStore";
import { sanitizeFollowAliases } from "@/lib/domain/notifications/audience";
import type { PushSubscriptionData } from "@/lib/domain/notifications/types";

export async function subscribeToPush(subscription: PushSubscriptionData): Promise<void> {
  await saveSubscription(subscription);
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  await removeSubscription(endpoint);
}

/** Guarda a qué MCs sigue una suscripción. Devuelve false si esa suscripción no existe (no se aceptan datos de endpoints ajenos). */
export async function followMcs(endpoint: string, aliases: unknown): Promise<boolean> {
  if (!(await hasSubscription(endpoint))) return false;
  await setFollows(endpoint, sanitizeFollowAliases(aliases));
  return true;
}
