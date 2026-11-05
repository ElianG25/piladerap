import { describe, it, expect } from "vitest";
import { rankLeague } from "./ranking";
import { battlePoints, isReplica } from "./scoring";
import { getMcBattles, summarizeMcBattles } from "./profile";
import { getFinalBattle, groupByRound, orderBracketRounds, roundRank } from "./rounds";
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

describe("orderBracketRounds", () => {
  // Fecha 4 real, con las batallas de Cuartos y Octavos en el orden de la hoja (que no cuadra)
  const b = (id: string, ronda: string, mc1: string, mc2: string, orden: number) =>
    mkBattle({ battleId: id, ronda, mc1, mc2, orden, ganador: mc1, perdedor: mc2 });
  const rounds = [
    { ronda: "Octavos", battles: [
      b("o1", "Octavos", "Chase", "Felpa Divo", 1), b("o2", "Octavos", "Mecha", "Numenosis", 2),
      b("o3", "Octavos", "Baltrip", "Leamback", 3), b("o4", "Octavos", "Jakob", "Kico Rankiao", 4),
      b("o5", "Octavos", "Aekis", "Draco", 5), b("o6", "Octavos", "Th3ra", "R16", 6),
      b("o7", "Octavos", "Jonah", "Reimy", 7), b("o8", "Octavos", "Inty", "Dinamita", 8),
    ] },
    { ronda: "Cuartos", battles: [
      b("c1", "Cuartos", "Kico Rankiao", "Numenosis", 9), b("c2", "Cuartos", "Draco", "Dinamita", 10),
      b("c3", "Cuartos", "Felpa Divo", "Leamback", 11), b("c4", "Cuartos", "R16", "Reimy", 12),
    ] },
    { ronda: "Semifinal", battles: [b("s1", "Semifinal", "Reimy", "Dinamita", 13), b("s2", "Semifinal", "Leamback", "Numenosis", 14)] },
    { ronda: "Final", battles: [b("f", "Final", "Numenosis", "Dinamita", 15)] },
  ];

  it("ordena las rondas para que cuadren según quién peleó contra quién", () => {
    const { rounds: ordered, problems } = orderBracketRounds(rounds);
    expect(problems).toEqual([]);
    const ids = (i: number) => ordered[i].battles.map((x) => x.battleId);
    expect(ids(3)).toEqual(["f"]);
    expect(ids(2)).toEqual(["s2", "s1"]); // la Final es Numenosis vs Dinamita
    expect(ids(1)).toEqual(["c3", "c1", "c4", "c2"]);
    expect(ids(0)).toEqual(["o1", "o3", "o4", "o2", "o6", "o7", "o5", "o8"]);
  });

  it("cada batalla queda al lado de la que la alimenta", () => {
    const { rounds: ordered } = orderBracketRounds(rounds);
    // en cada ronda posterior, la batalla i debe tener como participantes a ganadores/participantes de las posiciones 2i y 2i+1 anteriores
    for (let k = 1; k < ordered.length; k++) {
      ordered[k].battles.forEach((later, i) => {
        const feeders = [ordered[k - 1].battles[2 * i], ordered[k - 1].battles[2 * i + 1]];
        const players = [later.mc1, later.mc2];
        for (const p of players) {
          expect(feeders.some((fd) => [fd.mc1, fd.mc2].includes(p))).toBe(true);
        }
      });
    }
  });

  it("avisa cuando un MC aparece en una ronda sin haber peleado en la anterior", () => {
    const broken = [
      { ronda: "Semifinal", battles: [b("s1", "Semifinal", "A", "B", 1), b("s2", "Semifinal", "C", "D", 2)] },
      { ronda: "Final", battles: [b("f", "Final", "A", "Z", 3)] },
    ];
    const { problems } = orderBracketRounds(broken);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join(" ")).toContain("Z");
  });
});
