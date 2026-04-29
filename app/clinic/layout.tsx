"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CalendarCheck2,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Settings,
  Stethoscope,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  clearClinicLoginSession,
  CLINIC_LOGIN_SESSION_KEY,
  CLINIC_ONBOARDING_COMPLETE_KEY,
  readClinicLoginSession,
} from "@/lib/clinic/session";
import { fetchClinicPool, fetchClinicSetupState } from "@/lib/api/clinic-dashboard";
import { cn } from "@/lib/utils";

// ── Nav items ─────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  requiresOnboarding: boolean;
};

type PoolAlertState = {
  newCount: number;
  totalCount: number;
};

const CLINIC_POOL_SEEN_IDS_KEY = "bimble:clinic:pool-seen-ids";

const NAV_ITEMS: NavItem[] = [
  { href: "/clinic/dashboard",               label: "Setup",          Icon: LayoutDashboard, requiresOnboarding: false },
  { href: "/clinic/appointments/today",      label: "Today",          Icon: CalendarCheck2,  requiresOnboarding: true  },
  { href: "/clinic/appointments",            label: "Appointments",   Icon: CalendarDays,    requiresOnboarding: true  },
  { href: "/clinic/pool",                    label: "Pool",           Icon: Zap,             requiresOnboarding: true  },
  { href: "/clinic/requests",                label: "Requests",       Icon: NotebookPen,     requiresOnboarding: true  },
  { href: "/clinic/doctors",                 label: "Doctors",        Icon: Stethoscope,     requiresOnboarding: true  },
  { href: "/clinic/doctors/schedule",        label: "Availability",   Icon: ClipboardList,   requiresOnboarding: true  },
  { href: "/clinic/analytics",              label: "Analytics",      Icon: BarChart3,       requiresOnboarding: true  },
  { href: "/clinic/settings",               label: "Settings",       Icon: Settings,        requiresOnboarding: true  },
];

function subscribeToClinicStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener("bimble:clinic:onboarding-complete", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("bimble:clinic:onboarding-complete", handleChange);
  };
}

// ── Sidebar ───────────────────────────────────────────────────────

function Sidebar({
  clinicSlug,
  clinicName,
  onboardingComplete,
  poolAlert,
  onOpenOscar,
  onLogout,
}: {
  clinicSlug: string;
  clinicName: string;
  onboardingComplete: boolean;
  poolAlert: PoolAlertState;
  onOpenOscar: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const visibleNavItems = onboardingComplete
    ? NAV_ITEMS.filter((item) => item.label !== "Setup")
    : NAV_ITEMS;

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <BrandMark size={28} className="h-7 w-7" />
        <span className="font-display text-base font-700 tracking-tight text-foreground">
          Bimble
        </span>
      </div>

      {/* Clinic name */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Clinic
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
          {clinicName || clinicSlug}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleNavItems.map(({ href, label, Icon, requiresOnboarding }) => {
          const locked = requiresOnboarding && !onboardingComplete;
          const active = pathname === href || pathname.startsWith(href + "/");
          const badge =
            label === "Pool" && poolAlert.totalCount > 0
              ? String(poolAlert.totalCount)
              : null;

          return (
            <SidebarNavItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              active={active}
              locked={locked}
              badge={badge}
            />
          );
        })}
      </nav>

      {/* Bottom: OSCAR link + theme + logout */}
      <div className="border-t border-border px-2 py-3 space-y-1">
        <button
          type="button"
          onClick={onOpenOscar}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">Open OSCAR</span>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </button>

        <div className="px-3 py-2">
          <ThemeToggle className="w-full justify-center" />
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  href,
  label,
  Icon,
  active,
  locked,
  badge,
}: {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  active: boolean;
  locked: boolean;
  badge?: string | null;
}) {
  const baseClass = "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

  if (locked) {
    return (
      <div
        title="Complete your setup to unlock this section"
        className={cn(
          baseClass,
          "cursor-not-allowed select-none opacity-40",
          "text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
          Setup
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        baseClass,
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {badge ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary",
            )}
          >
            {badge}
          </span>
        ) : null}
      </Link>
  );
}

