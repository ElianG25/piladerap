"use client";

/** Comparte un enlace con el menú del teléfono; en PC lo copia. */
export async function shareUrl(title: string, url: string): Promise<"compartido" | "copiado" | "cancelado"> {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "compartido";
    }
    await navigator.clipboard.writeText(url);
    return "copiado";
  } catch {
    return "cancelado";
  }
}
