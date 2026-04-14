"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, MapPin, Search } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import {
  bcCities,
  faqs,
  howItWorks,
  navItems,
  specialties,
  stats,
  testimonials,
  whyFeatures,
} from "./content";
import "./homepage.css";

/* ── Geolocation helpers ────────────────────── */

async function reverseGeocodeCity(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: { city?: string; town?: string; village?: string; state?: string };
    };
    const city =
      data.address?.city ?? data.address?.town ?? data.address?.village ?? null;
    return city ? city : null;
  } catch {
    return null;
  }
}

/* ── Component ──────────────────────────────── */

export function Homepage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Hero search state
  const [careQuery, setCareQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  /* ── Geolocation on mount ─────────────────── */
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude);
        if (city) {
          setLocationQuery(city + ", BC");
        } else {
          setLocationQuery("Vancouver, BC");
        }
        setGeoStatus("done");
      },
      () => {
        setGeoStatus("denied");
      },
      { timeout: 6000 },
    );
  }, []);

  /* ── Reveal animation ─────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("visible");
          }
        });
      },
      { threshold: 0.07 },
    );

    document.querySelectorAll(".reveal").forEach((el, i) => {
      const target = el as HTMLElement;
      target.style.transitionDelay = `${i * 70}ms`;
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  const filteredCities = bcCities.filter(
    (c) =>
      locationQuery.length > 0 &&
      c.toLowerCase().startsWith(locationQuery.toLowerCase()),
  );

  const handleSelectCity = useCallback((city: string) => {
    setLocationQuery(city + ", BC");
    setShowCitySuggestions(false);
  }, []);

  return (
    <div className="hp">

      {/* ══ NAV ══════════════════════════════════ */}
      <nav className="hp-nav">
        <div className="hp-nav-inner">
          <Link href="/" className="hp-nav-logo">
            <BrandMark size={36} priority className="h-9 w-9" />
            Bimble
          </Link>

          <ul className="hp-nav-links">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>

          <div className="hp-nav-actions">
            <Link href="/login" className="hp-nav-signin">
              Sign In
            </Link>
            <Link href="#find-care" className="hp-nav-cta">
              <CalendarDays size={14} strokeWidth={2.5} />
              Find Care
            </Link>
          </div>
        </div>
      </nav>

      <main>

        {/* ══ HERO ══════════════════════════════════ */}
        <section className="hp-hero" id="find-care">
          <div className="hp-hero-inner">
            <h1 className="hp-hero-h1">
              Book a doctor&rsquo;s appointment<br />
              in under <em>2 minutes.</em>
            </h1>

            <p className="hp-hero-sub">
              Tell us what you need. We match you with a verified BC doctor
              and confirm your appointment — no hold music, no callbacks.
            </p>

            {/* Search bar — clean single-line, no stacked labels */}
            <div className="hp-search-box">
              <div className="hp-search-field">
                <Search size={17} strokeWidth={2} />
                <input
                  type="text"
                  value={careQuery}
                  onChange={(e) => setCareQuery(e.target.value)}
                  placeholder="What type of care do you need?"
                  autoComplete="off"
                />
              </div>

              <div className="hp-search-field" style={{ position: "relative" }}>
                <MapPin
                  size={17}
                  strokeWidth={2}
                  style={{ color: geoStatus === "loading" ? "#1f4fff" : undefined }}
                />
                <input
                  ref={locationInputRef}
                  type="text"
                  value={locationQuery}
                  onChange={(e) => { setLocationQuery(e.target.value); setShowCitySuggestions(true); }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                  placeholder={geoStatus === "loading" ? "Detecting location…" : "City in BC"}
                  autoComplete="off"
                />

                {showCitySuggestions && filteredCities.length > 0 && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "#fff", border: "1px solid #d0d8f0",
                    borderRadius: "12px", boxShadow: "0 8px 32px rgba(15,31,61,0.12)",
                    zIndex: 50, overflow: "hidden",
                  }}>
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onMouseDown={() => handleSelectCity(city)}
                        style={{
                          width: "100%", textAlign: "left", padding: "10px 16px",
                          fontSize: "14px", color: "#0f1f3d", background: "none",
                          border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "8px",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#eef2ff"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                      >
                        <MapPin size={13} style={{ color: "#8896b4", flexShrink: 0 }} />
                        {city}, BC
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" className="hp-search-btn">
                <Search size={15} strokeWidth={2.5} />
                Find care
              </button>
            </div>

          </div>
        </section>

        {/* ══ STATS BAR ════════════════════════════ */}
        <div className="hp-stats">
          <div className="hp-stats-inner">
            {stats.map((stat) => (
              <div key={stat.label} className="hp-stat">
                <div className="hp-stat-value">{stat.value}</div>
                <div className="hp-stat-label">{stat.label}</div>
                {stat.sub && <div className="hp-stat-sub">{stat.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ══ PROBLEM STATEMENT ════════════════════ */}
        <section className="hp-problem">
          <div className="hp-problem-inner">
            <div className="reveal">
              <div className="hp-section-label hp-problem-label">The BC Healthcare Gap</div>
              <h2 className="hp-problem-h2">
                Finding care in BC<br />
                shouldn&rsquo;t feel like<br />
                <em>a second job.</em>
              </h2>
              <p className="hp-problem-text">
                1 in 5 BC residents has no family doctor. Specialist wait times average
                27 weeks. Walk-ins turn patients away. Phone trees waste hours.
                Bimble fixes this — one verified booking at a time.
              </p>
            </div>

            <div className="hp-problem-points reveal">
              {[
                {
                  icon: "📞",
                  title: "Hours on hold, no appointment",
                  text: "Most BC clinics still require phone calls during business hours. Bimble lets you book in under 2 minutes, any time.",
                },
                {
                  icon: "🩺",
                  title: "No family doctor? Not alone.",
                  text: "Over 1 million BC residents are without a GP. Bimble surfaces every family practice accepting new patients in your area.",
                },
                {
                  icon: "⏳",
                  title: "Specialist waits measured in months",
                  text: "The average BC specialist wait is 27 weeks. Bimble finds clinics with faster access and direct-booking availability.",
                },
              ].map((point) => (
                <div key={point.title} className="hp-problem-point">
                  <div className="hp-problem-point-icon">{point.icon}</div>
                  <div>
                    <div className="hp-problem-point-title">{point.title}</div>
                    <div className="hp-problem-point-text">{point.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ═════════════════════════ */}
        <section className="hp-how" id="how-it-works">
          <div className="hp-how-inner">
            <div className="hp-section-head reveal">
              <div className="hp-section-label">Simple &amp; Fast</div>
              <h2 className="hp-section-h2">Book your appointment in under 2 minutes</h2>
              <p className="hp-section-sub">
                No calls. No faxes. Just a few taps to connect with the right clinic in BC.
              </p>
            </div>

            <div className="hp-how-steps reveal">
              {howItWorks.map((step) => (
                <div key={step.step} className="hp-how-step">
                  <div className="hp-how-step-num">{step.step}</div>
                  <div className="hp-how-step-icon">{step.icon}</div>
                  <div className="hp-how-step-title">{step.title}</div>
                  <div className="hp-how-step-text">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SPECIALTIES ══════════════════════════ */}
        <section className="hp-specialties" id="specialties">
          <div className="hp-specialties-inner">
            <div className="hp-section-head reveal">
              <div className="hp-section-label">All Specialties</div>
              <h2 className="hp-section-h2">Care for every health need in BC</h2>
              <p className="hp-section-sub">
                From family doctors to mental health — find verified BC providers across every specialty.
              </p>
            </div>

            <div className="hp-specialties-grid reveal">
              {specialties.map((specialty) => (
                <button
                  key={specialty.slug}
                  type="button"
                  className="hp-specialty-card"
                  onClick={() => setCareQuery(specialty.name)}
                >
                  <div className="hp-specialty-card-icon">{specialty.icon}</div>
                  <div className="hp-specialty-card-title">{specialty.name}</div>
                  <div className="hp-specialty-card-desc">{specialty.description}</div>
                  <div className="hp-specialty-card-link">
                    Find providers <ArrowRight size={12} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>


        {/* ══ WHY BIMBLE ═══════════════════════════ */}
        <section className="hp-why">
          <div className="hp-why-inner">
            <div className="hp-section-head reveal">
              <div className="hp-section-label">Patient First</div>
              <h2 className="hp-section-h2">Built for BC patients, not the system</h2>
              <p className="hp-section-sub">
                Everything on Bimble is designed around your time, your health card, and your right to faster care.
              </p>
            </div>

            <div className="hp-why-grid reveal">
              {whyFeatures.map((feature) => (
                <div key={feature.title} className="hp-why-card">
                  <div className="hp-why-icon">{feature.icon}</div>
                  <div className="hp-why-title">{feature.title}</div>
                  <div className="hp-why-text">{feature.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ═════════════════════════ */}
        <section className="hp-testimonials" id="reviews">
          <div className="hp-testimonials-inner">
            <div className="hp-section-head reveal">
              <div className="hp-section-label">Real Reviews</div>
              <h2 className="hp-section-h2">Trusted by BC patients</h2>
              <p className="hp-section-sub">
                From Surrey to Kelowna — real people who found faster care through Bimble.
              </p>
            </div>

            <div className="hp-testimonials-grid reveal">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className={`hp-testimonial-card${t.featured ? " featured" : ""}`}
                >
                  <div className="hp-testimonial-stars">★★★★★</div>
                  <div className="hp-testimonial-text">&ldquo;{t.text}&rdquo;</div>
                  <div className="hp-testimonial-author">
                    <div className="hp-testimonial-avatar">{t.initials}</div>
                    <div>
                      <div className="hp-testimonial-name">{t.name}</div>
                      <div className="hp-testimonial-meta">{t.meta}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ══════════════════════════════════ */}
        <section className="hp-faq" id="faq">
          <div className="hp-faq-inner">
            <div className="hp-section-head reveal">
              <div className="hp-section-label">Common Questions</div>
              <h2 className="hp-section-h2">Everything you need to know</h2>
            </div>

            <div className="hp-faq-list reveal">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="hp-faq-item">
                  <button
                    type="button"
                    className={`hp-faq-q${openFaqIndex === index ? " open" : ""}`}
                    onClick={() =>
                      setOpenFaqIndex((curr) => (curr === index ? null : index))
                    }
                  >
                    {faq.question}
                    <div className="hp-faq-icon">+</div>
                  </button>
                  <div className={`hp-faq-a${openFaqIndex === index ? " open" : ""}`}>
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PATIENT CTA BANNER ═══════════════════ */}
        <section className="hp-cta-banner">
          <div className="hp-cta-banner-inner reveal">
            <h2 className="hp-cta-banner-h2">
              Your next BC appointment<br />is minutes away.
            </h2>
            <p className="hp-cta-banner-sub">
              Join thousands of BC residents who found a family doctor, walk-in, or specialist through Bimble —
              free, fast, and MSP accepted.
            </p>
            <div className="hp-cta-banner-actions">
              <Link href="#find-care" className="hp-cta-banner-primary">
                <Search size={15} strokeWidth={2.5} />
                Find Care Now
              </Link>
              <Link href="/onboarding/plan" className="hp-cta-banner-secondary">
                List Your Clinic
              </Link>
            </div>
            <p className="hp-cta-trust">No account needed · Always free for patients · MSP accepted</p>
          </div>
        </section>

        {/* ══ FOR CLINICS ══════════════════════════ */}
        <section className="hp-for-clinics" id="for-clinics">
          <div className="hp-for-clinics-inner">
            <div className="reveal">
              <div className="hp-section-label hp-for-clinics-label">For BC Clinics</div>
              <h2 className="hp-for-clinics-h2">
                Fill every slot.<br />
                Reduce no-shows.<br />
                Grow your practice.
              </h2>
              <p className="hp-for-clinics-text">
                Join 500+ verified BC clinics using Bimble to manage real-time availability,
                reduce front-desk calls, and connect with patients who are ready to book.
                No setup fee. No long-term contracts.
              </p>

              <div className="hp-for-clinics-features">
                {[
                  { icon: "📅", text: "Real-time slot management synced with your existing schedule" },
                  { icon: "🔒", text: "Secure OTP patient verification before every appointment" },
                  { icon: "🤖", text: "AI-assisted clinical notes and post-visit documentation" },
                  { icon: "📊", text: "Analytics dashboard showing bookings, cancellations, and revenue" },
                  { icon: "💳", text: "MSP billing support with direct pay and extended health" },
                ].map((f) => (
                  <div key={f.text} className="hp-for-clinics-feature">
                    <div className="hp-for-clinics-feature-icon">{f.icon}</div>
                    <div className="hp-for-clinics-feature-text">{f.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link href="/onboarding/plan" className="hp-btn-primary">
                  Get Started Free
                  <ArrowRight size={15} />
                </Link>
                <Link href="/onboarding/plan" className="hp-btn-ghost">
                  See Plans &amp; Pricing
                </Link>
              </div>
            </div>

            <div className="hp-for-clinics-visual reveal">
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--blue)", marginBottom: "8px" }}>
                  Clinic performance snapshot
                </div>
                <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                  Average results for BC clinics on Bimble after 90 days
                </div>
              </div>

              <div className="hp-for-clinics-stat-row">
                {[
                  { val: "38%", label: "Fewer phone calls to front desk" },
                  { val: "92%", label: "Patient show-up rate" },
                  { val: "2×", label: "Faster new patient intake" },
                  { val: "4.8★", label: "Average clinic rating on Bimble" },
                ].map((s) => (
                  <div key={s.label} className="hp-for-clinics-stat">
                    <div className="hp-for-clinics-stat-val">{s.val}</div>
                    <div className="hp-for-clinics-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "20px", padding: "16px", background: "var(--blue-pale)", borderRadius: "var(--r-md)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ fontSize: "20px" }}>🏥</div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)", marginBottom: "3px" }}>
                    90-day free trial
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                    No credit card required to start. Full platform access for 3 months.
                    Cancel anytime before the trial ends.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ══ FOOTER ════════════════════════════════ */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-top">
            <div className="hp-footer-brand">
              <Link href="/" className="hp-footer-logo">
                <BrandMark size={32} className="h-8 w-8" />
                Bimble
              </Link>
              <p className="hp-footer-tagline">
                British Columbia&rsquo;s trusted platform for fast, verified healthcare bookings.
                Free for patients. MSP accepted everywhere.
              </p>

              <div className="hp-footer-cities">
                {bcCities.map((city) => (
                  <span key={city} className="hp-footer-city">{city}</span>
                ))}
              </div>
            </div>

            <div className="hp-footer-col">
              <h4>For Patients</h4>
              <ul>
                <li><a href="#find-care">Find a Doctor</a></li>
                <li><a href="#find-care">Book Appointment</a></li>
                <li><a href="#specialties">Virtual Care</a></li>
                <li><a href="#specialties">All Specialties</a></li>
                <li><a href="#reviews">Patient Reviews</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
              </ul>
            </div>

            <div className="hp-footer-col">
              <h4>For Clinics</h4>
              <ul>
                <li><Link href="/onboarding/plan">List Your Clinic</Link></li>
                <li><Link href="/onboarding/plan">Pricing</Link></li>
                <li><Link href="/onboarding/plan">Start Free Trial</Link></li>
                <li><a href="#for-clinics">Clinic Features</a></li>
                <li><Link href="/login">Clinic Login</Link></li>
              </ul>
            </div>

            <div className="hp-footer-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Bimble</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Accessibility</a></li>
                <li><a href="#">PIPA Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="hp-footer-bottom">
            <span className="hp-footer-copy">
              © 2026 Bimble Canada Inc. · Serving British Columbia 🍁
            </span>
            <div className="hp-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">PIPA Compliance</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
