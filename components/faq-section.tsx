"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Does the AI make medical decisions?",
    answer:
      "No. Your doctor remains the final authority, reviewing and signing all AI-generated notes and prescriptions. The AI is a documentation assistant, not a decision-maker.",
  },
  {
    question: "Is my medicine delivery really guaranteed in an hour?",
    answer:
      'Yes, when selecting "Bimble Priority Delivery" during your booking flow. Our delivery network is optimized for speed while maintaining medication safety and proper handling.',
  },
  {
    question: "Can I manage my family's health here?",
    answer:
      "Yes, the Patient Dashboard allows you to manage exclusive profiles for family members securely. Each profile maintains its own medical history and appointment records.",
  },
  {
    question: "How does the OTP verification work?",
    answer:
      "When you book an appointment, we send a one-time password to your registered phone number. This ensures that only verified patients can book appointments, eliminating ghost bookings and no-shows.",
  },
  {
    question: "What happens to my consultation recording?",
    answer:
      "Your consultation is processed in real-time by our Ambient AI to generate medical notes. The recording is encrypted and stored securely according to HIPAA standards. You can request deletion at any time.",
  },
];

export function FAQSection() {
  const [openItem, setOpenItem] = useState<number | null>(0);

  return (
    <section className="bg-card py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about Bimble.
          </p>
        </div>

        <div className="w-full">
          {faqs.map((faq, index) => {
            const isOpen = openItem === index;

            return (
              <div key={faq.question} className="border-b border-border">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 py-4 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
                  aria-expanded={isOpen}
                  onClick={() => setOpenItem(isOpen ? null : index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen ? (
                  <div className="pb-4 text-sm text-muted-foreground">
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
