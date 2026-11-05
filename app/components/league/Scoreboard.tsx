"use client";

import { useMemo, useState } from "react";
import type { RankedItem } from "@/lib/domain/league/types";
import type { Movement } from "@/lib/domain/league/standings";
import { hasNoStatsYet, hasPendingResults } from "@/lib/domain/league/rules";
import { formatPoints } from "@/lib/shared/format";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon, ShareIcon, StarIcon } from "@/app/components/ui/icons";
import { useFollows } from "@/app/hooks/useFollows";
import { shareUrl } from "@/app/lib/share";
import { useOverlays } from "./OverlayProvider";

type ScoreboardProps = {
  ranking: RankedItem[];
  /** Cuánto se movió cada MC con la última fecha (clave: alias en minúsculas). */
  movement: Map<string, Movement>;
  /** Cuántas filas se ven antes de "Ver todos" (solo variante compacta). */
  limit?: number;
  variant?: "compact" | "full";
};

function Chip({ children, tone }: { children: React.ReactNode; tone: "pila" | "line" }) {
  return (
    <span className={`shrink-0 px-1.5 py-1 text-xs font-bold uppercase leading-none ${
      tone === "pila" ? "bg-pila text-ink" : "border border-muted-ink text-muted-ink"
    }`}>
      {children}
    </span>
  );
}

function MovementMark({ delta }: { delta: number | null }) {
  if (!delta) return null;
  const up = delta > 0;
  return (
    <span className={`num inline-flex shrink-0 items-center text-xs font-bold ${up ? "text-pila" : "text-[#ff7a5c]"}`}
      title={up ? `Subió ${delta} con la última fecha` : `Bajó ${-delta} con la última fecha`}>
      {up ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />}
      <span className="sr-only">{up ? "Subió" : "Bajó"} </span>{Math.abs(delta)}
    </span>
  );
}

function Row({ mc, move, following, onOpen }: { mc: RankedItem; move?: Movement; following: boolean; onOpen: (alias: string) => void }) {
  const leader = mc.posicion === 1;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(mc.alias)}
        aria-label={`${mc.alias}, posición ${mc.posicion}, ${formatPoints(mc.puntosLiga)} puntos. Ver ficha`}
        className="grid min-h-14 w-full grid-cols-[2.75rem_1fr_auto] items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-ink-2 sm:grid-cols-[3rem_1fr_7rem_5rem]"
      >
        <span className={`display num text-3xl ${leader ? "text-pila" : "text-paper"}`}>{mc.posicion}</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`break-words text-base font-bold uppercase ${leader ? "text-pila" : ""}`}>{mc.alias}</span>
            {following && <StarIcon filled className="h-4 w-4 shrink-0 text-pila" aria-label="Lo sigues" role="img" />}
            {mc.estado === "campeon" && <Chip tone="pila">Campeón</Chip>}
            {mc.empatado && <Chip tone="line">Empate</Chip>}
            {hasNoStatsYet(mc) && <Chip tone="line">Pendiente</Chip>}
            {move?.debut ? <Chip tone="line">Debut</Chip> : <MovementMark delta={move?.delta ?? null} />}
          </span>
          <span className="num mt-0.5 block text-xs text-muted-ink sm:hidden">
            {mc.victorias}V · {mc.derrotas}D · {mc.replicas}R
          </span>
        </span>
        <span className="num hidden text-right text-sm text-muted-ink sm:block">
          {mc.victorias}V · {mc.derrotas}D · {mc.replicas}R
        </span>
        <span className="text-right">
          <span className={`display num block text-3xl ${leader ? "text-pila" : ""}`}>{formatPoints(mc.puntosLiga)}</span>
          {move && move.puntosFecha > 0 && <span className="num block text-xs font-semibold text-muted-ink">+{formatPoints(move.puntosFecha)} fecha</span>}
        </span>
      </button>
    </li>
  );
}

/** El marcador oficial: tabla de la liga con ficha de cada MC. */
export function Scoreboard({ ranking, movement, limit = 5, variant = "compact" }: ScoreboardProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const { openMc } = useOverlays();
  const { isFollowing } = useFollows();

  const isFull = variant === "full";
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? ranking.filter((mc) => mc.alias.toLowerCase().includes(q)) : ranking),
    [ranking, q]
  );
  const rows = isFull ? filtered : expanded ? ranking : ranking.slice(0, limit);
  const canExpand = !isFull && ranking.length > limit;
  const provisional = ranking.length > 0 && hasPendingResults(ranking);
  const tiesVisible = rows.some((r) => r.empatado);

  return (
    <section aria-labelledby="ranking-titulo" className="board overflow-hidden">
      <div className="flex items-end justify-between gap-3 px-3 pb-2 pt-4 sm:px-4">
        <h2 id="ranking-titulo" className="display text-4xl sm:text-5xl">Ranking</h2>
        <div className="flex items-center gap-3 pb-1">
          <p className="num text-sm font-semibold text-muted-ink">
            {isFull ? `${ranking.length} MCs` : `Top ${Math.min(limit, ranking.length)}`}
          </p>
          {isFull && (
            <button type="button" aria-label="Compartir el ranking"
              onClick={async () => { await shareUrl("Ranking · Pila de Ra'", `${window.location.origin}/?s=ranking`); }}
              className="flex h-11 w-11 items-center justify-center border-2 border-paper/40 text-paper transition-colors hover:border-pila hover:text-pila">
              <ShareIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {provisional && (
        <p className="mx-3 mb-3 bg-pila px-3 py-2 text-sm font-semibold leading-snug text-ink sm:mx-4">
          Resultados provisionales: faltan puntos de la última fecha por cargar y la tabla puede moverse en las próximas horas.
        </p>
      )}

      {tiesVisible && (
        <p className="mx-3 mb-3 text-sm leading-snug text-muted-ink sm:mx-4">
          <span className="font-bold text-pila">Empate:</span> mismos puntos y sin batalla directa entre ellos, así que comparten posición.
        </p>
      )}

      {isFull && ranking.length > 6 && (
        <div className="relative mx-3 mb-2 sm:mx-4">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
          <input
            type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar MC" aria-label="Buscar MC"
            className="min-h-11 w-full border-2 border-ink-line bg-ink-2 pl-9 pr-3 text-paper placeholder:text-muted-ink focus:border-pila focus:outline-none"
          />
        </div>
      )}

      {ranking.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-ink">El ranking se publica cuando empiece la liga.</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-ink">No hay ningún MC que se llame &ldquo;{query}&rdquo;.</p>
      ) : (
        <>
          <div className="grid grid-cols-[2.75rem_1fr_auto] gap-2 border-y-2 border-ink-line px-3 py-1.5 text-xs font-semibold text-muted-ink sm:grid-cols-[3rem_1fr_7rem_5rem]" aria-hidden>
            <span>#</span><span>MC</span><span className="hidden text-right sm:block">Récord</span><span className="text-right">Pts</span>
          </div>
          <ul className="divide-y divide-ink-line">
            {rows.map((mc) => <Row key={mc.alias} mc={mc} move={movement.get(mc.alias.trim().toLowerCase())} following={isFollowing(mc.alias)} onOpen={openMc} />)}
          </ul>
        </>
      )}

      {canExpand && (
        <button
          type="button" onClick={() => setExpanded((v) => !v)}
          className="min-h-12 w-full border-t-2 border-ink-line text-sm font-bold uppercase tracking-wide text-pila transition hover:bg-ink-2"
        >
          {expanded ? "Ver menos" : `Ver los ${ranking.length} MCs`}
        </button>
      )}

    </section>
  );
}
