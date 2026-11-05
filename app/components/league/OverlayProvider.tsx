"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Battle, LeagueEvent, RankedItem } from "@/lib/domain/league/types";
import type { Movement } from "@/lib/domain/league/standings";
import { getYouTubeId } from "@/lib/shared/youtube";
import { McProfileSheet } from "./McProfileSheet";
import { VideoModal, type PlayPayload } from "./VideoModal";

type OverlayContextValue = {
  openMc: (alias: string) => void;
  openVideo: (video: NonNullable<PlayPayload>) => void;
};

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlays(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlays debe usarse dentro de <OverlayProvider>");
  return ctx;
}

const norm = (s: string) => s.trim().toLowerCase();

/** Pone o quita un parámetro de la URL sin recargar, para que la ficha o el video se puedan compartir. */
function setUrlParam(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(null, "", url);
}

function readParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

/** El MC a abrir al entrar: ?mc=Reimy o la ruta compartible /mc/Reimy. */
function readInitialMc(): string | null {
  const fromQuery = readParam("mc");
  if (fromQuery) return fromQuery;
  const m = typeof window !== "undefined" ? window.location.pathname.match(/^\/mc\/([^/]+)/) : null;
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return null; }
}

function videoFromBattle(b: Battle | undefined): PlayPayload {
  const id = b ? getYouTubeId(b.youtubeUrl) : null;
  if (!b || !id) return null;
  const players = [b.mc1, b.mc2, b.mc3, b.mc4].filter(Boolean).join(" vs ");
  return { id, title: `${players} · ${b.ronda}`, url: b.youtubeUrl, battleId: b.battleId };
}

type OverlayProviderProps = {
  ranking: RankedItem[];
  battles: Battle[];
  events: LeagueEvent[];
  movement: Map<string, Movement>;
  children: ReactNode;
};

/**
 * Un solo lugar para la ficha de MC y el reproductor de video: cualquier
 * parte de la web los abre con `useOverlays()`, y los enlaces
 * `?mc=Reimy` / `?batalla=f4-b15` los abren directo al entrar.
 */
export function OverlayProvider({ ranking, battles, events, movement, children }: OverlayProviderProps) {
  const [mcAlias, setMcAlias] = useState<string | null>(readInitialMc);
  const [video, setVideo] = useState<PlayPayload>(() => {
    const id = readParam("batalla");
    return id ? videoFromBattle(battles.find((b) => b.battleId === id)) : null;
  });

  const openMc = useCallback((alias: string) => {
    setMcAlias(alias);
    setUrlParam("mc", alias);
  }, []);
  const closeMc = useCallback(() => {
    setMcAlias(null);
    // Si se entró por /mc/NOMBRE, al cerrar la ficha la URL vuelve a la home
    if (window.location.pathname.startsWith("/mc/")) window.history.replaceState(null, "", "/");
    else setUrlParam("mc", null);
  }, []);
  const openVideo = useCallback((v: NonNullable<PlayPayload>) => {
    setVideo(v);
    setUrlParam("batalla", v.battleId ?? null);
  }, []);
  const closeVideo = useCallback(() => {
    setVideo(null);
    setUrlParam("batalla", null);
  }, []);

  const mc = useMemo(() => (mcAlias ? ranking.find((r) => norm(r.alias) === norm(mcAlias)) ?? null : null), [mcAlias, ranking]);
  const value = useMemo(() => ({ openMc, openVideo }), [openMc, openVideo]);

  return (
    <OverlayContext.Provider value={value}>
      {children}
      <McProfileSheet
        mc={mc}
        battles={battles}
        events={events}
        movement={mc ? movement.get(norm(mc.alias)) ?? null : null}
        onClose={closeMc}
        onPlay={openVideo}
      />
      <VideoModal video={video} onClose={closeVideo} />
    </OverlayContext.Provider>
  );
}
