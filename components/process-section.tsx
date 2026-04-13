import Link from "next/link";
import { Brain, Clock, FileText, Package, Smartphone, Truck } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Smartphone,
    title: "Secure Verify",
    description: "Login via phone/OTP to access your personal dashboard",
  },
  {
    number: 2,
    icon: Brain,
    title: "Smart Triage",
    description:
      "Answer AI-powered intent questions so your care team is prepared",
  },
  {
    number: 3,
    icon: FileText,
    title: "The Encounter",
    description:
      "Choose virtual or walk-in. Your doctor listens; our AI documents",
  },
  {
    number: 4,
    icon: Package,
    title: "Seamless Resolution",
    description:
      "Review your automated notes and receive your meds via your chosen delivery path",
  },
];

export function ProcessSection() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            How it works
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            A clear, anxiety-free process from start to finish
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            From verified booking to final follow-up, every step is designed to
            reduce friction for patients and clinics alike.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="rounded-[1.75rem] border border-border bg-white p-6 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 ? (
                    <div className="mt-6 h-px w-full bg-border" />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                    What the clinic sees
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">
                    The care context stays with the visit
                  </h3>
                </div>
                <Clock className="h-5 w-5 text-primary" />
              </div>

              <div className="mt-6 space-y-3">
                {[
                  {
                    title: "Verified patient",
                    copy: "Secure OTP login before the appointment.",
                  },
                  {
                    title: "Prepared care team",
                    copy: "Triage and notes are ready when the visit starts.",
                  },
                  {
                    title: "Recovery path set",
                    copy: "Delivery and follow-up happen in the same flow.",
                  },
                ].map((item, index) => {
                  const Icon = [Smartphone, Brain, Truck][index];

                  return (
                    <div
                      key={item.title}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-slate-50 p-4"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {item.copy}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              id="book-demo"
              className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                Get started
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">
                Get Started with Bimble
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                See how Bimble improves healthcare for providers and patients.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#hero"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                  Book an Appointment
                </Link>
                <Link
                  href="/onboarding/plan"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-white"
                >
                  Clinic Register
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Book from desktop or mobile",
                  "Designed to reduce clinic admin",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
