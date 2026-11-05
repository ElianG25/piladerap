"use client";

import { useState } from "react";
import { MC_PHOTO_SLUGS } from "@/lib/generated/mcPhotos";
import { initials } from "@/lib/shared/format";
import { mcSlug } from "@/lib/domain/league/mcPhoto";

type McPhotoProps = {
  alias: string;
  /** Lado del cuadrado, en px. */
  size: number;
  className?: string;
};

/**
 * Foto de un MC si hay una en /public/mcs (ya reducida a ~400 px por
 * `npm run fotos`, así que pesa poco); si no, sus iniciales sobre tinta. Solo
 * se pide cuando se abre la ficha, no al cargar la tabla.
 */
export function McPhoto({ alias, size, className = "" }: McPhotoProps) {
  const slug = mcSlug(alias);
  const [failed, setFailed] = useState(false);
  const has = !failed && MC_PHOTO_SLUGS.includes(slug);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-ink-2 ${className}`}
      style={{ width: size, height: size }}
    >
      {has ? (
        // eslint-disable-next-line @next/next/no-img-element -- ya viene reducida por el script de fotos
        <img
          src={`/mcs/${slug}.jpg`}
          alt={`Foto de ${alias}`}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden className="display text-pila" style={{ fontSize: size * 0.42 }}>{initials(alias)}</span>
      )}
    </span>
  );
}
