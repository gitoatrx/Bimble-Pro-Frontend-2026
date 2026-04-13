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
        "relative flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:-translate-y-0.5 hover:border-primary/40",
      )}
    >
      {plan.recommended ? (
        <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
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

        <div className="rounded-xl bg-primary/5 px-4 py-3">
          <p className="text-2xl font-semibold text-foreground">
            {plan.priceLabel}
          </p>
          <p className="text-sm text-muted-foreground">{plan.billingInterval}</p>
        </div>

        <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
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
          "mt-6 h-12",
          selected
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-foreground text-background hover:bg-foreground/90",
        )}
        onClick={onSelect}
      >
        {selected ? "Continue with this plan" : "Choose plan"}
      </Button>
    </div>
  );
}
