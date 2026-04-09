import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ClinicFlowShellProps = {
  backHref: string;
  backLabel: string;
  children: ReactNode;
  contentClassName?: string;
};

export function ClinicFlowShell({
  backHref,
  backLabel,
  children,
  contentClassName,
}: ClinicFlowShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Bimble</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href={backHref}
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>

          <div className={cn("py-2", contentClassName)}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
