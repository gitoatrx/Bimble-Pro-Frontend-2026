"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#who-we-serve", label: "For Patients" },
  { href: "#clinics", label: "For Clinics" },
  { href: "#faq", label: "Resources" },
  { href: "/login", label: "Sign in" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between py-3">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              B
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-semibold text-foreground">
                Bimble
              </span>
              <span className="block text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Healthcare platform
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-accent/40"
            >
              Sign in
            </Link>
            <Link
              href="#book-demo"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-accent/40"
            >
              Book a Demo
            </Link>
            <Link
              href="/onboarding/plan"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            >
              Clinic Register
            </Link>
          </div>

          <button
            className="rounded-xl border border-border bg-white p-2.5 text-foreground shadow-sm lg:hidden"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border/70 pb-5 pt-4 lg:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    item.href === "/login"
                      ? "text-foreground/75 hover:bg-accent/40 hover:text-foreground"
                      : "text-foreground/85 hover:bg-accent/40 hover:text-foreground",
                  )}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
              <div className="mt-3 grid gap-2">
                <Link
                  href="#book-demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-accent/40"
                >
                  Book a Demo
                </Link>
                <Link
                  href="/onboarding/plan"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                  Clinic Register
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
