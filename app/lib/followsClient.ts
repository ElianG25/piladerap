"use client";

/** Aviso a los demás componentes de que cambió la lista de MCs que sigo. */
export const FOLLOWS_EVENT = "pdr-follows-change";
const KEY = "pdr-follows";
export const MAX_FOLLOWS = 5;

const EMPTY: string[] = [];
let cache: { raw: string | null; list: string[] } = { raw: null, list: EMPTY };

/** MCs que sigue esta persona (se guardan en el teléfono, no en un servidor). */
export function readFollows(): string[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.list;
  let list = EMPTY;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) list = parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_FOLLOWS);
  } catch { /* lista dañada: se ignora */ }
  cache = { raw, list };
  return list;
}

export function writeFollows(list: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_FOLLOWS)));
  } catch { /* sin almacenamiento: no se guarda */ }
  window.dispatchEvent(new Event(FOLLOWS_EVENT));
  void syncFollowsToServer(list);
}

export function subscribeFollows(callback: () => void) {
  window.addEventListener(FOLLOWS_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(FOLLOWS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Si el navegador ya tiene avisos activados, le dice al servidor a qué MCs
 * sigue para mandarle solo sus novedades. Sin avisos activados no hace nada
 * (la lista local igual resalta a esos MCs en la tabla).
 */
export async function syncFollowsToServer(list: string[] = readFollows()): Promise<void> {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await fetch("/api/push/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint, aliases: list }),
    });
  } catch { /* es un extra: si falla, la lista local sigue funcionando */ }
}
