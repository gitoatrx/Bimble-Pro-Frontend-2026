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
  clinicName?: string;
  username?: string;
  password?: string;
  pin?: string;
  tempPassword?: string;
  tempPin?: string;
  appUrl?: string;
  bootstrapUrl?: string;
};

// Login form fields (step 1 — email + password only; PIN/slug handled server-side)
export type ClinicLoginFormData = {
  email: string;
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
  username?: string;
  temp_password?: string;
  temp_pin?: string;
  stripe_checkout_url: string;
  clinic_login_url?: string;
  queue_position: number;
  message: string;
  clinic_name?: string;
  password?: string;
  pin?: string;
  app_url?: string;
  bootstrap_url?: string;
};

// POST /api/v1/clinic-auth/login — step 1 request (email + password)
export type ClinicLoginRequest = {
  email: string;
  password: string;
};

// POST /api/v1/clinic-auth/login — step 1 response (OTP dispatched)
export type ClinicLoginStep1Response = {
  requires_otp: boolean;
  otp_token: string;
  masked_email: string;
  message: string;
};

// POST /api/v1/clinic-auth/verify-otp — request
export type ClinicOtpVerifyRequest = {
  otp_token: string;
  otp_code: string;
};

// POST /api/v1/clinic-auth/resend-otp — request
export type ClinicOtpResendRequest = {
  otp_token: string;
};

// POST /api/v1/clinic-auth/verify-otp — response (full session)
export type ClinicLoginResponse = {
  access_token: string;
  token_type: string;
  clinic_slug: string;
  clinic_name: string;
  username: string;
  temp_password?: string | null;
  temp_pin?: string | null;
  dashboard_url: string;
  app_url: string;          // bootstrap_url — opens OSCAR with auto-login
  bootstrap_url: string;
  emr_launch_url: string;
  message: string;
};

export type ClinicLoginSession = {
  clinicSlug: string;
  accessToken: string;
  appUrl: string;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type SetFormField<T> = <K extends keyof T>(field: K, value: T[K]) => void;
