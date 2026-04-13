"use client";

import { Clock, FileText, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function StakeholderSection() {
  const [activeTab, setActiveTab] = useState<"patients" | "clinics">("patients");

  const content = {
    patients: {
      eyebrow: "For Patients",
      title: "Manage your healthcare in one secure home",
      description:
        "Confirm, cancel, or modify appointments, message your provider, and review results without jumping between tools.",
      bullets: [
        "Book from mobile in a few taps",
        "Keep your visit details organized",
        "Choose the care path that fits your day",
      ],
      panelTitle: "Patient portal",
      panelRows: [
        "Verified appointment booking",
        "Message your provider securely",
        "Review results and follow-up steps",
      ],
      panelNote: "patient portal syncs with most EMR systems",
      icon: ShieldCheck,
    },
    clinics: {
      eyebrow: "For Clinics",
      title: "Reduce the work around every appointment",
      description:
        "Automate the work around care so your team can spend less time on phone tag, typing, and status chasing.",
      bullets: [
        "Verified bookings through Secure OTP",
        "AI-assisted documentation and follow-up",
        "Medicine delivery and reminder workflows",
      ],
      panelTitle: "Clinic workflow",
      panelRows: [
        "Less phone tag and fewer interruptions",
        "Cleaner handoffs across the team",
        "More time focused on patient care",
      ],
      panelNote: "Built for calmer clinic days",
      icon: FileText,
    },
  } as const;

  const activeContent = content[activeTab];
  const ActiveIcon = activeContent.icon;

  return (
    <section id="clinics" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Tools that simplify the workflow
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Everything around the appointment, in one place
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            From verified booking to follow-up, Bimble keeps the patient and
            clinic experience aligned without adding friction.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("patients")}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-semibold transition-all",
                activeTab === "patients"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              For Patients
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("clinics")}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-semibold transition-all",
                activeTab === "clinics"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              For Clinics
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-white p-8 shadow-sm lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <ActiveIcon className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                {activeContent.eyebrow}
              </p>
              <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {activeContent.title}
              </h3>
              <p className="max-w-xl leading-7 text-muted-foreground">
                {activeContent.description}
              </p>

              <ul className="space-y-3">
                {activeContent.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-border bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {activeContent.panelTitle}
                  </p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary shadow-sm">
                    Live
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {activeContent.panelRows.map((row) => (
                    <div
                      key={row}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"
                    >
                      {activeTab === "patients" ? (
                        <MessageSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Clock className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {row}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activeTab === "patients"
                            ? "Accessible from mobile or desktop."
                            : "Less manual work around the visit."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {activeTab === "patients"
                  ? [
                      ["15m", "fast access"],
                      ["1 home", "for care tasks"],
                      ["Secure", "verification first"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-[1.25rem] border border-border bg-white p-4 shadow-sm"
                      >
                        <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                          {value}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    ))
                  : [
                      ["20+", "hours saved weekly"],
                      ["84%", "less admin work"],
                      ["0", "extra tabs"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-[1.25rem] border border-border bg-white p-4 shadow-sm"
                      >
                        <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                          {value}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    ))}
              </div>

              <div className="rounded-[1.5rem] bg-primary/5 p-4">
                <p className="text-sm font-semibold text-primary">
                  {activeContent.panelNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
