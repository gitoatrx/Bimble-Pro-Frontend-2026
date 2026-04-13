import { Clock, Heart, Monitor } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "A calmer, more sustainable clinic day",
    bullets: [
      "Cuts 20+ hours of weekly admin per practitioner",
      "Fewer interruptions and less phone tag",
      "More time to focus on patient care",
    ],
  },
  {
    icon: Heart,
    title: "Improved experience for patients",
    bullets: [
      "Easy, frustration-free self-booking",
      "Clean, mobile-friendly forms",
      "Online access to medical records",
    ],
  },
  {
    icon: Monitor,
    title: "More efficient clinic operations",
    bullets: [
      "Reduce administrative tasks by up to 84%",
      "Minimize no-shows with automated reminders",
      "Avoid lost billing with pre-appointment checks",
    ],
  },
];

export function DifferentiatorsSection() {
  return (
    <section id="benefits" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Benefits
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            More medicine. Less admin.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Bimble automates the work around care so providers can focus on
            patients instead of screens, callbacks, and manual follow-up.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="rounded-[2rem] border border-border bg-white p-8 shadow-sm"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <ul className="mt-6 space-y-3">
                  {benefit.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                    >
                      <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:grid-cols-3">
          {[
            {
              value: "20+ hours",
              label: "weekly admin cut per practitioner",
            },
            { value: "84%", label: "fewer administrative tasks" },
            { value: "15 minutes", label: "to see a doctor" },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-slate-50 p-5">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
