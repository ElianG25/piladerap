import type { Battle, LeagueEvent, LeaguePayload } from "./types";
import { isReplica } from "./scoring";
import { getFinalBattle } from "./rounds";
import { hasNoStatsYet } from "./rules";
import { asHttpUrl, getYouTubeId } from "@/lib/shared/youtube";
import { parseEventDate } from "./eventTime";

export type DataIssueSeverity = "error" | "warning" | "info";

export type DataIssue = {
  severity: DataIssueSeverity;
  code: string;
  /** Hoja y fila donde mirar, p. ej. "Batallas · f4-b09 (Fecha 4, Semifinal)". */
  where: string;
  message: string;
  /** Qué cambiar en la hoja. */
  hint?: string;
};

const norm = (s: string) => s.trim().toLowerCase();

function distance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}

const SEVERITY_ORDER: Record<DataIssueSeverity, number> = { error: 0, warning: 1, info: 2 };

/**
 * Revisa que las hojas de la liga sean coherentes entre sí: nombres que no
 * existen en Ranking, ganadores que no pelearon, puntos que no cuadran con las
 * batallas, fechas repetidas, enlaces rotos... Pura: no lee nada, solo mira el
 * payload que ya validó el mapper. No cambia nada; solo informa.
 */
export function validateLeagueData(league: LeaguePayload): DataIssue[] {
  const issues: DataIssue[] = [];
  const add = (i: DataIssue) => issues.push(i);

  const events = league.events;
  const eventById = new Map(events.map((e) => [e.eventId, e]));
  const eventName = (id: string) => eventById.get(id)?.titulo || id;
  const battles = league.battles.filter((b) => b.estado !== "oculta");
  const aliasSet = new Map(league.ranking.map((r) => [norm(r.alias), r.alias]));
  const battleWhere = (b: Battle) => `Batallas · ${b.battleId || "(sin id)"} (${eventName(b.eventId)}, ${b.ronda || "sin ronda"})`;

  // ── Eventos ───────────────────────────────────────────────────────
  const byNumero = new Map<number, LeagueEvent[]>();
  for (const e of events) if (e.numero) byNumero.set(e.numero, [...(byNumero.get(e.numero) ?? []), e]);
  for (const [numero, list] of byNumero) {
    if (list.length > 1)
      add({ severity: "error", code: "FECHA_NUMERO_REPETIDO", where: `Eventos · ${list.map((e) => e.eventId).join(", ")}`,
        message: `El número ${numero} lo usan ${list.map((e) => e.titulo).join(" y ")}.`,
        hint: "Cada fecha debe tener su propio número en la columna numero." });
  }
  for (const e of events) {
    const m = e.titulo.match(/(\d+)/);
    if (m && e.numero && Number(m[1]) !== e.numero)
      add({ severity: "warning", code: "FECHA_NUMERO_NO_COINCIDE", where: `Eventos · ${e.eventId}`,
        message: `"${e.titulo}" tiene numero = ${e.numero}.`, hint: `Cambia numero a ${m[1]} para que coincida con el título.` });

    if (e.fechaEvento && !parseEventDate(e.fechaEvento, e.horaEvento))
      add({ severity: "error", code: "FECHA_INVALIDA", where: `Eventos · ${e.eventId}`,
        message: `fechaEvento "${e.fechaEvento}" no se entiende como fecha.`, hint: "Usa el formato 2026-11-01." });
    if (!e.fechaEvento && ["anunciada", "inscripciones", "en_vivo"].includes(e.estado))
      add({ severity: "warning", code: "FECHA_SIN_DIA", where: `Eventos · ${e.eventId}`,
        message: `${e.titulo} está ${e.estado} pero no tiene fechaEvento, así que no hay cuenta regresiva.` });

    if (e.youtubePlaylist && !asHttpUrl(e.youtubePlaylist))
      add({ severity: "warning", code: "PLAYLIST_NO_ES_URL", where: `Eventos · ${e.eventId}`,
        message: `youtubePlaylist de ${e.titulo} dice "${e.youtubePlaylist.slice(0, 50)}", que no es un enlace.`,
        hint: "Pega la URL completa de la playlist (https://www.youtube.com/playlist?list=...)." });
    if (!e.youtubePlaylist && e.estado === "finalizada" && !league.media.some((m2) => m2.eventId === e.eventId && asHttpUrl(m2.url)))
      add({ severity: "info", code: "PLAYLIST_FALTA", where: `Eventos · ${e.eventId}`,
        message: `${e.titulo} no tiene playlist, así que no se muestra su foto de grupo ni el botón de playlist.` });

    if (e.estado === "finalizada") {
      if (!e.campeon)
        add({ severity: "warning", code: "FECHA_SIN_CAMPEON", where: `Eventos · ${e.eventId}`, message: `${e.titulo} está finalizada pero no tiene campeón.` });
      const final = getFinalBattle(battles, e.eventId);
      if (final?.ganador && e.campeon && norm(final.ganador) !== norm(e.campeon))
        add({ severity: "warning", code: "CAMPEON_NO_COINCIDE_FINAL", where: `Eventos · ${e.eventId}`,
          message: `${e.titulo}: el campeón dice ${e.campeon}, pero la Final la ganó ${final.ganador}.` });
      if (final?.perdedor && e.subcampeon && norm(final.perdedor) !== norm(e.subcampeon))
        add({ severity: "warning", code: "SUBCAMPEON_NO_COINCIDE_FINAL", where: `Eventos · ${e.eventId}`,
          message: `${e.titulo}: el subcampeón dice ${e.subcampeon}, pero la Final la perdió ${final.perdedor}.` });
      if (e.inscripcionesAbiertas)
        add({ severity: "warning", code: "FINALIZADA_CON_INSCRIPCIONES", where: `Eventos · ${e.eventId}`,
          message: `${e.titulo} está finalizada pero tiene inscripcionesAbiertas en TRUE.` });
    }
  }

  // ── Config ────────────────────────────────────────────────────────
  for (const key of ["activeEventId", "featuredEventId", "latestCompletedEventId"]) {
    const id = league.config[key];
    if (id && !eventById.has(id))
      add({ severity: "error", code: "CONFIG_EVENTO_INEXISTENTE", where: `Config · ${key}`,
        message: `${key} apunta a "${id}", que no existe (o está oculto) en Eventos.` });
  }
  const upcoming = [...events].filter((e) => ["anunciada", "inscripciones", "en_vivo"].includes(e.estado)).sort((a, b) => a.orden - b.orden)[0];
  const featured = league.featuredEvent;
  if (upcoming && featured && featured.estado === "finalizada")
    add({ severity: "warning", code: "CONFIG_DESACTUALIZADA", where: "Config · featuredEventId / activeEventId",
      message: `${upcoming.titulo} está ${upcoming.estado}, pero la portada sigue mostrando ${featured.titulo} (finalizada).`,
      hint: `Cambia featuredEventId y activeEventId a ${upcoming.eventId}.` });
  if (!league.config.backgroundVideoId)
    add({ severity: "info", code: "VIDEO_FONDO_VACIO", where: "Config · backgroundVideoId", message: "No hay video de fondo configurado; la portada solo muestra la foto." });

  // ── Batallas ──────────────────────────────────────────────────────
  const idCount = new Map<string, number>();
  for (const b of battles) if (b.battleId) idCount.set(b.battleId, (idCount.get(b.battleId) ?? 0) + 1);

  for (const b of battles) {
    if (!b.battleId) add({ severity: "warning", code: "BATALLA_SIN_ID", where: battleWhere(b), message: "La batalla no tiene battleId." });
    else if ((idCount.get(b.battleId) ?? 0) > 1)
      add({ severity: "error", code: "BATALLA_ID_REPETIDO", where: battleWhere(b), message: `El battleId ${b.battleId} está en más de una fila.` });
    if (!eventById.has(b.eventId))
      add({ severity: "error", code: "BATALLA_EVENTO_INEXISTENTE", where: battleWhere(b), message: `eventId "${b.eventId}" no existe en Eventos.` });

    const players = [b.mc1, b.mc2, b.mc3, b.mc4].filter(Boolean);
    if (b.ganador && b.perdedor && norm(b.ganador) === norm(b.perdedor))
      add({ severity: "error", code: "GANADOR_IGUAL_PERDEDOR", where: battleWhere(b),
        message: `${b.ganador} figura como ganador y como perdedor a la vez (${players.join(" vs ")}).`,
        hint: `Pon como perdedor al otro MC de la batalla.` });
    for (const [role, name] of [["ganador", b.ganador], ["perdedor", b.perdedor]] as const) {
      if (name && !players.some((p) => norm(p) === norm(name)))
        add({ severity: "error", code: "RESULTADO_NO_PARTICIPA", where: battleWhere(b),
          message: `El ${role} "${name}" no es ninguno de los que pelearon (${players.join(" vs ")}).`,
          hint: "Revisa que el nombre esté escrito igual que en mc1 / mc2." });
    }
    if (b.estado === "publicada" && !b.ganador)
      add({ severity: "warning", code: "BATALLA_SIN_RESULTADO", where: battleWhere(b), message: `${players.join(" vs ")} está publicada pero no tiene ganador.` });
    if (b.ganador && !/^(directa|r[eé]plica)$/i.test(b.tipoResultado.trim()))
      add({ severity: "warning", code: "TIPO_RESULTADO_RARO", where: battleWhere(b),
        message: `tipoResultado "${b.tipoResultado}" no es ni directa ni replica, así que se cuenta como directa.` });
    if (b.youtubeUrl && !getYouTubeId(b.youtubeUrl))
      add({ severity: "warning", code: "VIDEO_NO_VALIDO", where: battleWhere(b), message: `youtubeUrl "${b.youtubeUrl.slice(0, 50)}" no parece un video de YouTube.` });
  }

  // El mismo MC dos veces en la misma ronda de una fecha
  const perRound = new Map<string, { name: string; ids: string[] }>();
  for (const b of battles)
    for (const p of [b.mc1, b.mc2, b.mc3, b.mc4].filter(Boolean)) {
      const k = `${b.eventId}|${norm(b.ronda)}|${norm(p)}`;
      const cur = perRound.get(k) ?? { name: p, ids: [] };
      cur.ids.push(b.battleId);
      perRound.set(k, cur);
    }
  for (const [k, v] of perRound)
    if (v.ids.length > 1) {
      const [eventId, ronda] = k.split("|");
      add({ severity: "warning", code: "MC_REPETIDO_EN_RONDA", where: `Batallas · ${v.ids.join(", ")}`,
        message: `${v.name} aparece ${v.ids.length} veces en ${ronda} de ${eventName(eventId)}.` });
    }

  // Nombres de Batallas que no existen en Ranking
  const missing = new Map<string, { name: string; ids: string[] }>();
  for (const b of battles)
    for (const p of [b.mc1, b.mc2, b.mc3, b.mc4].filter(Boolean))
      if (!aliasSet.has(norm(p))) {
        const cur = missing.get(norm(p)) ?? { name: p, ids: [] };
        cur.ids.push(b.battleId || "(sin id)");
        missing.set(norm(p), cur);
      }
  for (const { name, ids } of missing.values()) {
    const close = [...aliasSet.values()].filter((a) => distance(norm(a), norm(name)) <= 2).slice(0, 2);
    add({ severity: "error", code: "MC_NO_ESTA_EN_RANKING", where: `Batallas · ${ids.join(", ")}`,
      message: `"${name}" pelea en Batallas pero no tiene fila en Ranking.`,
      hint: close.length ? `¿Será ${close.join(" o ")}? Si es otro MC, agrégalo a Ranking.` : "Agrégalo a Ranking (aunque tenga 0 puntos)." });
  }

  // ── Ranking ───────────────────────────────────────────────────────
  const seen = new Map<string, string>();
  for (const r of league.ranking) {
    const k = norm(r.alias);
    if (seen.has(k)) add({ severity: "error", code: "RANKING_ALIAS_REPETIDO", where: `Ranking · ${r.alias}`, message: `${r.alias} tiene más de una fila en Ranking.`, hint: "Fusiona las filas en una sola." });
    seen.set(k, r.alias);
    if (r.ultimaFecha && !eventById.has(r.ultimaFecha))
      add({ severity: "warning", code: "ULTIMA_FECHA_INEXISTENTE", where: `Ranking · ${r.alias}`, message: `ultimaFecha "${r.ultimaFecha}" no existe en Eventos.` });
    if (r.replicas > r.victorias + r.derrotas)
      add({ severity: "warning", code: "REPLICAS_IMPOSIBLES", where: `Ranking · ${r.alias}`, message: `${r.alias} tiene más réplicas (${r.replicas}) que batallas (${r.victorias + r.derrotas}).` });
  }
  const names = league.ranking.map((r) => r.alias);
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i], b = names[j];
      if (Math.min(a.length, b.length) >= 4 && distance(norm(a), norm(b)) === 1)
        add({ severity: "warning", code: "ALIAS_PARECIDOS", where: `Ranking · ${a} / ${b}`, message: `"${a}" y "${b}" se escriben casi igual: ¿son la misma persona?` });
    }

  const champs = league.ranking.filter((r) => r.estado === "campeon");
  if (champs.length > 1)
    add({ severity: "warning", code: "VARIOS_CAMPEONES", where: "Ranking · estado", message: `${champs.map((c) => c.alias).join(" y ")} tienen estado "campeon" a la vez.` });
  const latest = league.latestCompletedEvent;
  if (latest?.campeon && champs[0] && norm(champs[0].alias) !== norm(latest.campeon))
    add({ severity: "warning", code: "RANKING_CAMPEON_DISTINTO", where: "Ranking · estado",
      message: `Ranking marca campeón a ${champs[0].alias}, pero ${latest.titulo} dice que ganó ${latest.campeon}.` });

  // Puntos de la tabla contra lo que dan las batallas (solo fechas que tienen batallas)
  const calc = new Map<string, { p: number; v: number; d: number; r: number }>();
  const bump = (n: string) => calc.get(norm(n)) ?? calc.set(norm(n), { p: 0, v: 0, d: 0, r: 0 }).get(norm(n))!;
  for (const b of battles) {
    if (!b.ganador || !b.perdedor || norm(b.ganador) === norm(b.perdedor)) continue;
    const w = bump(b.ganador), l = bump(b.perdedor);
    const rep = isReplica(b.tipoResultado);
    w.v++; l.d++;
    if (rep) { w.p += 2; l.p += 1; w.r++; l.r++; } else w.p += 3;
  }
  const eventsWithoutBattles = events.filter((e) => e.estado === "finalizada" && !battles.some((b) => b.eventId === e.eventId));
  const explainable: string[] = [];
  for (const r of league.ranking) {
    const c = calc.get(norm(r.alias));
    if (!c) continue;
    const where = `Ranking · ${r.alias}`;
    if (r.puntosLiga < c.p)
      add({ severity: "error", code: "PUNTOS_MENORES_QUE_BATALLAS", where, message: `${r.alias} tiene ${r.puntosLiga} puntos en Ranking, pero sus batallas ya suman ${c.p}.`, hint: "Revisa los puntos de Ranking o el resultado de sus batallas." });
    else if (r.puntosLiga > c.p) {
      if (eventsWithoutBattles.length) explainable.push(`${r.alias} (+${+(r.puntosLiga - c.p).toFixed(1)})`);
      else add({ severity: "warning", code: "PUNTOS_MAYORES_QUE_BATALLAS", where,
        message: `${r.alias}: Ranking dice ${r.puntosLiga} y las batallas dan ${c.p}.`,
        hint: "Deberían ser iguales: revisa cuál está mal." });
    }
    for (const [label, tabla, bat] of [["victorias", r.victorias, c.v], ["derrotas", r.derrotas, c.d], ["réplicas", r.replicas, c.r]] as const)
      if (tabla < bat)
        add({ severity: "error", code: "RECORD_MENOR_QUE_BATALLAS", where, message: `${r.alias} tiene ${tabla} ${label} en Ranking, pero sus batallas ya suman ${bat}.` });
  }

  if (explainable.length)
    add({ severity: "info", code: "PUNTOS_MAYORES_QUE_BATALLAS", where: "Ranking",
      message: `${explainable.length} MCs tienen más puntos en Ranking que en sus batallas: ${explainable.join(", ")}.`,
      hint: `Es esperable: ${eventsWithoutBattles.map((e) => e.titulo).join(", ")} no tiene batallas cargadas. Solo es un problema si alguien no jugó esa fecha.` });

  const pending = league.ranking.filter(hasNoStatsYet);
  if (pending.length)
    add({ severity: "info", code: "MCS_SIN_STATS", where: "Ranking", message: `${pending.length} MC(s) sin estadísticas todavía: ${pending.map((p) => p.alias).slice(0, 8).join(", ")}.` });

  // ── Media ─────────────────────────────────────────────────────────
  for (const m of league.media) {
    if (!eventById.has(m.eventId)) add({ severity: "warning", code: "MEDIA_EVENTO_INEXISTENTE", where: `Media · ${m.eventId}`, message: `eventId "${m.eventId}" no existe en Eventos.` });
    if (!asHttpUrl(m.url)) add({ severity: "warning", code: "MEDIA_URL_INVALIDA", where: `Media · ${m.eventId}`, message: `La url "${m.url.slice(0, 50)}" no es un enlace.` });
  }

  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
