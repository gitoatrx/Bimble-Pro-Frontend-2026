"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  clearClinicLoginSession,
  readClinicLoginSession,
} from "@/lib/clinic/session";

export default function ClinicDashboardPage() {
  const router = useRouter();
  const loginSession = readClinicLoginSession();

  useEffect(() => {
    if (!loginSession) {
      router.replace("/login");
    }
  }, [loginSession, router]);

  if (!loginSession) {
    return null;
  }

  function handleOpenOscar() {
    if (!loginSession) {
      return;
    }

    window.location.assign(loginSession.appUrl);
  }

  function handleLogout() {
    clearClinicLoginSession();
    router.replace("/login");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Clinic dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Welcome, {loginSession.clinicSlug}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use the OSCAR button below to continue directly into your clinic app.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" onClick={handleOpenOscar}>
            Open OSCAR
          </Button>
          <Button type="button" variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </section>
    </main>
  );
}
