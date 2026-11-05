"use client";

import { PilaMark } from "@/app/components/ui/PilaMark";
import { btnInk } from "@/app/components/ui/buttons";

export function ErrorScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-pila px-6 text-center text-ink">
      <PilaMark height="5rem" tone="ink" />
      <h1 className="display mt-6 text-5xl">No se pudo cargar</h1>
      <p className="mt-3 max-w-xs text-base font-semibold">
        {message || "La información de la liga no está disponible ahora mismo."}
      </p>
      <button onClick={() => window.location.reload()} className={`${btnInk} mt-8`}>
        Intentar otra vez
      </button>
    </div>
  );
}
