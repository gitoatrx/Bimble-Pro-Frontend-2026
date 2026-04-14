export type Specialty = {
  icon: string;
  name: string;
  count: string;
};

export type ClinicCard = {
  type: string;
  name: string;
  location: string;
  rating: string;
  reviewCount: string;
  icon: string;
  gradient: string;
  tags: Array<{ label: string; variant?: "leaf" }>;
  availability: string;
};

export type Feature = {
  icon: string;
  iconClass: "teal" | "leaf" | "coral" | "gold";
  title: string;
  description: string;
};

export type Testimonial = {
  initials: string;
  name: string;
  meta: string;
  text: string;
  featured?: boolean;
};

export type Faq = {
  question: string;
  answer: string;
};

export const navItems = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#find-clinic", label: "Find a Clinic" },
  { href: "#specialties", label: "Specialties" },
  { href: "#for-clinics", label: "For Clinics" },
];

export const specialties: Specialty[] = [
  { icon: "👨‍👩‍👧", name: "Family Care", count: "340+ clinics" },
  { icon: "🚶", name: "Walk-In", count: "210+ clinics" },
  { icon: "🖥️", name: "Virtual Care", count: "300+ doctors" },
  { icon: "💉", name: "Urgent Care", count: "140+ clinics" },
  { icon: "🧬", name: "Dermatology", count: "88+ clinics" },
];

export const clinicCards: ClinicCard[] = [
  {
    type: "Family Practice",
    name: "Sunnybrook Family Health",
    location: "2387 Yonge St, Toronto · 1.2 km away",
    rating: "4.9",
    reviewCount: "(312)",
    icon: "🏥",
    gradient: "linear-gradient(135deg, var(--teal-pale) 0%, #C5EDE4 100%)",
    tags: [
      { label: "OHIP Accepted" },
      { label: "Same-Day" },
      { label: "New Patients", variant: "leaf" },
    ],
    availability: "Next slot: Today 3:00 PM",
  },
  {
    type: "Mental Health",
    name: "MindWell Therapy Centre",
    location: "890 Queen St W, Toronto · 2.8 km away",
    rating: "4.8",
    reviewCount: "(184)",
    icon: "🧠",
    gradient: "linear-gradient(135deg, #EAF5EE, #C0E8CC)",
    tags: [
      { label: "Virtual Available" },
      { label: "Bilingual FR/EN" },
      { label: "Sliding Scale", variant: "leaf" },
    ],
    availability: "Next slot: Tomorrow 10:00 AM",
  },
  {
    type: "Physiotherapy & Rehab",
    name: "ActiveCare Physio Clinic",
    location: "145 King St E, Toronto · 3.5 km away",
    rating: "4.9",
    reviewCount: "(97)",
    icon: "💆",
    gradient: "linear-gradient(135deg, #FDF4E7, #FAD893)",
    tags: [
      { label: "WSIB Approved" },
      { label: "Extended Benefits" },
      { label: "No Referral", variant: "leaf" },
    ],
    availability: "Next slot: Today 5:30 PM",
  },
];

export const whyFeatures: Feature[] = [
  {
    icon: "⚡",
    iconClass: "teal",
    title: "Same-Day & Next-Day Availability",
    description:
      "Real-time slots pulled directly from clinic systems. If it shows available, it is. Guaranteed.",
  },
  {
    icon: "🔒",
    iconClass: "leaf",
    title: "Secure OTP Verification",
    description:
      "Every booking starts with a simple identity check so clinics can trust the visit.",
  },
  {
    icon: "✍️",
    iconClass: "coral",
    title: "AI-Assisted Documentation",
    description:
      "Notes and summaries stay organized without adding more typing for the clinic.",
  },
  {
    icon: "🚚",
    iconClass: "gold",
    title: "Delivery & Follow-Up",
    description:
      "Recovery steps stay visible, from prescriptions to the next appointment.",
  },
];

