import { SCORING_RULES, THIRD_PLACE_BONUS } from "@/lib/domain/league/scoring";

/** Las reglas de puntos a la vista: quien mira la tabla entiende por qué alguien va primero. */
export function ScoringRules({ compact = false, narrow = false }: { compact?: boolean; narrow?: boolean }) {
  return (
    <section aria-labelledby="reglas-titulo" className={compact ? "" : "border-2 border-ink p-4 sm:p-5"}>
      <h3 id="reglas-titulo" className="display text-2xl sm:text-3xl">Cómo se puntúa</h3>
      <dl className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-3 ${narrow ? "" : "sm:grid-cols-4"}`}>
        {SCORING_RULES.map((r) => (
          <div key={r.label} className="flex items-baseline gap-3 border-t-2 border-ink pt-2">
            <dd className="display num order-first text-4xl">{r.puntos}</dd>
            <dt className="text-sm font-semibold leading-tight">{r.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
        <strong className="font-bold text-ink">Tercer puesto:</strong> no da esos puntos; quien lo gana suma{" "}
        <span className="num font-bold text-ink">{THIRD_PLACE_BONUS}</span> punto extra, y no cuenta como victoria ni derrota.
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Si dos MCs terminan con los mismos puntos, gana quien le ganó al otro en una batalla directa.
        Si nunca se cruzaron, el empate se mantiene y comparten posición.
      </p>
    </section>
  );
}
