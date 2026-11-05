import { describe, it, expect } from "vitest";
import { buildCalendarIcs, buildEventIcs, mapsUrl } from "./calendar";
import type { LeagueEvent } from "@/lib/domain/league/types";

const ev = (p: Partial<LeagueEvent>): LeagueEvent => ({
  eventId: "fecha-5", numero: 5, titulo: "Fecha 5", label: "", estado: "anunciada", fechaEvento: "2026-12-06",
  horaEvento: "3:00 PM", ubicacion: "Plaza Revolución", maxCupos: 32, campeon: "", subcampeon: "", mvp: "",
  resumen: "", youtubePlaylist: "", inscripcionesAbiertas: false, visible: true, orden: 5, ...p,
});

describe("buildEventIcs", () => {
  it("arma un evento con fecha y hora locales", () => {
    const ics = buildEventIcs(ev({}))!;
    expect(ics).toContain("DTSTART:20261206T150000");
    expect(ics).toContain("SUMMARY:Pila de Ra'");
    expect(ics).toContain("LOCATION:Plaza Revolución");
  });
  it("devuelve null sin fecha válida", () => {
    expect(buildEventIcs(ev({ fechaEvento: "" }))).toBeNull();
  });
});

describe("mapsUrl", () => {
  it("codifica el lugar", () => {
    expect(mapsUrl("Plaza X")).toContain("query=Plaza%20X%2C%20Santo%20Domingo");
  });
});

describe("buildCalendarIcs", () => {
  it("junta todas las fechas con día válido y descarta las ocultas o sin fecha", () => {
    const ics = buildCalendarIcs([ev({ eventId: "f5" }), ev({ eventId: "f6", fechaEvento: "" }), ev({ eventId: "f7", estado: "oculta" })]);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain("UID:f5@piladerap.vercel.app");
    expect(ics).toContain("X-WR-CALNAME");
  });
});
