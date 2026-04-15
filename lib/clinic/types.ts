export type OnboardingStepKey = "clinic" | "location" | "operations";

export type ClinicBillingCycle = "monthly" | "annual";

// Plan ID is now a free-form string matching the backend plan_code (e.g. "standard", "premium")
export type ClinicPlanId = string;

export type ClinicPlan = {
  id: ClinicPlanId;          // maps to backend plan_code
  name: string;
  subtitle: string;
  priceLabel: string;
  billingInterval: string;
  trialDays: number;
  features: string[];
  recommended?: boolean;
  billingCycle?: ClinicBillingCycle;
  monthlyPriceCents: number; // raw monthly price from backend for annual calc
};

// Raw response from GET /api/v1/plans
export type BackendPlan = {
  plan_id: number;
  plan_code: string;
  plan_name: string;
  description: string | null;
  trial_days: number;
  grace_days: number;
  provider_limit: number | null;
  monthly_price_cents: number;
  extra_seat_price_cents: number;
  premium_visibility_minutes: number;
  standard_visibility_delay_minutes: number;
  signup_available: boolean;
  is_active: boolean;
  benefits: string[];
  clinics_count: number;
  created_at: string;
  updated_at: string;
};

export type ClinicOnboardingFormData = {
  clinicLegalName: string;
  clinicDisplayName: string;
  establishedYear: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  email: string;
  phoneNumber: string;
  clinicType: string;
  servicesProvided: string;
};

// Stored after a successful signup — used by login page
export type ClinicSignupResult = {
  clinicId: number;
  clinicCode: string;
  slug: string;
  stripeCheckoutUrl: string;
  message: string;
};

// Login form fields
export type ClinicLoginFormData = {
  clinicSlug: string;
  pin: string;
  username: string;
  password: string;
};

export type ClinicAddressSelection = {
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

// POST /api/v1/clinics/signup — request
export type ClinicRegisterRequest = {
  clinic_name: string;
  clinic_legal_name: string;
  clinic_display_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  clinic_type?: string;
  established_year?: number;
  plan_code: string;
};

// POST /api/v1/clinics/signup — response
export type ClinicRegisterResponse = {
  clinic_id: number;
  clinic_code: string;
  slug: string;
  stripe_checkout_url: string;
  queue_position: number;
  message: string;
};

// POST /api/clinics/login — request
export type ClinicLoginRequest = {
  clinic_name: string;
  pin: string;
  username: string;
  password: string;
};

// POST /api/clinics/login — response
export type ClinicLoginResponse = {
  clinic_name: string;
  app_url: string;
  bootstrap_url: string;
  message: string;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type SetFormField<T> = <K extends keyof T>(field: K, value: T[K]) => void;
