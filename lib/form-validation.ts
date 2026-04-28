import { getCanadaPacificDateKey } from "@/lib/time-zone";
import type { Dispatch, SetStateAction } from "react";

export function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function limitDigits(value: string | null | undefined, expectedLength: number) {
  return digitsOnly(value).slice(0, expectedLength);
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

export function validateEmail(value: string | null | undefined) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? "").trim());
}

export function capitalizeLeadingLetter(value: string | null | undefined) {
  const normalized = (value ?? "").replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.replace(/^(\s*)(\p{L})/u, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

export function normalizeAlphabeticInput(value: string | null | undefined) {
  return capitalizeLeadingLetter((value ?? "").replace(/[^\p{L}\s'’-]/gu, ""));
}

export function normalizeNameInput(value: string | null | undefined) {
  return normalizeAlphabeticInput(value);
}

export function normalizeCityInput(value: string | null | undefined) {
  return normalizeAlphabeticInput(value);
}

export function normalizeProvinceInput(value: string | null | undefined) {
  return capitalizeLeadingLetter((value ?? "").replace(/[^\p{L}\s.'’-]/gu, ""));
}

const canadianProvinceCodeMap: Record<string, string> = {
  alberta: "AB",
  "british columbia": "BC",
  manitoba: "MB",
  "new brunswick": "NB",
  "newfoundland and labrador": "NL",
  "northwest territories": "NT",
  "nova scotia": "NS",
  nunavut: "NU",
  ontario: "ON",
  "prince edward island": "PE",
  quebec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

const canadianProvinceCodes = new Set(Object.values(canadianProvinceCodeMap));

export function normalizeProvinceCodeInput(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  const compact = normalized.toUpperCase();
  if (Object.values(canadianProvinceCodeMap).includes(compact)) {
    return compact;
  }

  return canadianProvinceCodeMap[normalized.toLowerCase()] ?? compact;
}

export function isValidCanadianProvinceCode(value: string | null | undefined) {
  return canadianProvinceCodes.has((value ?? "").trim().toUpperCase());
}

export function formatPostalCodeInput(value: string | null | undefined) {
  const compact = (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (compact.length <= 3) {
    return compact;
  }
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function normalizePostalCode(value: string | null | undefined) {
  return formatPostalCodeInput(value);
}

export function isValidCanadianPostalCode(value: string | null | undefined) {
  return /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/.test(formatPostalCodeInput(value));
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

export function getLivePostalCodeError(value: string | null | undefined, label: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return isValidCanadianPostalCode(normalized)
    ? ""
    : `Enter a valid Canadian postal code for ${label}.`;
}

export function getLiveProvinceCodeError(value: string | null | undefined, label: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return isValidCanadianProvinceCode(normalized)
    ? ""
    : `Enter a valid Canadian province code for ${label}.`;
}

export function getLiveEmailError(value: string | null | undefined, label: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return validateEmail(normalized) ? "" : `Enter a valid email address for ${label}.`;
}

export function getLiveAlphabeticError(value: string | null | undefined, label: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return /^[\p{L}][\p{L}\s'’.-]*$/u.test(normalized)
    ? ""
    : `Use letters only for ${label}.`;
}

export function getLiveFutureDateError(value: string | null | undefined, label: string) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return "";
  }

  return isFutureDate(normalized) ? `${label} cannot be in the future.` : "";
}

type StringFieldErrors<TField extends string> = Partial<Record<TField, string>>;

export function updateLiveTenDigitField<
  TField extends string,
  TState,
>(
  setFormState: Dispatch<SetStateAction<TState>>,
  setFieldErrors: Dispatch<SetStateAction<StringFieldErrors<TField>>>,
  field: TField,
  rawValue: string | null | undefined,
  label: string,
  kind: "phone number" | "fax number" = "phone number",
) {
  const nextValue = limitDigits(rawValue, 10);

  setFormState((current) => ({
    ...(current as TState),
    [field]: nextValue,
  } as TState));

  setFieldErrors((current) => ({
    ...current,
    [field]: getLiveTenDigitError(nextValue, label, kind),
  }));
}

export function updateLiveFutureDateField<
  TField extends string,
  TState,
>(
  setFormState: Dispatch<SetStateAction<TState>>,
  setFieldErrors: Dispatch<SetStateAction<StringFieldErrors<TField>>>,
  field: TField,
  rawValue: string | null | undefined,
  label: string,
) {
  const nextValue = (rawValue ?? "").trim();

  setFormState((current) => ({
    ...(current as TState),
    [field]: nextValue,
  } as TState));

  setFieldErrors((current) => ({
    ...current,
    [field]: getLiveFutureDateError(nextValue, label),
  }));
}
