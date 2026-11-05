import type { EventStatus } from "@/lib/domain/league/types";

type EventStatusBadgeProps = { status: EventStatus | string };

const STATUS_LABELS: Record<string, string> = {
  futura: "Por anunciar",
  anunciada: "Anunciada",
  inscripciones: "Inscripciones abiertas",
  en_vivo: "Hoy",
  finalizada: "Finalizada",
  oculta: "Oculta",
};

/** Cada estado se distingue por forma y texto, no solo por color. */
const STATUS_STYLES: Record<string, string> = {
  futura: "border-2 border-ink text-ink",
  anunciada: "bg-pila text-ink",
  inscripciones: "bg-ink text-pila",
  en_vivo: "bg-live text-paper",
  finalizada: "bg-ink text-paper",
  oculta: "border-2 border-muted text-muted",
};

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const key = status || "futura";
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-bold uppercase leading-none tracking-wide ${STATUS_STYLES[key] || STATUS_STYLES.futura}`}>
      {STATUS_LABELS[key] || key}
    </span>
  );
}
