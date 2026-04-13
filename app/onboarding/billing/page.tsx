"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

export default function ClinicBillingPage() {
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
      window.location.replace("/onboarding/plan");
      return;
    }

    setSelectedPlan(storedPlan);
    setHasLoadedPlan(true);
  }, []);

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

      window.location.assign("/onboarding");
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
        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm leading-6 text-slate-600">
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
    <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
          Step 2 of 3
        </div>

        <div className="mb-5 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Card details
          </h1>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor="cardholderName"
              className="block text-sm font-medium text-slate-900"
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
              className="h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20"
            />
            <FieldError message={errors.cardholderName} />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="cardNumber"
              className="block text-sm font-medium text-slate-900"
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
              className="h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20"
            />
            <FieldError message={errors.cardNumber} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="expiryDate"
                className="block text-sm font-medium text-slate-900"
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
                className="h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20"
              />
              <FieldError message={errors.expiryDate} />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cvc"
                className="block text-sm font-medium text-slate-900"
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
                className="h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20"
              />
              <FieldError message={errors.cvc} />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="billingPostalCode"
              className="block text-sm font-medium text-slate-900"
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
              className="h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20"
            />
            <FieldError message={errors.billingPostalCode} />
          </div>

          <FieldError message={submitError} />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-12 sm:min-w-32"
              onClick={() => {
                window.location.assign("/onboarding/plan");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              type="submit"
              className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Activating trial..." : "Start trial and continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </ClinicFlowShell>
  );
}
