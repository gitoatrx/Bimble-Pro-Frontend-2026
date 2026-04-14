"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Billing is now handled by Stripe Checkout after clinic registration.
// This route redirects to the registration form to keep old links working.
export default function BillingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding");
  }, [router]);

  return null;
}
