import { PilaMark } from "@/app/components/ui/PilaMark";

export function LoadingScreen() {
  return (
    <div className="min-h-[100svh] bg-concrete" aria-busy="true" aria-label="Cargando la liga">
      <div className="bg-ink">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <PilaMark height="2.25rem" priority />
          <span className="display text-2xl text-paper">Pila de Ra&apos;</span>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="skeleton h-80 w-full" />
        <div className="skeleton h-72 w-full" />
      </div>
    </div>
  );
}
