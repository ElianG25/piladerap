import { describe, it, expect } from "vitest";
import { sortRanking, getPublicEvents, getPublishedBattles, getEventById, isSectionEnabled, getVisibleMedia, getEventPlaylist, hasNoStatsYet, hasPendingResults } from "./rules";
import type { RankingItem, LeagueEvent, Battle, MediaItem } from "./types";

const mkRank = (p: Partial<RankingItem>): RankingItem => ({
  alias: "x", puntosLiga: 0, victorias: 0, derrotas: 0,
  replicas: 0, bonus: 0, estado: "", ultimaFecha: "", movimiento: "", ...p,
});
const mkEvent = (p: Partial<LeagueEvent>): LeagueEvent => ({
  eventId: "e", numero: 0, titulo: "", label: "", estado: "futura", fechaEvento: "",
  horaEvento: "", ubicacion: "", maxCupos: 0, campeon: "", subcampeon: "", mvp: "",
  resumen: "", youtubePlaylist: "", inscripcionesAbiertas: false, visible: true, orden: 0, ...p,
});
const mkBattle = (p: Partial<Battle>): Battle => ({
  battleId: "b", eventId: "e", orden: 0, ronda: "", grupo: "", mc1: "", mc2: "", mc3: "",
  mc4: "", ganador: "", perdedor: "", youtubeUrl: "", estado: "publicada", tipoResultado: "",
  cuentaParaLiga: false, puntosMc1: 0, puntosMc2: 0, notas: "", ...p,
});
const mkMedia = (p: Partial<MediaItem>): MediaItem => ({
  eventId: "e", tipo: "playlist", titulo: "", url: "https://youtube.com/x", visible: true, orden: 0, ...p,
});

describe("sortRanking", () => {
  it("ordena por puntosLiga desc y desempata por victorias", () => {
    const r = sortRanking([
      mkRank({ alias: "A", puntosLiga: 10, victorias: 1 }),
      mkRank({ alias: "B", puntosLiga: 20 }),
      mkRank({ alias: "C", puntosLiga: 10, victorias: 5 }),
    ]);
    expect(r.map((x) => x.alias)).toEqual(["B", "C", "A"]);
  });
  it("no muta el array original", () => {
    const orig = [mkRank({ alias: "A", puntosLiga: 1 }), mkRank({ alias: "B", puntosLiga: 2 })];
    sortRanking(orig);
    expect(orig[0].alias).toBe("A");
  });
});

describe("getPublicEvents", () => {
  it("excluye ocultos/invisibles y ordena por orden", () => {
    const ev = getPublicEvents([
      mkEvent({ eventId: "2", orden: 2 }),
      mkEvent({ eventId: "h", estado: "oculta", orden: 1 }),
      mkEvent({ eventId: "i", visible: false, orden: 1 }),
      mkEvent({ eventId: "1", orden: 1 }),
    ]);
    expect(ev.map((e) => e.eventId)).toEqual(["1", "2"]);
  });
});

describe("getPublishedBattles", () => {
  it("excluye ocultas y ordena por evento y orden", () => {
    const b = getPublishedBattles([
      mkBattle({ battleId: "x", eventId: "e1", orden: 2 }),
      mkBattle({ battleId: "o", estado: "oculta", eventId: "e1", orden: 1 }),
      mkBattle({ battleId: "y", eventId: "e1", orden: 1 }),
    ]);
    expect(b.map((x) => x.battleId)).toEqual(["y", "x"]);
  });
});

describe("getEventById", () => {
  it("encuentra por id o devuelve null", () => {
    const events = [mkEvent({ eventId: "a" }), mkEvent({ eventId: "b" })];
    expect(getEventById(events, "b")?.eventId).toBe("b");
    expect(getEventById(events, "z")).toBeNull();
  });
});

describe("isSectionEnabled", () => {
  it("está habilitado por defecto si el flag no viene o el config no existe", () => {
    expect(isSectionEnabled(undefined, "showRanking")).toBe(true);
    expect(isSectionEnabled({}, "showRanking")).toBe(true);
    expect(isSectionEnabled({ showRanking: "TRUE" }, "showRanking")).toBe(true);
  });
  it("solo se deshabilita con 'FALSE' explícito", () => {
    expect(isSectionEnabled({ showRanking: "FALSE" }, "showRanking")).toBe(false);
  });
});

describe("getVisibleMedia", () => {
  it("excluye invisibles y sin url, y ordena por orden", () => {
    const media = getVisibleMedia([
      mkMedia({ eventId: "2", orden: 2 }),
      mkMedia({ eventId: "oculto", visible: false, orden: 1 }),
      mkMedia({ eventId: "sin-url", url: "", orden: 1 }),
      mkMedia({ eventId: "1", orden: 1 }),
    ]);
    expect(media.map((m) => m.eventId)).toEqual(["1", "2"]);
  });
});

describe("getEventPlaylist", () => {
  it("encuentra la playlist de un evento", () => {
    const media = [mkMedia({ eventId: "fecha-2", tipo: "playlist", url: "https://youtube.com/p" })];
    expect(getEventPlaylist(media, "fecha-2")?.url).toBe("https://youtube.com/p");
  });
  it("devuelve null si el evento no tiene playlist", () => {
    const media = [mkMedia({ eventId: "fecha-2", tipo: "playlist" })];
    expect(getEventPlaylist(media, "fecha-3")).toBeNull();
  });
  it("ignora entradas de media que no son playlist", () => {
    const media = [mkMedia({ eventId: "fecha-2", tipo: "foto" })];
    expect(getEventPlaylist(media, "fecha-2")).toBeNull();
  });
});

describe("hasNoStatsYet", () => {
  it("true si todos los campos numéricos están en 0", () => {
    expect(hasNoStatsYet(mkRank({}))).toBe(true);
  });
  it("false si tiene al menos un campo distinto de 0", () => {
    expect(hasNoStatsYet(mkRank({ derrotas: 1 }))).toBe(false);
    expect(hasNoStatsYet(mkRank({ replicas: 1 }))).toBe(false);
  });
});

describe("hasPendingResults", () => {
  it("true si al menos un MC no tiene stats cargadas", () => {
    expect(hasPendingResults([mkRank({ alias: "A", puntosLiga: 10 }), mkRank({ alias: "B" })])).toBe(true);
  });
  it("false si todos los MCs ya tienen stats", () => {
    expect(hasPendingResults([mkRank({ alias: "A", puntosLiga: 10 }), mkRank({ alias: "B", derrotas: 1 })])).toBe(false);
  });
  it("false con ranking vacío", () => {
    expect(hasPendingResults([])).toBe(false);
  });
});
