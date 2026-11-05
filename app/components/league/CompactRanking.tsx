"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RankingItem } from "@/lib/domain/league/types";
import { hasNoStatsYet, hasPendingResults } from "@/lib/domain/league/rules";
import { initials } from "@/lib/shared/format";

type CompactRankingProps = {
  ranking: RankingItem[];
  limit?: number;
  variant?: "compact" | "full";
};

const TOP3_BG   = ["bg-yellow-400/[0.09]", "bg-white/[0.03]",   "bg-orange-500/[0.05]"];
const TOP3_RING = ["border-yellow-400/30", "border-white/[0.09]","border-orange-400/25"];
const TOP3_NUM  = ["text-yellow-400",      "text-zinc-200",      "text-orange-300"];

function Avatar({ alias, size = 34, gold = false }: { alias: string; size?: number; gold?: boolean }) {
  return (
    <span
      className="mc-avatar shrink-0"
      style={{
        width: size, height: size,
        fontSize: size * 0.4,
        ...(gold ? { borderColor: "rgba(250,204,21,0.5)", color: "#fde68a" } : {}),
      }}
      aria-hidden
    >
      {initials(alias)}
    </span>
  );
}

/**
 * Insignia para RankingItem.estado === "campeon" — quien ganó la fecha más
 * reciente, independiente de su posición por puntos. Se muestra aparte del
 * podio (que ordena por puntosLiga) porque el campeón de una fecha nueva
 * suele arrancar en 0 puntos hasta que se cargan los resultados completos;
 * sin esta insignia, el estado "campeon" de la hoja no tenía ningún efecto
 * visible en la página.
 */
function ChampionBadge() {
  return (
    <span
      title="Campeón de la última fecha"
      className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-1.5 py-0.5 text-[8px] font-display font-bold uppercase leading-none text-yellow-300"
    >
      👑 Campeón
    </span>
  );
}

/** Para MCs recién agregados cuyas estadísticas todavía no se cargaron (ver hasNoStatsYet). */
function PendingBadge() {
  return (
    <span
      title="Sin resultados cargados todavía"
      className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[8px] font-display font-bold uppercase leading-none text-zinc-500"
    >
      Pendiente
    </span>
  );
}

function MovimientoIcon({ movimiento }: { movimiento: string }) {
  if (movimiento === "sube" || movimiento === "up")
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/15 px-1 py-0.5 text-[8px] font-black leading-none text-emerald-400">
        &#9650;
      </span>
    );
  if (movimiento === "baja" || movimiento === "down")
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-red-500/15 px-1 py-0.5 text-[8px] font-black leading-none text-red-400">
        &#9660;
      </span>
    );
  return null;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionVal = useMotionValue(value);
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    const controls = animate(motionVal, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = String(Math.round(v)); },
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, motionVal]);

  return <span ref={ref} className={className}>{value}</span>;
}

/** Se muestra mientras haya al menos un MC sin stats cargadas (ver hasPendingResults). */
function PendingResultsBanner() {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.05] px-3.5 py-3">
      <span className="mt-px shrink-0 text-sm leading-none">⏳</span>
      <p className="text-[11px] font-medium leading-snug text-yellow-200/80">
        Todavía faltan resultados de la última fecha por cargar — la tabla puede moverse en las próximas horas. Nada es definitivo hasta que estén todas las stats.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="opacity-20">
        <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="1.5" className="text-yellow-400" />
        <rect x="22" y="10" width="8" height="18" rx="4" fill="currentColor" className="text-yellow-400" />
        <path d="M15 26c0 6.075 4.925 11 11 11s11-4.925 11-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-yellow-400" />
        <line x1="26" y1="37" x2="26" y2="43" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-yellow-400" />
        <line x1="20" y1="43" x2="32" y2="43" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-yellow-400" />
      </svg>
      <div className="text-center">
        <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-zinc-400">Sin datos aún</p>
        <p className="mt-1 text-xs text-zinc-500">El ranking se publicará cuando inicie la liga</p>
      </div>
    </div>
  );
}

