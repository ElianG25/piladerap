"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Battle, LeagueEvent, RankedItem } from "@/lib/domain/league/types";
import { getMcBattles, summarizeMcBattles } from "@/lib/domain/league/profile";
import { getHeadToHead, getRivals } from "@/lib/domain/league/headToHead";
import { mcHistory, type Movement } from "@/lib/domain/league/standings";
import { formatPoints } from "@/lib/shared/format";
import { getYouTubeId } from "@/lib/shared/youtube";
import { CheckIcon, CloseIcon, PlayIcon, ShareIcon, StarIcon } from "@/app/components/ui/icons";
import { McPhoto } from "@/app/components/ui/McPhoto";
import { useFollows } from "@/app/hooks/useFollows";
import { useModalLayer } from "@/app/hooks/useModalLayer";
import { usePushSubscription } from "@/app/hooks/usePushSubscription";
import type { PlayPayload } from "./VideoModal";

type McProfileSheetProps = {
  mc: RankedItem | null;
  battles: Battle[];
  events: LeagueEvent[];
  movement: Movement | null;
  onClose: () => void;
  onPlay: (video: NonNullable<PlayPayload>) => void;
};

const norm = (s: string) => s.trim().toLowerCase();

function movementText(m: Movement | null, fecha: string): string | null {
  if (!m) return null;
  if (m.debut) return `Debutó en la ${fecha} con ${formatPoints(m.puntosFecha)} pts.`;
  const pts = m.puntosFecha > 0 ? ` y sumó ${formatPoints(m.puntosFecha)} pts` : "";
  if (m.delta && m.delta > 0) return `Subió ${m.delta} ${m.delta === 1 ? "lugar" : "lugares"} con la ${fecha}${pts}.`;
  if (m.delta && m.delta < 0) return `Bajó ${-m.delta} ${m.delta === -1 ? "lugar" : "lugares"} con la ${fecha}${pts}.`;
  return m.puntosFecha > 0 ? `Mantuvo su lugar con la ${fecha} (+${formatPoints(m.puntosFecha)} pts).` : null;
}

