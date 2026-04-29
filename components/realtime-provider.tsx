"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import { readPatientLoginSession } from "@/lib/patient/session";

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

function buildRealtimeUrl(accessToken: string) {
  const configured = process.env.NEXT_PUBLIC_BIMBLE_WS_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    url.searchParams.set("access_token", accessToken);
    return url.toString();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname || "localhost";
  const url = new URL(`${protocol}//${hostname}:8000/api/v1/realtime/ws`);
  url.searchParams.set("access_token", accessToken);
  return url.toString();
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
  const accessToken = useMemo(() => getSessionToken(pathname), [pathname]);

  useEffect(() => {
    if (!accessToken || isPublicAuthPage(pathname) || typeof window === "undefined") {
      return;
    }

    let closed = false;

    function connect() {
      if (closed) return;
      const socket = new WebSocket(buildRealtimeUrl(accessToken));
      socketRef.current = socket;

      socket.onmessage = (message) => {
        let event: BimbleRealtimeEvent;
        try {
          event = JSON.parse(message.data) as BimbleRealtimeEvent;
        } catch {
          return;
        }

        if (event.type !== "data.changed") return;

        window.dispatchEvent(
          new CustomEvent<BimbleRealtimeEvent>(BIMBLE_REALTIME_EVENT, {
            detail: event,
          }),
        );
      };

      socket.onclose = () => {
        socketRef.current = null;
        if (!closed) {
          retryTimerRef.current = window.setTimeout(connect, 3000);
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
