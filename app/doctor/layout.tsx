"use client";

import React, { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  Users,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  clearDoctorLoginSession,
  DOCTOR_LOGIN_SESSION_KEY,
  DOCTOR_UI_PREVIEW_OFF_KEY,
  getDoctorUiPreviewSession,
  getDoctorUiPreviewSessionRaw,
  getDoctorSessionRemainingMs,
  readDoctorLoginSession,
  suppressDoctorUiPreviewForTab,
} from "@/lib/doctor/session";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/doctor/dashboard",     label: "Today",         Icon: LayoutDashboard },
  { href: "/doctor/pool",          label: "Pool",          Icon: Zap             },
  { href: "/doctor/appointments",  label: "Appointments",  Icon: CalendarDays    },
  { href: "/doctor/patients",      label: "Patients",      Icon: Users           },
  { href: "/doctor/prescriptions", label: "Prescriptions", Icon: ClipboardList   },
  { href: "/doctor/schedule",      label: "My Schedule",   Icon: Stethoscope     },
  { href: "/doctor/settings",      label: "Settings",      Icon: Settings        },
];

function isPublicDoctorRoute(pathname: string) {
  if (pathname === "/doctor/login") return true;
  // /doctor/invite/[token]
  if (pathname.startsWith("/doctor/invite")) return true;
  return false;
}

function subscribeToDoctorSessionChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  function handleStorage(event: StorageEvent) {
    if (
      event.key === DOCTOR_LOGIN_SESSION_KEY ||
      event.key === DOCTOR_UI_PREVIEW_OFF_KEY ||
      event.key === null
    ) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

function readDoctorSessionSnapshot() {
  if (typeof window === "undefined") return null;

  const rawSession = localStorage.getItem(DOCTOR_LOGIN_SESSION_KEY);
  if (rawSession) return rawSession;

  return getDoctorUiPreviewSessionRaw();
}

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicDoctorRoute(pathname);
  const sessionRaw = useSyncExternalStore(
    subscribeToDoctorSessionChanges,
    readDoctorSessionSnapshot,
    () => null,
  );
  const session = useMemo(() => {
    if (!sessionRaw) return null;
    return readDoctorLoginSession() ?? getDoctorUiPreviewSession();
  }, [sessionRaw]);

  useEffect(() => {
    if (isPublic) return;
    if (!session) {
      router.replace("/doctor/login");
    }
  }, [isPublic, router, session]);

  useEffect(() => {
    if (isPublic || !session) return;
    const remainingMs = getDoctorSessionRemainingMs(session);
    if (remainingMs === null) return;
    if (remainingMs <= 0) {
      clearDoctorLoginSession();
      router.replace("/doctor/login");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearDoctorLoginSession();
      router.replace("/doctor/login");
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [isPublic, session, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!session) return null;

  function handleLogout() {
    clearDoctorLoginSession();
    if (process.env.NEXT_PUBLIC_DOCTOR_UI_PREVIEW === "true") {
      suppressDoctorUiPreviewForTab();
    }
    router.replace("/doctor/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-card lg:flex">
          <div className="flex h-full w-full flex-col">
            <div className="border-b border-border px-5 py-5">
              <div className="flex items-center gap-3">
                <BrandMark size={34} className="h-8 w-8" />
                <div>
                  <p className="font-display text-lg font-bold tracking-tight text-foreground">
                    Bimble
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Doctor workspace
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Current clinic
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground" suppressHydrationWarning>
                  {session.clinicName}
                </p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {session.clinicSlug}
                </p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Navigation
              </p>
              <div className="space-y-1">
                {NAV_ITEMS.map(({ href, label, Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{label}</span>
                      {active ? <span className="ml-auto h-2 w-2 rounded-full bg-current/80" /> : null}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-border p-4">
              <a
                href={session.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary">
                  <ExternalLink className="h-4 w-4" />
                </span>
                <span className="flex-1">Open OSCAR</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>

              <div className="mt-4 flex justify-center">
                <ThemeToggle />
              </div>

              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-card lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <BrandMark size={32} className="h-8 w-8 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground" suppressHydrationWarning>
                    {session.clinicName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                    {session.clinicSlug}
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
              {NAV_ITEMS.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
