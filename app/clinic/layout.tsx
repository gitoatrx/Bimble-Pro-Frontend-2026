"use client";

import React, { useEffect, useState } from "react";
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
  Settings,
  Stethoscope,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  clearClinicLoginSession,
  getClinicSessionRemainingMs,
  readClinicLoginSession,
} from "@/lib/clinic/session";
import { fetchClinicSetupState } from "@/lib/api/clinic-dashboard";
import { cn } from "@/lib/utils";

// ── Nav items ─────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  requiresOnboarding: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/clinic/dashboard",               label: "Setup",          Icon: LayoutDashboard, requiresOnboarding: false },
  { href: "/clinic/appointments/today",      label: "Today",          Icon: CalendarCheck2,  requiresOnboarding: true  },
  { href: "/clinic/appointments",            label: "Appointments",   Icon: CalendarDays,    requiresOnboarding: true  },
  { href: "/clinic/pool",                    label: "Pool",           Icon: Zap,             requiresOnboarding: true  },
  { href: "/clinic/doctors",                 label: "Doctors",        Icon: Stethoscope,     requiresOnboarding: true  },
  { href: "/clinic/doctors/schedule",        label: "Availability",   Icon: ClipboardList,   requiresOnboarding: true  },
  { href: "/clinic/analytics",              label: "Analytics",      Icon: BarChart3,       requiresOnboarding: true  },
  { href: "/clinic/settings",               label: "Settings",       Icon: Settings,        requiresOnboarding: true  },
];

// ── Sidebar ───────────────────────────────────────────────────────

function Sidebar({
  clinicSlug,
  clinicName,
  clinicStatus,
  onboardingComplete,
  onOpenOscar,
  onLogout,
}: {
  clinicSlug: string;
  clinicName: string;
  clinicStatus: string;
  onboardingComplete: boolean;
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
        <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {clinicStatus || "Active"}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleNavItems.map(({ href, label, Icon, requiresOnboarding }) => {
          const locked = requiresOnboarding && !onboardingComplete;
          const active = pathname === href || pathname.startsWith(href + "/");

          return (
            <SidebarNavItem
              key={href}
              href={href}
              label={label}
              Icon={Icon}
              active={active}
              locked={locked}
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
}: {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  active: boolean;
  locked: boolean;
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
      <span>{label}</span>
    </Link>
  );
}

// ── Layout ────────────────────────────────────────────────────────

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session] = useState(() => readClinicLoginSession());
  const [backendOnboardingComplete, setBackendOnboardingComplete] = useState(false);

  // Check onboarding completion (stored flag, updated after go-live)
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("bimble:clinic:onboarding-complete") === "true";
  });

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    const remainingMs = getClinicSessionRemainingMs(session);
    if (remainingMs === null) return;
    if (remainingMs <= 0) {
      clearClinicLoginSession();
      router.replace("/login");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearClinicLoginSession();
      router.replace("/login");
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [session, router]);

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
          setOnboardingComplete(true);
          localStorage.setItem("bimble:clinic:onboarding-complete", "true");
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
      setOnboardingComplete(true);
    }
    window.addEventListener("bimble:clinic:onboarding-complete", handleComplete);
    return () => window.removeEventListener("bimble:clinic:onboarding-complete", handleComplete);
  }, []);

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

  const resolvedOnboardingComplete =
    onboardingComplete || backendOnboardingComplete;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        clinicSlug={clinicSession.clinicSlug}
        clinicName={clinicSession.clinicSlug}
        clinicStatus="Active"
        onboardingComplete={resolvedOnboardingComplete}
        onOpenOscar={handleOpenOscar}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
