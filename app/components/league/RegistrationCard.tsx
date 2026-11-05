"use client";

import { FormEvent, useState } from "react";
import type { LeagueEvent, Registration } from "@/lib/domain/league/types";
import { getErrorMessage } from "@/lib/domain/league/registrationErrors";
import { formatEventDate } from "@/lib/shared/format";
import { usePushSubscription } from "@/app/hooks/usePushSubscription";
import { BellIcon } from "@/app/components/ui/icons";
import { btnInk, btnPila } from "@/app/components/ui/buttons";

type RegistrationCardProps = {
  activeEvent: LeagueEvent | null;
  capacity: { total: number; restantes: number; max: number };
  registrations: Registration[];
};
type FormState = { nombre: string; alias: string; telefono: string; instagram: string };
const blank: FormState = { nombre: "", alias: "", telefono: "", instagram: "" };

const FIELDS = [
  { key: "nombre", label: "Nombre completo", type: "text", autoComplete: "name", hint: "" },
  { key: "alias", label: "Tu AKA (nombre artístico)", type: "text", autoComplete: "nickname", hint: "" },
  { key: "telefono", label: "Teléfono", type: "tel", autoComplete: "tel-national", hint: "10 dígitos, sin guiones" },
  { key: "instagram", label: "Instagram (opcional)", type: "text", autoComplete: "off", hint: "" },
] as const;

/** Estado cerrado: en vez de un formulario apagado, un aviso claro y la forma de enterarse cuando abran. */
function ClosedNotice() {
  const { status, isSubscribed, busy, subscribe } = usePushSubscription();
  return (
    <div className="on-ink board mt-6 p-5">
      <p className="text-lg font-bold">La próxima fecha todavía no abre inscripciones.</p>
      <p className="mt-1 text-base text-muted-ink">Activa los avisos y te escribimos apenas se abran los cupos.</p>
      {status === "ready" && !isSubscribed && (
        <button type="button" onClick={subscribe} disabled={busy} className={`${btnPila} mt-4`}>
          <BellIcon className="h-4 w-4" />
          {busy ? "…" : "Activar avisos"}
        </button>
      )}
      {isSubscribed && <p className="mt-4 text-base font-bold text-pila">Ya tienes los avisos activados.</p>}
      {status === "ios_needs_install" && (
        <p className="mt-4 text-base text-paper">
          En iPhone: toca Compartir → Agregar a inicio, y abre la app desde ahí para activar los avisos.
        </p>
      )}
    </div>
  );
}

export function RegistrationCard({ activeEvent, capacity, registrations }: RegistrationCardProps) {
  const [form, setForm] = useState<FormState>(blank);
  const [hp, setHp] = useState(""); // honeypot anti-spam (debe quedar vacío)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isOpen = Boolean(activeEvent?.inscripcionesAbiertas);
  const anotados = registrations
    .filter((r) => r.eventId === activeEvent?.eventId && ["pendiente", "confirmado", "inscrito"].includes(r.estado))
    .map((r) => r.alias)
    .filter(Boolean);
  const pct = capacity.max > 0 ? Math.min(100, Math.round((capacity.total / capacity.max) * 100)) : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/league", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: hp, eventId: activeEvent?.eventId ?? "" }),
      });
      const data = await res.json();
      if (!data.ok) {
        setStatus("error");
        setMessage(getErrorMessage(data.error));
        return;
      }
      setStatus("success");
      setMessage("Inscripción recibida. Te esperamos en la plaza.");
      setForm(blank);
    } catch {
      setStatus("error");
      setMessage("Error de conexión. Inténtalo nuevamente.");
    }
  }

  return (
    <section aria-labelledby="inscripcion-titulo" className="mx-auto max-w-xl">
      <h2 id="inscripcion-titulo" className="display text-5xl sm:text-6xl">
        {isOpen ? "Asegura tu cupo" : "Inscripciones cerradas"}
      </h2>

      {!isOpen ? (
        <ClosedNotice />
      ) : (
        <>
          <p className="mt-3 text-base text-muted">
            {`${activeEvent?.titulo || "La próxima fecha"}${activeEvent?.fechaEvento ? ` · ${formatEventDate(activeEvent.fechaEvento)}` : ""}${activeEvent?.ubicacion ? ` · ${activeEvent.ubicacion}` : ""}.`}
          </p>

          <div className="mt-5">
            <p className="num text-lg font-bold">{capacity.restantes} de {capacity.max} cupos libres</p>
            <div className="mt-1.5 h-3 border-2 border-ink" role="presentation">
              <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Honeypot anti-spam: oculto a humanos, los bots lo rellenan */}
            <input
              type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
              value={hp} onChange={(e) => setHp(e.target.value)}
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />
            {FIELDS.map(({ key, label, type, autoComplete, hint }) => (
              <div key={key}>
                <label htmlFor={`reg-${key}`} className="text-sm font-bold">{label}</label>
                {hint && <span className="ml-2 text-sm text-muted">{hint}</span>}
                <input
                  id={`reg-${key}`}
                  value={form[key]} type={type} autoComplete={autoComplete}
                  inputMode={key === "telefono" ? "numeric" : undefined}
                  onChange={(e) => {
                    const val = key === "telefono" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value;
                    setForm((c) => ({ ...c, [key]: val }));
                  }}
                  disabled={status === "loading"}
                  className="mt-1 min-h-12 w-full border-2 border-ink bg-paper px-3 text-ink focus:bg-white disabled:opacity-50"
                />
              </div>
            ))}

            <button type="submit" disabled={status === "loading"} className={`${btnInk} w-full`}>
              {status === "loading" ? "Enviando…" : "Inscribirme"}
            </button>
          </form>
        </>
      )}

      {isOpen && anotados.length > 0 && (
        <section aria-labelledby="anotados-titulo" className="mt-10 border-t-2 border-ink pt-5">
          <h3 id="anotados-titulo" className="display text-3xl">Ya están anotados</h3>
          <p className="mt-1 text-sm text-muted">Solo se muestran los nombres artísticos, nunca los datos de contacto.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {anotados.map((a) => (
              <li key={a} className="border-2 border-ink px-3 py-1.5 text-sm font-bold uppercase">{a}</li>
            ))}
          </ul>
        </section>
      )}

      <div role="status" aria-live="polite">
        {message && (
          <p className={`mt-5 px-4 py-3 text-base font-bold ${status === "success" ? "bg-ink text-pila" : "bg-live text-paper"}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
