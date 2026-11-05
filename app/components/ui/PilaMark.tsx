import Image from "next/image";

type PilaMarkProps = {
  /** Alto del símbolo (cualquier unidad CSS). */
  height?: string;
  /** "pila" = amarillo de marca (sobre tinta); "ink" = silueta de tinta (sobre amarillo). */
  tone?: "pila" | "ink";
  priority?: boolean;
};

/**
 * La pila del logo, recortada de los márgenes del PNG original. Todo el
 * tamaño se expresa en `em` sobre el alto pedido, así escala sin saltos.
 */
export function PilaMark({ height = "2.25rem", tone = "pila", priority = false }: PilaMarkProps) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden"
      style={{ fontSize: height, height: "1em", width: "0.527em" }}
    >
      <Image
        src="/logo.png"
        alt="Pila de Ra'"
        width={1855}
        height={2400}
        sizes="96px"
        priority={priority}
        className="absolute max-w-none"
        style={{
          width: "0.939em",
          height: "1.215em",
          left: "-0.2005em",
          top: "-0.1288em",
          filter: tone === "ink" ? "brightness(0)" : undefined,
        }}
      />
    </span>
  );
}
