import { Redis } from "@upstash/redis";
import type { PushSubscriptionData } from "@/lib/domain/notifications/types";
import type { LeaguePayload } from "@/lib/domain/league/types";

const SUBSCRIPTIONS_KEY = "push:subscriptions";
const FOLLOWS_KEY = "push:follows";
const SNAPSHOT_KEY = "push:last-league-snapshot";
const REMINDED_PREFIX = "push:reminded:";
const REMINDED_TTL_SECONDS = 60 * 60 * 24 * 2;

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

export async function saveSubscription(subscription: PushSubscriptionData): Promise<void> {
  await getRedis().hset(SUBSCRIPTIONS_KEY, { [subscription.endpoint]: subscription });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await getRedis().hdel(SUBSCRIPTIONS_KEY, endpoint);
  await getRedis().hdel(FOLLOWS_KEY, endpoint);
}

export async function hasSubscription(endpoint: string): Promise<boolean> {
  return (await getRedis().hexists(SUBSCRIPTIONS_KEY, endpoint)) === 1;
}

/** MCs que sigue una suscripción (alias en minúsculas). Lista vacía = deja de seguir a todos. */
export async function setFollows(endpoint: string, aliases: string[]): Promise<void> {
  if (aliases.length === 0) await getRedis().hdel(FOLLOWS_KEY, endpoint);
  else await getRedis().hset(FOLLOWS_KEY, { [endpoint]: aliases });
}

export async function getAllFollows(): Promise<Record<string, string[]>> {
  const all = await getRedis().hgetall<Record<string, unknown>>(FOLLOWS_KEY);
  const out: Record<string, string[]> = {};
  for (const [endpoint, raw] of Object.entries(all ?? {})) {
    let value = raw;
    if (typeof value === "string") {
      try { value = JSON.parse(value); } catch { continue; }
    }
    if (Array.isArray(value)) out[endpoint] = value.filter((v): v is string => typeof v === "string");
  }
  return out;
}

function isPushSubscriptionData(value: unknown): value is PushSubscriptionData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.endpoint === "string" && typeof v.keys === "object" && v.keys !== null;
}

export async function getAllSubscriptions(): Promise<PushSubscriptionData[]> {
  const all = await getRedis().hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
  if (!all) return [];
  return Object.values(all)
    .map((raw) => {
      // El cliente de Redis deserializa JSON automáticamente al leer, así que
      // `raw` normalmente ya es un objeto — pero se tolera el caso de que
      // llegue como string (p. ej. datos guardados por una versión anterior).
      if (typeof raw === "string") {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      return raw;
    })
    .filter(isPushSubscriptionData);
}

export async function getLastSnapshot(): Promise<LeaguePayload | null> {
  const snapshot = await getRedis().get<LeaguePayload>(SNAPSHOT_KEY);
  return snapshot ?? null;
}

export async function saveSnapshot(snapshot: LeaguePayload): Promise<void> {
  await getRedis().set(SNAPSHOT_KEY, snapshot);
}

function reminderKey(eventId: string, now: Date): string {
  return `${REMINDED_PREFIX}${eventId}:${now.toISOString().slice(0, 10)}`;
}

export async function hasBeenRemindedToday(eventId: string, now: Date): Promise<boolean> {
  const value = await getRedis().get(reminderKey(eventId, now));
  return value != null;
}

export async function markRemindedToday(eventId: string, now: Date): Promise<void> {
  await getRedis().set(reminderKey(eventId, now), "1", { ex: REMINDED_TTL_SECONDS });
}
