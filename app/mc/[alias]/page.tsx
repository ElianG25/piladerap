import type { Metadata } from "next";
import HomeClient from "@/app/HomeClient";

type Props = { params: Promise<{ alias: string }> };

function readAlias(raw: string): string {
  try {
    return decodeURIComponent(raw).slice(0, 40);
  } catch {
    return "";
  }
}

/**
 * Enlace para compartir la ficha de un MC (`/mc/Reimy`): al pegarlo en
 * WhatsApp o redes sale su tarjeta. La web que se abre es la misma de
 * siempre, con la ficha ya abierta.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const alias = readAlias((await params).alias);
  if (!alias) return {};
  const image = `/api/og?mc=${encodeURIComponent(alias)}`;
  return {
    title: alias,
    description: `${alias} en Pila de Ra': puntos, batallas y videos.`,
    openGraph: { title: `${alias} · Pila de Ra'`, description: "Puntos, batallas y videos de la liga.", images: [{ url: image, width: 800, height: 420 }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default function McPage() {
  return <HomeClient />;
}
