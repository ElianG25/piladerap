import { ImageResponse } from "next/og";
import { getLeague } from "@/lib/application/league/getLeague";
import { buildShareHighlights } from "@/lib/application/league/buildShareHighlights";
import { youtubeThumbSources } from "@/lib/shared/youtube";
import { mcSlug } from "@/lib/domain/league/mcPhoto";
import { MC_PHOTO_SLUGS } from "@/lib/generated/mcPhotos";

export const runtime = "edge";
export const revalidate = 60;

/* El diseño se piensa en 1200×630 y se genera a 800×420: pesa ~40 % menos
   (WhatsApp no muestra la vista previa de imágenes muy pesadas) y sigue
   siendo nítido en los tamaños en que se ven estas tarjetas. */
const SCALE = 2 / 3;
const s = (n: number) => Math.round(n * SCALE);
const W = s(1200);
const H = s(630);
const PHOTO_W = s(560);
const SLAB_W = W - PHOTO_W;
const INK = "#101010";
const PILA = "#fdee0e";

/* ── Recursos remotos: si alguno falla, la imagen se arma sin él ─────── */

const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

/** TTF de Google Fonts (satori no lee woff2). Se pide con un User-Agent viejo para que responda truetype. */
function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      (async () => {
        try {
          const css = await (
            await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`, {
              headers: { "User-Agent": "Mozilla/5.0" },
            })
          ).text();
          const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
          return url ? await (await fetch(url)).arrayBuffer() : null;
        } catch {
          return null;
        }
      })()
    );
  }
  return fontCache.get(key)!;
}

function toDataUri(buf: ArrayBuffer, mime: string): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${mime};base64,${btoa(bin)}`;
}

async function loadImage(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("image/")) return toDataUri(await res.arrayBuffer(), type);
    } catch { /* prueba la siguiente */ }
  }
  return null;
}

/** La pila del logo, recortada de los márgenes del PNG (misma geometría que PilaMark en la web). */
function LogoMark({ src, height }: { src: string; height: number }) {
  return (
    <div style={{ display: "flex", position: "relative", overflow: "hidden", width: height * 0.527, height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={height * 0.939}
        height={height * 1.215}
        style={{ position: "absolute", left: -height * 0.2005, top: -height * 0.1288, width: height * 0.939, height: height * 1.215 }}
      />
    </div>
  );
}

/** Anton es angosta (~0.47em por letra): el tamaño se ajusta al ancho de la losa. */
function headlineSize(text: string): number {
  const inner = SLAB_W - 2 * s(36);
  return Math.max(s(56), Math.min(s(124), Math.floor(inner / (Math.max(text.length, 1) * 0.47))));
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const params = new URL(request.url).searchParams;
  const league = await getLeague(60).catch(() => null);
  const { headline, lead, detail, top3, photoVideoId, mcAlias } = buildShareHighlights(league, {
    mc: params.get("mc")?.slice(0, 40),
    view: params.get("view"),
    fecha: params.get("fecha")?.slice(0, 60),
  });
  // Si el MC tiene foto propia, esa va primero; si no, la foto de la última final
  const slug = mcAlias ? mcSlug(mcAlias) : null;
  const mcPhotoUrl = slug && MC_PHOTO_SLUGS.includes(slug) ? `${origin}/mcs/${slug}.jpg` : null;

  const [anton, archivo, logo, photo] = await Promise.all([
    loadGoogleFont("Anton", 400),
    loadGoogleFont("Archivo", 700),
    loadImage([`${origin}/logo.png`]),
    loadImage([...(mcPhotoUrl ? [mcPhotoUrl] : []), ...(photoVideoId ? youtubeThumbSources(photoVideoId) : [])]),
  ]);

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[] = [];
  if (anton) fonts.push({ name: "Anton", data: anton, weight: 400, style: "normal" });
  if (archivo) fonts.push({ name: "Archivo", data: archivo, weight: 700, style: "normal" });
  const display = anton ? "Anton" : "Arial";
  const text = archivo ? "Archivo" : "Arial";

  const title = headline.toUpperCase();

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", backgroundColor: PILA, fontFamily: text, color: INK }}>
        {/* Foto real de la final (o la pila grande si todavía no hay video) */}
        <div style={{ display: "flex", position: "relative", width: PHOTO_W, height: H, backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={PHOTO_W} height={H} style={{ width: PHOTO_W, height: H, objectFit: "cover", objectPosition: "50% 20%" }} />
          ) : logo ? (
            <LogoMark src={logo} height={s(300)} />
          ) : null}
        </div>

        {/* Losa amarilla: marca arriba, titular, y el Top 3 como marcador */}
        <div style={{ display: "flex", flexDirection: "column", width: SLAB_W, height: H }}>
          <div style={{ display: "flex", alignItems: "center", height: s(88), backgroundColor: INK, padding: `0 ${s(36)}px` }}>
            {logo ? <LogoMark src={logo} height={s(52)} /> : null}
            <div style={{ display: "flex", marginLeft: logo ? s(16) : 0, fontFamily: display, fontSize: s(44), color: PILA, letterSpacing: 1 }}>
              {"PILA DE RA'"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${s(26)}px ${s(36)}px ${s(28)}px` }}>
            <div style={{ display: "flex", fontFamily: display, fontSize: headlineSize(title), lineHeight: 0.95 }}>{title}</div>
            <div style={{ display: "flex", marginTop: s(14), fontSize: s(30) }}>{lead}</div>
            {detail ? <div style={{ display: "flex", marginTop: s(6), fontSize: s(22) }}>{detail}</div> : null}

            <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
              {top3.map((mc, i) => (
                <div
                  key={mc.alias}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `${Math.max(2, s(3))}px solid ${INK}`, padding: `${s(7)}px 0` }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", width: s(44), fontFamily: display, fontSize: s(34) }}>{i + 1}</div>
                    <div style={{ display: "flex", fontSize: s(26) }}>{mc.alias.toUpperCase()}</div>
                  </div>
                  <div style={{ display: "flex", fontFamily: display, fontSize: s(34) }}>{mc.puntos}</div>
                </div>
              ))}
              <div style={{ display: "flex", marginTop: s(8), fontSize: s(20), color: INK }}>piladerap.vercel.app</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts,
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    }
  );
}

