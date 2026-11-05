import { describe, it, expect } from "vitest";
import { diffLeagueForNotifications } from "./diffLeague";
import type { LeagueEvent, RankingItem, Battle, LeaguePayload } from "@/lib/domain/league/types";

const mkEvent = (p: Partial<LeagueEvent>): LeagueEvent => ({
  eventId: "e", numero: 0, titulo: "Fecha X", label: "", estado: "futura", fechaEvento: "",
  horaEvento: "", ubicacion: "", maxCupos: 32, campeon: "", subcampeon: "", mvp: "",
  resumen: "", youtubePlaylist: "", inscripcionesAbiertas: false, visible: true, orden: 0, ...p,
});
const mkBattle = (p: Partial<Battle>): Battle => ({
  battleId: "b", eventId: "e", orden: 0, ronda: "", grupo: "", mc1: "", mc2: "", mc3: "",
  mc4: "", ganador: "", perdedor: "", youtubeUrl: "", estado: "publicada", tipoResultado: "",
  cuentaParaLiga: false, puntosMc1: 0, puntosMc2: 0, notas: "", ...p,
});
const mkRank = (p: Partial<RankingItem>): RankingItem => ({
  alias: "x", puntosLiga: 0, victorias: 0, derrotas: 0,
  replicas: 0, bonus: 0, estado: "", ultimaFecha: "", movimiento: "", ...p,
});
const mkLeague = (p: Partial<LeaguePayload>): LeaguePayload => ({
  config: {}, activeEvent: null, featuredEvent: null, latestCompletedEvent: null,
  events: [], registrations: [], participants: [], ranking: [], battles: [], media: [],
  capacity: { total: 0, restantes: 32, max: 32 }, ...p,
});

