/** Botones de la liga: bloques rectos, texto en mayúsculas, 48px de alto mínimo. */
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40";

/** Tinta con texto amarillo — la acción principal sobre amarillo o cemento. */
export const btnInk = `${base} bg-ink text-pila hover:bg-ink-2`;
/** Amarillo con texto tinta — la acción principal sobre tinta. */
export const btnPila = `${base} bg-pila text-ink hover:bg-paper`;
/** Contorno de tinta — acción secundaria sobre amarillo o cemento. */
export const btnOutline = `${base} border-2 border-ink text-ink hover:bg-ink hover:text-pila`;
