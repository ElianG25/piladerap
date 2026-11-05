import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/app/components/ServiceWorkerRegistration";

/* Anton: el rotulado amarillo condensado de las portadas de los videos.
   Archivo: lectura y cifras (tabulares) — legible a pleno sol en el teléfono. */
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://piladerap.vercel.app"),
  title: {
    default: "Pila de Ra' | Freestyle en RD",
    template: "%s | Pila de Ra'",
  },
  description: "Liga de freestyle de plazas en República Dominicana. Ranking, batallas y fechas.",
  openGraph: {
    title: "Pila de Ra'",
    description: "Vamo' a prender la plaza. Freestyle, barras y competencia real en RD.",
    url: "https://piladerap.vercel.app",
    siteName: "Pila de Ra'",
    images: [{ url: "https://piladerap.vercel.app/api/og", width: 1200, height: 630, alt: "Pila de Ra'" }],
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pila de Ra'",
    description: "Liga de freestyle de plazas en República Dominicana. Ranking, batallas y fechas.",
    images: ["https://piladerap.vercel.app/api/og"],
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Pila de Ra'" },
};

export const viewport: Viewport = {
  themeColor: "#101010",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${anton.variable} ${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
