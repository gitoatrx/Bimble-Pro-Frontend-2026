"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DISPLAY_DATE_FORMAT,
  formatDateInputValue,
  formatIsoDateToDisplay,
  parseDisplayDateToIso,
} from "@/lib/date-format";

type DisplayDateInputProps = Omit<InputProps, "type" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  maxIsoDate?: string;
};

export function DisplayDateInput({
  value,
  onChange,
  className,
  maxIsoDate,
  placeholder = DISPLAY_DATE_FORMAT,
  ...props
}: DisplayDateInputProps) {
  const nativeDateRef = useRef<HTMLInputElement | null>(null);
  const displayValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? formatIsoDateToDisplay(value)
    : value;

  function openPicker() {
    const picker = nativeDateRef.current;
    if (!picker) return;

    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }

    picker.click();
  }

  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        value={displayValue}
        onChange={(event) => onChange(formatDateInputValue(event.target.value))}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={10}
        autoComplete="bday"
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
        aria-label="Open date picker"
      >
        <CalendarDays className="h-4 w-4" />
      </button>
      <input
        ref={nativeDateRef}
        type="date"
        value={parseDisplayDateToIso(displayValue)}
        max={maxIsoDate}
        onChange={(event) => onChange(formatIsoDateToDisplay(event.target.value))}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
