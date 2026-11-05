"use client";

import { useCallback, useSyncExternalStore } from "react";
import { MAX_FOLLOWS, readFollows, subscribeFollows, writeFollows } from "@/app/lib/followsClient";

const norm = (s: string) => s.trim().toLowerCase();
const EMPTY: string[] = [];

/** MCs que sigue esta persona, con acciones para seguir / dejar de seguir. */
export function useFollows() {
  const follows = useSyncExternalStore(subscribeFollows, readFollows, () => EMPTY);

  const isFollowing = useCallback((alias: string) => follows.some((f) => norm(f) === norm(alias)), [follows]);

  const toggle = useCallback((alias: string): "seguido" | "dejado" | "lleno" => {
    const current = readFollows();
    if (current.some((f) => norm(f) === norm(alias))) {
      writeFollows(current.filter((f) => norm(f) !== norm(alias)));
      return "dejado";
    }
    if (current.length >= MAX_FOLLOWS) return "lleno";
    writeFollows([...current, alias]);
    return "seguido";
  }, []);

  return { follows, isFollowing, toggle, max: MAX_FOLLOWS };
}
