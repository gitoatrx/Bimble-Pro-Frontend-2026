import { Clock, MapPin, ShieldCheck, Truck } from "lucide-react";

export function DifferentiatorsSection() {
  return (
    <>
      <section id="services" className="bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Verified Appointments
                </span>
              </div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Real Appointments for Real People
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Unlike platforms &quot;clogged&quot; with unverified leads and
                no-shows, Bimble requires a Secure OTP Login for every booking.
                This ensures your spot is guaranteed and the clinic has your
                clinical context before you even arrive.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  OTP verification prevents ghost bookings
                </li>
                <li className="flex items-center gap-3 text-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Clinical context shared before arrival
                </li>
                <li className="flex items-center gap-3 text-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Guaranteed appointment slots
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-background p-8">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Verified</h3>
                <p className="text-muted-foreground">
                  Every booking authenticated via secure OTP
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="delivery" className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Your Recovery, Accelerated
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Don&apos;t wait in a pharmacy line. Choose your path directly in
              the booking flow.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
              <div className="absolute -top-3 left-6">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  1-HOUR
                </span>
              </div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">
                Priority Delivery
              </h3>
              <p className="text-muted-foreground">
                Medicine at your doorstep in under 1 hour. Fast, reliable, and
                tracked in real-time.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <Truck className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">
                Express Pickup
              </h3>
              <p className="text-muted-foreground">
                Ready at our partner labs the moment you arrive. Skip the wait
                entirely.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <MapPin className="h-7 w-7 text-accent" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">
                Your Choice
              </h3>
              <p className="text-muted-foreground">
                Send it to any local pharmacy of your preference. Flexibility
                that fits your life.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