describe("diffLeagueForNotifications", () => {
  it("no notifica nada en la primera corrida (sin snapshot previo)", () => {
    const current = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "anunciada" })] });
    expect(diffLeagueForNotifications(null, current)).toEqual([]);
  });

  it("detecta una fecha recién anunciada", () => {
    const previous = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "futura" })] });
    const current = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "anunciada", titulo: "Fecha 4" })] });
    const result = diffLeagueForNotifications(previous, current);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("event_announced");
    expect(result[0].body).toContain("Fecha 4");
  });

  it("no repite la notificación si el estado ya era 'anunciada' antes", () => {
    const previous = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "anunciada" })] });
    const current = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "anunciada" })] });
    expect(diffLeagueForNotifications(previous, current)).toEqual([]);
  });

  it("detecta apertura de inscripciones", () => {
    const previous = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "anunciada" })] });
    const current = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "inscripciones" })] });
    const result = diffLeagueForNotifications(previous, current);
    expect(result.map((r) => r.kind)).toContain("registration_open");
  });

  it("detecta cupos bajos solo al cruzar el umbral", () => {
    const activeEvent = mkEvent({ eventId: "e1", estado: "inscripciones" });
    const previous = mkLeague({ activeEvent, capacity: { total: 20, restantes: 12, max: 32 } });
    const current = mkLeague({ activeEvent, capacity: { total: 29, restantes: 3, max: 32 } });
    const result = diffLeagueForNotifications(previous, current);
    expect(result.map((r) => r.kind)).toContain("low_capacity");
    expect(result[0].body).toContain("3");
  });

  it("no repite el aviso de cupos bajos si ya estaba bajo antes", () => {
    const activeEvent = mkEvent({ eventId: "e1", estado: "inscripciones" });
    const previous = mkLeague({ activeEvent, capacity: { total: 29, restantes: 3, max: 32 } });
    const current = mkLeague({ activeEvent, capacity: { total: 30, restantes: 2, max: 32 } });
    expect(diffLeagueForNotifications(previous, current)).toEqual([]);
  });

  it("detecta que un evento pasó a en vivo", () => {
    const previous = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "inscripciones" })] });
    const current = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "en_vivo" })] });
    expect(diffLeagueForNotifications(previous, current).map((r) => r.kind)).toContain("event_live");
  });

  it("detecta un campeón nuevo", () => {
    const previous = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "en_vivo", campeon: "" })] });
    const current = mkLeague({ events: [mkEvent({ eventId: "e1", estado: "finalizada", campeon: "Reimy" })] });
    const result = diffLeagueForNotifications(previous, current);
    expect(result.map((r) => r.kind)).toContain("champion_crowned");
    expect(result.find((r) => r.kind === "champion_crowned")!.body).toContain("Reimy");
  });

  it("detecta un video nuevo en una batalla existente", () => {
    const previous = mkLeague({ battles: [mkBattle({ battleId: "b1", mc1: "A", mc2: "B", youtubeUrl: "" })] });
    const current = mkLeague({ battles: [mkBattle({ battleId: "b1", mc1: "A", mc2: "B", youtubeUrl: "https://youtu.be/x" })] });
    const result = diffLeagueForNotifications(previous, current);
    expect(result.map((r) => r.kind)).toContain("new_video");
    expect(result.find((r) => r.kind === "new_video")!.body).toContain("A vs B");
  });

  it("no notifica si el video ya estaba antes", () => {
    const previous = mkLeague({ battles: [mkBattle({ battleId: "b1", youtubeUrl: "https://youtu.be/x" })] });
    const current = mkLeague({ battles: [mkBattle({ battleId: "b1", youtubeUrl: "https://youtu.be/x" })] });
    expect(diffLeagueForNotifications(previous, current)).toEqual([]);
  });

  it("detecta un cambio en el top 3 del ranking", () => {
    const previous = mkLeague({
      ranking: [
        mkRank({ alias: "A", puntosLiga: 20 }),
        mkRank({ alias: "B", puntosLiga: 10 }),
        mkRank({ alias: "C", puntosLiga: 5 }),
      ],
    });
    const current = mkLeague({
      ranking: [
        mkRank({ alias: "B", puntosLiga: 25 }),
        mkRank({ alias: "A", puntosLiga: 20 }),
        mkRank({ alias: "C", puntosLiga: 5 }),
      ],
    });
    const result = diffLeagueForNotifications(previous, current);
    expect(result.map((r) => r.kind)).toContain("ranking_shuffle");
    expect(result.find((r) => r.kind === "ranking_shuffle")!.body).toContain("B");
  });

  it("no notifica si el top 3 no cambió", () => {
    const ranking = [
      mkRank({ alias: "A", puntosLiga: 20 }),
      mkRank({ alias: "B", puntosLiga: 10 }),
      mkRank({ alias: "C", puntosLiga: 5 }),
    ];
    const previous = mkLeague({ ranking });
    const current = mkLeague({ ranking: [...ranking] });
    expect(diffLeagueForNotifications(previous, current)).toEqual([]);
  });

  it("marca el aviso de top 3 como provisional si todavía hay resultados pendientes", () => {
    const previous = mkLeague({
      ranking: [
        mkRank({ alias: "A", puntosLiga: 20 }),
        mkRank({ alias: "B", puntosLiga: 10 }),
        mkRank({ alias: "C", puntosLiga: 5 }),
      ],
    });
    const current = mkLeague({
      ranking: [
        mkRank({ alias: "B", puntosLiga: 25 }),
        mkRank({ alias: "A", puntosLiga: 20 }),
        mkRank({ alias: "C", puntosLiga: 5 }),
        mkRank({ alias: "D" }), // sin stats aún
      ],
    });
    const shuffle = diffLeagueForNotifications(previous, current).find((r) => r.kind === "ranking_shuffle");
    expect(shuffle?.body).toContain("provisional");
  });

  it("detecta cuando se terminan de cargar los resultados pendientes de la fecha", () => {
    const finishedEvent = mkEvent({ eventId: "e1", estado: "finalizada", titulo: "Fecha 5" });
    const previous = mkLeague({ ranking: [mkRank({ alias: "A" })], latestCompletedEvent: finishedEvent });
    const current = mkLeague({
      ranking: [mkRank({ alias: "A", puntosLiga: 10, victorias: 3 })],
      latestCompletedEvent: finishedEvent,
    });
    const result = diffLeagueForNotifications(previous, current);
    expect(result.map((r) => r.kind)).toContain("results_finalized");
    expect(result.find((r) => r.kind === "results_finalized")!.body).toContain("Fecha 5");
  });

  it("no notifica resultados definitivos si ya no había pendientes antes", () => {
    const ranking = [mkRank({ alias: "A", puntosLiga: 10, victorias: 3 })];
    const previous = mkLeague({ ranking });
    const current = mkLeague({ ranking: [...ranking] });
    expect(diffLeagueForNotifications(previous, current).map((r) => r.kind)).not.toContain("results_finalized");
  });
});
