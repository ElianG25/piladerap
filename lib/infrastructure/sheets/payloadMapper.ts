import { z } from "zod";
import type { LeagueEvent, LeaguePayload, RankingItem, Battle, Registration, Participant, MediaItem } from "@/lib/domain/league/types";

/* ── Coerciones seguras ──────────────────────────────────────────── */
const str = z.preprocess((v) => (v == null ? "" : v), z.coerce.string()).catch("").default("");
const num = z.preprocess((v) => (v == null ? 0 : v), z.coerce.number()).catch(0).default(0);

/** Booleano tolerante: "FALSE"/"0"/"no"/"" → false (Boolean() los daría truthy). */
const bool = z
  .any()
  .transform((v) => {
    if (typeof v === "boolean") return v;
    const s = String(v ?? "").trim().toLowerCase();
    return !(s === "" || s === "false" || s === "0" || s === "no" || s === "n");
  })
  .catch(false)
  .default(false);

const ESTADOS = ["futura", "anunciada", "inscripciones", "en_vivo", "finalizada", "oculta"] as const;
const estado = z
  .any()
  .transform((v) => {
    const s = String(v ?? "").trim();
    return (ESTADOS as readonly string[]).includes(s) ? s : "futura";
  })
  .catch("futura")
  .default("futura") as z.ZodType<LeagueEvent["estado"]>;

/* ── Esquemas ─────────────────────────────────────────────────────── */
const EventSchema: z.ZodType<LeagueEvent> = z.object({
  eventId: str,
  numero: num,
  titulo: str,
  label: str,
  estado,
  fechaEvento: str,
  horaEvento: str,
  ubicacion: str,
  maxCupos: num,
  campeon: str,
  subcampeon: str,
  mvp: str,
  resumen: str,
  youtubePlaylist: str,
  inscripcionesAbiertas: bool,
  visible: bool,
  orden: num,
  coverUrl: z.string().optional(),
});

const RankingSchema: z.ZodType<RankingItem> = z.object({
  alias: str,
  puntosLiga: num,
  victorias: num,
  derrotas: num,
  replicas: num,
  bonus: num,
  estado: str,
  ultimaFecha: str,
  movimiento: str,
});

const BattleSchema: z.ZodType<Battle> = z.object({
  battleId: str,
  eventId: str,
  orden: num,
  ronda: str,
  grupo: str,
  mc1: str,
  mc2: str,
  mc3: str,
  mc4: str,
  ganador: str,
  perdedor: str,
  youtubeUrl: str,
  estado: str,
  tipoResultado: str,
  cuentaParaLiga: bool,
  puntosMc1: num,
  puntosMc2: num,
  notas: str,
});

/* Zod descarta las claves que no declaramos: nombre, teléfono e Instagram de las
   inscripciones nunca pasan de aquí, así que no llegan al JSON público. */
const RegistrationSchema: z.ZodType<Registration> = z.object({
  eventId: str,
  alias: str,
  estado: str,
});

const ParticipantSchema: z.ZodType<Participant> = z.object({
  eventId: str,
  alias: str,
  estado: str,
});

const MediaSchema: z.ZodType<MediaItem> = z.object({
  eventId: str,
  tipo: str,
  titulo: str,
  url: str,
  visible: bool,
  orden: num,
});

/** Parsea cada elemento de un array; descarta los que ni siquiera son objetos. */
function parseArray<T>(value: unknown, schema: z.ZodType<T>, label: string): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    const res = schema.safeParse(item);
    if (res.success) out.push(res.data);
    else console.warn(`[adaptPayload] elemento inválido en ${label}:`, res.error.issues?.[0]?.message);
  }
  return out;
}

/** Limpia artefacto de Sheets: hora leída como fecha "1899-12-30...". */
function normalizeTime(value: string): string {
  if (!value || value.startsWith("1899-12-30")) return "";
  return value;
}

function normalizeEvent(event: LeagueEvent): LeagueEvent {
  return { ...event, horaEvento: normalizeTime(event.horaEvento) };
}

/**
 * Transforma el payload crudo del Apps Script ({ ok, league }) al shape que
 * espera la aplicación. Valida y normaliza con zod para evitar errores
 * silenciosos si cambia el contenido de Sheets; ante un payload que no
 * cumpla el contrato (ok !== true, league ausente), devuelve una liga vacía
 * en vez de lanzar.
 */
export function adaptPayload(raw: Record<string, unknown>): { ok: true; league: LeaguePayload } {
  const rawLeague = (raw.ok === true && raw.league != null ? raw.league : {}) as Record<string, unknown>;
  const config = (rawLeague.config ?? {}) as Record<string, string>;
  const events = parseArray(rawLeague.events, EventSchema, "events").map(normalizeEvent);

  const byId = (id: unknown) =>
    typeof id === "string" && id ? events.find((e) => e.eventId === id) ?? null : null;

  const pickEvent = (cfgId: unknown, fallback: unknown): LeagueEvent | null => {
    const fromCfg = byId(cfgId);
    if (fromCfg) return fromCfg;
    const parsed = fallback ? EventSchema.safeParse(fallback) : null;
    return parsed && parsed.success ? normalizeEvent(parsed.data) : null;
  };

  const league: LeaguePayload = {
    config,
    events,
    featuredEvent: pickEvent(config.featuredEventId, rawLeague.featuredEvent),
    activeEvent: pickEvent(config.activeEventId, rawLeague.activeEvent),
    latestCompletedEvent: pickEvent(config.latestCompletedEventId, rawLeague.latestCompletedEvent),
    registrations: parseArray(rawLeague.registrations, RegistrationSchema, "registrations"),
    participants: parseArray(rawLeague.participants, ParticipantSchema, "participants"),
    ranking: parseArray(rawLeague.ranking, RankingSchema, "ranking"),
    battles: parseArray(rawLeague.battles, BattleSchema, "battles"),
    media: parseArray(rawLeague.media, MediaSchema, "media"),
    capacity: normalizeCapacity(rawLeague.capacity),
  };

  return { ok: true, league };
}

function normalizeCapacity(value: unknown): LeaguePayload["capacity"] {
  const c = (value ?? {}) as Record<string, unknown>;
  const total = Number(c.total) || 0;
  const max = Number(c.max) || 0;
  const restantes = c.restantes != null ? Number(c.restantes) || 0 : Math.max(0, max - total);
  return { total, restantes, max };
}
