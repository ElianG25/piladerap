import { describe, it, expect } from "vitest";
import { validateLeagueData } from "./dataHealth";
import type { Battle, LeagueEvent, LeaguePayload, RankingItem } from "./types";

const ev = (p: Partial<LeagueEvent>): LeagueEvent => ({
  eventId: "f1", numero: 1, titulo: "Fecha 1", label: "", estado: "finalizada", fechaEvento: "2026-05-30",
  horaEvento: "3:00 PM", ubicacion: "", maxCupos: 32, campeon: "", subcampeon: "", mvp: "", resumen: "",
  youtubePlaylist: "https://youtube.com/playlist?list=A", inscripcionesAbiertas: false, visible: true, orden: 1, ...p,
});
const rk = (p: Partial<RankingItem>): RankingItem => ({
  alias: "x", puntosLiga: 1, victorias: 0, derrotas: 1, replicas: 0, bonus: 0, estado: "", ultimaFecha: "", movimiento: "", ...p,
});
const bt = (p: Partial<Battle>): Battle => ({
  battleId: "b1", eventId: "f1", orden: 1, ronda: "Final", grupo: "", mc1: "Ana", mc2: "Beto", mc3: "", mc4: "",
  ganador: "Ana", perdedor: "Beto", youtubeUrl: "https://youtu.be/abcdefghijk", estado: "publicada",
  tipoResultado: "directa", cuentaParaLiga: true, puntosMc1: 0, puntosMc2: 0, notas: "", ...p,
});
const league = (p: Partial<LeaguePayload>): LeaguePayload => ({
  config: { backgroundVideoId: "x" }, activeEvent: null, featuredEvent: null, latestCompletedEvent: null,
  events: [ev({})], registrations: [], participants: [], ranking: [], battles: [], media: [],
  capacity: { total: 0, restantes: 32, max: 32 }, ...p,
});
const codes = (l: LeaguePayload) => validateLeagueData(l).map((i) => i.code);

