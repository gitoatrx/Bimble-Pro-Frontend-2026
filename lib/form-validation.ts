import { getCanadaPacificDateKey } from "@/lib/time-zone";

export function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function hasExactDigits(value: string | null | undefined, expectedLength: number) {
  return digitsOnly(value).length === expectedLength;
}

export function hasValidTenDigitNumber(value: string | null | undefined) {
  return hasExactDigits(value, 10);
}

export function isFutureDate(value: string | null | undefined, todayKey = getCanadaPacificDateKey()) {
  const normalized = (value ?? "").trim();
  return Boolean(normalized) && normalized > todayKey;
}

export function getLiveTenDigitError(
  value: string | null | undefined,
  label: string,
  kind: "phone number" | "fax number" = "phone number",
) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return hasExactDigits(normalized, 10) ? "" : `Enter a valid 10-digit ${kind} for ${label}.`;
}

export function getLiveFiveDigitError(value: string | null | undefined, label: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return hasExactDigits(normalized, 5) ? "" : `Enter a valid 5-digit number for ${label}.`;
}

export function getLiveDigitCountError(
  value: string | null | undefined,
  label: string,
  expectedLength: number,
  kind = "number",
) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return hasExactDigits(normalized, expectedLength)
    ? ""
    : `Enter a valid ${expectedLength}-digit ${kind} for ${label}.`;
}

export function getLiveFutureDateError(value: string | null | undefined, label: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return isFutureDate(normalized) ? `${label} cannot be in the future.` : "";
}
