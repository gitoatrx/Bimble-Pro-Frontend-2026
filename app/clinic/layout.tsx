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
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { clearClinicLoginSession, readClinicLoginSession } from "@/lib/clinic/session";
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
  { href: "/clinic/doctors",                 label: "Doctors",        Icon: Stethoscope,     requiresOnboarding: true  },
  { href: "/clinic/doctors/schedule",        label: "Availability",   Icon: ClipboardList,   requiresOnboarding: true  },
  { href: "/clinic/analytics",              label: "Analytics",      Icon: BarChart3,       requiresOnboarding: true  },
  { href: "/clinic/settings",               label: "Settings",       Icon: Settings,        requiresOnboarding: true  },
];

// ── Sidebar ───────────────────────────────────────────────────────

function Sidebar({
  clinicSlug,
  appUrl,
  onboardingComplete,
  onLogout,
}: {
  clinicSlug: string;
  appUrl: string;
  onboardingComplete: boolean;
  onLogout: () => void;
}) {
  const pathname = usePathname();

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
        <p className="mt-0.5 text-sm font-semibold text-foreground truncate">
          {clinicSlug}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, Icon, requiresOnboarding }) => {
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
        <a
          href={appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">Open OSCAR</span>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </a>

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
  const [session, setSession] = useState(() => readClinicLoginSession());

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

  // Listen for onboarding completion signal from child pages
  useEffect(() => {
    function handleComplete() {
      setOnboardingComplete(true);
    }
    window.addEventListener("bimble:clinic:onboarding-complete", handleComplete);
    return () => window.removeEventListener("bimble:clinic:onboarding-complete", handleComplete);
  }, []);

  if (!session) return null;

  function handleLogout() {
    clearClinicLoginSession();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        clinicSlug={session.clinicSlug}
        appUrl={session.appUrl}
        onboardingComplete={onboardingComplete}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
