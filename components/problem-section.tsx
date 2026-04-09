import { Heart, Monitor } from "lucide-react";

export function ProblemSection() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Moving Care to the Foreground
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            We believe technology should enhance human connection, not replace
            it.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <Monitor className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                The Documentation Clog
              </h3>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              Most doctors spend half their day typing into screens, driving
              burnout and impersonal visits. The focus shifts from you to the
              keyboard, creating a disconnect in what should be a personal
              interaction.
            </p>
            <div className="mt-6 rounded-xl bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                50% of physician time spent on documentation
              </p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                The Bimble Solution
              </h3>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              Our platform uses background technology that &quot;fades
              away.&quot; We turn your consultation into structured medical
              notes automatically, restoring the gestures, empathy, and human
              connection of medicine.
            </p>
            <div className="mt-6 rounded-xl bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">
                100% focus on you during your visit
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