export const clinicBenefits: Feature[] = [
  {
    icon: "🔒",
    iconClass: "leaf",
    title: "Verified bookings",
    description:
      "Secure OTP keeps appointments real before they reach the clinic queue.",
  },
  {
    icon: "🤖",
    iconClass: "teal",
    title: "AI-assisted notes",
    description:
      "Reduce typing and hand off cleaner visit summaries to the care team.",
  },
  {
    icon: "📉",
    iconClass: "coral",
    title: "Fewer no-shows",
    description:
      "Automated reminders help patients confirm or reschedule in advance.",
  },
  {
    icon: "📊",
    iconClass: "gold",
    title: "Clinic analytics",
    description:
      "Track bookings, revenue, and patient flow in one calm view.",
  },
];

export const testimonials: Testimonial[] = [
  {
    initials: "JM",
    name: "Jessica M.",
    meta: "Patient · Vancouver, BC",
    text:
      "I had been trying to get a family doctor for 6 months. Through Bimble I found one taking new patients in my neighbourhood within two days. Absolute lifesaver.",
  },
  {
    initials: "DR",
    name: "Dr. Anita Reyes",
    meta: "Clinic Director · Calgary Medical Group",
    text:
      "Since joining Bimble, our appointment bookings went up 34% in the first quarter. The no-show reminder system alone has saved us thousands in lost revenue. Best decision we made.",
    featured: true,
  },
  {
    initials: "PL",
    name: "Pierre L.",
    meta: "Parent · Montréal, QC",
    text:
      "My daughter needed a pediatrician urgently. Found one 10 minutes from home, booked for the same afternoon. The whole process took less than 3 minutes on my phone.",
  },
  {
    initials: "GS",
    name: "Gurpreet S.",
    meta: "Patient · Brampton, ON",
    text:
      "As a newcomer to Canada I didn't know how the healthcare system worked. Bimble made it simple — I found a bilingual Punjabi-speaking doctor and got care I understood.",
  },
  {
    initials: "TN",
    name: "Dr. Thomas N.",
    meta: "Orthopedic Surgeon · Ottawa, ON",
    text:
      "The analytics dashboard gives us a real picture of our practice performance. We've been able to optimize staffing and we're fully booked 3 weeks out. Revenue is up 22% this year.",
  },
  {
    initials: "AM",
    name: "Alexandra M.",
    meta: "Patient · Toronto, ON",
    text:
      "Mental health appointments used to take months to arrange. I found a therapist on Bimble within the week, and my employer benefits covered it. Truly changed my life.",
  },
];

export const faqs: Faq[] = [
  {
    question: "Is Bimble free for patients?",
    answer:
      "Yes — Bimble is completely free for patients. There are no subscription fees, no booking fees, and no hidden charges. We generate revenue from the clinics, not from you.",
  },
  {
    question: "Does my provincial health card work?",
    answer:
      "Absolutely. We support OHIP (Ontario), MSP (BC), AHCIP (Alberta), RAMQ (Quebec), and all other provincial plans. Simply select your province during booking.",
  },
  {
    question: "Are the doctors on Bimble verified?",
    answer:
      "Yes. Every physician and healthcare provider on our platform is verified against the College of Physicians and Surgeons registry in their province before being listed.",
  },
  {
    question: "Can I book same-day appointments?",
    answer:
      'Many clinics on Bimble offer same-day or next-day availability. Use the "Available Today" filter in your search to see only clinics with immediate openings.',
  },
  {
    question: "What if I need to cancel or reschedule?",
    answer:
      "You can cancel or reschedule any appointment up to 2 hours before your slot directly through the app or via your confirmation email link — at no charge.",
  },
  {
    question: "How does billing work for clinics?",
    answer:
      "Clinics pay a small per-confirmed-appointment fee. There are no setup costs, no monthly subscriptions, and no contracts. You only pay when a patient shows up.",
  },
];

export const provinces = [
  "Ontario",
  "British Columbia",
  "Alberta",
  "Quebec",
  "Manitoba",
  "Saskatchewan",
  "Nova Scotia",
  "New Brunswick",
  "Newfoundland",
  "PEI",
];
