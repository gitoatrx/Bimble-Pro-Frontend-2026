export type Specialty = {
  icon: string;
  name: string;
  description: string;
  slug: string;
};

export type ClinicCard = {
  type: string;
  name: string;
  location: string;
  city: string;
  rating: string;
  reviewCount: string;
  icon: string;
  tags: string[];
  availability: string;
  acceptingNew: boolean;
  mspAccepted: boolean;
};

export type Feature = {
  icon: string;
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

export type Stat = {
  value: string;
  label: string;
  sub?: string;
};

export const navItems = [
  { href: "#find-care", label: "Find a Doctor" },
  { href: "#specialties", label: "Specialties" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#for-clinics", label: "For Clinics" },
];

export const specialties: Specialty[] = [
  {
    icon: "🩺",
    name: "Family Doctor",
    description: "Find a GP accepting new patients near you",
    slug: "family-doctor",
  },
  {
    icon: "🚶",
    name: "Walk-In Clinic",
    description: "No appointment needed — see a doctor today",
    slug: "walk-in",
  },
  {
    icon: "💻",
    name: "Virtual Care",
    description: "See a doctor online from anywhere in BC",
    slug: "virtual-care",
  },
  {
    icon: "🧠",
    name: "Mental Health",
    description: "Therapists and counsellors across BC",
    slug: "mental-health",
  },
  {
    icon: "🦴",
    name: "Physiotherapy",
    description: "Rehab, injury recovery, and pain management",
    slug: "physiotherapy",
  },
  {
    icon: "🧬",
    name: "Dermatology",
    description: "Skin concerns, conditions, and screenings",
    slug: "dermatology",
  },
  {
    icon: "👶",
    name: "Pediatrics",
    description: "Child and infant care from trusted BC doctors",
    slug: "pediatrics",
  },
  {
    icon: "🚑",
    name: "Urgent Care",
    description: "Same-day care for non-emergency conditions",
    slug: "urgent-care",
  },
];

export const clinicCards: ClinicCard[] = [
  {
    type: "Family Practice",
    name: "Broadway Medical Clinic",
    location: "1816 W Broadway, Vancouver",
    city: "Vancouver, BC",
    rating: "4.9",
    reviewCount: "214",
    icon: "🏥",
    tags: ["MSP Accepted", "New Patients", "Same-Day"],
    availability: "Today · 2:30 PM",
    acceptingNew: true,
    mspAccepted: true,
  },
  {
    type: "Walk-In Clinic",
    name: "Surrey Central Walk-In",
    location: "10153 King George Blvd, Surrey",
    city: "Surrey, BC",
    rating: "4.7",
    reviewCount: "389",
    icon: "⚕️",
    tags: ["MSP Accepted", "No Appointment", "Open Now"],
    availability: "Now · Estimated 20 min wait",
    acceptingNew: true,
    mspAccepted: true,
  },
  {
    type: "Mental Health",
    name: "Burnaby Counselling Group",
    location: "4277 Kingsway, Burnaby",
    city: "Burnaby, BC",
    rating: "4.8",
    reviewCount: "127",
    icon: "🧠",
    tags: ["BCMHSUS Covered", "Virtual Available", "Sliding Scale"],
    availability: "Tomorrow · 10:00 AM",
    acceptingNew: true,
    mspAccepted: true,
  },
];

export const howItWorks = [
  {
    step: "01",
    title: "Search your care need",
    description:
      "Tell us what you're looking for — a family doctor, walk-in visit, specialist, or virtual care — and where you are in BC.",
    icon: "🔍",
  },
  {
    step: "02",
    title: "See real availability",
    description:
      "We show you verified clinics with live slots — same-day, next-day, or scheduled. Filter by language, MSP, and more.",
    icon: "📅",
  },
  {
    step: "03",
    title: "Book in seconds",
    description:
      "Confirm your appointment without phone calls or hold music. You'll get a confirmation with everything you need.",
    icon: "✅",
  },
];

export const whyFeatures: Feature[] = [
  {
    icon: "🆓",
    title: "Always free for patients",
    description:
      "Bimble costs nothing to use. No subscription, no booking fee. We're paid by the clinics, not by you.",
  },
  {
    icon: "💳",
    title: "MSP accepted everywhere",
    description:
      "Every clinic on Bimble accepts BC's Medical Services Plan. Your provincial health card covers what it always has.",
  },
  {
    icon: "📍",
    title: "Real-time availability",
    description:
      "Slots are pulled live from clinic systems. If it shows open, it is open — no calling ahead to confirm.",
  },
  {
    icon: "🔒",
    title: "Secure & private",
    description:
      "Your health information is protected under BC's PIPA and never shared without your consent.",
  },
  {
    icon: "🌐",
    title: "Multiple languages",
    description:
      "Find providers who speak your language — Mandarin, Punjabi, Tagalog, French, and more across BC.",
  },
  {
    icon: "🆕",
    title: "New patients welcome",
    description:
      "We surface clinics actively accepting new patients — including family doctors, which can be impossible to find otherwise.",
  },
];

export const stats: Stat[] = [
  {
    value: "1 in 5",
    label: "BC residents has no family doctor",
    sub: "We're fixing that.",
  },
  {
    value: "27 wks",
    label: "Average specialist wait in BC",
    sub: "Bimble finds faster.",
  },
  {
    value: "< 2 min",
    label: "Average time to book on Bimble",
    sub: "No hold music.",
  },
  {
    value: "500+",
    label: "Verified BC clinics",
    sub: "And growing weekly.",
  },
];

export const testimonials: Testimonial[] = [
  {
    initials: "SK",
    name: "Simran K.",
    meta: "Patient · Surrey, BC",
    text: "I moved to Surrey two years ago and couldn't find a family doctor anywhere. I tried walk-ins for every single thing. Through Bimble I found a GP accepting new patients 10 minutes from my house. I had my first appointment within a week.",
    featured: true,
  },
  {
    initials: "MR",
    name: "Marcus R.",
    meta: "Patient · Vancouver, BC",
    text: "My daughter had a fever on a Saturday night. I found a walk-in clinic on Bimble that was open until 10 PM with a 15-minute wait. Booked on my phone from the car. We were in and out in under an hour.",
  },
  {
    initials: "LN",
    name: "Linh N.",
    meta: "Patient · Richmond, BC",
    text: "I needed to see a dermatologist but my GP's referral waitlist was 6 months. Bimble found a dermatologist in Richmond accepting direct bookings. Seen within 3 weeks. The whole experience was so much simpler than I expected.",
  },
  {
    initials: "AB",
    name: "Amara B.",
    meta: "Patient · Burnaby, BC",
    text: "As someone dealing with anxiety, finding a therapist felt overwhelming. Bimble let me filter by sliding scale fees, virtual sessions, and my coverage type. I found someone I connected with on the first try.",
  },
  {
    initials: "DW",
    name: "David W.",
    meta: "Patient · Kelowna, BC",
    text: "Living outside Vancouver, I always assumed the good options were only in the city. Bimble showed me three excellent clinics within 5 km of my home in Kelowna, including one with same-day physiotherapy.",
  },
  {
    initials: "RP",
    name: "Riya P.",
    meta: "Patient · North Vancouver, BC",
    text: "My elderly mother doesn't speak English well. I was able to filter for Punjabi-speaking doctors in North Van. Found one immediately. That feature alone is worth everything.",
  },
];

export const faqs: Faq[] = [
  {
    question: "Is Bimble free for patients?",
    answer:
      "Yes, completely. Bimble is free to use for every patient in BC. There are no booking fees, no subscription charges, and nothing hidden. Clinics pay to be listed — you never do.",
  },
  {
    question: "Does my BC MSP card work?",
    answer:
      "Yes. Every clinic listed on Bimble accepts BC's Medical Services Plan (MSP). If a service is covered by MSP, you won't pay out of pocket. We also show which clinics accept extended health benefits.",
  },
  {
    question: "Can I actually find a family doctor accepting new patients?",
    answer:
      "Yes — and this is one of the most important things Bimble does. We specifically surface family practices in BC that are accepting new patients, including those that don't advertise publicly. This is updated in real time.",
  },
  {
    question: "Are the clinics on Bimble verified?",
    answer:
      "Every clinic and provider on Bimble is verified before being listed. We confirm licensing with the BC College of Physicians and Surgeons and the relevant regulatory bodies for other health professionals.",
  },
  {
    question: "What if I need to cancel or reschedule?",
    answer:
      "You can cancel or reschedule up to 2 hours before your appointment at no cost, directly from your confirmation email or through Bimble. No phone calls needed.",
  },
  {
    question: "Do you cover areas outside of Vancouver?",
    answer:
      "Yes. Bimble covers clinics across British Columbia — including Surrey, Burnaby, Richmond, Langley, Abbotsford, Kelowna, Victoria, Nanaimo, Kamloops, and more. We're expanding our network weekly.",
  },
  {
    question: "Can I book virtual appointments through Bimble?",
    answer:
      "Absolutely. Many clinics on Bimble offer virtual care — video or phone consultations — for appropriate visit types. You can filter by 'Virtual Available' when searching.",
  },
];

export const bcCities = [
  "Vancouver",
  "Surrey",
  "Burnaby",
  "Richmond",
  "Kelowna",
  "Victoria",
  "Langley",
  "Abbotsford",
  "Nanaimo",
  "Kamloops",
  "North Vancouver",
  "Coquitlam",
];

export const careTypes = [
  "Family doctor",
  "Walk-in clinic",
  "Virtual care",
  "Mental health",
  "Physiotherapy",
  "Dermatology",
  "Pediatrics",
  "Urgent care",
];
