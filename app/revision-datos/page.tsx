import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeague } from "@/lib/application/league/getLeague";
import { validateLeagueData, type DataIssue, type DataIssueSeverity } from "@/lib/domain/league/dataHealth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revisión de datos",
  robots: { index: false, follow: false },
};

const GROUPS: { severity: DataIssueSeverity; title: string; blurb: string; chip: string }[] = [
  { severity: "error", title: "Errores", blurb: "Datos que se contradicen: la web puede mostrar algo incorrecto.", chip: "bg-live text-paper" },
  { severity: "warning", title: "Avisos", blurb: "Probablemente un descuido; conviene revisarlos.", chip: "bg-pila text-ink" },
  { severity: "info", title: "Para tener en cuenta", blurb: "No son errores, pero explican cosas que se ven en la web.", chip: "border-2 border-ink text-ink" },
];

function IssueItem({ issue, chip }: { issue: DataIssue; chip: string }) {
  return (
    <li className="border-2 border-ink bg-paper p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-1 text-xs font-bold uppercase leading-none ${chip}`}>{issue.where}</span>
      </div>
      <p className="mt-2 text-base font-semibold">{issue.message}</p>
      {issue.hint && <p className="mt-1 text-sm text-muted">Cómo arreglarlo: {issue.hint}</p>}
      <p className="mt-2 text-xs text-muted">{issue.code}</p>
    </li>
  );
}

/**
 * Revisión de coherencia de las hojas de la liga. Es de uso interno: en
 * producción solo abre con `?key=` igual a CRON_SECRET (la misma llave del cron).
 */
export default async function RevisionDatosPage({ searchParams }: { searchParams: Promise<{ key?: string | string[] }> }) {
  const { key } = await searchParams;
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || key !== secret)) notFound();

  let issues: DataIssue[] = [];
  let loadError = "";
  try {
    issues = validateLeagueData(await getLeague(0));
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudo leer la hoja.";
  }

  const count = (s: DataIssueSeverity) => issues.filter((i) => i.severity === s).length;

  return (
    <main className="min-h-[100svh] bg-concrete px-4 py-8 text-ink sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="display text-5xl sm:text-6xl">Revisión de datos</h1>
        <p className="mt-3 max-w-prose text-base text-muted">
          Compara las hojas de la liga entre sí y avisa de lo que no cuadra. No cambia nada: tú corriges en Google Sheets y
          recargas esta página. La web pública usa los datos con un retraso de hasta un minuto.
        </p>

        {loadError ? (
          <p className="mt-6 bg-live px-4 py-3 text-base font-bold text-paper">No se pudo leer la hoja: {loadError}</p>
        ) : issues.length === 0 ? (
          <p className="mt-6 bg-ink px-4 py-3 text-base font-bold text-pila">Todo cuadra: no encontré nada raro.</p>
        ) : (
          <p className="num mt-6 text-lg font-bold">
            {count("error")} errores · {count("warning")} avisos · {count("info")} notas
          </p>
        )}

        {GROUPS.map((g) => {
          const list = issues.filter((i) => i.severity === g.severity);
          if (list.length === 0) return null;
          return (
            <section key={g.severity} className="mt-8" aria-labelledby={`g-${g.severity}`}>
              <h2 id={`g-${g.severity}`} className="display text-4xl">{g.title}</h2>
              <p className="mt-1 text-sm text-muted">{g.blurb}</p>
              <ul className="mt-3 space-y-3">
                {list.map((i, idx) => <IssueItem key={`${i.code}-${idx}`} issue={i} chip={g.chip} />)}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
