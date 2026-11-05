"use client";

import { useMemo } from "react";
import type { Battle, LeagueEvent, RankingItem } from "@/lib/domain/league/types";
import { getChampionsHall, getSeasonRecords } from "@/lib/domain/league/records";
import { useOverlays } from "./OverlayProvider";

type SeasonExtrasProps = { ranking: RankingItem[]; battles: Battle[]; events: LeagueEvent[] };

function NameLink({ alias }: { alias: string }) {
  const { openMc } = useOverlays();
  return (
    <button type="button" onClick={() => openMc(alias)}
      className="inline-block min-h-6 font-bold uppercase underline decoration-2 underline-offset-4 hover:bg-pila">
      {alias}
    </button>
  );
}

function List({ names }: { names: string[] }) {
  return (
    <>
      {names.map((n, i) => (
        <span key={n}>{i > 0 && ", "}<NameLink alias={n} /></span>
      ))}
    </>
  );
}

/** Récords de la temporada y salón de campeones: todo sale de lo que ya está en las hojas. */
export function SeasonExtras({ ranking, battles, events }: SeasonExtrasProps) {
  const records = useMemo(() => getSeasonRecords(ranking, battles, events), [ranking, battles, events]);
  const hall = useMemo(() => getChampionsHall(events), [events]);

  return (
    <>
      {records.length > 0 && (
        <section aria-labelledby="records-titulo" className="border-2 border-ink p-4 sm:p-5">
          <h3 id="records-titulo" className="display text-2xl sm:text-3xl">Récords de la temporada</h3>
          <ul className="mt-3 space-y-3">
            {records.map((r) => (
              <li key={r.id} className="grid grid-cols-[4.5rem_1fr] items-baseline gap-3 border-t-2 border-ink pt-2">
                <span className="display num text-3xl">{r.valor}</span>
                <span>
                  <span className="block text-sm font-semibold text-muted">{r.titulo}</span>
                  <span className="block text-base"><List names={r.quienes} /></span>
                  <span className="block text-xs text-muted">{r.detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hall.fechas.length > 0 && (
        <section aria-labelledby="salon-titulo" className="border-2 border-ink p-4 sm:p-5">
          <h3 id="salon-titulo" className="display text-2xl sm:text-3xl">Salón de campeones</h3>
          <ul className="mt-3 space-y-2">
            {hall.fechas.map((f) => (
              <li key={f.eventId} className="border-t-2 border-ink pt-2">
                <span className="block text-sm font-semibold text-muted">{f.titulo}</span>
                <span className="block text-base"><NameLink alias={f.campeon} /></span>
                {f.subcampeon && <span className="block text-xs text-muted">Subcampeón {f.subcampeon}</span>}
              </li>
            ))}
          </ul>
          {hall.titulos.some((t) => t.veces > 1) && (
            <p className="mt-3 border-t-2 border-ink pt-2 text-sm">
              <span className="font-semibold text-muted">Más de una fecha ganada: </span>
              {hall.titulos.filter((t) => t.veces > 1).map((t, i) => (
                <span key={t.alias}>{i > 0 && ", "}<NameLink alias={t.alias} /> <span className="num">×{t.veces}</span></span>
              ))}
            </p>
          )}
        </section>
      )}
    </>
  );
}
