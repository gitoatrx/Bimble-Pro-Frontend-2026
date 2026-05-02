"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import { readPatientLoginSession } from "@/lib/patient/session";
import { buildRealtimeUrl } from "@/lib/realtime-url";

export type BimbleRealtimeEvent = {
  type: string;
  id?: string;
  path?: string;
  method?: string;
  status_code?: number;
  actor?: Record<string, unknown>;
  scope?: Record<string, unknown>;
  created_at?: string;
};

export const BIMBLE_REALTIME_EVENT = "bimble:realtime";
export const BIMBLE_REALTIME_STATUS_EVENT = "bimble:realtime:status";

type RealtimeConnectionState = "idle" | "connecting" | "open" | "closed" | "error";

type BimbleRealtimeStatusEvent = {
  state: RealtimeConnectionState;
  url: string;
  code?: number;
  reason?: string;
  error?: string;
};

function getSessionToken(pathname: string) {
  if (pathname.startsWith("/clinic")) {
    return readClinicLoginSession()?.accessToken ?? "";
  }
  if (pathname.startsWith("/doctor")) {
    return readDoctorLoginSession()?.accessToken ?? "";
  }
  if (pathname.startsWith("/patient") || pathname.startsWith("/patient-portal")) {
    return readPatientLoginSession()?.accessToken ?? "";
  }
  return "";
}

function isPublicAuthPage(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/doctor/login" ||
    pathname.startsWith("/doctor/invite") ||
    pathname === "/patient-portal"
  );
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const retryTimerRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(1000);
  const accessToken = useMemo(() => getSessionToken(pathname), [pathname]);

  useEffect(() => {
    if (!accessToken || isPublicAuthPage(pathname) || typeof window === "undefined") {
      return;
    }

    let closed = false;

    function dispatchStatus(status: BimbleRealtimeStatusEvent) {
      if (typeof window === "undefined") {
        return;
      }

      window.dispatchEvent(
        new CustomEvent<BimbleRealtimeStatusEvent>(BIMBLE_REALTIME_STATUS_EVENT, {
          detail: status,
        }),
      );
    }

    function scheduleReconnect() {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }

      const delay = reconnectDelayRef.current;
      retryTimerRef.current = window.setTimeout(() => {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
        connect();
      }, delay);
    }

    function connect() {
      if (closed) return;
      const url = buildRealtimeUrl(accessToken);
      const socket = new WebSocket(url);
      socketRef.current = socket;
      dispatchStatus({ state: "connecting", url });

      socket.onopen = () => {
        reconnectDelayRef.current = 1000;
        dispatchStatus({ state: "open", url });
      };

      socket.onmessage = (message) => {
        let event: BimbleRealtimeEvent | null = null;
        try {
          const parsed = JSON.parse(message.data) as unknown;
          if (parsed && typeof parsed === "object") {
            event = parsed as BimbleRealtimeEvent;
          }
        } catch {
          event = null;
        }

        if (!event || typeof event.type !== "string" || typeof event.path !== "string") {
          return;
        }

        const eventType = event.type.trim().toLowerCase();
        const shouldRefresh =
          eventType === "data.changed" ||
          eventType === "data.updated" ||
          eventType === "resource.changed" ||
          eventType === "resource.updated" ||
          eventType.endsWith(".changed") ||
          eventType.endsWith(".updated");

        if (!shouldRefresh) return;

        window.dispatchEvent(
          new CustomEvent<BimbleRealtimeEvent>(BIMBLE_REALTIME_EVENT, {
            detail: event,
          }),
        );
      };

      socket.onerror = () => {
        dispatchStatus({ state: "error", url, error: "WebSocket connection error" });
      };

      socket.onclose = () => {
        socketRef.current = null;
        dispatchStatus({ state: "closed", url });
        if (!closed) {
          scheduleReconnect();
        }
      };
    }

    connect();

    return () => {
      closed = true;
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [accessToken, pathname]);

  return <>{children}</>;
}
