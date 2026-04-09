"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  function openClinicOnboarding() {
    setMobileMenuOpen(false);
    router.push("/onboarding");
  }

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
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button
              variant="outline"
              className="border-foreground/20 text-foreground hover:bg-foreground/5"
            >
              Book Demo
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={openClinicOnboarding}
            >
              Clinic Register
            </Button>
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
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  variant="outline"
                  className="w-full border-foreground/20 text-foreground"
                >
                  Book Demo
                </Button>
                <Button
                  className="w-full bg-primary text-primary-foreground"
                  onClick={openClinicOnboarding}
                >
                  Clinic LogIn
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