/**
 * Podio Top-3 por puntos (vista completa). Orden visual: 2º · 1º · 3º.
 * "LÍDER" es puramente por puntosLiga — no implica que sea el campeón
 * vigente (ver ChampionBadge), ya que alguien puede ganar la última fecha
 * y arrancar en 0 puntos hasta que se cargan sus resultados.
 */
function Podium({ top }: { top: RankingItem[] }) {
  if (top.length < 3) return null;
  const order = [1, 0, 2]; // índices a posiciones visuales
  const heights = ["pt-5", "pt-0", "pt-7"];
  const labels = ["2º", "LÍDER", "3º"];
  return (
    <div className="mb-5 grid grid-cols-3 items-end gap-2 sm:gap-3">
      {order.map((idx, col) => {
        const mc = top[idx];
        const isLeader = idx === 0;
        return (
          <motion.div
            key={mc.alias}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: col * 0.08 }}
            className={`${heights[col]} flex flex-col items-center`}
          >
            <div className={`relative flex w-full flex-col items-center rounded-2xl border px-2 py-4 text-center ${
              isLeader
                ? "border-yellow-400/40 bg-yellow-400/[0.10] shadow-[0_0_30px_-8px_rgba(250,204,21,0.5)]"
                : `${TOP3_RING[idx]} ${TOP3_BG[idx]}`
            }`}>
              {isLeader && (
                <svg className="absolute -top-3 h-6 w-6 text-yellow-400 drop-shadow" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M3 7l4 4 5-6 5 6 4-4v10H3V7z" />
                </svg>
              )}
              <Avatar alias={mc.alias} size={isLeader ? 56 : 44} gold={isLeader} />
              <p className={`mt-2 truncate w-full font-display font-bold uppercase tracking-tight ${isLeader ? "text-base text-yellow-300" : `text-sm ${TOP3_NUM[idx]}`}`}>
                {mc.alias}
              </p>
              {mc.estado === "campeon" && (
                <span className="mt-1"><ChampionBadge /></span>
              )}
              <p className="font-mono text-lg font-extrabold tabular-nums text-white leading-none mt-1">{mc.puntosLiga}</p>
              <p className="font-mono text-[10px] tabular-nums text-zinc-500 mt-1">
                {mc.victorias}V · {mc.derrotas}D
              </p>
            </div>
            <span className={`mt-2 font-display text-[10px] font-semibold uppercase tracking-[0.2em] ${isLeader ? "text-yellow-400" : "text-zinc-500"}`}>
              {labels[col]}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function RankRow({ mc, index }: { mc: RankingItem; index: number }) {
  const isTop3 = index < 3;
  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      className={`group relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-default transition-colors ${
        isTop3
          ? `${TOP3_BG[index]} ${TOP3_RING[index]} hover:brightness-110`
          : "border-white/[0.05] bg-transparent hover:border-white/[0.1] hover:bg-white/[0.02]"
      }`}
    >
      <span className={`w-5 shrink-0 text-center font-mono text-sm font-bold tabular-nums ${isTop3 ? TOP3_NUM[index] : "text-zinc-500"}`}>
        {index + 1}
      </span>
      <Avatar alias={mc.alias} size={30} gold={index === 0} />
      <div className="flex flex-1 items-center gap-1.5 min-w-0 overflow-hidden">
        <span className={`truncate font-display text-sm font-bold uppercase tracking-tight transition-colors ${
          isTop3 ? TOP3_NUM[index] : "text-white group-hover:text-yellow-50"
        }`}>
          {mc.alias}
        </span>
        {mc.estado === "campeon" && <ChampionBadge />}
        {hasNoStatsYet(mc) && <PendingBadge />}
        {mc.movimiento && <MovimientoIcon movimiento={mc.movimiento} />}
        {mc.bonus > 0 && (
          <span className="shrink-0 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-1.5 py-0.5 text-[8px] font-display font-bold leading-none text-yellow-400">
            +{mc.bonus}
          </span>
        )}
      </div>
      <span className="relative z-10 hidden sm:block shrink-0 w-24 text-right font-mono text-[10px] font-medium tabular-nums text-zinc-500">
        {mc.victorias}V · {mc.derrotas}D · {mc.replicas}R
      </span>
      <div className="w-[4.5rem] shrink-0 flex items-baseline justify-end gap-0.5">
        <AnimatedNumber value={mc.puntosLiga} className="font-mono text-base font-extrabold tabular-nums text-white leading-none" />
        <span className="text-[8px] font-display font-bold uppercase text-zinc-500 leading-none">pts</span>
      </div>
    </motion.div>
  );
}

export function CompactRanking({ ranking, limit = 5, variant = "compact" }: CompactRankingProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const isFull = variant === "full";
  const searchable = isFull && ranking.length > 6;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranking;
    return ranking.filter((mc) => mc.alias.toLowerCase().includes(q));
  }, [ranking, query]);

  const searching = query.trim().length > 0;
  const showPodium = isFull && !searching && ranking.length >= 3;

  // En compacto: respeta el límite + expand. En full: muestra todo (o filtrado).
  const listSource = isFull ? filtered : (expanded ? ranking : ranking.slice(0, limit));
  const rowItems = showPodium ? listSource.slice(3) : listSource;
  const canExpand = !isFull && ranking.length > limit;

  return (
    <section className="arena-card p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-end justify-between border-b border-white/[0.05] pb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path fillRule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.173L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8Zm11 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8Zm-6.828 2.828a.75.75 0 0 1 0 1.061L6.11 12.95a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.061 0Zm3.594-3.317a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 0 1-1.061 1.062l-1.06-1.061a.75.75 0 0 1 0-1.06ZM10 14a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 14Z" clipRule="evenodd"/>
            </svg>
            <p className="kicker text-[10px] text-yellow-400">Tabla oficial</p>
          </div>
          <h2 className="section-title text-3xl text-white">Ranking</h2>
        </div>
        <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[9px] font-display font-bold uppercase tracking-[0.2em] text-zinc-400">
          {isFull ? `${ranking.length} MCs` : `Top ${Math.min(limit, ranking.length)}`}
        </span>
      </div>

      {ranking.length > 0 && hasPendingResults(ranking) && <PendingResultsBanner />}

      {/* Buscador (solo vista completa) */}
      {searchable && (
        <div className="relative mb-4">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3m1.8-4.7a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar MC..."
            aria-label="Buscar MC"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm font-medium text-white placeholder:text-zinc-500 outline-none focus:border-yellow-400/40"
          />
        </div>
      )}

      {ranking.length === 0 ? (
        <EmptyState />
      ) : searching && filtered.length === 0 ? (
        <p className="py-10 text-center font-display text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Sin resultados para &ldquo;{query}&rdquo;
        </p>
      ) : (
        <>
          {showPodium && <Podium top={ranking.slice(0, 3)} />}

          {rowItems.length > 0 && (
            <>
              <div className="mb-2 flex items-center gap-2.5 px-3 text-[8px] font-display font-bold uppercase tracking-[0.22em] text-zinc-600">
                <span className="w-5 shrink-0 text-center">#</span>
                <span className="w-[30px] shrink-0" />
                <span className="flex-1">MC</span>
                <span className="hidden sm:block w-24 text-right">Récord</span>
                <span className="w-[4.5rem] shrink-0 text-right">Pts</span>
              </div>
              <div className="space-y-1">
                {rowItems.map((mc, i) => (
                  <RankRow key={mc.alias} mc={mc} index={showPodium ? i + 3 : i} />
                ))}
              </div>
            </>
          )}

          {canExpand && (
            <motion.button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              whileTap={{ scale: 0.97 }}
              className="mt-4 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-[10px] font-display font-bold uppercase tracking-[0.22em] text-zinc-400 transition hover:border-yellow-400/25 hover:text-yellow-400"
            >
              {expanded ? "Colapsar ↑" : `Ver todos (${ranking.length}) ↓`}
            </motion.button>
          )}
        </>
      )}
    </section>
  );
}
