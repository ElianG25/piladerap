import { describe, it, expect } from "vitest";
import { rankLeague } from "./ranking";
import { battlePoints, isReplica } from "./scoring";
import { getMcBattles, summarizeMcBattles } from "./profile";
import { getFinalBattle, groupByRound, roundRank } from "./rounds";
import type { Battle, RankingItem } from "./types";

const mkRank = (p: Partial<RankingItem>): RankingItem => ({
  alias: "x", puntosLiga: 0, victorias: 0, derrotas: 0,
  replicas: 0, bonus: 0, estado: "", ultimaFecha: "", movimiento: "", ...p,
});
const mkBattle = (p: Partial<Battle>): Battle => ({
  battleId: "b", eventId: "e", orden: 0, ronda: "Octavos", grupo: "", mc1: "", mc2: "", mc3: "",
  mc4: "", ganador: "", perdedor: "", youtubeUrl: "", estado: "publicada", tipoResultado: "directa",
  cuentaParaLiga: true, puntosMc1: 0, puntosMc2: 0, notas: "", ...p,
});

describe("rankLeague", () => {
  it("ordena por puntos de liga", () => {
    const r = rankLeague([mkRank({ alias: "A", puntosLiga: 5 }), mkRank({ alias: "B", puntosLiga: 9 })], []);
    expect(r.map((x) => [x.alias, x.posicion])).toEqual([["B", 1], ["A", 2]]);
  });

  it("desempata por cruce directo", () => {
    const r = rankLeague(
      [mkRank({ alias: "Ana", puntosLiga: 5 }), mkRank({ alias: "Beto", puntosLiga: 5 })],
      [mkBattle({ ganador: "Beto", perdedor: "Ana", mc1: "Ana", mc2: "Beto" })]
    );
    expect(r.map((x) => x.alias)).toEqual(["Beto", "Ana"]);
    expect(r.map((x) => x.posicion)).toEqual([1, 2]);
    expect(r.every((x) => !x.empatado)).toBe(true);
  });

  it("si no hubo cruce, el empate se mantiene y comparten posición", () => {
    const r = rankLeague(
      [mkRank({ alias: "A", puntosLiga: 9 }), mkRank({ alias: "B", puntosLiga: 5 }), mkRank({ alias: "C", puntosLiga: 5 }), mkRank({ alias: "D", puntosLiga: 1 })],
      []
    );
    expect(r.map((x) => x.posicion)).toEqual([1, 2, 2, 4]);
    expect(r[1].empatado && r[2].empatado).toBe(true);
    expect(r[0].empatado).toBe(false);
  });

  it("ignora cruces con MCs que no están empatados", () => {
    const r = rankLeague(
      [mkRank({ alias: "A", puntosLiga: 5 }), mkRank({ alias: "B", puntosLiga: 5 }), mkRank({ alias: "C", puntosLiga: 9 })],
      [mkBattle({ ganador: "C", perdedor: "A" })]
    );
    expect(r.map((x) => x.posicion)).toEqual([1, 2, 2]);
  });

  it("con tres empatados usa una mini-tabla de cruces", () => {
    const r = rankLeague(
      [mkRank({ alias: "A", puntosLiga: 4 }), mkRank({ alias: "B", puntosLiga: 4 }), mkRank({ alias: "C", puntosLiga: 4 })],
      [mkBattle({ ganador: "A", perdedor: "B" }), mkBattle({ ganador: "A", perdedor: "C" })]
    );
    expect(r.map((x) => [x.alias, x.posicion])).toEqual([["A", 1], ["B", 2], ["C", 2]]);
  });

  it("no muta el array original", () => {
    const orig = [mkRank({ alias: "A", puntosLiga: 1 }), mkRank({ alias: "B", puntosLiga: 2 })];
    rankLeague(orig, []);
    expect(orig[0].alias).toBe("A");
  });
});

describe("scoring", () => {
  it("aplica 3/2/1/0", () => {
    expect(battlePoints("directa", true)).toBe(3);
    expect(battlePoints("replica", true)).toBe(2);
    expect(battlePoints("replica", false)).toBe(1);
    expect(battlePoints("directa", false)).toBe(0);
    expect(isReplica("Réplica")).toBe(true);
  });
});

describe("getMcBattles", () => {
  const battles = [
    mkBattle({ battleId: "1", eventId: "fecha-2", ronda: "Octavos", ganador: "Ana", perdedor: "Beto", tipoResultado: "replica" }),
    mkBattle({ battleId: "2", eventId: "fecha-3", ronda: "Final", ganador: "Cris", perdedor: "Ana" }),
    mkBattle({ battleId: "3", eventId: "fecha-3", ronda: "Octavos", ganador: "Ana", perdedor: "Dan" }),
    mkBattle({ battleId: "4", eventId: "fecha-3", ronda: "Octavos", ganador: "Eli", perdedor: "Fer" }),
  ];
  it("devuelve solo las batallas del MC, de lo más reciente a lo más viejo", () => {
    const r = getMcBattles(battles, "ana");
    expect(r.map((x) => x.battle.battleId)).toEqual(["2", "3", "1"]);
    expect(r.map((x) => x.puntos)).toEqual([0, 3, 2]);
  });
  it("resume puntos y récord", () => {
    expect(summarizeMcBattles(getMcBattles(battles, "Ana"))).toEqual({ puntos: 5, victorias: 2, derrotas: 1, replicas: 1 });
  });
});

describe("rounds", () => {
  it("ordena las rondas en el orden de juego", () => {
    expect(roundRank("Octavos")).toBeLessThan(roundRank("Cuartos"));
    expect(roundRank("Final")).toBeLessThan(roundRank("Tercer Puesto"));
  });
  it("agrupa por ronda", () => {
    const g = groupByRound([mkBattle({ ronda: "Final" }), mkBattle({ ronda: "Octavos", orden: 2 }), mkBattle({ ronda: "Octavos", orden: 1, battleId: "x" })]);
    expect(g.map((x) => x.ronda)).toEqual(["Octavos", "Final"]);
    expect(g[0].battles[0].battleId).toBe("x");
  });
  it("encuentra la final sin confundirla con la semifinal", () => {
    const f = getFinalBattle([mkBattle({ battleId: "s", ronda: "Semifinal" }), mkBattle({ battleId: "f", ronda: "Final" })], "e");
    expect(f?.battleId).toBe("f");
  });
});
