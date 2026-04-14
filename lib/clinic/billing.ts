import { formatPostalCode, validatePostalCode } from "@/lib/clinic/onboarding";
import type {
  ClinicBillingFormData,
  ClinicPlan,
  ClinicPlanId,
  FieldErrors,
} from "@/lib/clinic/types";

export const defaultClinicPlans: ClinicPlan[] = [
  {
    id: "standard",
    name: "Standard",
    subtitle: "Everything a clinic needs to get started.",
    priceLabel: "CAD 149 / month",
    billingInterval: "Billed monthly after the trial",
    trialDays: 90,
    features: [
      "90-day free trial",
      "Clinic setup workflow",
      "Core scheduling tools",
      "Email support",
    ],
    billingCycle: "monthly",
  },
  {
    id: "premium",
    name: "Premium",
    subtitle: "For clinics that want more automation and support.",
    priceLabel: "CAD 249 / month",
    billingInterval: "Billed monthly after the trial",
    trialDays: 90,
    features: [
      "90-day free trial",
      "Everything in Standard",
      "Priority support",
      "Advanced workflow automation",
    ],
    recommended: true,
    billingCycle: "monthly",
  },
];

export const initialClinicBillingFormData: ClinicBillingFormData = {
  cardholderName: "",
  cardNumber: "",
  expiryDate: "",
  cvc: "",
  billingPostalCode: "",
};

export function getClinicPlanById(planId: ClinicPlanId) {
  return defaultClinicPlans.find((plan) => plan.id === planId) ?? null;
}

export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

export function formatCardExpiryDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatBillingPostalCode(value: string) {
  return formatPostalCode(value);
}

export function validateClinicBillingForm(
  formData: ClinicBillingFormData,
) {
  const errors: FieldErrors<ClinicBillingFormData> = {};

  if (!formData.cardholderName.trim()) {
    errors.cardholderName = "Cardholder name is required.";
  }

  const cardNumberDigits = formData.cardNumber.replace(/\D/g, "");
  if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
    errors.cardNumber = "Enter a valid card number.";
  }

  const expiryDigits = formData.expiryDate.replace(/\D/g, "");
  if (expiryDigits.length !== 4) {
    errors.expiryDate = "Enter the expiry date as MM/YY.";
  } else {
    const month = Number(expiryDigits.slice(0, 2));
    const year = Number(expiryDigits.slice(2, 4));
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear() % 100;

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.expiryDate = "Enter a valid expiry month.";
    } else if (
      year < currentYear ||
      (year === currentYear && month < currentMonth)
    ) {
      errors.expiryDate = "Card has expired.";
    }
  }

  const cvcDigits = formData.cvc.replace(/\D/g, "");
  if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    errors.cvc = "Enter a valid CVC.";
  }

  if (!formData.billingPostalCode.trim()) {
    errors.billingPostalCode = "Billing postal code is required.";
  } else if (!validatePostalCode(formData.billingPostalCode)) {
    errors.billingPostalCode = "Enter a valid Canadian postal code.";
  }

  return errors;
}

export function createBillingToken() {
  return `billing_${crypto.randomUUID().replace(/-/g, "")}`;
}
