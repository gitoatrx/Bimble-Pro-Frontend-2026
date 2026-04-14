"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClinicPlan } from "@/lib/clinic/types";

type ClinicPlanOptionCardProps = {
  plan: ClinicPlan;
  selected?: boolean;
  onSelect: () => void;
};

export function ClinicPlanOptionCard({
  plan,
  selected = false,
  onSelect,
}: ClinicPlanOptionCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-[2rem] border bg-white p-6 shadow-sm transition-all duration-200",
        selected
          ? "border-primary/40 ring-2 ring-primary/15 shadow-md"
          : "border-border hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
      )}
    >
      {plan.recommended ? (
        <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Recommended
        </div>
      ) : null}

      <div className="flex-1 space-y-5">
        <div className="space-y-2 pr-24">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            {plan.name}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {plan.subtitle}
          </p>
        </div>

        <div className="rounded-2xl bg-primary/5 px-4 py-4">
          <p className="text-2xl font-semibold text-foreground">
            {plan.priceLabel}
          </p>
          <p className="text-sm text-muted-foreground">{plan.billingInterval}</p>
        </div>

        <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
          Includes a {plan.trialDays}-day trial. Autopay starts after the trial
          ends.
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        type="button"
        className={cn(
          "mt-6 h-12 rounded-2xl",
          selected
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-foreground text-background hover:bg-foreground/90",
        )}
        onClick={onSelect}
      >
        {selected ? "Selected plan" : "Choose this plan"}
      </Button>
    </div>
  );
}
