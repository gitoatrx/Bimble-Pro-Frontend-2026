import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";

type ClinicFlowShellProps = {
  backHref: string;
  backLabel: string;
  children: ReactNode;
  contentClassName?: string;
  /** Defaults to “Clinic workspace” — use “Find care” for patient flows. */
  workspaceLabel?: string;
};

export function ClinicFlowShell({
  backHref,
  backLabel,
  children,
  contentClassName,
  workspaceLabel = "Clinic workspace",
}: ClinicFlowShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size={40} priority className="h-10 w-10" />
            <div className="leading-tight">
              <span className="block font-display text-lg font-semibold text-foreground">
                Bimble
              </span>
              <span className="block text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                {workspaceLabel}
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className={cn("mx-auto w-full", contentClassName ?? "max-w-2xl")}>
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>

          <div className="py-2">{children}</div>
        </div>
      </main>
    </div>
  );
}
