"use client";

import { Building2, DollarSign, FileText, Stethoscope } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function StakeholderSection() {
  const [activeTab, setActiveTab] = useState<"doctors" | "clinics">("doctors");

  return (
    <section id="providers" className="bg-card py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            The Stakeholder Ecosystem
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Bimble serves everyone in the healthcare journey with tailored
            solutions.
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-background p-1">
            <button
              onClick={() => setActiveTab("doctors")}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-medium transition-all",
                activeTab === "doctors"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              For Doctors
            </button>
            <button
              onClick={() => setActiveTab("clinics")}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-medium transition-all",
                activeTab === "clinics"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              For Clinics
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          {activeTab === "doctors" ? (
            <div className="rounded-2xl border border-border bg-background p-8 lg:p-12">
              <div className="grid items-center gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    End the &quot;after-hours&quot; charting
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Our AI captures your visit and generates structured SOAP
                    notes and prescriptions instantly for your review. Spend
                    your evenings with family, not paperwork.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-foreground">
                      <FileText className="h-5 w-5 text-primary" />
                      Automated SOAP notes generation
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <FileText className="h-5 w-5 text-primary" />
                      Instant prescription drafts
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <FileText className="h-5 w-5 text-primary" />
                      Full review control
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <span className="text-sm text-muted-foreground">
                        Today&apos;s Visits
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        12
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <span className="text-sm text-muted-foreground">
                        Notes Completed
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        12
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Time Saved
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        3h 24m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-8 lg:p-12">
              <div className="grid items-center gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                    <Building2 className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    A unified Billing Command Center
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Monitor MSP and private billing ledgers with real-time
                    status scrutiny to eliminate administrative waste and
                    revenue leakage. One dashboard for complete financial
                    clarity.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-foreground">
                      <DollarSign className="h-5 w-5 text-accent" />
                      Real-time billing status
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <DollarSign className="h-5 w-5 text-accent" />
                      Revenue leakage detection
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <DollarSign className="h-5 w-5 text-accent" />
                      Unified MSP and private billing
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <span className="text-sm text-muted-foreground">
                        Claims Processed
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        847
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <span className="text-sm text-muted-foreground">
                        Recovery Rate
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        98.5%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Admin Hours Saved
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        42h/week
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