/** Ficha de un MC: foto, posición, récord, historial por fecha, cara a cara y cada batalla con video. */
export function McProfileSheet({ mc, battles, events, movement, onClose, onPlay }: McProfileSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useModalLayer(Boolean(mc), panelRef, onClose, closeRef);

  const { isFollowing, toggle, max } = useFollows();
  const { status: pushStatus, isSubscribed } = usePushSubscription();
  const [note, setNote] = useState("");
  const [rival, setRival] = useState<string | null>(null);

  const results = useMemo(() => (mc ? getMcBattles(battles, mc.alias) : []), [mc, battles]);
  const summary = useMemo(() => summarizeMcBattles(results), [results]);
  const history = useMemo(() => (mc ? mcHistory(battles, events, mc.alias) : []), [mc, battles, events]);
  const rivals = useMemo(() => (mc ? getRivals(battles, mc.alias) : []), [mc, battles]);
  const maxPts = Math.max(1, ...history.map((h) => h.puntos));
  const selectedRival = rival && rivals.some((r) => norm(r.alias) === norm(rival)) ? rival : rivals[0]?.alias ?? null;
  const h2h = useMemo(() => (mc && selectedRival ? getHeadToHead(battles, mc.alias, selectedRival) : []), [mc, selectedRival, battles]);
  const h2hWins = mc ? h2h.filter((b) => norm(b.ganador) === norm(mc.alias)).length : 0;

  const latestEvent = [...events].filter((e) => e.estado === "finalizada").sort((a, b) => b.orden - a.orden)[0];
  const eventTitle = (id: string) => events.find((e) => e.eventId === id)?.titulo ?? id;
  const following = mc ? isFollowing(mc.alias) : false;
  const tableDiffers = mc ? summary.puntos !== mc.puntosLiga : false;

  function onFollow() {
    if (!mc) return;
    const r = toggle(mc.alias);
    setNote(r === "lleno" ? `Ya sigues a ${max} MCs. Deja de seguir a alguien para agregar otro.` : "");
  }

  async function onShare() {
    if (!mc) return;
    const url = `${window.location.origin}/mc/${encodeURIComponent(mc.alias)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${mc.alias} · Pila de Ra'`, url });
      else {
        await navigator.clipboard.writeText(url);
        setNote("Enlace copiado.");
      }
    } catch { /* cerró el menú de compartir */ }
  }

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
            <div className="flex items-start gap-3 p-5 pb-3">
              <McPhoto alias={mc.alias} size={88} />
              <div className="min-w-0 flex-1">
                <h2 className="display break-words text-5xl text-pila">{mc.alias}</h2>
                <p className="mt-1 text-sm font-semibold text-muted-ink">
                  {mc.estado === "campeon" ? "Campeón de la última fecha · " : ""}
                  Posición {mc.posicion}{mc.empatado ? " (empatado)" : ""}
                </p>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar ficha"
                className="flex h-11 w-11 shrink-0 items-center justify-center bg-pila text-ink transition hover:bg-paper">
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 px-5 pb-3">
              <button type="button" onClick={onFollow} aria-pressed={following}
                className={`flex min-h-11 items-center gap-2 border-2 px-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                  following ? "border-pila bg-pila text-ink" : "border-paper/40 text-paper hover:border-pila hover:text-pila"
                }`}>
                <StarIcon filled={following} className="h-4 w-4" />
                {following ? "Siguiendo" : "Seguir"}
              </button>
              <button type="button" onClick={onShare}
                className="flex min-h-11 items-center gap-2 border-2 border-paper/40 px-4 text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:border-pila hover:text-pila">
                <ShareIcon className="h-4 w-4" />
                Compartir
              </button>
            </div>
            <div role="status" aria-live="polite" className="px-5">
              {note && <p className="pb-2 text-sm font-semibold text-pila"><CheckIcon className="mr-1 inline h-4 w-4" />{note}</p>}
              {following && !note && pushStatus === "ready" && !isSubscribed && (
                <p className="pb-2 text-sm text-muted-ink">Activa las notificaciones (la campana de arriba) para recibir sus resultados.</p>
              )}
              {following && !note && isSubscribed && <p className="pb-2 text-sm text-muted-ink">Te avisamos cuando haya un resultado suyo.</p>}
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

            <div className="flex-1 space-y-7 p-5">
              {movementText(movement, latestEvent?.titulo ?? "última fecha") && (
                <p className="text-base font-semibold">{movementText(movement, latestEvent?.titulo ?? "última fecha")}</p>
              )}

              {history.length > 0 && (
                <section aria-labelledby="hist-titulo">
                  <h3 id="hist-titulo" className="display text-3xl">Fecha por fecha</h3>
                  <ul className="mt-2 space-y-2">
                    {history.map((h) => (
                      <li key={h.event.eventId} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
                        <span className="font-bold">{h.event.titulo}</span>
                        <span className="h-3 bg-ink-line" role="presentation">
                          <span className="block h-full bg-pila" style={{ width: `${(h.puntos / maxPts) * 100}%` }} />
                        </span>
                        <span className="num text-right font-semibold">
                          {h.puntos} pts <span className="text-muted-ink">· {h.victorias}V {h.derrotas}D</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {rivals.length > 0 && selectedRival && (
                <section aria-labelledby="h2h-titulo">
                  <h3 id="h2h-titulo" className="display text-3xl">Cara a cara</h3>
                  <label htmlFor="h2h-rival" className="mt-2 block text-sm text-muted-ink">Elige un rival con el que se ha cruzado</label>
                  <select id="h2h-rival" value={selectedRival} onChange={(e) => setRival(e.target.value)}
                    className="mt-1 min-h-11 w-full border-2 border-ink-line bg-ink-2 px-3 text-paper focus:border-pila">
                    {rivals.map((r) => <option key={r.alias} value={r.alias}>{r.alias} ({r.veces} {r.veces === 1 ? "vez" : "veces"})</option>)}
                  </select>
                  <p className="display num mt-3 text-4xl">
                    {mc.alias} <span className="text-pila">{h2hWins}</span> – <span className="text-pila">{h2h.length - h2hWins}</span> {selectedRival}
                  </p>
                  <ul className="mt-2 divide-y-2 divide-ink-line border-y-2 border-ink-line">
                    {h2h.map((b) => {
                      const id = getYouTubeId(b.youtubeUrl);
                      const won = norm(b.ganador) === norm(mc.alias);
                      return (
                        <li key={b.battleId} className="flex items-center gap-3 py-2.5 text-sm">
                          <span className="flex-1">{eventTitle(b.eventId)} · {b.ronda}</span>
                          <span className={`px-2 py-1 text-xs font-bold uppercase ${won ? "bg-pila text-ink" : "border-2 border-ink-line text-muted-ink"}`}>{won ? "Ganó" : "Perdió"}</span>
                          {id ? (
                            <button type="button" aria-label={`Ver ${b.mc1} vs ${b.mc2}`}
                              onClick={() => onPlay({ id, title: `${b.mc1} vs ${b.mc2} · ${b.ronda}`, url: b.youtubeUrl, battleId: b.battleId })}
                              className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-paper/40 transition hover:border-pila hover:text-pila">
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          ) : <span className="h-11 w-11 shrink-0" aria-hidden />}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {results.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-ink">
                  Todavía no hay batallas de {mc.alias} en el archivo. Sus puntos vienen de la tabla oficial.
                </p>
              ) : (
                <section aria-labelledby="bat-titulo">
                  <h3 id="bat-titulo" className="display text-3xl">Batallas</h3>
                  {history.map((h) => (
                    <div key={h.event.eventId} className="mt-4">
                      <h4 className="display text-xl text-pila">{h.event.titulo}</h4>
                      <ul className="mt-1 divide-y-2 divide-ink-line border-y-2 border-ink-line">
                        {results.filter((r) => r.battle.eventId === h.event.eventId).map((r) => {
                          const id = getYouTubeId(r.battle.youtubeUrl);
                          const title = `${r.battle.mc1} vs ${r.battle.mc2} · ${r.battle.ronda}`;
                          return (
                            <li key={r.battle.battleId} className="flex items-center gap-3 py-2.5">
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-bold uppercase">vs {r.rival}</p>
                                <p className="text-xs text-muted-ink">{r.battle.ronda}{r.replica ? " · réplica" : ""}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-bold uppercase ${r.won ? "bg-pila text-ink" : "border-2 border-ink-line text-muted-ink"}`}>
                                {r.won ? "Ganó" : "Perdió"} <span className="num">+{r.puntos}</span>
                              </span>
                              {id ? (
                                <button type="button" aria-label={`Ver ${title}`}
                                  onClick={() => onPlay({ id, title, url: r.battle.youtubeUrl, battleId: r.battle.battleId })}
                                  className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-paper/40 text-paper transition hover:border-pila hover:text-pila">
                                  <PlayIcon className="h-4 w-4" />
                                </button>
                              ) : <span className="h-11 w-11 shrink-0" aria-hidden />}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                  {tableDiffers && (
                    <p className="mt-4 text-xs leading-relaxed text-muted-ink">
                      La tabla oficial es la que cuenta: puede incluir resultados que no tienen detalle de batalla aquí (por ejemplo, la Fecha 1).
                    </p>
                  )}
                </section>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
