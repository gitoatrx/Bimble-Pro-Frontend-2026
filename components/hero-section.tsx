import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="space-y-8 lg:pr-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
              Trusted by clinics that want calmer care workflows
            </div>

            <div className="space-y-5">
              <h1 className="font-display max-w-3xl text-[3.15rem] leading-[0.96] tracking-[-0.08em] text-foreground sm:text-[4.3rem] lg:text-[5.25rem]">
                Healthcare that stays connected, from your first click to final
                recovery.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Bimble brings booking, verification, AI-assisted documentation,
                and recovery workflows together so patients and clinics can move
                through care with less friction.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#book-demo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
              >
                Book an Appointment
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/onboarding/plan"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-6 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/40"
              >
                Clinic Register
              </Link>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="absolute -left-8 top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="space-y-4">
              <div className="rounded-[1.9rem] border border-border bg-white p-5 shadow-[0_24px_72px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                      Booking view
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      Secure appointment booking
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Live
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-border bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["Patient", "Verified"],
                        ["Visit type", "Walk-in"],
                        ["Pharmacy", "Selected"],
                        ["Status", "Ready"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-border bg-white p-3 shadow-sm"
                        >
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-border bg-white p-5 shadow-[0_24px_72px_rgba(15,23,42,0.12)]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                    Visit summary
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    AI-assisted documentation
                  </p>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    "Structured note draft",
                    "Follow-up tasks",
                    "Prescription summary",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50 p-4"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Less typing, more time with the patient.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-border bg-white p-5 shadow-[0_24px_72px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                      Recovery path
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      Medicine delivery
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Ready
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  patient portal syncs with most EMR systems
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Delivery selected
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pharmacy or home delivery, depending on the visit.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Follow-up set
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Next steps stay visible after the appointment ends.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
