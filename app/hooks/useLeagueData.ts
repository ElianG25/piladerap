"use client";

import { useEffect, useState } from "react";
import type { LeaguePayload } from "@/lib/domain/league/types";
import { fetchLeague } from "@/app/lib/leagueClient";

/** Carga la liga, y la refresca sola (más seguido si hay una fecha en vivo). */
export function useLeagueData(options: { refreshMs?: number } = {}) {
  const [league, setLeague] = useState<LeaguePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchLeague()
      .then((data) => { if (mounted) { setLeague(data); setLoading(false); } })
      .catch((err) => { if (mounted) { setError(err instanceof Error ? err.message : "Error desconocido"); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (loading || error) return;
    const isLive = league?.featuredEvent?.estado === "en_vivo";
    const ms = options.refreshMs ?? (isLive ? 30_000 : 120_000);
    const id = setInterval(async () => {
      setRefreshing(true);
      try { const data = await fetchLeague(); setLeague(data); }
      catch { /* silent */ }
      finally { setRefreshing(false); }
    }, ms);
    return () => clearInterval(id);
  }, [loading, error, league?.featuredEvent?.estado, options.refreshMs]);

  return { league, loading, error, refreshing };
}
