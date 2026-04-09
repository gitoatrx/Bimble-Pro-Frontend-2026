"use client";

import Image from "next/image";
import { useState } from "react";
import { Clock, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSection() {
  const [symptoms, setSymptoms] = useState("");

  return (
    <section className="relative overflow-hidden bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Care that starts with a conversation
              </p>
              <h1 className="text-balance text-4xl leading-tight font-bold text-foreground sm:text-5xl lg:text-6xl">
                Healthcare that stays connected, from your first click to final
                recovery.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                We&apos;ve unified the Canadian outpatient journey. One platform
                that empowers patients to access care instantly and helps clinics
                manage the full path of care, including AI documentation,
                provincial billing, and medicine delivery.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Describe symptoms..."
                  className="h-12 border-border bg-background pl-10 text-foreground"
                  value={symptoms}
                  onChange={(event) => setSymptoms(event.target.value)}
                />
              </div>
              <Button className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90">
                Book An Appointment
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Verified by Secure OTP</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>See a doctor in as little as 15 minutes</span>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-8">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop"
                alt="Doctor having a warm conversation with patient"
                width={800}
                height={600}
                priority
                className="h-auto w-full object-cover"
              />
              <div className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-card/90 px-4 py-2 backdrop-blur-sm">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  Ambient AI Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
