import { FileText, MessageSquare, ShieldCheck, Users } from "lucide-react";

const audiences = ["Patients", "Doctors", "Clinics", "Care teams", "Pharmacies", "Virtual care"];

export function ProblemSection() {
  return (
    <section id="who-we-serve" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Who we serve
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Bimble works with every part of the care journey
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            One platform that adapts to your clinic&apos;s needs and keeps
            patients, providers, and care teams moving in the same direction.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {audiences.map((audience) => (
            <span
              key={audience}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm"
            >
              {audience}
            </span>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">
                For Patients
              </h3>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              Confirm, cancel, or modify appointments, message your provider,
              and review results without jumping between tools.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Book from mobile in a few taps",
                "Keep your visit details organized",
                "Choose the care path that fits your day",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50 p-4"
                >
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border-2 border-primary/40 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">
                For Clinics
              </h3>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              Automate the work around every appointment so your team can spend
              less time on phone tag, typing, and status chasing.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Verified bookings through Secure OTP",
                "AI-assisted documentation and follow-up",
                "Medicine delivery and reminder workflows",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-primary/5 p-4"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary">
                patient portal syncs with most EMR systems
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
