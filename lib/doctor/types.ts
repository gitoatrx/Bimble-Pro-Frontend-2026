// ── Doctor auth ────────────────────────────────────────────────────

export type DoctorLoginFormData = {
  email: string;
  password: string;
};

// POST /api/v1/doctor-auth/login — step 1 response
export type DoctorLoginStep1Response = {
  requires_otp: boolean;
  otp_token: string;
  masked_email: string;
  message: string;
  access_token?: string;
  token_type?: string;
  doctor_id?: number;
  clinic_slug?: string;
  clinic_name?: string;
  app_url?: string;
};

// POST /api/v1/doctor-auth/verify-otp — request
export type DoctorOtpVerifyRequest = {
  otp_token: string;
  otp_code: string;
};

// POST /api/v1/doctor-auth/resend-otp — request
export type DoctorOtpResendRequest = {
  otp_token: string;
};

// A single clinic the doctor belongs to (returned when they have multiple)
export type DoctorClinicOption = {
  clinic_id: number;
  clinic_slug: string;
  clinic_name: string;
  app_url: string;
};

// POST /api/v1/doctor-auth/verify-otp — response
// If needs_clinic_selection is true, clinics is populated and no token is issued yet.
// If needs_clinic_selection is false, the full session fields are populated.
export type DoctorOtpVerifyResponse =
  | {
      needs_clinic_selection: true;
      clinics: DoctorClinicOption[];
      selection_token: string; // short-lived token to exchange for JWT after clinic pick
    }
  | {
      needs_clinic_selection: false;
      access_token: string;
      token_type: string;
      doctor_id: number;
      clinic_slug: string;
      clinic_name: string;
      app_url: string;
      message: string;
    };

// POST /api/v1/doctor-auth/select-clinic — request
export type DoctorSelectClinicRequest = {
  selection_token: string;
  clinic_slug: string;
};

// POST /api/v1/doctor-auth/select-clinic — response
export type DoctorSelectClinicResponse = {
  access_token: string;
  token_type: string;
  doctor_id: number;
  clinic_slug: string;
  clinic_name: string;
  app_url: string;
  message: string;
};

// Persisted after full login
export type DoctorLoginSession = {
  doctorId: number;
  clinicSlug: string;
  clinicName: string;
  accessToken: string;
  appUrl: string;
};

// ── Shared status display maps ─────────────────────────────────────

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  QUEUED: "Waiting",
  ASSIGNED: "Doctor Assigned",
  IN_PROGRESS: "In Consultation",
  COMPLETED: "Seen",
  CANCELLED: "Cancelled",
  NO_SHOW: "Didn't Show Up",
  ESCALATED: "Needs Attention",
  PICKED_UP: "Claimed",
  OPEN: "Available",
  PREMIUM_VISIBLE: "Available — Early Access",
  PENDING_RELEASE: "Pending",
  EXPIRED: "Expired",
};

export const DOCTOR_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Available",
  ON_LEAVE: "On Leave",
  INACTIVE: "Deactivated",
};

export function appointmentLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}

export function doctorStatusLabel(status: string): string {
  return DOCTOR_STATUS_LABELS[status] ?? status;
}

// ── Doctor roster ──────────────────────────────────────────────────

export type RosterEntryMode = "recurring" | "specific";

export type DoctorRosterEntry = {
  id?: number;
  doctor_id: number;
  mode: RosterEntryMode;
  // Recurring: 0=Sun, 1=Mon … 6=Sat
  day_of_week?: number;
  // Specific date: ISO "YYYY-MM-DD"
  specific_date?: string;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  effective_from: string; // "YYYY-MM-DD"
  effective_until?: string; // "YYYY-MM-DD" or null = indefinite
};

export type DoctorRosterFormData = {
  doctorId: string;
  mode: RosterEntryMode;
  selectedDays: number[]; // for recurring
  specificDates: string[]; // for specific-date
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil: string; // empty string = indefinite
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;
