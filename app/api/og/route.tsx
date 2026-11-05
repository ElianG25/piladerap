import { ImageResponse } from "next/og";
import { getLeague } from "@/lib/application/league/getLeague";
import { buildShareHighlights } from "@/lib/application/league/buildShareHighlights";

export const runtime = "edge";
export const revalidate = 60;

export async function GET() {
  const league = await getLeague(60).catch(() => null);
  const { badge, headline, sub, top3, latestChampion } = buildShareHighlights(league);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          backgroundColor: "#101010",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          padding: 60,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", fontSize: 42, fontWeight: 900, color: "#fdee0e" }}>
            PILA DE RA&apos;
          </div>

          <div
            style={{
              display: "flex",
              backgroundColor: "#fdee0e",
              color: "#101010",
              borderRadius: 999,
              padding: "12px 22px",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            {badge}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: headline.length > 22 ? 58 : 76,
            fontWeight: 900,
            lineHeight: 1.05,
          }}
        >
          {headline}
        </div>

        <div style={{ display: "flex", marginTop: 18, fontSize: 28, color: "#fde68a" }}>
          {sub}
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: 16, marginTop: 44, width: "100%" }}>
          {top3.length > 0 ? (
            top3.map((mc, i) => (
              <div
                key={mc.alias}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  backgroundColor: i === 0 ? "rgba(250,204,21,0.14)" : "#18181b",
                  border: i === 0 ? "1px solid rgba(250,204,21,0.4)" : "1px solid #27272a",
                  borderRadius: 20,
                  padding: "20px 12px",
                }}
              >
                <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: i === 0 ? "#fdee0e" : "#a1a1aa" }}>
                  {`#${i + 1}`}
                </div>
                <div style={{ display: "flex", fontSize: 26, fontWeight: 900, color: "#ffffff", marginTop: 6 }}>
                  {mc.alias}
                </div>
                <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#fde68a", marginTop: 4 }}>
                  {mc.puntosLiga} pts
                </div>
              </div>
            ))
          ) : latestChampion ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 20,
                padding: "20px 28px",
              }}
            >
              <div style={{ display: "flex", fontSize: 18, color: "#a1a1aa" }}>Último campeón</div>
              <div style={{ display: "flex", fontSize: 32, fontWeight: 900, color: "#fdee0e" }}>
                {latestChampion}
              </div>
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginTop: "auto",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            fontSize: 24,
            color: "#d4d4d8",
          }}
        >
          <div style={{ display: "flex" }}>Freestyle · República Dominicana</div>
          <div style={{ display: "flex" }}>piladerap.vercel.app</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    }
  );
}
