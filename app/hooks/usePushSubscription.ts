"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { syncFollowsToServer } from "@/app/lib/followsClient";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushSupportStatus = "unsupported" | "ios_needs_install" | "ready";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function isIOS(): boolean {
  return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Soporte + iOS/standalone dependen solo de "display-mode", así que basta suscribirse a esa media query. */
function subscribeSupport(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSupportSnapshot(): PushSupportStatus {
  if (typeof window === "undefined") return "unsupported";

  // En iOS, Safari fuera de standalone ni siquiera expone `PushManager` en
  // `window` — hay que detectar este caso ANTES del chequeo de soporte
  // general, o nunca se llega a distinguirlo de "unsupported".
  if (isIOS() && !isStandaloneDisplay()) return "ios_needs_install";

  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  return supported ? "ready" : "unsupported";
}

// No hay evento nativo de "cambió el permiso"; el valor se re-lee en cada
// render (useSyncExternalStore llama a getSnapshot siempre), así que alcanza
// con forzar un render después de pedir permiso (ya lo hacemos vía setBusy).
function subscribeNoop() {
  return () => {};
}

function getPermissionSnapshot(): NotificationPermission {
  return typeof Notification !== "undefined" ? Notification.permission : "default";
}

/**
 * Maneja el ciclo de vida de la suscripción push del navegador: soporte,
 * permiso, estado de suscripción, y las acciones de activar/desactivar.
 * En iOS, el push solo funciona con la PWA agregada a la pantalla de
 * inicio — `status` distingue ese caso para que la UI muestre instrucciones
 * en vez de un botón que fallaría en silencio.
 */
export function usePushSubscription() {
  const status = useSyncExternalStore(subscribeSupport, getSupportSnapshot, () => "unsupported" as const);
  const permission = useSyncExternalStore(subscribeNoop, getPermissionSnapshot, () => "default" as const);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "ready") return;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setIsSubscribed(Boolean(subscription)))
      .catch(() => {});
  }, [status]);

  const subscribe = useCallback(async () => {
    if (status !== "ready" || !VAPID_PUBLIC_KEY) return;
    setBusy(true);
    setError("");
    try {
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      // Si ya seguía a algún MC antes de activar los avisos, se le cuenta al servidor ahora
      void syncFollowsToServer();

      setIsSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar las notificaciones");
    } finally {
      setBusy(false);
    }
  }, [status]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar las notificaciones");
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, permission, isSubscribed, busy, error, subscribe, unsubscribe };
}
