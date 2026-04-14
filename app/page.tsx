import type { Metadata } from "next";
import { Homepage } from "@/components/homepage/homepage";

export const metadata: Metadata = {
  title: "Bimble Canada — Book Your Appointment Today",
  description:
    "Bimble connects booking, secure verification, documentation, and follow-up for calmer healthcare workflows.",
};

export default function HomePage() {
  return <Homepage />;
}
