import { getCanadaPacificDateKey } from "@/lib/time-zone";

export const DISPLAY_DATE_FORMAT = "MM-DD-YYYY";

export function formatIsoDateToDisplay(value: string | null | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return value ?? "";
  return `${match[2]}-${match[3]}-${match[1]}`;
}

export function formatDateInputValue(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

export function parseDisplayDateToIso(value: string | null | undefined) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec((value ?? "").trim());
  if (!match) return "";

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return `${match[3]}-${match[1]}-${match[2]}`;
}

export function getDisplayDateError(
  value: string | null | undefined,
  label: string,
  options: { allowIncomplete?: boolean } = {},
) {
  const normalized = (value ?? "").trim();
  if (!normalized) return "";
  if (options.allowIncomplete && normalized.length < DISPLAY_DATE_FORMAT.length) {
    return "";
  }

  const isoDate = parseDisplayDateToIso(normalized);
  if (!isoDate) return `${label} must use ${DISPLAY_DATE_FORMAT} format.`;

  return isoDate > getCanadaPacificDateKey() ? `${label} cannot be in the future.` : "";
}
