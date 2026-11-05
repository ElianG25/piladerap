import { NextResponse } from "next/server";
import { followMcs } from "@/lib/application/notifications/manageSubscription";

/** Guarda a qué MCs sigue una suscripción push ya existente (para mandarle solo sus novedades). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { endpoint?: unknown; aliases?: unknown };
    if (typeof body.endpoint !== "string" || !body.endpoint) {
      return NextResponse.json({ ok: false, error: "ENDPOINT_REQUERIDO" }, { status: 400 });
    }
    const ok = await followMcs(body.endpoint, body.aliases);
    if (!ok) return NextResponse.json({ ok: false, error: "SUSCRIPCION_NO_ENCONTRADA" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/push/follow error:", error);
    return NextResponse.json({ ok: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}
