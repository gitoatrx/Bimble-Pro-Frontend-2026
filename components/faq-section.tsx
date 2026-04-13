"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Does the AI make medical decisions?",
    answer:
      "No. Your doctor remains the final authority, reviewing and signing all AI-generated notes and prescriptions. The AI is there to reduce documentation work, not replace clinical judgment.",
  },
  {
    question: "How does Secure OTP verification work?",
    answer:
      "When a patient books an appointment, Bimble sends a one-time password to the registered phone number so only verified patients can complete the booking.",
  },
  {
    question: "Can patients manage appointments and follow-up on mobile?",
    answer:
      "Yes. Patients can confirm, cancel, or modify bookings, message their provider, review results, and stay on top of next steps from a mobile-friendly patient home.",
    },
  {
    question: "Does Bimble fit into existing clinic workflows?",
    answer:
      "Yes. Bimble is designed to support booking, intake, reminders, documentation, and delivery without forcing teams to rebuild their entire process.",
  },
];

export function FAQSection() {
  const [openItem, setOpenItem] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Reassurance
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Everything you need to know about Bimble before getting started.
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm">
          {faqs.map((faq, index) => {
            const isOpen = openItem === index;

            return (
              <div key={faq.question} className="border-b border-border">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left text-sm font-medium text-foreground transition-colors hover:text-primary sm:px-6"
                  aria-expanded={isOpen}
                  onClick={() => setOpenItem(isOpen ? null : index)}
                >
                  <span className="max-w-2xl text-base font-semibold leading-6">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen ? (
                  <div className="px-5 pb-5 text-sm leading-7 text-muted-foreground sm:px-6">
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
