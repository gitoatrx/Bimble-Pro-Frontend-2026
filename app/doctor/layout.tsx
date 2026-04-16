"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
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
import { clearDoctorLoginSession, readDoctorLoginSession } from "@/lib/doctor/session";
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

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = readDoctorLoginSession();

  useEffect(() => {
    if (!session) {
      router.replace("/doctor/login");
    }
  }, [session, router]);

  if (!session) return null;

  function handleLogout() {
    clearDoctorLoginSession();
    router.replace("/doctor/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-border bg-card">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
          <BrandMark size={28} className="h-7 w-7" />
          <span className="font-display text-base font-700 tracking-tight text-foreground">
            Bimble
          </span>
        </div>

        {/* Doctor context */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Doctor
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground truncate">
            {session.clinicName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{session.clinicSlug}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border px-2 py-3 space-y-1">
          <a
            href={session.appUrl}
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
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
