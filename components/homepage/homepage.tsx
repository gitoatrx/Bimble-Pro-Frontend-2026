"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Home, MapPin, Search } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import {
  clinicBenefits,
  clinicCards,
  faqs,
  navItems,
  provinces,
  specialties,
  testimonials,
  whyFeatures,
} from "./content";
import "./homepage.css";

export function Homepage() {
  const [activeSpecialtyIndex, setActiveSpecialtyIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("visible");
          }
        });
      },
      { threshold: 0.08 },
    );

    document.querySelectorAll(".reveal").forEach((element, index) => {
      const target = element as HTMLElement;
      target.style.transitionDelay = `${index * 80}ms`;
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage-page">
      <nav>
        <Link href="#hero" className="nav-logo">
          <BrandMark size={40} priority className="h-10 w-10" />
          Bimble
        </Link>

        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <Link href="/login" className="btn-ghost">
            Sign In
          </Link>
          <Link href="/onboarding/plan" className="btn-primary">
            <CalendarDays size={15} strokeWidth={2.5} />
            Book Now
          </Link>
        </div>
      </nav>

      <main>
        <section className="hero" id="hero">
          <div className="hero-bg" />
          <div className="hero-leaf" />

          <div className="hero-left">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              ✳ Bimble connects booking, notes, and recovery
            </div>

            <h1 className="hero-title">
              <em>Healthcare</em>
              <br />
              that stays connected.
            </h1>

            <p className="hero-subtitle">
              Bimble brings booking, Secure OTP verification, AI-assisted
              documentation, and recovery workflows together in one calm
              experience.
            </p>

            <div className="hero-search-wrap">
              <div className="hero-search-field">
                <Search size={18} strokeWidth={2} />
                <div style={{ flex: 1 }}>
                  <label>Care need or specialist</label>
                  <input
                    type="text"
                    placeholder="e.g. Family Care, Dermatology…"
                  />
                </div>
              </div>

              <div className="hero-search-field">
                <MapPin size={18} strokeWidth={2} />
                <div style={{ flex: 1 }}>
                  <label>City or Province</label>
                  <input type="text" placeholder="Toronto, ON…" />
                </div>
              </div>

              <Link href="#find-clinic" className="btn-primary hero-search-cta">
                <Search size={16} strokeWidth={2.5} />
                Find Appointment
              </Link>
            </div>

            <div className="hero-cta-row">
              <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                Popular:
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Family Care", "Walk-In", "Virtual Care", "Urgent Care"].map(
                  (item) => (
                    <span
                      key={item}
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--teal-deep)",
                        background: "var(--teal-pale)",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontWeight: 500,
                        border: "1px solid rgba(31,79,255,0.12)",
                      }}
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div style={{ position: "relative", padding: "40px 20px 20px" }}>
              <div className="hero-card-main">
                <div className="hero-card-header">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "rgba(255,255,255,0.65)",
                          marginBottom: "6px",
                          fontWeight: 500,
                        }}
                      >
                        BIMBLE CARE FLOW
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--ff-display)",
                          fontSize: "1.3rem",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        One connected visit
                      </div>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                      Live
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "16px",
                    }}
                  >
                    <div className="workflow-chip">🔒 Secure OTP</div>
                    <div className="workflow-chip">✍️ AI Notes</div>
                    <div className="workflow-chip">🚚 Delivery</div>
                  </div>
                </div>

                <div className="hero-card-body">
                  <div className="workflow-label">Connected workflow</div>

                  <div className="doctor-row">
                    <div className="doctor-avatar">🔒</div>
                    <div className="doctor-info">
                      <div className="doctor-name">
                        Secure OTP verification
                      </div>
                      <div className="doctor-spec">
                        Identity confirmed before the appointment starts.
                      </div>
                    </div>
                    <div className="avail-tag">Live</div>
                  </div>

                  <div className="doctor-row">
                    <div className="doctor-avatar">✍️</div>
                    <div className="doctor-info">
                      <div className="doctor-name">
                        AI-assisted documentation
                      </div>
                      <div className="doctor-spec">
                        Notes and summaries stay in one calm flow.
                      </div>
                    </div>
                    <div className="avail-tag">Draft ready</div>
                  </div>

                  <div className="doctor-row">
                    <div className="doctor-avatar">🚚</div>
                    <div className="doctor-info">
                      <div className="doctor-name">Medicine delivery</div>
                      <div className="doctor-spec">
                        Pharmacy or home delivery after the visit.
                      </div>
                    </div>
                    <div className="avail-tag busy">On track</div>
                  </div>

                  <div className="booking-confirm">
                    <div className="booking-confirm-icon">📅</div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        Ready to continue?
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "rgba(255,255,255,0.65)",
                        }}
                      >
                        Instant confirmation · No credit card needed
                      </div>
                    </div>
                    <Link
                      href="/onboarding/plan"
                      className="booking-confirm-button"
                    >
                      Start →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="section-header-row reveal">
            <div>
              <div className="section-tag">
                <div className="section-tag-line" />
                Simple & Fast
              </div>
              <h2 className="section-title">
                Book your appointment
                <br />
                in <em>under 2 minutes</em>
              </h2>
              <p className="section-subtitle">
                No phone calls. No faxes. Just a few taps to connect with the
                right clinic in your area.
              </p>
            </div>
            <Link href="/onboarding/plan" className="btn-primary section-cta">
              Get Started Free →
            </Link>
          </div>

          <div className="steps-grid reveal">
            <div className="steps-connector" />
            <div className="step-card active">
              <div className="step-num">01</div>
              <div className="step-icon">🔍</div>
              <div className="step-title">Search Your Area</div>
              <div className="step-desc">
                Enter your city, postal code, or allow location access to find
                clinics near you instantly.
              </div>
            </div>
            <div className="step-card">
              <div className="step-num">02</div>
              <div className="step-icon">🩺</div>
              <div className="step-title">Choose a Specialist</div>
              <div className="step-desc">
                Browse verified doctors and clinics by specialty, language,
                availability, and patient reviews.
              </div>
            </div>
            <div className="step-card">
              <div className="step-num">03</div>
              <div className="step-icon">📅</div>
              <div className="step-title">Pick a Time Slot</div>
              <div className="step-desc">
                See real-time availability — same-day, next-day, or schedule
                ahead. Pick what works for you.
              </div>
            </div>
            <div className="step-card">
              <div className="step-num">04</div>
              <div className="step-icon">✅</div>
              <div className="step-title">Get Confirmed</div>
              <div className="step-desc">
                Instant confirmation via SMS and email. Reminders sent before
                your appointment so you never miss it.
              </div>
            </div>
          </div>
        </section>

        <section className="section section-alt" id="specialties">
          <div className="section-header-row reveal">
            <div>
              <div className="section-tag">
                <div className="section-tag-line" />
                All Specialties
              </div>
              <h2 className="section-title">
                Care for every
                <br />
                <em>health need</em>
              </h2>
            </div>
            <Link href="#specialties" className="btn-ghost">
              View All Specialties →
            </Link>
          </div>

          <div className="spec-scroll reveal">
            {specialties.map((specialty, index) => (
              <button
                key={specialty.name}
                type="button"
                className={`spec-pill ${
                  activeSpecialtyIndex === index ? "active" : ""
                }`}
                onClick={() => setActiveSpecialtyIndex(index)}
              >
                <span className="spec-icon">{specialty.icon}</span>
                <div className="spec-name">{specialty.name}</div>
                <div className="spec-count">{specialty.count}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="section" id="find-clinic">
          <div className="section-header-row reveal">
            <div>
              <div className="section-tag">
                <div className="section-tag-line" />
                Top Rated
              </div>
              <h2 className="section-title">
                Featured clinics
                <br />
                in <em>your city</em>
              </h2>
              <p className="section-subtitle">
                Hand-picked, verified clinics with real patient reviews and
                real-time availability.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <select defaultValue="Toronto, ON">
                <option>Toronto, ON</option>
                <option>Vancouver, BC</option>
                <option>Calgary, AB</option>
                <option>Montréal, QC</option>
                <option>Ottawa, ON</option>
                <option>Edmonton, AB</option>
              </select>
              <Link href="#find-clinic" className="btn-ghost">
                View All Clinics →
              </Link>
            </div>
          </div>

          <div className="clinics-grid reveal">
            {clinicCards.map((clinic) => (
              <div className="clinic-card" key={clinic.name}>
                <div className="clinic-card-img">
                  <div
                    className="clinic-card-img-bg"
                    style={{ background: clinic.gradient }}
                  />
                  <div className="clinic-card-img-icon">{clinic.icon}</div>
                  <div className="clinic-rating-badge">
                    ⭐ {clinic.rating}{" "}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--muted)",
                        fontWeight: 400,
                      }}
                    >
                      {clinic.reviewCount}
                    </span>
                  </div>
                </div>

                <div className="clinic-card-body">
                  <div className="clinic-card-type">{clinic.type}</div>
                  <div className="clinic-card-name">{clinic.name}</div>
                  <div className="clinic-card-location">
                    <MapPin size={13} strokeWidth={2} />
                    {clinic.location}
                  </div>
                  <div className="clinic-card-tags">
                    {clinic.tags.map((tag) => (
                      <span
                        key={tag.label}
                        className={tag.variant === "leaf" ? "tag leaf" : "tag"}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  <div className="clinic-card-footer">
                    <div className="clinic-avail">
                      <div className="clinic-avail-dot" />
                      {clinic.availability}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section section-alt">
          <div className="why-grid">
            <div className="reveal">
              <div className="section-tag">
                <div className="section-tag-line" />
                Patient First
              </div>
              <h2 className="section-title">
                Healthcare that
                <br />
                puts <em>you first</em>
              </h2>
              <p className="section-subtitle why-copy">
                We built Bimble to make booking, verification, notes, and
                follow-up feel like one connected experience. We&apos;re on your
                side — always.
              </p>

              <div className="why-features">
                {whyFeatures.map((feature) => (
                  <div className="why-feature" key={feature.title}>
                    <div className={`why-feature-icon ${feature.iconClass}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <div className="why-feature-title">{feature.title}</div>
                      <div className="why-feature-desc">
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="why-visual reveal">
              <div className="why-visual-bg" />
              <div className="impact-label">Bimble impact</div>
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-num">48h</div>
                  <div className="metric-label">Average wait time</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">98%</div>
                  <div className="metric-label">Appointment confirmations</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">1.2M</div>
                  <div className="metric-label">Appointments booked</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">10</div>
                  <div className="metric-label">Provinces served</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section-dark" id="for-clinics">
          <div className="for-clinics-grid">
            <div className="reveal">
              <div className="section-tag clinic-tag">
                <div className="section-tag-line clinic-tag-line" />
                For Clinics
              </div>
              <h2 className="section-title clinic-title">
                Grow your practice.
                <br />
                <em>Fill every slot.</em>
              </h2>
              <p className="section-subtitle clinic-copy">
                Join clinics that use Bimble to keep booking, notes, and
                follow-up in one connected flow — with zero upfront cost.
              </p>
              <div className="clinic-actions">
                <Link href="/onboarding/plan" className="btn-white">
                  Join as a Clinic →
                </Link>
                <Link href="/onboarding/plan" className="btn-outline-white">
                  View Demo
                </Link>
              </div>
            </div>

            <div className="clinic-benefits reveal">
              {clinicBenefits.map((benefit) => (
                <div className="clinic-benefit-card" key={benefit.title}>
                  <div className="clinic-benefit-icon">{benefit.icon}</div>
                  <div className="clinic-benefit-title">{benefit.title}</div>
                  <div className="clinic-benefit-desc">
                    {benefit.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="reviews">
          <div className="section-header-row reveal">
            <div>
              <div className="section-tag">
                <div className="section-tag-line" />
                Real Reviews
              </div>
              <h2 className="section-title">
                Trusted by patients
                <br />
                &amp; clinics <em>coast to coast</em>
              </h2>
            </div>
          </div>

          <div className="testimonials-grid reveal">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className={`testimonial-card ${
                  testimonial.featured ? "featured" : ""
                }`}
              >
                <div className="stars">★★★★★</div>
                <div className="testimonial-text">{testimonial.text}</div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.initials}</div>
                  <div>
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-meta">{testimonial.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section section-alt" id="faq">
          <div className="section-header-row reveal">
            <div>
              <div className="section-tag">
                <div className="section-tag-line" />
                Common Questions
              </div>
              <h2 className="section-title">
                Everything you
                <br />
                need to <em>know</em>
              </h2>
            </div>
          </div>

          <div className="faq-grid reveal">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={`faq-item ${openFaqIndex === index ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() =>
                    setOpenFaqIndex((current) =>
                      current === index ? null : index,
                    )
                  }
                >
                  {faq.question}
                  <div className="faq-icon">+</div>
                </button>
                <div className="faq-answer">{faq.answer}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="cta-wrap">
          <div className="cta-banner reveal">
            <div className="cta-banner-bg" />
            <div className="cta-banner-bg2" />
            <div className="cta-banner-eyebrow">
              ✳ Bimble&apos;s connected care platform
            </div>
            <div className="cta-banner-title">
              Your next appointment
              <br />
              is <em>just minutes away.</em>
            </div>
            <div className="cta-banner-sub">
              Join over 500,000 Canadians who&apos;ve found faster, better care
              through Bimble.
            </div>
            <div className="cta-banner-btns">
              <Link href="#find-clinic" className="btn-white">
                <CalendarDays size={16} strokeWidth={2.5} />
                Book an Appointment
              </Link>
              <Link href="/onboarding/plan" className="btn-outline-white">
                <Home size={16} strokeWidth={2.5} />
                List Your Clinic
              </Link>
            </div>
          </div>
        </div>

      </main>
      <footer>
        <div className="footer-top">
          <div>
        <Link href="/" className="nav-logo footer-brand">
              <BrandMark size={40} className="h-10 w-10" />
              <span>Bimble</span>
            </Link>
            <p className="footer-brand-desc">
              Canada&apos;s trusted platform for fast, easy healthcare appointments.
              Connecting patients to clinics in every province.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                𝕏
              </a>
              <a href="#" className="social-link">
                in
              </a>
              <a href="#" className="social-link">
                f
              </a>
              <a href="#" className="social-link">
                ▶
              </a>
            </div>
            <div style={{ marginTop: "20px" }}>
              <div className="province-label">Serving All Provinces</div>
              <div className="provinces-strip">
                {provinces.map((province) => (
                  <a key={province} href="#" className="province-pill">
                    {province}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="footer-heading">For Patients</div>
            <ul className="footer-links">
              <li>
                <a href="#find-clinic">Find a Doctor</a>
              </li>
              <li>
                <a href="#find-clinic">Book Appointment</a>
              </li>
              <li>
                <a href="#specialties">Virtual Care</a>
              </li>
              <li>
                <a href="#specialties">Specialties</a>
              </li>
              <li>
                <a href="#reviews">Patient Reviews</a>
              </li>
              <li>
                <a href="#how-it-works">How It Works</a>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-heading">For Clinics</div>
            <ul className="footer-links">
              <li>
                <Link href="/onboarding/plan">List Your Clinic</Link>
              </li>
              <li>
                <Link href="/onboarding/plan">Pricing</Link>
              </li>
              <li>
                <a href="#">EMR Integration</a>
              </li>
              <li>
                <a href="#">Analytics</a>
              </li>
              <li>
                <a href="#">Success Stories</a>
              </li>
              <li>
                <Link href="/onboarding/plan">Partner Support</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-heading">Company</div>
            <ul className="footer-links">
              <li>
                <a href="#">About Us</a>
              </li>
              <li>
                <a href="#">Careers</a>
              </li>
              <li>
                <a href="#">Press &amp; Media</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
              <li>
                <a href="#">Contact Us</a>
              </li>
              <li>
                <a href="#">Accessibility</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">
            © 2025 Bimble Canada Inc. All rights reserved. 🍁
          </span>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
            <a href="#">PIPEDA Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
