"use client";

import { useEffect, type RefObject } from "react";

/** Capas abiertas, la última es la de arriba: Escape y Tab solo le hacen caso a esa. */
const layers: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento común de un diálogo modal: bloquea el scroll de la página,
 * lleva el foco adentro y lo atrapa con Tab, cierra con Escape (solo la capa
 * de arriba si hay varias abiertas) y devuelve el foco a quien lo abrió.
 */
export function useModalLayer(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!open) return;
    const id = Symbol("modal");
    layers.push(id);
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (initialFocusRef?.current ?? containerRef.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (layers[layers.length - 1] !== id) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!containerRef.current?.contains(active)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      const i = layers.indexOf(id);
      if (i !== -1) layers.splice(i, 1);
      if (layers.length === 0) document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
    // onClose y los refs son estables para quien llama (useCallback / useRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
