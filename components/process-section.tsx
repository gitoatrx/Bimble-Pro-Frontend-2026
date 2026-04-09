import { Brain, Package, Smartphone, Video } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Smartphone,
    title: "Secure Verify",
    description: "Login via phone/OTP to access your personal dashboard",
  },
  {
    number: 2,
    icon: Brain,
    title: "Smart Triage",
    description:
      "Answer AI-powered intent questions so your care team is prepared",
  },
  {
    number: 3,
    icon: Video,
    title: "The Encounter",
    description:
      "Choose virtual or walk-in. Your doctor listens; our AI documents",
  },
  {
    number: 4,
    icon: Package,
    title: "Seamless Resolution",
    description:
      "Review your automated notes and receive your meds via your chosen delivery path",
  },
];

export function ProcessSection() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            A clear, anxiety-free process from start to finish.
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute top-16 right-0 left-0 hidden h-0.5 bg-border lg:block"
            style={{ marginLeft: "12.5%", marginRight: "12.5%" }}
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex h-full flex-col items-center rounded-2xl border border-border bg-card p-6 text-center">
                  <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-background">
                    <step.icon className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
