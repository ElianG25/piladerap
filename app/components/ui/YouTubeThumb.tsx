"use client";

import { useState } from "react";
import { youtubeThumbSources } from "@/lib/shared/youtube";

type YouTubeThumbProps = {
  id: string;
  alt: string;
  className?: string;
  /** Prioridad de carga: solo para la imagen principal sobre el pliegue. */
  eager?: boolean;
};

/**
 * Portada de un video de la liga. Si la máxima resolución no existe para ese
 * video, cae sola a la siguiente. Es una foto real de la plaza: no se filtra.
 */
export function YouTubeThumb({ id, alt, className, eager = false }: YouTubeThumbProps) {
  const sources = youtubeThumbSources(id);
  const [index, setIndex] = useState(0);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- portada remota de YouTube, ya viene optimizada
    <img
      src={sources[index]}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setIndex((i) => Math.min(i + 1, sources.length - 1))}
      className={className}
    />
  );
}
