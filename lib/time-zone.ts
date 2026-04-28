export const CANADA_PACIFIC_TIME_ZONE = "America/Vancouver" as const;

type CanadaPacificDateInput = Date | string | number;

function toDate(value: CanadaPacificDateInput) {
  return value instanceof Date ? value : new Date(value);
}

function parseIsoDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return { year, month, day };
}

function partsToIsoDate(parts: Intl.DateTimeFormatPart[]) {
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date using Canada Pacific time (Pacific Time for British Columbia).
 * Use this anywhere the app needs a consistent Pacific timestamp or date label.
 */
export function formatCanadaPacificTime(
  value: CanadaPacificDateInput = new Date(),
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("en-CA", {
    ...options,
    timeZone: CANADA_PACIFIC_TIME_ZONE,
  }).format(toDate(value));
}

/**
 * Returns a YYYY-MM-DD date key in Canada Pacific time.
 */
export function getCanadaPacificDateKey(value: CanadaPacificDateInput = new Date()) {
  const date = toDate(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CANADA_PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return partsToIsoDate(parts);
}

/**
 * Shifts a YYYY-MM-DD key by a number of days without using the browser's local time zone.
 */
export function shiftCanadaPacificDateKey(value: string, days: number) {
  const parsed = parseIsoDateKey(value);
  if (!parsed) {
    return value;
  }

  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Formats a YYYY-MM-DD date key in Canada Pacific time.
 */
export function formatCanadaPacificDateKey(
  value: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  const parsed = parseIsoDateKey(value);
  const date = parsed ? new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12)) : new Date(value);

  return formatCanadaPacificTime(date, options);
}

/**
 * Returns a compact date/time label in Canada Pacific time.
 */
export function formatCanadaPacificDateTime(value: CanadaPacificDateInput = new Date()) {
  return formatCanadaPacificTime(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
