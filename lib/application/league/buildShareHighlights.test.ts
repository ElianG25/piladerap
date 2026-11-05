import { describe, it, expect } from "vitest";
import { buildShareHighlights } from "./buildShareHighlights";
import type { Battle, LeagueEvent, LeaguePayload, RankingItem } from "@/lib/domain/league/types";

const ev = (p: Partial<LeagueEvent>): LeagueEvent => ({
  eventId: "f4", numero: 4, titulo: "Fecha 4", label: "", estado: "finalizada", fechaEvento: "2026-11-01",
  horaEvento: "3:00 PM", ubicacion: "Plaza Revolución", maxCupos: 32, campeon: "Dinamita", subcampeon: "Numenosis",
  mvp: "", resumen: "", youtubePlaylist: "", inscripcionesAbiertas: false, visible: true, orden: 4, ...p,
});
const rk = (alias: string, puntosLiga: number): RankingItem => ({
  alias, puntosLiga, victorias: 1, derrotas: 0, replicas: 0, bonus: 0, estado: "", ultimaFecha: "", movimiento: "",
});
const final: Battle = {
  battleId: "f4-b15", eventId: "f4", orden: 16, ronda: "Final", grupo: "", mc1: "Numenosis", mc2: "Dinamita", mc3: "", mc4: "",
  ganador: "Dinamita", perdedor: "Numenosis", youtubeUrl: "https://www.youtube.com/watch?v=zxc5royhRlQ", estado: "publicada",
  tipoResultado: "directa", cuentaParaLiga: true, puntosMc1: 0, puntosMc2: 0, notas: "",
};
const league = (p: Partial<LeaguePayload>): LeaguePayload => ({
  config: {}, activeEvent: null, featuredEvent: null, latestCompletedEvent: null, events: [], registrations: [],
  participants: [], ranking: [], battles: [], media: [], capacity: { total: 0, restantes: 32, max: 32 }, ...p,
});

describe("buildShareHighlights", () => {
  it("sin datos usa un mensaje por defecto", () => {
    const h = buildShareHighlights(null);
    expect(h.headline).toBe("La plaza sigue viva");
    expect(h.top3).toEqual([]);
    expect(h.photoVideoId).toBeNull();
  });

  it("muestra al campeón de la última fecha con la foto de su final", () => {
    const f4 = ev({});
    const h = buildShareHighlights(league({ featuredEvent: f4, latestCompletedEvent: f4, battles: [final], ranking: [rk("Reimy", 35), rk("Dinamita", 23), rk("Leamback", 13.5)] }));
    expect(h.headline).toBe("Dinamita");
    expect(h.lead).toBe("Campeón de la Fecha 4");
    expect(h.detail).toBe("Subcampeón Numenosis");
    expect(h.photoVideoId).toBe("zxc5royhRlQ");
    expect(h.top3.map((t) => t.puntos)).toEqual(["35", "23", "13.5"]);
  });

  it("si hay una fecha por venir, la destaca con su día y lugar", () => {
    const f4 = ev({});
    const f5 = ev({ eventId: "f5", titulo: "Fecha 5", estado: "inscripciones", fechaEvento: "2026-12-06", campeon: "", subcampeon: "" });
    const h = buildShareHighlights(league({ featuredEvent: f5, latestCompletedEvent: f4, battles: [final] }));
    expect(h.headline).toBe("Fecha 5");
    expect(h.lead).toBe("Inscripciones abiertas");
    expect(h.detail).toContain("Plaza Revolución");
    expect(h.photoVideoId).toBe("zxc5royhRlQ");
  });
});
