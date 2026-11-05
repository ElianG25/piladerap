"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, CloseIcon, ShareIcon } from "@/app/components/ui/icons";
import { useModalLayer } from "@/app/hooks/useModalLayer";

export type PlayPayload = { id: string; title: string; url: string } | null;

type VideoModalProps = { video: PlayPayload; onClose: () => void };

/** Reproductor embebido de una batalla, con opciones para compartirla. */
export function VideoModal({ video, onClose }: VideoModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useModalLayer(Boolean(video), panelRef, onClose, closeRef);

  async function share() {
    if (!video) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: video.title, text: `Mira esta batalla: ${video.title}`, url: video.url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(video.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* sin portapapeles: los enlaces de WhatsApp y Telegram siguen disponibles */ }
  }

  const waText = video ? encodeURIComponent(`Mira esta batalla: ${video.title} ${video.url}`) : "";
  const tgUrl = video ? encodeURIComponent(video.url) : "";
  const tgText = video ? encodeURIComponent(`Mira esta batalla: ${video.title}`) : "";

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          className="on-ink fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-3 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} role="dialog" aria-modal="true" aria-label={video.title}
        >
          <motion.div
            ref={panelRef}
            className="w-full max-w-3xl"
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="display truncate text-2xl text-paper sm:text-3xl">{video.title}</p>
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar video"
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-pila text-ink transition hover:bg-paper">
                <CloseIcon />
              </button>
            </div>

            <div className="relative aspect-video bg-black">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={video.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={share}
                className="flex min-h-11 items-center gap-2 border-2 border-paper px-4 text-sm font-bold uppercase tracking-wide text-paper transition hover:bg-paper hover:text-ink">
                {copied ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
                {copied ? "Enlace copiado" : "Compartir"}
              </button>
              <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer"
                className="flex min-h-11 items-center border-2 border-paper/40 px-4 text-sm font-bold uppercase tracking-wide text-paper transition hover:border-paper">
                WhatsApp
              </a>
              <a href={`https://t.me/share/url?url=${tgUrl}&text=${tgText}`} target="_blank" rel="noreferrer"
                className="flex min-h-11 items-center border-2 border-paper/40 px-4 text-sm font-bold uppercase tracking-wide text-paper transition hover:border-paper">
                Telegram
              </a>
              <a href={video.url} target="_blank" rel="noreferrer"
                className="ml-auto flex min-h-11 items-center px-2 text-sm font-semibold text-muted-ink underline decoration-2 underline-offset-4 transition hover:text-paper">
                Abrir en YouTube
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
