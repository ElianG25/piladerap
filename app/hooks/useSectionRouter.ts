"use client";

import { useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { isSectionEnabled } from "@/lib/domain/league/rules";

export type Section = "inicio" | "ranking" | "fechas" | "batallas" | "inscripcion";

export const SECTIONS: { id: Section; label: string }[] = [
  { id: "inicio",      label: "Inicio"   },
  { id: "ranking",     label: "Ranking"  },
  { id: "fechas",      label: "Fechas"   },
  { id: "batallas",    label: "Batallas" },
  { id: "inscripcion", label: "Unirse"   },
];

const ALL_SECTION_IDS: Section[] = SECTIONS.map((s) => s.id);

/** Qué flag de la hoja Config apaga cada sección (además de "inicio"/"inscripcion", siempre visibles). */
const SECTION_CONFIG_FLAG: Partial<Record<Section, string>> = {
  ranking: "showRanking",
  fechas: "showEvents",
  batallas: "showBattles",
};

function getVisibleSections(config: Record<string, string> | undefined) {
  return SECTIONS.filter((s) => {
    const flag = SECTION_CONFIG_FLAG[s.id];
    return !flag || isSectionEnabled(config, flag);
  });
}

/** Lee la sección inicial desde la URL: ?s=ranking */
function getInitialSection(): Section {
  if (typeof window === "undefined") return "inicio";
  if (window.location.pathname.startsWith("/fecha/")) return "fechas";
  const s = new URLSearchParams(window.location.search).get("s");
  return (ALL_SECTION_IDS.includes(s as Section) ? s : "inicio") as Section;
}

/**
 * Encapsula la navegación entre secciones de la home: estado activo, qué
 * secciones están visibles según Config, sincronización con la URL,
 * dirección de la transición y gestos de swipe.
 */
export function useSectionRouter(config: Record<string, string> | undefined, isReady: boolean) {
  const [section, setSection] = useState<Section>(getInitialSection);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);

  const visibleSections = useMemo(() => getVisibleSections(config), [config]);
  const visibleIdsKey = visibleSections.map((s) => s.id).join(",");

  // Si la sección activa quedó deshabilitada por Config (o venía de un ?s= viejo), vuelve a
  // inicio. Se ajusta durante el render (no en un efecto aparte) para no disparar un render
  // en cascada — ver https://react.dev/learn/you-might-not-need-an-effect.
  const [checkedIdsKey, setCheckedIdsKey] = useState<string | null>(null);
  if (isReady && checkedIdsKey !== visibleIdsKey) {
    setCheckedIdsKey(visibleIdsKey);
    if (!visibleSections.some((s) => s.id === section)) {
      setSection("inicio");
    }
  }

  function navigate(to: Section) {
    const order = visibleSections.map((s) => s.id);
    const fromIdx = order.indexOf(section);
    const toIdx = order.indexOf(to);
    setDirection(toIdx >= fromIdx ? 1 : -1);
    setSection(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const url = to === "inicio" ? "/" : `/?s=${to}`;
    window.history.replaceState(null, "", url);
  }

  function navigateDir(dir: 1 | -1) {
    const order = visibleSections.map((s) => s.id);
    const cur = order.indexOf(section);
    const next = cur + dir;
    if (next >= 0 && next < order.length) navigate(order[next]);
  }

  function onTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 55) navigateDir(diff > 0 ? 1 : -1);
  }

  const activeIndex = visibleSections.findIndex((s) => s.id === section);

  return { section, visibleSections, activeIndex, direction, navigate, navigateDir, onTouchStart, onTouchEnd };
}
