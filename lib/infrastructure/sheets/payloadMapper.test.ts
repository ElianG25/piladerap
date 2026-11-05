import { describe, it, expect } from "vitest";
import { adaptPayload } from "./payloadMapper";

describe("adaptPayload — formato nuevo", () => {
  it("usa IDs del config para featured/active/latest y normaliza hora artefacto", () => {
    const raw = {
      ok: true,
      league: {
        config: { featuredEventId: "e2", activeEventId: "e2", latestCompletedEventId: "e1" },
        events: [
          { eventId: "e1", titulo: "Fecha 1", estado: "finalizada", orden: 1, horaEvento: "1899-12-30T19:00:00" },
          { eventId: "e2", titulo: "Fecha 2", estado: "inscripciones", orden: 2, horaEvento: "20:00", inscripcionesAbiertas: "TRUE" },
        ],
        ranking: [], battles: [], registrations: [],
        capacity: { total: 5, max: 32 },
      },
    };
    const { league } = adaptPayload(raw as Record<string, unknown>);
    expect(league.featuredEvent?.eventId).toBe("e2");
    expect(league.latestCompletedEvent?.eventId).toBe("e1");
    expect(league.events[0].horaEvento).toBe(""); // artefacto 1899 → vacío
    expect(league.events[1].inscripcionesAbiertas).toBe(true); // "TRUE" → true
    expect(league.capacity.restantes).toBe(27); // 32 - 5 derivado
  });

  it("descarta booleano 'FALSE' como string correctamente", () => {
    const raw = {
      ok: true,
      league: { config: {}, events: [{ eventId: "e", inscripcionesAbiertas: "FALSE", visible: "TRUE" }] },
    };
    const { league } = adaptPayload(raw as Record<string, unknown>);
    expect(league.events[0].inscripcionesAbiertas).toBe(false);
    expect(league.events[0].visible).toBe(true);
  });
});

describe("adaptPayload — payload inválido o inesperado", () => {
  it("devuelve una liga vacía si falta 'ok' u 'league' (no lanza)", () => {
    const { league } = adaptPayload({ events: "nope", ranking: 42, battles: null } as Record<string, unknown>);
    expect(league.events).toEqual([]);
    expect(league.ranking).toEqual([]);
    expect(league.battles).toEqual([]);
    expect(league.featuredEvent).toBeNull();
  });

  it("es resiliente a datos basura dentro de un league válido", () => {
    const raw = { ok: true, league: { events: "nope", ranking: 42, battles: null, config: {} } };
    const { league } = adaptPayload(raw as Record<string, unknown>);
    expect(league.events).toEqual([]);
    expect(league.ranking).toEqual([]);
    expect(league.battles).toEqual([]);
  });
});

describe("adaptPayload — privacidad", () => {
  it("no deja pasar nombre, teléfono ni Instagram de las inscripciones", () => {
    const raw = {
      ok: true,
      league: {
        config: {},
        events: [{ eventId: "f5", titulo: "Fecha 5", orden: 5 }],
        registrations: [
          { createdAt: "2026-11-02", eventId: "f5", nombre: "Persona Real", alias: "Zeta", telefono: "8095550000", instagram: "@zeta", estado: "confirmado", source: "web" },
        ],
        participants: [{ eventId: "f5", alias: "Zeta", nombre: "Persona Real", instagram: "@zeta", estado: "inscrito", notas: "x" }],
      },
    };
    const { league } = adaptPayload(raw as Record<string, unknown>);
    expect(league.registrations).toEqual([{ eventId: "f5", alias: "Zeta", estado: "confirmado" }]);
    expect(league.participants).toEqual([{ eventId: "f5", alias: "Zeta", estado: "inscrito" }]);
    const serializado = JSON.stringify(league);
    expect(serializado).not.toContain("8095550000");
    expect(serializado).not.toContain("Persona Real");
    expect(serializado).not.toContain("@zeta");
  });
});
