/** ID de un video de YouTube a partir de una URL (watch, youtu.be, embed, shorts). */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&\s/]+)/);
  return m?.[1] ?? null;
}

/** Portadas en orden de preferencia: máxima resolución primero, 16:9 sin barras negras. */
export function youtubeThumbSources(id: string): string[] {
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  ];
}

/** Solo URLs http(s) reales — evita enlaces rotos cuando la hoja trae texto suelto. */
export function asHttpUrl(value: string | undefined | null): string | null {
  return value && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}
