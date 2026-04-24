"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, Battery, Brain, CalendarCheck, ChevronDown, Droplets, MapPin, Moon, Search, Stethoscope, Sun, TrendingUp, Users, Zap } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { fetchAvailableServices, type AvailableServiceRecord } from "@/lib/api/clinic-dashboard";
import { reverseGeocodePatientLocation } from "@/lib/api/patient-intake";
import {
  bcCities,
  faqs,
  marqueeConditions,
  stats,
  testimonials,
} from "./content";
import "./homepage.css";

/* ── Animated stat counter ──────────────────── */

type StatFormat = { prefix: string; target: number; suffix: string; decimals: number };

function parseStatValue(value: string): StatFormat {
  if (value.startsWith("< ")) {
    const n = parseFloat(value.replace("< ", "").split(" ")[0]);
    const suffix = value.replace(`< ${n}`, "");
    return { prefix: "< ", target: n, suffix, decimals: 0 };
  }
  const match = value.match(/^([\d.]+)(.*)$/);
  if (!match) return { prefix: "", target: 0, suffix: value, decimals: 0 };
  const n = parseFloat(match[1]);
  const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;
  return { prefix: "", target: n, suffix: match[2], decimals };
}

function AnimatedStat({ value, active }: { value: string; active: boolean }) {
  const { prefix, target, suffix, decimals } = parseStatValue(value);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [active, target]);

  const formatted = display.toFixed(decimals);
  return <>{prefix}{formatted}{suffix}</>;
}

/* ── Component ──────────────────────────────── */

