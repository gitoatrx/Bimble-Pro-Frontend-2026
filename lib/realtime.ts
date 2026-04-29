"use client";

import { useEffect } from "react";
import { BIMBLE_REALTIME_EVENT, type BimbleRealtimeEvent } from "@/components/realtime-provider";

type RealtimeRefreshOptions = {
  enabled?: boolean;
  paths?: string[];
  debounceMs?: number;
};

export function useRealtimeRefresh(
  refresh: () => void | Promise<void>,
  { enabled = true, paths, debounceMs = 400 }: RealtimeRefreshOptions = {},
) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let timer: number | null = null;

    function handleRealtime(event: Event) {
      const detail = (event as CustomEvent<BimbleRealtimeEvent>).detail;
      if (paths?.length && detail?.path && !paths.some((path) => detail.path?.includes(path))) {
        return;
      }

      if (timer !== null) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
        void refresh();
      }, debounceMs);
    }

    window.addEventListener(BIMBLE_REALTIME_EVENT, handleRealtime);

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      window.removeEventListener(BIMBLE_REALTIME_EVENT, handleRealtime);
    };
  }, [debounceMs, enabled, paths, refresh]);
}
