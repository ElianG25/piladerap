import type { Battle, LeaguePayload } from "@/lib/domain/league/types";
import { isReplica } from "@/lib/domain/league/scoring";
import type { NotificationEvent } from "./types";

const norm = (s: string) => s.trim().toLowerCase();

function eventTitle(league: LeaguePayload, eventId: string): string {
  return league.events.find((e) => e.eventId === eventId)?.titulo || "la fecha";
}

function build(alias: string, rival: string, won: boolean, b: Battle, fecha: string): NotificationEvent {
  const ronda = b.ronda.trim();
  const final = norm(ronda) === "final";
  const third = norm(ronda) === "tercer puesto";
  const rep = isReplica(b.tipoResultado) ? " con réplica" : "";
  const url = `/mc/${encodeURIComponent(alias)}`;

  if (won) {
    if (final) return { kind: "mc_result", audience: { aliases: [norm(alias)] }, url, title: `🏆 ¡${alias} se coronó!`, body: `Le ganó a ${rival} en la Final de ${fecha}${rep}. Campeón de la plaza.` };
    if (third) return { kind: "mc_result", audience: { aliases: [norm(alias)] }, url, title: `🥉 ¡${alias} se llevó el tercer puesto!`, body: `Le ganó a ${rival} en ${fecha}${rep}. Cerró con todo.` };
    return { kind: "mc_result", audience: { aliases: [norm(alias)] }, url, title: `⚡ ¡${alias} sigue en pie!`, body: `Le ganó a ${rival} en ${ronda || fecha}${rep}. Va por la próxima.` };
  }
  if (final) return { kind: "mc_result", audience: { aliases: [norm(alias)] }, url, title: `🥈 ${alias} es subcampeón`, body: `Cayó en la Final contra ${rival}. Se la jugó completo.` };
  if (third) return { kind: "mc_result", audience: { aliases: [norm(alias)] }, url, title: `${alias} cerró en cuarto lugar`, body: `Cayó ante ${rival} en el tercer puesto de ${fecha}. Se la jugó.` };
  return { kind: "mc_result", audience: { aliases: [norm(alias)] }, url, title: `👋 ${alias} se despidió`, body: `Cayó ante ${rival} en ${ronda || fecha}${rep}. Se la jugó en la plaza.` };
}

/**
 * Un aviso por cada MC que tuvo un resultado nuevo (batalla que antes no
 * tenía ganador). Van marcados con `audience`: solo les llegan a quienes
 * siguen a ese MC. Si no hay snapshot previo, no hay nada que comparar.
 */
export function buildFollowedMcEvents(previous: LeaguePayload | null, current: LeaguePayload): NotificationEvent[] {
  if (!previous) return [];
  const out: NotificationEvent[] = [];
  for (const b of current.battles) {
    if (b.estado === "oculta" || !b.battleId || !b.ganador || !b.perdedor || norm(b.ganador) === norm(b.perdedor)) continue;
    const before = previous.battles.find((x) => x.battleId === b.battleId);
    if (before?.ganador) continue; // ya tenía resultado: no es novedad
    const fecha = eventTitle(current, b.eventId);
    out.push(build(b.ganador, b.perdedor, true, b, fecha), build(b.perdedor, b.ganador, false, b, fecha));
  }
  return out;
}
