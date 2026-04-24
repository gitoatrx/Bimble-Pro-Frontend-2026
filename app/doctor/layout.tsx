"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
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
  isDoctorOnboardingComplete,
  readDoctorLoginSession,
  storeDoctorLoginSession,
  suppressDoctorUiPreviewForTab,
} from "@/lib/doctor/session";
import { fetchDoctorClinics, type DoctorClinicListItem } from "@/lib/api/doctor-dashboard";
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
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isOnboardingRoute = pathname === "/doctor/onboarding";
  const sessionRaw = useSyncExternalStore(
    subscribeToDoctorSessionChanges,
    readDoctorSessionSnapshot,
    () => null,
  );
  const session = useMemo(() => {
    if (!hydrated || !sessionRaw) return null;
    return readDoctorLoginSession() ?? getDoctorUiPreviewSession();
  }, [hydrated, sessionRaw]);
  const [clinics, setClinics] = useState<DoctorClinicListItem[]>([]);
  const [switchingClinic, setSwitchingClinic] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadClinics() {
      if (!session?.accessToken) {
        if (active) setClinics([]);
        return;
      }

      try {
        const items = await fetchDoctorClinics(session.accessToken);
        if (active) {
          setClinics(items);
        }
      } catch {
        if (active) {
          setClinics([]);
        }
      }
    }

    void loadClinics();
    return () => {
      active = false;
    };
  }, [session?.accessToken, session?.clinicSlug]);

  useEffect(() => {
    if (!hydrated || isPublic) return;
    if (!session) {
      router.replace("/doctor/login");
      return;
    }

    if (!isDoctorOnboardingComplete(session.doctorId) && pathname !== "/doctor/onboarding") {
      router.replace("/doctor/onboarding");
    }
  }, [hydrated, isPublic, pathname, router, session]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!hydrated) return null;
  if (!session) return null;

  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  function handleLogout() {
    clearDoctorLoginSession();
    if (process.env.NEXT_PUBLIC_DOCTOR_UI_PREVIEW === "true") {
      suppressDoctorUiPreviewForTab();
    }
    router.replace("/doctor/login");
  }

  async function handleClinicSwitch(nextClinicSlug: string) {
    if (!session?.accessToken || !nextClinicSlug || nextClinicSlug === session.clinicSlug) {
      return;
    }

    setSwitchingClinic(true);
    try {
      const response = await fetch("/api/v1/doctor-auth/switch-clinic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ clinic_slug: nextClinicSlug }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "Could not switch clinic.");
      }

      const payload = data as {
        access_token: string;
        doctor_id: number;
        clinic_slug: string;
        clinic_name: string;
        app_url: string;
        oscar_app_url?: string | null;
        emr_launch_url?: string | null;
      };

      storeDoctorLoginSession({
        doctorId: payload.doctor_id,
        clinicSlug: payload.clinic_slug,
        clinicName: payload.clinic_name,
        accessToken: payload.access_token,
        appUrl: payload.app_url,
        oscarAppUrl: payload.oscar_app_url ?? undefined,
        emrLaunchUrl: payload.emr_launch_url ?? undefined,
      });
      window.dispatchEvent(new StorageEvent("storage", { key: DOCTOR_LOGIN_SESSION_KEY }));
      router.replace("/doctor/dashboard");
      router.refresh();
    } catch {
      // Keep the shell stable; user can retry from the selector.
    } finally {
      setSwitchingClinic(false);
    }
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
                {clinics.length > 1 ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Switch clinic
                    </label>
                    <div className="relative">
                      <select
                        value={session.clinicSlug}
                        onChange={(event) => {
                          void handleClinicSwitch(event.target.value);
                        }}
                        disabled={switchingClinic}
                        className="w-full appearance-none rounded-xl border border-border bg-card px-3 py-2 pr-9 text-sm text-foreground outline-none transition-colors focus:border-primary"
                      >
                        {clinics.map((clinic) => (
                          <option key={clinic.clinic_slug} value={clinic.clinic_slug}>
                            {clinic.clinic_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                ) : null}
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
