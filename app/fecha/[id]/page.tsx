import type { Metadata } from "next";
import HomeClient from "@/app/HomeClient";

type Props = { params: Promise<{ id: string }> };

/** Enlace compartible de una fecha (`/fecha/fecha-4`): sale con la tarjeta de esa fecha y abre la sección Fechas. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let id = "";
  try { id = decodeURIComponent((await params).id).slice(0, 60); } catch { return {}; }
  if (!id) return {};
  const image = `/api/og?fecha=${encodeURIComponent(id)}`;
  return {
    title: "Fecha de la liga",
    openGraph: { title: "Pila de Ra'", description: "Resultados y fotos de la fecha.", images: [{ url: image, width: 800, height: 420 }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default function FechaPage() {
  return <HomeClient />;
}
