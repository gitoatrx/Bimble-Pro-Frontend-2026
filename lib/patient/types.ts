export type PatientVisitType = "virtual" | "walk_in";

export type PatientFulfillment = "pickup" | "delivery";

export type PatientPharmacyChoice = "bimble" | "preferred";

export type PatientOnboardingStep =
  | "phone"
  | "otp"
  | "health"
  | "demographics"
  | "visit_type"
  | "slot"
  | "fulfillment"
  | "pharmacy"
  | "complete";

export type PatientOnboardingDraft = {
  serviceId: number | null;
  serviceName: string;
  careReason: string;
  careLocation: string;
  phone: string;
  dateOfBirth: string;
  phn: string;
  noPhn: boolean;
  emailIfNoPhn: string;
  firstName: string;
  lastName: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  gender: string;
  visitType: PatientVisitType | "";
  appointmentDate: string;
  appointmentTime: string;
  fulfillment: PatientFulfillment | "";
  pharmacyChoice: PatientPharmacyChoice | "";
  preferredPharmacyName: string;
  preferredPharmacyAddress: string;
  preferredPharmacyCity: string;
  preferredPharmacyPostalCode: string;
  preferredPharmacyPhone: string;
};

export type PatientIntakeSummary = {
  visit_type: PatientVisitType;
  appointment_date: string;
  appointment_time: string;
  fulfillment: PatientFulfillment;
  pharmacy_choice: PatientPharmacyChoice | null;
  location: string | null;
};

export type PatientIntakeCompletion = {
  appointmentId: number;
  status: string;
  patientId: number;
  serviceName: string | null;
  summary: PatientIntakeSummary;
};

export const initialPatientOnboardingDraft: PatientOnboardingDraft = {
  serviceId: null,
  serviceName: "",
  careReason: "",
  careLocation: "",
  phone: "",
  dateOfBirth: "",
  phn: "",
  noPhn: false,
  emailIfNoPhn: "",
  firstName: "",
  lastName: "",
  addressLine: "",
  city: "",
  province: "",
  postalCode: "",
  gender: "",
  visitType: "",
  appointmentDate: "",
  appointmentTime: "",
  fulfillment: "",
  pharmacyChoice: "",
  preferredPharmacyName: "",
  preferredPharmacyAddress: "",
  preferredPharmacyCity: "",
  preferredPharmacyPostalCode: "",
  preferredPharmacyPhone: "",
};

export type PatientLoginSession = {
  patientId: number;
  accessToken: string;
  expiresAt?: string;
};

export type PatientOtpStartResponse = {
  otp_token: string;
  channel: string;
  message: string;
  debug_otp?: string | null;
};

export type PatientPhoneOtpVerifyResponse = {
  otp_token: string;
  phone_verified: boolean;
  message: string;
};

export type PatientOtpVerifyResponse = {
  access_token: string;
  token_type: "bearer";
  patient_id: number;
};

export type PatientProfile = {
  patient_id: number;
  phn: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  status: string;
};

export type PatientPortalClinic = {
  clinic_id: number;
  slug: string;
  clinic_display_name: string;
  city: string | null;
  province: string | null;
};

export type PatientPortalService = {
  service_id: number;
  service_code: string;
  service_name: string;
  description: string | null;
  requires_phn_billing: boolean;
  is_active: boolean;
  created_at: string;
};

export type PatientPortalAppointment = {
  appointment_id: number;
  clinic_id: number | null;
  clinic_name: string | null;
  service_id: number | null;
  service_name: string | null;
  channel: string;
  status: string;
  assigned_doctor_id: number | null;
  chief_complaint: string | null;
  notes: string | null;
  visit_type: PatientVisitType | null;
  appointment_date: string | null;
  appointment_time: string | null;
  fulfillment: PatientFulfillment | null;
  pharmacy_choice: PatientPharmacyChoice | null;
  preferred_pharmacy_name: string | null;
  preferred_pharmacy_address: string | null;
  preferred_pharmacy_city: string | null;
  preferred_pharmacy_postal_code: string | null;
  preferred_pharmacy_phone: string | null;
  care_location: string | null;
  prescription_notes: string | null;
  cancellation_reason: string | null;
  queued_at: string;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type PatientPortalAppointmentsPayload = {
  current: PatientPortalAppointment[];
  past: PatientPortalAppointment[];
};

export type PatientPortalRequest = {
  request_id: number;
  patient_id: number;
  appointment_id: number | null;
  clinic_id: number | null;
  clinic_name?: string | null;
  request_type: "RESCHEDULE" | "PRESCRIPTION" | "LAB_REPORT" | string;
  status: string;
  details: string | null;
  patient_message?: string | null;
  clinic_response?: string | null;
  created_at: string;
};

export type PatientPortalDashboard = {
  patient_id: number;
  total_appointments: number;
  active_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  family_members_count: number;
  open_requests_count: number;
  recent_appointments: PatientPortalAppointment[];
  recent_requests: PatientPortalRequest[];
};

export type PatientFamilyMember = {
  family_member_id: number;
  patient_id: number;
  first_name: string;
  last_name: string;
  relationship_label: string;
  date_of_birth: string | null;
  phn: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};
