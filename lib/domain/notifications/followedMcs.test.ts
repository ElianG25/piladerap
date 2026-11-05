import { describe, it, expect } from "vitest";
import { buildFollowedMcEvents } from "./followedMcs";
import { sanitizeFollowAliases, selectForSubscription } from "./audience";
import type { Battle, LeaguePayload } from "@/lib/domain/league/types";
import type { NotificationEvent } from "./types";

const bt = (p: Partial<Battle>): Battle => ({
  battleId: "b1", eventId: "f4", orden: 1, ronda: "Semifinal", grupo: "", mc1: "Ana", mc2: "Beto", mc3: "", mc4: "",
  ganador: "", perdedor: "", youtubeUrl: "", estado: "publicada", tipoResultado: "directa", cuentaParaLiga: true,
  puntosMc1: 0, puntosMc2: 0, notas: "", ...p,
});
const league = (battles: Battle[]): LeaguePayload => ({
  config: {}, activeEvent: null, featuredEvent: null, latestCompletedEvent: null,
  events: [{ eventId: "f4", numero: 4, titulo: "Fecha 4", label: "", estado: "en_vivo", fechaEvento: "", horaEvento: "", ubicacion: "", maxCupos: 32, campeon: "", subcampeon: "", mvp: "", resumen: "", youtubePlaylist: "", inscripcionesAbiertas: false, visible: true, orden: 4 }],
  registrations: [], participants: [], ranking: [], battles, media: [], capacity: { total: 0, restantes: 32, max: 32 },
});

describe("buildFollowedMcEvents", () => {
  it("avisa del ganador y del perdedor cuando una batalla recibe resultado", () => {
    const prev = league([bt({})]);
    const curr = league([bt({ ganador: "Ana", perdedor: "Beto" })]);
    const events = buildFollowedMcEvents(prev, curr);
    expect(events).toHaveLength(2);
    expect(events[0].audience?.aliases).toEqual(["ana"]);
    expect(events[0].title).toContain("Ana");
    expect(events[1].audience?.aliases).toEqual(["beto"]);
    expect(events[1].url).toBe("/mc/Beto");
  });

  it("no repite avisos de resultados que ya estaban", () => {
    const l = league([bt({ ganador: "Ana", perdedor: "Beto" })]);
    expect(buildFollowedMcEvents(l, l)).toEqual([]);
  });

  it("sin snapshot previo no avisa nada", () => {
    expect(buildFollowedMcEvents(null, league([bt({ ganador: "Ana", perdedor: "Beto" })]))).toEqual([]);
  });

  it("la Final tiene su propio mensaje de campeón y subcampeón", () => {
    const curr = league([bt({ ronda: "Final", ganador: "Ana", perdedor: "Beto" })]);
    const [win, lose] = buildFollowedMcEvents(league([bt({ ronda: "Final" })]), curr);
    expect(win.title).toContain("se coronó");
    expect(lose.title).toContain("subcampeón");
  });
});

describe("selectForSubscription", () => {
  const general: NotificationEvent = { kind: "event_live", title: "g", body: "", url: "/" };
  const mk = (alias: string): NotificationEvent => ({ kind: "mc_result", title: alias, body: "", url: "/", audience: { aliases: [alias] } });

  it("manda los generales a todos y los dirigidos solo a quien sigue al MC", () => {
    const all = [general, mk("ana"), mk("beto")];
    expect(selectForSubscription(all, [])).toEqual([general]);
    expect(selectForSubscription(all, ["Ana"]).map((n) => n.title)).toEqual(["g", "ana"]);
  });

  it("si salen demasiados, manda un resumen", () => {
    const all = [mk("ana"), mk("ana"), mk("ana"), mk("ana"), mk("ana")];
    const out = selectForSubscription(all, ["ana"]);
    expect(out).toHaveLength(3);
    expect(out[2].title).toContain("5 novedades");
  });
});

describe("sanitizeFollowAliases", () => {
  it("limpia, quita repetidos y limita a 5", () => {
    expect(sanitizeFollowAliases([" Ana ", "ana", "", 5, "Beto", "C", "D", "E", "F"])).toEqual(["ana", "beto", "c", "d", "e"]);
    expect(sanitizeFollowAliases("no es lista")).toEqual([]);
  });
});
