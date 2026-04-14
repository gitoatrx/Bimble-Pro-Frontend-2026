"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBillingToken,
  formatBillingPostalCode,
  formatCardExpiryDate,
  formatCardNumber,
  initialClinicBillingFormData,
  validateClinicBillingForm,
} from "@/lib/clinic/billing";
import {
  readClinicSelectedPlan,
  storeClinicBillingState,
} from "@/lib/clinic/session";
import type {
  ClinicBillingFormData,
  ClinicPlan,
  FieldErrors,
} from "@/lib/clinic/types";

const neutralFieldClassName =
  "h-12 !border-border !bg-white !text-foreground !shadow-none focus-visible:ring-primary/20";

export default function ClinicBillingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ClinicPlan | null>(null);
  const [hasLoadedPlan, setHasLoadedPlan] = useState(false);
  const [formData, setFormData] = useState<ClinicBillingFormData>(
    initialClinicBillingFormData,
  );
  const [errors, setErrors] = useState<FieldErrors<ClinicBillingFormData>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedPlan = readClinicSelectedPlan();

    if (!storedPlan) {
      router.replace("/onboarding/plan");
      return;
    }

    setSelectedPlan(storedPlan);
    setHasLoadedPlan(true);
  }, [router]);

  const billingCycleLabel = useMemo(() => {
    if (!selectedPlan) {
      return "Billing cycle";
    }

    return selectedPlan.billingCycle === "annual"
      ? "Annual billing"
      : "Monthly billing";
  }, [selectedPlan]);

  const previewFeatures = useMemo(
    () => selectedPlan?.features.slice(0, 3) ?? [],
    [selectedPlan],
  );

  function setField<K extends keyof ClinicBillingFormData>(
    field: K,
    value: ClinicBillingFormData[K],
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  }

  async function handleSubmit() {
    const nextErrors = validateClinicBillingForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const billingToken = createBillingToken();

      storeClinicBillingState({
        billingToken,
      });

      router.push("/onboarding");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not activate the trial right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasLoadedPlan) {
    return (
      <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
        <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm leading-6 text-muted-foreground">
            Loading billing setup...
          </p>
        </div>
      </ClinicFlowShell>
    );
  }

  if (!selectedPlan) {
    return null;
  }

  return (
    <ClinicFlowShell
      backHref="/onboarding/plan"
      backLabel="Back to plans"
      contentClassName="max-w-7xl"
    >
      <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24 h-fit">
          <div className="rounded-[2rem] border border-primary/20 bg-white p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              Step 2 of 3
            </div>

            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Confirm the plan and add card details
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">
                Card details
              </h1>
              <p className="text-sm leading-7 text-muted-foreground">
                Review your plan summary, enter billing details, and activate
                the trial without leaving the flow.
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-primary/5 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                {selectedPlan.name}
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {selectedPlan.priceLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedPlan.billingInterval}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium text-foreground">
              <CalendarRange className="h-4 w-4 text-primary" />
              {billingCycleLabel}
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-white p-4">
              <p className="text-sm font-semibold text-foreground">
                What&apos;s included
              </p>
              <ul className="mt-3 space-y-2">
                {previewFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              Checkout summary
            </div>
            <div className="mt-4 space-y-3">
              {[
                "No charge is made today.",
                "Card details unlock the rest of the clinic setup.",
                "Billing begins after the trial ends.",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Billing details
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
              Enter the card details for {selectedPlan.name}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              The trial is already attached to your plan. This page just
              confirms the card that will be charged after the trial ends.
            </p>
          </div>

          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="cardholderName"
                  className="block text-sm font-medium text-foreground"
                >
                  Cardholder name
                </label>
                <Input
                  id="cardholderName"
                  value={formData.cardholderName}
                  onChange={(event) =>
                    setField("cardholderName", event.target.value)
                  }
                  placeholder="Clinic Finance"
                  autoComplete="cc-name"
                  className={neutralFieldClassName}
                />
                <FieldError message={errors.cardholderName} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="cardNumber"
                  className="block text-sm font-medium text-foreground"
                >
                  Card number
                </label>
                <Input
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={(event) =>
                    setField("cardNumber", formatCardNumber(event.target.value))
                  }
                  placeholder="4242 4242 4242 4242"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  className={neutralFieldClassName}
                />
                <FieldError message={errors.cardNumber} />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-foreground"
                >
                  Expiry date
                </label>
                <Input
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={(event) =>
                    setField(
                      "expiryDate",
                      formatCardExpiryDate(event.target.value),
                    )
                  }
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  className={neutralFieldClassName}
                />
                <FieldError message={errors.expiryDate} />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="cvc"
                  className="block text-sm font-medium text-foreground"
                >
                  CVC / CVV
                </label>
                <Input
                  id="cvc"
                  value={formData.cvc}
                  onChange={(event) =>
                    setField(
                      "cvc",
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  placeholder="123"
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  className={neutralFieldClassName}
                />
                <FieldError message={errors.cvc} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label
                  htmlFor="billingPostalCode"
                  className="block text-sm font-medium text-foreground"
                >
                  Billing postal code
                </label>
                <Input
                  id="billingPostalCode"
                  value={formData.billingPostalCode}
                  onChange={(event) =>
                    setField(
                      "billingPostalCode",
                      formatBillingPostalCode(event.target.value),
                    )
                  }
                  placeholder="V6B 1A1"
                  autoComplete="postal-code"
                  className={neutralFieldClassName}
                />
                <FieldError message={errors.billingPostalCode} />
              </div>
            </div>

            <FieldError message={submitError} />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-12 sm:min-w-32"
                onClick={() => {
                  router.push("/onboarding/plan");
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                type="submit"
                className="h-12 flex-1 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Activating trial..." : "Start trial and continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>
      </div>
    </ClinicFlowShell>
  );
}
