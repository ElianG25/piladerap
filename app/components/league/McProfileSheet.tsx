"use client";

import { useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Battle, LeagueEvent, RankedItem } from "@/lib/domain/league/types";
import { getMcBattles, summarizeMcBattles } from "@/lib/domain/league/profile";
import { formatPoints } from "@/lib/shared/format";
import { getYouTubeId } from "@/lib/shared/youtube";
import { CloseIcon, PlayIcon } from "@/app/components/ui/icons";
import { useModalLayer } from "@/app/hooks/useModalLayer";
import type { PlayPayload } from "./VideoModal";

type McProfileSheetProps = {
  mc: RankedItem | null;
  battles: Battle[];
  events: LeagueEvent[];
  onClose: () => void;
  onPlay: (video: NonNullable<PlayPayload>) => void;
};

/** Ficha de un MC: su posición, su récord y cada batalla que peleó, con video. */
export function McProfileSheet({ mc, battles, events, onClose, onPlay }: McProfileSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useModalLayer(Boolean(mc), panelRef, onClose, closeRef);

  const results = useMemo(() => (mc ? getMcBattles(battles, mc.alias) : []), [mc, battles]);
  const summary = useMemo(() => summarizeMcBattles(results), [results]);

  const byEvent = useMemo(() => {
    const titles = new Map(events.map((e) => [e.eventId, e.titulo || e.label || e.eventId]));
    const groups: { eventId: string; title: string; items: typeof results }[] = [];
    for (const r of results) {
      const last = groups[groups.length - 1];
      if (last && last.eventId === r.battle.eventId) last.items.push(r);
      else groups.push({ eventId: r.battle.eventId, title: titles.get(r.battle.eventId) ?? r.battle.eventId, items: [r] });
    }
    return groups;
  }, [results, events]);

  const tableDiffers = mc ? summary.puntos !== mc.puntosLiga : false;

  return (
    <AnimatePresence>
      {mc && (
        <motion.div
          className="on-ink fixed inset-0 z-50 flex items-end justify-center bg-ink/80 sm:items-stretch sm:justify-end"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            role="dialog" aria-modal="true" aria-label={`Ficha de ${mc.alias}`}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90svh] w-full flex-col overflow-y-auto bg-ink text-paper sm:max-h-none sm:w-[28rem]"
          >
            <div className="flex items-start justify-between gap-3 p-5 pb-3">
              <div className="min-w-0">
                <h2 className="display break-words text-5xl text-pila sm:text-6xl">{mc.alias}</h2>
                <p className="mt-2 text-sm font-semibold text-muted-ink">
                  {mc.estado === "campeon" ? "Campeón de la última fecha · " : ""}
                  Posición {mc.posicion}{mc.empatado ? " (empatado)" : ""}
                </p>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar ficha"
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-pila text-ink transition hover:bg-paper">
                <CloseIcon />
              </button>
            </div>

            <dl className="grid grid-cols-4 border-y-2 border-ink-line text-center">
              {[
                { k: "Puntos", v: formatPoints(mc.puntosLiga), hi: true },
                { k: "Victorias", v: String(mc.victorias) },
                { k: "Derrotas", v: String(mc.derrotas) },
                { k: "Réplicas", v: String(mc.replicas) },
              ].map((s) => (
                <div key={s.k} className="border-r-2 border-ink-line px-1 py-3 last:border-r-0">
                  <dd className={`display num text-4xl ${s.hi ? "text-pila" : ""}`}>{s.v}</dd>
                  <dt className="mt-1 text-xs font-semibold text-muted-ink">{s.k}</dt>
                </div>
              ))}
            </dl>

            <div className="flex-1 p-5">
              {byEvent.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-ink">
                  Todavía no hay batallas de {mc.alias} en el archivo. Sus puntos vienen de la tabla oficial.
                </p>
              ) : (
                <>
                  <h3 className="display text-3xl">Batallas</h3>
                  {byEvent.map((g) => (
                    <section key={g.eventId} className="mt-4" aria-label={g.title}>
                      <h4 className="display text-xl text-pila">{g.title}</h4>
                      <ul className="mt-1 divide-y-2 divide-ink-line border-y-2 border-ink-line">
                        {g.items.map((r) => {
                          const id = getYouTubeId(r.battle.youtubeUrl);
                          const title = `${r.battle.mc1} vs ${r.battle.mc2} · ${r.battle.ronda}`;
                          return (
                            <li key={r.battle.battleId} className="flex items-center gap-3 py-2.5">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold uppercase">vs {r.rival}</p>
                                <p className="text-xs text-muted-ink">
                                  {r.battle.ronda}{r.replica ? " · réplica" : ""}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-bold uppercase ${r.won ? "bg-pila text-ink" : "border-2 border-ink-line text-muted-ink"}`}>
                                {r.won ? "Ganó" : "Perdió"} <span className="num">+{r.puntos}</span>
                              </span>
                              {id ? (
                                <button type="button" aria-label={`Ver ${title}`}
                                  onClick={() => onPlay({ id, title, url: r.battle.youtubeUrl })}
                                  className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-paper/40 text-paper transition hover:border-pila hover:text-pila">
                                  <PlayIcon className="h-4 w-4" />
                                </button>
                              ) : <span className="h-11 w-11 shrink-0" aria-hidden />}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                  {tableDiffers && (
                    <p className="mt-4 text-xs leading-relaxed text-muted-ink">
                      La tabla oficial es la que cuenta: puede incluir resultados que no tienen detalle
                      de batalla aquí (por ejemplo, la Fecha 1).
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
