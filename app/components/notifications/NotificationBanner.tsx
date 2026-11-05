"use client";

import { useSyncExternalStore } from "react";
import { usePushSubscription } from "@/app/hooks/usePushSubscription";
import { BellIcon, CloseIcon } from "@/app/components/ui/icons";
import { btnPila } from "@/app/components/ui/buttons";

const DISMISSED_KEY = "pdr-notif-banner-dismissed";
const DISMISS_EVENT = "pdr-notif-banner-dismiss";

function subscribeDismissed(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DISMISS_EVENT, callback);
  return () => window.removeEventListener(DISMISS_EVENT, callback);
}

function getDismissedSnapshot(): boolean {
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

function dismissBanner() {
  window.localStorage.setItem(DISMISSED_KEY, "1");
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

/**
 * Aviso cerrable que invita a activar notificaciones. En PC, Android y iOS
 * ya instalado muestra el botón directo; en iOS sin instalar (donde el botón
 * fallaría en silencio) muestra las instrucciones. No depende de que alguien
 * note la campana de la barra. Se oculta solo si ya está suscrito o lo cerró.
 */
export function NotificationBanner() {
  const { status, isSubscribed, busy, subscribe } = usePushSubscription();
  // En el server no sabemos si ya se cerró antes: arranca oculto hasta hidratar en el cliente.
  const dismissed = useSyncExternalStore(subscribeDismissed, getDismissedSnapshot, () => true);

  const needsIosInstall = status === "ios_needs_install";
  const canSubscribeDirectly = status === "ready" && !isSubscribed;
  if (!((needsIosInstall || canSubscribeDirectly) && !dismissed)) return null;

  return (
    <section aria-label="Notificaciones" className="on-ink flex flex-wrap items-center gap-3 bg-ink p-3 text-paper sm:flex-nowrap sm:gap-4 sm:p-4">
      <div className="flex min-w-0 basis-full items-start gap-3 sm:basis-0 sm:flex-1 sm:items-center">
        <BellIcon className="mt-0.5 h-6 w-6 shrink-0 text-pila sm:mt-0" />
        <div className="min-w-0">
          <p className="text-base font-bold">Que no se te pase nada de la plaza</p>
          <p className="mt-0.5 text-sm text-muted-ink">
            {needsIosInstall
              ? "En iPhone: toca Compartir → Agregar a inicio, y abre la app desde ahí para activar los avisos."
              : "Fechas nuevas, videos y cambios en el ranking, directo a tu teléfono."}
          </p>
        </div>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
        {!needsIosInstall && (
          <button type="button" onClick={subscribe} disabled={busy} className={btnPila}>
            {busy ? "…" : "Activar"}
          </button>
        )}
        <button type="button" onClick={dismissBanner} aria-label="Cerrar aviso"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-ink transition-colors hover:text-paper">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
