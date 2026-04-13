import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b1220] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                B
              </div>
              <div className="leading-tight">
                <span className="block text-xl font-semibold text-white">
                  Bimble
                </span>
                <span className="block text-[11px] uppercase tracking-[0.28em] text-white/60">
                  Healthcare platform
                </span>
              </div>
            </Link>
            <p className="max-w-xl text-sm leading-7 text-white/70">
              Bimble brings booking, verification, documentation, and recovery
              together so patients and clinics can move through care with less
              friction.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#book-demo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
              >
                Book a Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/onboarding/plan"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition-all hover:border-white/25 hover:bg-white/10"
              >
                Clinic Register
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                For Patients
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="#book-demo"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Book Appointment
                  </Link>
                </li>
                <li>
                  <Link
                    href="#who-we-serve"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Manage Care
                  </Link>
                </li>
                <li>
                  <Link
                    href="#clinics"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Patient Portal
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                For Clinics
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/onboarding/plan"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Clinic Register
                  </Link>
                </li>
                <li>
                  <Link
                    href="#benefits"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Workflow Automation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Provider Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="#faq"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Articles
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Knowledge Base
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    E-Learning
                  </Link>
                </li>
                <li>
                  <Link
                    href="/onboarding/plan"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                More
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="#hero"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    About Bimble
                  </Link>
                </li>
                <li>
                  <Link
                    href="#book-demo"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-sm text-white/55">
              &copy; {new Date().getFullYear()} Bimble Health. All rights
              reserved.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#faq"
                className="text-sm text-white/55 transition-colors hover:text-white"
              >
                FAQ
              </Link>
              <Link
                href="#book-demo"
                className="text-sm text-white/55 transition-colors hover:text-white"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