function PoolAlertBanner({
  href,
  poolAlert,
  onDismiss,
}: {
  href: string;
  poolAlert: PoolAlertState;
  onDismiss: () => void;
}) {
  if (poolAlert.newCount <= 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950">
            New appointment{poolAlert.newCount === 1 ? "" : "s"} waiting in the pool
          </p>
          <p className="text-xs text-amber-800">
            {poolAlert.newCount} new item{poolAlert.newCount === 1 ? "" : "s"} detected. Open the pool to accept or reject them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="rounded-full bg-amber-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-950"
          >
            Open pool
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const sessionRaw = useSyncExternalStore(
    subscribeToClinicStorage,
    () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(CLINIC_LOGIN_SESSION_KEY);
    },
    () => null,
  );
  const [backendOnboardingComplete, setBackendOnboardingComplete] = useState(false);
  const onboardingCompleteRaw = useSyncExternalStore(
    subscribeToClinicStorage,
    () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(CLINIC_ONBOARDING_COMPLETE_KEY);
    },
    () => null,
  );
  const onboardingComplete = onboardingCompleteRaw === "true";
  const session = hydrated && sessionRaw ? readClinicLoginSession() : null;
  const pathname = usePathname();
  const [poolAlert, setPoolAlert] = useState<PoolAlertState>({ newCount: 0, totalCount: 0 });
  const resolvedOnboardingComplete =
    onboardingComplete || backendOnboardingComplete;

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace("/login");
    }
  }, [hydrated, session, router]);

  useEffect(() => {
    if (!session?.accessToken) return;

    let active = true;

    fetchClinicSetupState(session.accessToken)
      .then((record) => {
        if (!active) return;

        const value = record as Record<string, unknown>;
        const statusSource =
          typeof value.setup_status === "string"
            ? value.setup_status
            : typeof value.status === "string"
              ? value.status
              : "";
        const status = statusSource.toLowerCase();
        const completedSteps = Number(
          value.completed_steps ?? value.completedSteps ?? value.steps_completed ?? 0,
        );
        const totalSteps = Number(value.total_steps ?? value.totalSteps ?? 0);
        const completionPercent = Number(
          value.completion_percent ?? value.completionPercent ?? 0,
        );
        const complete =
          value.setup_completed === true ||
          value.complete === true ||
          value.completed === true ||
          value.is_complete === true ||
          value.setup_complete === true ||
          value.onboarding_complete === true ||
          completionPercent >= 100 ||
          (completedSteps > 0 && totalSteps > 0 && completedSteps >= totalSteps) ||
          status === "complete" ||
          status === "completed" ||
          status === "done" ||
          status === "live" ||
          status === "active";

        setBackendOnboardingComplete(complete);

        if (complete) {
          localStorage.setItem(CLINIC_ONBOARDING_COMPLETE_KEY, "true");
        }
      })
      .catch(() => {
        // Keep local onboarding state if backend status is unavailable.
      });

    return () => {
      active = false;
    };
  }, [session?.accessToken]);

  // Listen for onboarding completion signal from child pages
  useEffect(() => {
    function handleComplete() {
      localStorage.setItem(CLINIC_ONBOARDING_COMPLETE_KEY, "true");
    }
    window.addEventListener("bimble:clinic:onboarding-complete", handleComplete);
    return () => window.removeEventListener("bimble:clinic:onboarding-complete", handleComplete);
  }, []);

  useEffect(() => {
    if (!session?.accessToken || !resolvedOnboardingComplete) return;
    const accessToken = session.accessToken;

    let active = true;
    let initialized = false;

    function readSeenIds() {
      if (typeof window === "undefined") return new Set<number>();
      try {
        const raw = sessionStorage.getItem(CLINIC_POOL_SEEN_IDS_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === "number") : []);
      } catch {
        return new Set<number>();
      }
    }

    function writeSeenIds(ids: number[]) {
      if (typeof window === "undefined") return;
      sessionStorage.setItem(CLINIC_POOL_SEEN_IDS_KEY, JSON.stringify(ids));
    }

    async function pollPool() {
      try {
        const response = await fetchClinicPool(accessToken);
        if (!active) return;

        const appointmentIds = response.appointments.map((item) => item.appointment_id);
        const currentSet = new Set(appointmentIds);
        const seenIds = readSeenIds();
        const unseenIds = appointmentIds.filter((id) => !seenIds.has(id));

        if (!initialized) {
          writeSeenIds(appointmentIds);
          initialized = true;
          setPoolAlert({ newCount: 0, totalCount: appointmentIds.length });
          return;
        }

        if (pathname === "/clinic/pool") {
          writeSeenIds(appointmentIds);
          setPoolAlert({ newCount: 0, totalCount: appointmentIds.length });
          return;
        }

        const retainedSeenIds = [...seenIds].filter((id) => currentSet.has(id));
        writeSeenIds([...retainedSeenIds, ...unseenIds]);
        setPoolAlert({ newCount: unseenIds.length, totalCount: appointmentIds.length });
      } catch {
        if (!active) return;
      }
    }

    void pollPool();
    function handleRealtime(event: Event) {
      const detail = (event as CustomEvent<{ path?: string }>).detail;
      const eventPath = detail?.path ?? "";
      if (
        eventPath.includes("/pool") ||
        eventPath.includes("/appointments") ||
        eventPath.includes("/patient-intake")
      ) {
        void pollPool();
      }
    }

    window.addEventListener("bimble:realtime", handleRealtime);

    return () => {
      active = false;
      window.removeEventListener("bimble:realtime", handleRealtime);
    };
  }, [pathname, resolvedOnboardingComplete, session?.accessToken]);

  if (!hydrated) return null;
  if (!session) return null;
  const clinicSession = session;

  function handleLogout() {
    clearClinicLoginSession();
    router.replace("/login");
  }

  function handleOpenOscar() {
    if (typeof window === "undefined") {
      return;
    }

    let launchUrl = clinicSession.appUrl;
    const bootstrapUrl = clinicSession.bootstrapUrl;
    if (bootstrapUrl) {
      try {
        const parsed = new URL(bootstrapUrl);
        const username = parsed.searchParams.get("username") || "";
        const password = parsed.searchParams.get("password") || "";
        const pin = parsed.searchParams.get("pin") || "";

        if (username && password && pin) {
          const loginUrl = new URL("login.do", parsed);
          loginUrl.searchParams.set("username", username);
          loginUrl.searchParams.set("password", password);
          loginUrl.searchParams.set("pin", pin);
          loginUrl.searchParams.set("pin2", pin);
          loginUrl.searchParams.set("submit", "Login");
          loginUrl.searchParams.set("propname", "oscar_mcmaster");
          launchUrl = loginUrl.toString();
        }
      } catch {
        // Fall back to the next available launch path below.
      }
    }

    window.open(launchUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        clinicSlug={clinicSession.clinicSlug}
        clinicName={clinicSession.clinicName || clinicSession.clinicSlug}
        onboardingComplete={resolvedOnboardingComplete}
        poolAlert={poolAlert}
        onOpenOscar={handleOpenOscar}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto">
        <PoolAlertBanner
          href="/clinic/pool"
          poolAlert={poolAlert}
          onDismiss={() => setPoolAlert((current) => ({ ...current, newCount: 0 }))}
        />
        {children}
      </main>
    </div>
  );
}
