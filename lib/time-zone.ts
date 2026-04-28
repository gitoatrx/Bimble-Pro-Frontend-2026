export const CANADA_PACIFIC_TIME_ZONE = "America/Vancouver" as const;

type CanadaPacificDateInput = Date | string | number;

function toDate(value: CanadaPacificDateInput) {
  return value instanceof Date ? value : new Date(value);
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
    timeZone: CANADA_PACIFIC_TIME_ZONE,
    ...options,
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
