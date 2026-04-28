import type { ReactNode } from "react";
import {
  formatCanadaPacificDateKey,
  formatCanadaPacificTime,
} from "@/lib/time-zone";

type CanadianTimeKind = "date" | "datetime" | "date-key";

type CanadianTimeProps = {
  value: string | number | Date | null | undefined;
  kind?: CanadianTimeKind;
  options?: Intl.DateTimeFormatOptions;
  fallback?: ReactNode;
  className?: string;
};

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function parseValue(value: string | number | Date, kind: CanadianTimeKind) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (kind === "date-key" || isDateKey(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function CanadianTime({
  value,
  kind = "datetime",
  options,
  fallback = "—",
  className,
}: CanadianTimeProps) {
  if (value === null || value === undefined || value === "") {
    return <span className={className}>{fallback}</span>;
  }

  const parsed = parseValue(value, kind);
  if (!parsed) {
    return <span className={className}>{fallback}</span>;
  }

  const text =
    kind === "date-key"
      ? formatCanadaPacificDateKey(String(value), options)
      : kind === "date"
        ? formatCanadaPacificTime(parsed, {
            year: "numeric",
            month: "short",
            day: "numeric",
            ...options,
          })
        : formatCanadaPacificTime(parsed, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            ...options,
          });

  return (
    <time className={className} dateTime={parsed.toISOString()}>
      {text}
    </time>
  );
}
