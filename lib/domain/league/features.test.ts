import { describe, it, expect } from "vitest";
import { computeMovement, eventPoints, mcHistory } from "./standings";
import { getHeadToHead, getRivals } from "./headToHead";
import { getChampionsHall, getSeasonRecords } from "./records";
import { mcSlug } from "./mcPhoto";
import type { Battle, LeagueEvent, RankingItem } from "./types";

const rk = (alias: string, puntosLiga: number, victorias = 0, derrotas = 0, replicas = 0): RankingItem => ({
  alias, puntosLiga, victorias, derrotas, replicas, bonus: 0, estado: "", ultimaFecha: "", movimiento: "",
});
let n = 0;
const bt = (eventId: string, ronda: string, w: string, l: string, tipo = "directa"): Battle => ({
  battleId: `b${++n}`, eventId, orden: n, ronda, grupo: "", mc1: w, mc2: l, mc3: "", mc4: "", ganador: w, perdedor: l,
  youtubeUrl: "", estado: "publicada", tipoResultado: tipo, cuentaParaLiga: true, puntosMc1: 0, puntosMc2: 0, notas: "",
});
const ev = (eventId: string, orden: number, p: Partial<LeagueEvent> = {}): LeagueEvent => ({
  eventId, numero: orden, titulo: `Fecha ${orden}`, label: "", estado: "finalizada", fechaEvento: "", horaEvento: "", ubicacion: "",
  maxCupos: 32, campeon: "", subcampeon: "", mvp: "", resumen: "", youtubePlaylist: "", inscripcionesAbiertas: false, visible: true, orden, ...p,
});

describe("standings", () => {
  const battles = [bt("f2", "Final", "Ana", "Beto"), bt("f3", "Final", "Beto", "Ana", "replica"), bt("f3", "Octavos", "Beto", "Cris")];

  it("suma los puntos de una fecha con 3/2/1/0", () => {
    const p = eventPoints(battles, "f3");
    expect(p.get("beto")).toBe(5);
    expect(p.get("ana")).toBe(1);
  });

  it("calcula cuánto subió cada MC con la última fecha y quién debutó", () => {
    const ranking = [rk("Beto", 5, 2, 1, 1), rk("Ana", 4, 1, 1, 1), rk("Cris", 0, 0, 1, 0)];
    const m = computeMovement(ranking, battles, "f3");
    expect(m.get("beto")?.delta).toBe(1);
    expect(m.get("ana")?.delta).toBe(-1);
    expect(m.get("cris")?.debut).toBe(true);
    expect(m.get("beto")?.puntosFecha).toBe(5);
  });

  it("quien no peleó en la fecha no sube ni baja", () => {
    const ranking = [rk("Beto", 5, 2, 1, 1), rk("Ana", 4, 1, 1, 1), rk("Cris", 0, 0, 1, 0), rk("Zeta", 3, 1, 0, 0)];
    const m = computeMovement(ranking, battles, "f3");
    expect(m.get("zeta")?.jugo).toBe(false);
    expect(m.get("zeta")?.delta).toBeNull();
  });

  it("sin batallas de esa fecha no hay movimiento", () => {
    expect(computeMovement([rk("Ana", 3)], battles, "f9").size).toBe(0);
  });

  it("historial por fecha, de la más reciente a la más vieja", () => {
    const h = mcHistory(battles, [ev("f2", 2), ev("f3", 3)], "Ana");
    expect(h.map((x) => [x.event.eventId, x.puntos])).toEqual([["f3", 1], ["f2", 3]]);
  });
});

describe("headToHead", () => {
  const battles = [bt("f2", "Final", "Ana", "Beto"), bt("f3", "Final", "Beto", "Ana"), bt("f3", "Octavos", "Ana", "Cris")];

  it("lista rivales por veces cruzados", () => {
    const r = getRivals(battles, "Ana");
    expect(r[0]).toEqual({ alias: "Beto", veces: 2, ganadas: 1, perdidas: 1 });
    expect(r[1].alias).toBe("Cris");
  });

  it("busca las batallas entre dos MCs", () => {
    expect(getHeadToHead(battles, "ana", "BETO")).toHaveLength(2);
    expect(getHeadToHead(battles, "Ana", "Zeta")).toHaveLength(0);
  });
});

describe("records", () => {
  it("racha más larga, sin perder y más fechas ganadas", () => {
    const battles = [bt("f2", "Octavos", "Ana", "X"), bt("f2", "Cuartos", "Ana", "Y"), bt("f2", "Semifinal", "Ana", "Z"), bt("f2", "Final", "W", "Ana")];
    const events = [ev("f1", 1, { campeon: "Ana" }), ev("f2", 2, { campeon: "Ana" })];
    const rec = getSeasonRecords([rk("Ana", 9, 3, 1, 0), rk("Dina", 12, 4, 0, 1)], battles, events);
    const by = (id: string) => rec.find((r) => r.id === id);
    expect(by("racha")?.valor).toBe("3");
    expect(by("racha")?.quienes).toEqual(["Ana"]);
    expect(by("invicto")?.quienes).toEqual(["Dina"]);
    expect(by("titulos")?.valor).toBe("2");
  });

  it("salón de campeones con conteo de títulos", () => {
    const h = getChampionsHall([ev("f1", 1, { campeon: "Dina" }), ev("f2", 2, { campeon: "Ana" }), ev("f3", 3, { campeon: "Dina" })]);
    expect(h.fechas.map((f) => f.campeon)).toEqual(["Dina", "Ana", "Dina"]);
    expect(h.titulos[0]).toEqual({ alias: "Dina", veces: 2 });
  });
});

describe("mcSlug", () => {
  it("normaliza acentos, espacios y puntos", () => {
    expect(mcSlug("Ñaña Free")).toBe("nana-free");
    expect(mcSlug("D.I El Lirico")).toBe("d-i-el-lirico");
    expect(mcSlug("SEVENZ 8")).toBe("sevenz-8");
  });
});
