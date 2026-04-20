"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DoctorPageShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function DoctorPageShell({
  eyebrow,
  title,
  children,
  className,
}: DoctorPageShellProps) {
  return (
    <div className={cn("relative isolate min-h-full overflow-hidden", className)}>
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 sm:px-5 lg:px-6">
            <div className="space-y-1">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">
                {eyebrow}
              </span>
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
            </div>
          </div>
        </header>

        <div className={cn("grid gap-6", className)}>{children}</div>
      </div>
    </div>
  );
}

export function DoctorSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="space-y-0.5">
          <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}