export function Homepage() {
  const router = useRouter();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement>(null);
  const [statsActive, setStatsActive] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (loginMenuRef.current && !loginMenuRef.current.contains(e.target as Node)) {
        setLoginMenuOpen(false);
      }
    }
    if (loginMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [loginMenuOpen]);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsActive(true); observer.disconnect(); } },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Hero search state
  const [careQuery, setCareQuery] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [serviceOptions, setServiceOptions] = useState<AvailableServiceRecord[]>([]);
  const [locationResolved, setLocationResolved] = useState(false);

  const requestCurrentLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const response = await reverseGeocodePatientLocation(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          if (response.location) {
            setLocationQuery(response.location);
            setLocationResolved(true);
          } else {
            setLocationResolved(false);
          }
        } catch {
          setLocationResolved(false);
        }
        setGeoStatus("done");
      },
      () => {
        setGeoStatus("denied");
        setLocationResolved(false);
      },
      {
        timeout: 10000,
        maximumAge: 300000,
        enableHighAccuracy: true,
      },
    );
  }, []);

  /* ── Geolocation on mount / permission change ─────────────────── */
  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    const retryLocation = () => {
      if (!locationQuery) {
        requestCurrentLocation();
      }
    };

    const handleFocus = () => retryLocation();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        retryLocation();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    let permissionStatus: PermissionStatus | null = null;

    async function watchPermission() {
      if (!("permissions" in navigator) || !navigator.permissions?.query) return;
      try {
        permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        } as PermissionDescriptor);
        permissionStatus.onchange = () => {
          if (permissionStatus?.state === "granted") {
            requestCurrentLocation();
          } else if (permissionStatus?.state === "denied") {
            setGeoStatus("denied");
          }
        };
      } catch {
        // Ignore permission watcher failures and rely on focus retries.
      }
    }

    void watchPermission();

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [locationQuery, requestCurrentLocation]);

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

      // Immediately mark visible if already in the viewport (handles cases where
      // the element is above the fold or the IntersectionObserver callback is
      // delayed — e.g. when accessing via a network IP in Next.js dev mode).
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        target.classList.add("visible");
      } else {
        observer.observe(target);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const response = await fetchAvailableServices();
        if (!cancelled) {
          setServiceOptions(Array.isArray(response) ? response : []);
        }
      } catch {
        if (!cancelled) {
          setServiceOptions([]);
        }
      }
    }

    void loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCities = bcCities.filter(
    (c) =>
      locationQuery.length > 0 &&
      c.toLowerCase().startsWith(locationQuery.toLowerCase()),
  );

  const resolveServiceId = useCallback(
    (query: string) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return null;
      const exact = serviceOptions.find(
        (service) => service.service_name.toLowerCase() === normalized,
      );
      if (exact) return exact.service_id;
      const partial = serviceOptions.find((service) => {
        const name = service.service_name.toLowerCase();
        const description = (service.description ?? "").toLowerCase();
        return (
          name.includes(normalized) ||
          normalized.includes(name) ||
          description.includes(normalized)
        );
      });
      return partial?.service_id ?? null;
    },
    [serviceOptions],
  );

  const handleSelectCity = useCallback((city: string) => {
    setLocationQuery(city + ", BC");
    setLocationResolved(true);
    setShowCitySuggestions(false);
  }, []);

  return (
    <div className="hp">

      {/* ══ NAV ══════════════════════════════════ */}
      <nav className={`hp-nav${navScrolled ? " hp-nav--scrolled" : ""}`}>
        <div className="hp-nav-inner">
          <Link href="/" className="hp-nav-logo">
            <BrandMark size={36} priority className="h-9 w-9" />
            Bimble
          </Link>

          <div className="hp-nav-actions">
            <Link href="/onboarding/plan" className="hp-nav-list">
              List your practice
            </Link>

            {/* Login dropdown */}
            <div ref={loginMenuRef} style={{ position: "relative" }}>
              <button
                className="hp-nav-signin"
                onClick={() => setLoginMenuOpen((o) => !o)}
                aria-expanded={loginMenuOpen}
                aria-haspopup="true"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", padding: "9px 16px", borderRadius: "var(--r-sm)" }}
              >
                Log in
                <ChevronDown
                  size={14}
                  style={{
                    transition: "transform 0.18s",
                    transform: loginMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {loginMenuOpen && (
                <div className="hp-login-menu">
                  <Link
                    href="/login"
                    className="hp-login-menu-item"
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    <span className="hp-login-menu-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </span>
                    <span>
                      <strong>Login as Clinic</strong>
                      <em>Manage appointments &amp; settings</em>
                    </span>
                  </Link>
                  <Link
                    href="/doctor/login"
                    className="hp-login-menu-item"
                    onClick={() => setLoginMenuOpen(false)}
                  >
                    <span className="hp-login-menu-icon">
                      <Stethoscope size={16} />
                    </span>
                    <span>
                      <strong>Login as Doctor</strong>
                      <em>View patients &amp; pool appointments</em>
                    </span>
                  </Link>
                </div>
              )}
            </div>

            <Link href="/onboarding/plan" className="hp-nav-cta">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <main>

        {/* ══ HERO + STATS + MARQUEE (one connected section) ══ */}
        <section className="hp-hero" id="find-care">
          <div className="hp-hero-inner">
            <h1 className="hp-hero-h1">
              See a doctor today.<br />
              Confirmed in <em>minutes.</em>
            </h1>

            {/* Search bar */}
            <div className="hp-search-box">
              <div className="hp-search-field">
                <Search size={17} strokeWidth={2} />
                <input
                  type="text"
                  value={careQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCareQuery(value);
                    const selected = serviceOptions.find(
                      (service) => service.service_name.toLowerCase() === value.trim().toLowerCase(),
                    );
                    setSelectedServiceId(selected?.service_id ?? null);
                  }}
                  placeholder="What type of care do you need?"
                  autoComplete="off"
                  list="homepage-care-options"
                />
                <datalist id="homepage-care-options">
                  {serviceOptions.map((service) => (
                    <option key={service.service_id} value={service.service_name} />
                  ))}
                </datalist>
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
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setLocationResolved(false);
                    setShowCitySuggestions(true);
                  }}
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

              <button
                type="button"
                className="hp-search-btn"
                onClick={() => {
                  const params = new URLSearchParams();
                  const resolvedServiceId = selectedServiceId ?? resolveServiceId(careQuery);
                  if (careQuery.trim()) params.set("reason", careQuery.trim());
                  if (resolvedServiceId) params.set("serviceId", String(resolvedServiceId));
                  if (locationQuery.trim() && (locationResolved || geoStatus !== "done")) {
                    params.set("location", locationQuery.trim());
                  }
                  const q = params.toString();
                  router.push(q ? `/patient/onboarding?${q}` : "/patient/onboarding");
                }}
              >
                <Search size={15} strokeWidth={2.5} />
                Find care
              </button>
            </div>
          </div>

          {/* Stats — no separate background, part of hero */}
          <div className="hp-stats" ref={statsRef}>
            <div className="hp-stats-inner">
              {stats.map((stat) => (
                <div key={stat.label} className="hp-stat">
                  <div className="hp-stat-value">
                    <AnimatedStat value={stat.value} active={statsActive} />
                  </div>
                  <div className="hp-stat-label">{stat.label}</div>
                  {stat.sub && <div className="hp-stat-sub">{stat.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Marquee of care categories + conditions */}
          <div className="hp-marquee" aria-hidden="true">
            <div className="hp-marquee-track">
              {[...marqueeConditions, ...marqueeConditions].map((label, i) => (
                <span key={i} className="hp-marquee-pill">{label}</span>
              ))}
            </div>
          </div>
        </section>





        {/* ══ CARE HIGHLIGHTS ══════════════════════ */}
        <section className="hp-care">
          <div className="hp-care-inner">

            <div className="hp-care-head reveal">
              <h2 className="hp-care-h2">Care for whatever you&rsquo;re going through</h2>
              <p className="hp-care-sub">Video consultations, therapy, and specialist bookings — all virtual, all covered by your health card.</p>
            </div>

            <div className="hp-care-grid reveal">

              {/* ── Featured card: virtual doctors available now ── */}
              <div className="hp-care-card hp-care-card--featured">
                <div className="hp-care-card-content">
                  <h3 className="hp-care-card-title">See a doctor<br />from anywhere</h3>
                  <p className="hp-care-card-desc">Licensed doctors available by video now. No travel, no waiting room.</p>
                  <Link href="/book" className="hp-care-card-btn">
                    Get started <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Image — replace src with your own */}
                <div className="hp-care-card-image">
                  {/* <img src="/images/virtual-care.jpg" alt="Virtual care" /> */}
                </div>
              </div>

              {/* ── Mental health card ── */}
              <div className="hp-care-card hp-care-card--green">
                <div className="hp-care-card-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <h3 className="hp-care-card-title">Talk to<br />someone</h3>
                <p className="hp-care-card-desc">Virtual therapy with licensed counsellors. Filter by language, coverage, and availability.</p>
                <Link href="/book" className="hp-care-card-btn">
                  Get started <ArrowRight size={13} />
                </Link>
              </div>

              {/* ── Specialist card ── */}
              <div className="hp-care-card hp-care-card--blue">
                <div className="hp-care-card-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <h3 className="hp-care-card-title">Skip the<br />referral wait</h3>
                <p className="hp-care-card-desc">Dermatology, physiotherapy, and more — book direct without waiting months for a referral.</p>
                <Link href="/book" className="hp-care-card-btn">
                  Get started <ArrowRight size={13} />
                </Link>
              </div>

            </div>

            {/* Condition pills */}
            <div className="hp-care-pills reveal">
              {([
                ["Back pain",  <Activity key="i" size={14} />],
                ["Skin rash",  <Droplets key="i" size={14} />],
                ["Migraine",   <Zap key="i" size={14} />],
                ["Anxiety",    <Brain key="i" size={14} />],
              ] as [string, React.ReactNode][]).map(([c, icon]) => (
                <button
                  key={c}
                  type="button"
                  className="hp-care-pill"
                  onClick={() => {
                    setCareQuery(c);
                    const selected = serviceOptions.find(
                      (service) => service.service_name.toLowerCase() === c.toLowerCase(),
                    );
                    setSelectedServiceId(selected?.service_id ?? null);
                  }}
                >
                  {icon}{c}
                </button>
              ))}
              <button type="button" className="hp-care-pill hp-care-pill--more" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                See all <ArrowRight size={13} />
              </button>
            </div>

          </div>
        </section>

        {/* ══ TESTIMONIALS ═════════════════════════ */}
        <section className="hp-testimonials" id="reviews">
          <div className="hp-testimonials-inner">
            <h2 className="hp-t-heading">Real stories. Real appointments.</h2>
          </div>

          {/* Row 1 — scrolls left */}
          <div className="hp-t-marquee">
            <div className="hp-t-track hp-t-track--left">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="hp-t-card">
                  <div className="hp-t-stars">★★★★★</div>
                  <p className="hp-t-text">&ldquo;{t.text}&rdquo;</p>
                  <div className="hp-t-author">
                    <div className="hp-t-avatar">{t.initials}</div>
                    <div>
                      <div className="hp-t-name">{t.name}</div>
                      <div className="hp-t-meta">{t.meta}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 — scrolls right (offset order) */}
          <div className="hp-t-marquee" style={{ marginTop: "16px" }}>
            <div className="hp-t-track hp-t-track--right">
              {[...[...testimonials].reverse(), ...[...testimonials].reverse()].map((t, i) => (
                <div key={i} className="hp-t-card">
                  <div className="hp-t-stars">★★★★★</div>
                  <p className="hp-t-text">&ldquo;{t.text}&rdquo;</p>
                  <div className="hp-t-author">
                    <div className="hp-t-avatar">{t.initials}</div>
                    <div>
                      <div className="hp-t-name">{t.name}</div>
                      <div className="hp-t-meta">{t.meta}</div>
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

        {/* ══ CLINIC CTA ═══════════════════════════ */}
        <section className="hp-clinic-cta" id="for-clinics">
          <div className="hp-clinic-cta-inner reveal">

            <div className="hp-clinic-cta-left">
              <span className="hp-clinic-cta-eyebrow">For Clinics</span>
              <h2 className="hp-clinic-cta-h2">More patients.<br />Zero phone tag.</h2>
              <p className="hp-clinic-cta-sub">
                Bimble puts your clinic in front of patients actively searching for care in your area — no cold calls, no admin overhead, no long-term contracts.
              </p>
              <ul className="hp-clinic-benefits">
                <li><Users size={18} /><span><strong>Fill empty slots instantly</strong> — patients book in real time, 24/7</span></li>
                <li><CalendarCheck size={18} /><span><strong>Automatic reminders</strong> cut no-shows by up to 40%</span></li>
                <li><TrendingUp size={18} /><span><strong>Grow your panel</strong> with patients matched to your specialty</span></li>
              </ul>
              <div className="hp-clinic-cta-actions">
                <Link href="/onboarding/plan" className="hp-clinic-cta-btn-primary">
                  List your clinic free <ArrowRight size={15} />
                </Link>
              </div>
              <p className="hp-clinic-cta-trust">Free to join · No long-term contracts · Setup in 10 min</p>
            </div>

            <div className="hp-clinic-cta-right">
              <div className="hp-clinic-stat-card">
                <div className="hp-clinic-stat">
                  <span className="hp-clinic-stat-value">3×</span>
                  <span className="hp-clinic-stat-label">more bookings per month</span>
                </div>
                <div className="hp-clinic-stat-divider" />
                <div className="hp-clinic-stat">
                  <span className="hp-clinic-stat-value">40%</span>
                  <span className="hp-clinic-stat-label">fewer no-shows with reminders</span>
                </div>
                <div className="hp-clinic-stat-divider" />
                <div className="hp-clinic-stat">
                  <span className="hp-clinic-stat-value">0</span>
                  <span className="hp-clinic-stat-label">phone calls to manage bookings</span>
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
