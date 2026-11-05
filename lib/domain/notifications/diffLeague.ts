import { hasPendingResults } from "@/lib/domain/league/rules";
import { rankLeague } from "@/lib/domain/league/ranking";
import type { Battle, LeagueEvent, LeaguePayload } from "@/lib/domain/league/types";
import type { NotificationEvent } from "./types";

const LOW_CAPACITY_THRESHOLD = 5;

// Títulos cortos a propósito (buena práctica de notificaciones en general).
// La línea "Pila de Ra'" que agregan iOS/Android arriba del título es UI del
// sistema operativo para toda notificación (nativa o web) — no se puede
// desactivar desde acá, así que no vale la pena diseñar en torno a eso.

function buildAnnouncedEvent(ev: LeagueEvent): NotificationEvent {
  return {
    kind: "event_announced",
    title: "🔥 ¡Se prendió!",
    body: `${ev.titulo || "La próxima fecha"} ya tiene día marcado. Prepara las barras, que esto se pone bueno.`,
    url: "/?s=fechas",
  };
}

function buildRegistrationOpenEvent(ev: LeagueEvent): NotificationEvent {
  return {
    kind: "registration_open",
    title: "🎤 ¡Se abrió el mic!",
    body: `Los cupos de ${ev.titulo || "la próxima fecha"} ya están abiertos. Coge el tuyo antes que se acaben.`,
    url: "/?s=inscripcion",
  };
}

function buildLowCapacityEvent(ev: LeagueEvent, restantes: number): NotificationEvent {
  return {
    kind: "low_capacity",
    title: "⚡ ¡Últimos cupos!",
    body: `Quedan solo ${restantes} pa' ${ev.titulo || "la fecha"}. Si vas a tirar, es ahora o nunca.`,
    url: "/?s=inscripcion",
  };
}

function buildLiveEvent(ev: LeagueEvent): NotificationEvent {
  return {
    kind: "event_live",
    title: "🔥 ¡Ya arrancó!",
    body: `${ev.titulo || "La fecha"} está que arde en la plaza ahora mismo. Ven a vivirlo, que no te lo cuenten.`,
    url: "/",
  };
}

function buildChampionEvent(ev: LeagueEvent): NotificationEvent {
  return {
    kind: "champion_crowned",
    title: "👑 ¡Nuevo campeón!",
    body: `${ev.campeon} se coronó en ${ev.titulo || "la fecha"}. Dale un vistazo a cómo se puso la cosa.`,
    url: "/",
  };
}

function buildNewVideoEvent(battle: Battle): NotificationEvent {
  const mcs = [battle.mc1, battle.mc2, battle.mc3, battle.mc4].filter(Boolean).join(" vs ");
  return {
    kind: "new_video",
    title: "🎥 ¡Video nuevo!",
    body: `Ya subimos ${mcs || "una nueva batalla"}. Dale play y saca tus conclusiones.`,
    url: "/?s=batallas",
  };
}

function buildRankingShuffleEvent(top3: string[], provisional: boolean): NotificationEvent {
  return {
    kind: "ranking_shuffle",
    title: "📈 ¡Nuevo Top 3!",
    body: `Quedó así: 1. ${top3[0]} · 2. ${top3[1]} · 3. ${top3[2]}.${
      provisional
        ? " Ojo que todavía es provisional — faltan resultados por cargar."
        : " ¿Quién se queda con la corona?"
    }`,
    url: "/?s=ranking",
  };
}

function buildResultsFinalizedEvent(ev: LeagueEvent | null): NotificationEvent {
  return {
    kind: "results_finalized",
    title: "✅ ¡Ranking definitivo!",
    body: `Ya se terminaron de cargar las stats de ${ev?.titulo || "la última fecha"}. Dale un vistazo a cómo quedó la tabla.`,
    url: "/?s=ranking",
  };
}

/** Único usado desde afuera del dominio (application) para el recordatorio del día del evento. */
export function buildDayOfReminder(ev: LeagueEvent): NotificationEvent {
  return {
    kind: "event_reminder",
    title: "📅 ¡Hoy es el día!",
    body: `${ev.titulo || "La fecha"} arranca hoy${ev.horaEvento ? ` a las ${ev.horaEvento}` : ""}. Nos vemos en la plaza.`,
    url: "/?s=fechas",
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Compara el snapshot anterior de la liga contra el actual y devuelve qué
 * notificar. Pura: sin fetch, sin Date.now() (el recordatorio del día vive
 * en application/ porque depende de la fecha actual, no de un cambio de
 * estado). Si no hay snapshot anterior (primera corrida), no notifica nada
 * — solo hay una base para comparar de ahí en adelante.
 */
export function diffLeagueForNotifications(
  previous: LeaguePayload | null,
  current: LeaguePayload
): NotificationEvent[] {
  if (!previous) return [];

  const events: NotificationEvent[] = [];

  for (const ev of current.events) {
    const prevEv = previous.events.find((e) => e.eventId === ev.eventId);

    if (ev.estado === "anunciada" && prevEv?.estado !== "anunciada") {
      events.push(buildAnnouncedEvent(ev));
    }
    if (ev.estado === "inscripciones" && prevEv?.estado !== "inscripciones") {
      events.push(buildRegistrationOpenEvent(ev));
    }
    if (ev.estado === "en_vivo" && prevEv?.estado !== "en_vivo") {
      events.push(buildLiveEvent(ev));
    }
    if (ev.estado === "finalizada" && ev.campeon && prevEv?.campeon !== ev.campeon) {
      events.push(buildChampionEvent(ev));
    }
  }

  const currActive = current.activeEvent;
  if (currActive && current.capacity.restantes <= LOW_CAPACITY_THRESHOLD) {
    const prevRestantes = previous.activeEvent?.eventId === currActive.eventId
      ? previous.capacity.restantes
      : Infinity;
    if (prevRestantes > LOW_CAPACITY_THRESHOLD) {
      events.push(buildLowCapacityEvent(currActive, current.capacity.restantes));
    }
  }

  for (const battle of current.battles) {
    if (!battle.youtubeUrl) continue;
    const prevBattle = previous.battles.find((b) => b.battleId === battle.battleId);
    if (!prevBattle?.youtubeUrl) {
      events.push(buildNewVideoEvent(battle));
    }
  }

  const prevPending = hasPendingResults(previous.ranking);
  const currPending = hasPendingResults(current.ranking);

  const prevTop3 = rankLeague(previous.ranking, previous.battles).slice(0, 3).map((r) => r.alias);
  const currTop3 = rankLeague(current.ranking, current.battles).slice(0, 3).map((r) => r.alias);
  if (prevTop3.length === 3 && currTop3.length === 3 && !arraysEqual(prevTop3, currTop3)) {
    events.push(buildRankingShuffleEvent(currTop3, currPending));
  }

  if (prevPending && !currPending) {
    events.push(buildResultsFinalizedEvent(current.latestCompletedEvent));
  }

  return events;
}
