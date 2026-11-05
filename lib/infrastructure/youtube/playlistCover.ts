const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const TTL_MS = 6 * 60 * 60 * 1000;
// El og:image viene ~850 KB adentro de la página de YouTube; se corta apenas aparece.
const MAX_BYTES = 1_600_000;

const cache = new Map<string, { url: string | null; at: number }>();

/** ID de una playlist a partir de su URL (`...playlist?list=PLxxxx&si=...`). */
export function playlistIdFromUrl(url: string): string | null {
  try {
    return new URL(url).searchParams.get("list");
  } catch {
    return null;
  }
}

/** Saca la imagen de portada (og:image) del HTML de la playlist, solo si viene de YouTube. */
export function extractOgImage(html: string): string | null {
  const m = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!m) return null;
  const url = m[1].replace(/&amp;/g, "&");
  try {
    return new URL(url).hostname.endsWith("ytimg.com") ? url : null;
  } catch {
    return null;
  }
}

/**
 * Portada personalizada de una playlist (la foto grupal que sube la liga).
 * YouTube la firma y no tiene API pública sin llave, así que se lee del
 * og:image de la página; se lee en streaming y se corta apenas aparece.
 * Cache en memoria por 6 h; si falla, devuelve null y la web usa otra foto.
 */
export async function fetchPlaylistCover(playlistUrl: string): Promise<string | null> {
  const id = playlistIdFromUrl(playlistUrl);
  if (!id) return null;

  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.url;

  let url: string | null = null;
  try {
    const res = await fetch(`https://www.youtube.com/playlist?list=${encodeURIComponent(id)}`, {
      headers: { "User-Agent": UA, "Accept-Language": "es" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let html = "";
      let bytes = 0;
      while (bytes < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        html += decoder.decode(value, { stream: true });
        url = extractOgImage(html);
        if (url) break;
      }
      await reader.cancel().catch(() => {});
    }
  } catch {
    url = null;
  }
  cache.set(id, { url, at: Date.now() });
  return url;
}
