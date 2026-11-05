"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const QUERIES = ["(min-width: 768px)", "(prefers-reduced-motion: no-preference)"];
type Connection = { saveData?: boolean; effectiveType?: string };

/** Solo dispositivos que lo aguantan: pantalla grande, sin "reducir movimiento", sin ahorro de datos ni red lenta. */
function canPlayBackgroundVideo(): boolean {
  if (!QUERIES.every((q) => window.matchMedia(q).matches)) return false;
  const conn = (navigator as Navigator & { connection?: Connection }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && ["slow-2g", "2g", "3g"].includes(conn.effectiveType)) return false;
  return true;
}

function subscribe(callback: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", callback));
  return () => lists.forEach((l) => l.removeEventListener("change", callback));
}

function Frame({ id }: { id: string }) {
  const [ready, setReady] = useState(false);
  return (
    <iframe
      title="Video de fondo de la liga"
      tabIndex={-1}
      src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3`}
      allow="autoplay; encrypted-media"
      onLoad={() => setReady(true)}
      className={`absolute inset-0 h-full w-full scale-[1.4] transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}

/**
 * Video de fondo de la portada (el de la configuración de la liga), pensado
 * para no cargar la web: solo en dispositivos capaces, recién cuando la
 * página terminó de cargar, y se desmonta por completo cuando sale de
 * pantalla o la pestaña queda oculta (deja de descargar y de reproducir).
 */
export function HeroVideo({ id }: { id: string }) {
  const capable = useSyncExternalStore(subscribe, canPlayBackgroundVideo, () => false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    if (!capable) return;
    const timer = setTimeout(() => setArmed(true), 2500);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (boxRef.current) observer.observe(boxRef.current);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, [capable]);

  return (
    <div ref={boxRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {capable && armed && inView && tabVisible && <Frame id={id} />}
    </div>
  );
}
