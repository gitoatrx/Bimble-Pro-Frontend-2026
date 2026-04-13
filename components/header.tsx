"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-xl font-bold text-foreground">Bimble</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#services"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Care Services
            </Link>
            <Link
              href="#delivery"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              For patients
            </Link>
            <Link
              href="#providers"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              For Clinics
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Clinic Login
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button
              variant="outline"
              className="border-foreground/20 text-foreground hover:bg-foreground/5"
            >
              Book Demo
            </Button>
            <Link
              href="/onboarding/plan"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Clinic Register
            </Link>
          </div>

          <button
            className="p-2 text-foreground md:hidden"
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
          <div className="border-t border-border py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link
                href="#services"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                Care Services
              </Link>
              <Link
                href="#delivery"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                For patients
              </Link>
              <Link
                href="#providers"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                For Clinics
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                Clinic Login
              </Link>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  variant="outline"
                  className="w-full border-foreground/20 text-foreground"
                >
                  Book Demo
                </Button>
                <Link
                  href="/onboarding/plan"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
