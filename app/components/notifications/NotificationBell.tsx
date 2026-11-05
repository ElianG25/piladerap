"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePushSubscription } from "@/app/hooks/usePushSubscription";
import { BellIcon } from "@/app/components/ui/icons";

const bellBase =
  "flex h-11 w-11 items-center justify-center border-2 transition-colors disabled:opacity-50";

/** Campana de la barra superior: activa/desactiva las notificaciones push. En iOS sin instalar, explica cómo instalarla. */
export function NotificationBell() {
  const { status, isSubscribed, busy, subscribe, unsubscribe } = usePushSubscription();
  const [showIosHint, setShowIosHint] = useState(false);

  if (status === "unsupported") return null;

  if (status === "ios_needs_install") {
    return (
      <div className="relative">
        <button
          type="button" onClick={() => setShowIosHint((v) => !v)}
          aria-label="Cómo activar notificaciones en iPhone" aria-expanded={showIosHint}
          className={`${bellBase} border-paper/40 text-paper hover:border-pila hover:text-pila`}
        >
          <BellIcon />
        </button>
        <AnimatePresence>
          {showIosHint && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute right-0 top-12 z-50 w-64 border-2 border-pila bg-ink p-4 text-sm text-paper"
            >
              <p className="mb-1 font-bold text-pila">Activa las notificaciones</p>
              <p>En iPhone: toca <strong>Compartir</strong> → <strong>Agregar a inicio</strong>, y abre la app desde ahí para poder activarlas.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      type="button" onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
      disabled={busy} aria-pressed={isSubscribed}
      aria-label={isSubscribed ? "Desactivar notificaciones" : "Activar notificaciones"}
      title={isSubscribed ? "Notificaciones activadas" : "Activar notificaciones"}
      className={`${bellBase} ${isSubscribed ? "border-pila bg-pila text-ink" : "border-paper/40 text-paper hover:border-pila hover:text-pila"}`}
    >
      <BellIcon filled={isSubscribed} />
    </button>
  );
}
