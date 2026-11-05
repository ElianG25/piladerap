import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pantalla",
  robots: { index: false, follow: false },
};

export default function PantallaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