describe("validateLeagueData", () => {
  it("datos coherentes no producen avisos", () => {
    const l = league({
      events: [ev({ campeon: "Ana", subcampeon: "Beto" })],
      ranking: [rk({ alias: "Ana", puntosLiga: 3, victorias: 1, derrotas: 0 }), rk({ alias: "Beto", puntosLiga: 0, victorias: 0, derrotas: 1 })],
      battles: [bt({})],
    });
    expect(validateLeagueData(l)).toEqual([]);
  });

  it("detecta ganador igual al perdedor", () => {
    const l = league({ ranking: [rk({ alias: "Ana" }), rk({ alias: "Beto" })], battles: [bt({ ganador: "Ana", perdedor: "Ana" })] });
    expect(codes(l)).toContain("GANADOR_IGUAL_PERDEDOR");
  });

  it("detecta un resultado de alguien que no peleó", () => {
    const l = league({ ranking: [rk({ alias: "Ana" }), rk({ alias: "Beto" })], battles: [bt({ perdedor: "Cris" })] });
    expect(codes(l)).toContain("RESULTADO_NO_PARTICIPA");
  });

  it("detecta un MC de Batallas que no está en Ranking y sugiere el parecido", () => {
    const l = league({ ranking: [rk({ alias: "Leamback" }), rk({ alias: "Beto" })], battles: [bt({ mc1: "Leamback", mc2: "Leanback", ganador: "Beto", perdedor: "Leamback" })] });
    const issue = validateLeagueData(l).find((i) => i.code === "MC_NO_ESTA_EN_RANKING");
    expect(issue?.message).toContain("Leanback");
    expect(issue?.hint).toContain("Leamback");
  });

  it("detecta números de fecha repetidos y que no coinciden con el título", () => {
    const l = league({ events: [ev({ eventId: "f3", numero: 3, titulo: "Fecha 3" }), ev({ eventId: "f4", numero: 3, titulo: "Fecha 4", orden: 2 })] });
    expect(codes(l)).toContain("FECHA_NUMERO_REPETIDO");
    expect(codes(l)).toContain("FECHA_NUMERO_NO_COINCIDE");
  });

  it("detecta puntos de Ranking menores a los de sus batallas", () => {
    const l = league({
      ranking: [rk({ alias: "Ana", puntosLiga: 1, victorias: 1, derrotas: 0 }), rk({ alias: "Beto" })],
      battles: [bt({})],
    });
    expect(codes(l)).toContain("PUNTOS_MENORES_QUE_BATALLAS");
  });

  it("si faltan batallas de una fecha, que Ranking tenga más puntos es solo informativo", () => {
    const l = league({
      events: [ev({ eventId: "f1" }), ev({ eventId: "f2", numero: 2, titulo: "Fecha 2", orden: 2 })],
      ranking: [rk({ alias: "Ana", puntosLiga: 9, victorias: 3, derrotas: 0 }), rk({ alias: "Beto" })],
      battles: [bt({ eventId: "f2" })],
    });
    const issue = validateLeagueData(l).find((i) => i.code === "PUNTOS_MAYORES_QUE_BATALLAS");
    expect(issue?.severity).toBe("info");
  });

  it("avisa cuando la portada sigue en una fecha finalizada y hay una nueva", () => {
    const old = ev({ eventId: "f4", numero: 4, titulo: "Fecha 4", orden: 4 });
    const next = ev({ eventId: "f5", numero: 5, titulo: "Fecha 5", estado: "inscripciones", orden: 5 });
    expect(codes(league({ events: [old, next], featuredEvent: old }))).toContain("CONFIG_DESACTUALIZADA");
  });

  it("detecta playlist con texto suelto y campeón que no coincide con la Final", () => {
    const l = league({
      events: [ev({ youtubePlaylist: "(17) FECHA 2 - YouTube", campeon: "Beto" })],
      ranking: [rk({ alias: "Ana" }), rk({ alias: "Beto" })],
      battles: [bt({})],
    });
    expect(codes(l)).toContain("PLAYLIST_NO_ES_URL");
    expect(codes(l)).toContain("CAMPEON_NO_COINCIDE_FINAL");
  });

  it("detecta alias repetidos y casi iguales en Ranking", () => {
    const l = league({ ranking: [rk({ alias: "Kasaatx" }), rk({ alias: "Kassatx" }), rk({ alias: "kasaatx" })] });
    expect(codes(l)).toContain("RANKING_ALIAS_REPETIDO");
    expect(codes(l)).toContain("ALIAS_PARECIDOS");
  });

  it("ordena primero los errores", () => {
    const l = league({ ranking: [rk({ alias: "Ana" }), rk({ alias: "Beto" })], battles: [bt({ ganador: "Ana", perdedor: "Ana" })], config: {} });
    const sev = validateLeagueData(l).map((i) => i.severity);
    expect(sev[0]).toBe("error");
    expect(sev[sev.length - 1]).toBe("info");
  });

  it("revisa las fotos: archivos sin MC y MCs sin foto", () => {
    const l = league({ ranking: [rk({ alias: "Ñaña Free" }), rk({ alias: "Reimy" })] });
    const issues = validateLeagueData(l, { photoSlugs: ["nana-free", "reimi"] });
    const sinMc = issues.find((i) => i.code === "FOTO_SIN_MC");
    expect(sinMc?.hint).toContain("Reimy");
    expect(issues.find((i) => i.code === "FOTOS_FALTAN")?.message).toContain("Reimy");
  });

  it("sin fotos en la carpeta no molesta con avisos de fotos", () => {
    const l = league({ ranking: [rk({ alias: "Reimy" })] });
    expect(validateLeagueData(l, { photoSlugs: [] }).map((i) => i.code)).not.toContain("FOTOS_FALTAN");
  });
});
