import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";
import type { PatientFulfillment, PatientPharmacyChoice, PatientVisitType } from "@/lib/patient/types";

function intakeHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

function withQuery(base: string, params: Record<string, string | undefined>) {
  const url = new URL(base, "http://local.test");
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export type PatientIntakePhoneStartRequest = {
  phone: string;
  careReason: string;
  careLocation?: string;
  careLatitude?: number | null;
  careLongitude?: number | null;
  serviceId?: number | null;
};

export type PatientBimblePharmacy = {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string | null;
  postal_code: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  distance_label: string | null;
  drive_minutes: number | null;
  delivery_eta_minutes: number | null;
  delivery_eta_label: string | null;
};

export type PatientBimblePharmacyListResponse = {
  pharmacies: PatientBimblePharmacy[];
};

export type PatientIntakeLocationResponse = {
  location: string | null;
};

export type PatientIntakePhoneStartResponse = {
  intake_session_id: number;
  masked_phone: string;
  preview_code: string;
  expires_at: string;
};

export type PatientIntakePhoneVerifyRequest = {
  intakeSessionId: number;
  otpCode: string;
};

export type PatientIntakePhoneVerifyResponse = {
  access_token: string;
  token_type: string;
  intake_session_id: number;
  masked_phone: string;
};

export type PatientIntakeHealthRequest = {
  dateOfBirth: string;
  phn?: string | null;
  noPhn: boolean;
  emailIfNoPhn?: string | null;
};

export type PatientIntakeProfileRequest = {
  firstName: string;
  lastName: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  gender: string;
};

export type PatientIntakeVisitRequest = {
  visitType: PatientVisitType;
  appointmentDate: string;
  appointmentTime: string;
};

export type PatientIntakeSlotsResponse = {
  dates: string[];
  time_slots: string[];
};

export type PatientIntakeCompleteRequest = {
  fulfillment: PatientFulfillment;
  pharmacyChoice: PatientPharmacyChoice;
  preferredPharmacyName?: string;
  preferredPharmacyAddress?: string;
  preferredPharmacyCity?: string;
  preferredPharmacyPostalCode?: string;
  preferredPharmacyPhone?: string;
};

export type PatientIntakeCompletionResponse = {
  appointment_id: number;
  status: string;
  patient_id: number;
  patient_access_token: string;
  service_name: string | null;
  summary: {
    visit_type: PatientVisitType;
    appointment_date: string;
    appointment_time: string;
    fulfillment: PatientFulfillment;
    pharmacy_choice: PatientPharmacyChoice | null;
    location: string | null;
  };
};

export async function startPatientIntakePhone(payload: PatientIntakePhoneStartRequest) {
  return apiRequest<PatientIntakePhoneStartResponse, PatientIntakePhoneStartRequest>({
    endpoint: API_ENDPOINTS.patientIntakePhoneStart,
    method: "POST",
    body: payload,
  });
}

export async function reverseGeocodePatientLocation(lat: number, lng: number) {
  return apiRequest<PatientIntakeLocationResponse>({
    endpoint: withQuery(API_ENDPOINTS.patientIntakeLocationReverseGeocode, {
      lat: String(lat),
      lng: String(lng),
    }),
  });
}

export async function fetchBimblePharmacies(lat?: number | null, lng?: number | null) {
  return apiRequest<PatientBimblePharmacyListResponse>({
    endpoint:
      lat == null || lng == null
        ? API_ENDPOINTS.patientIntakeBimblePharmacies
        : withQuery(API_ENDPOINTS.patientIntakeBimblePharmacies, {
            lat: String(lat),
            lng: String(lng),
          }),
  });
}

export async function verifyPatientIntakePhone(payload: PatientIntakePhoneVerifyRequest) {
  return apiRequest<PatientIntakePhoneVerifyResponse, PatientIntakePhoneVerifyRequest>({
    endpoint: API_ENDPOINTS.patientIntakePhoneVerify,
    method: "POST",
    body: payload,
  });
}

export async function savePatientIntakeHealth(
  accessToken: string,
  payload: PatientIntakeHealthRequest,
) {
  return apiRequest<{ ok: boolean }, PatientIntakeHealthRequest>({
    endpoint: API_ENDPOINTS.patientIntakeHealth,
    method: "POST",
    body: payload,
    headers: intakeHeaders(accessToken),
  });
}

export async function savePatientIntakeProfile(
  accessToken: string,
  payload: PatientIntakeProfileRequest,
) {
  return apiRequest<{ ok: boolean }, PatientIntakeProfileRequest>({
    endpoint: API_ENDPOINTS.patientIntakeProfile,
    method: "POST",
    body: payload,
    headers: intakeHeaders(accessToken),
  });
}

export async function fetchPatientIntakeSlots(visitType: PatientVisitType) {
  return apiRequest<PatientIntakeSlotsResponse>({
    endpoint: withQuery(API_ENDPOINTS.patientIntakeSlots, { visitType }),
  });
}

export async function savePatientIntakeVisit(
  accessToken: string,
  payload: PatientIntakeVisitRequest,
) {
  return apiRequest<{ ok: boolean }, PatientIntakeVisitRequest>({
    endpoint: API_ENDPOINTS.patientIntakeVisit,
    method: "POST",
    body: payload,
    headers: intakeHeaders(accessToken),
  });
}

export async function completePatientIntake(
  accessToken: string,
  payload: PatientIntakeCompleteRequest,
) {
  return apiRequest<PatientIntakeCompletionResponse, PatientIntakeCompleteRequest>({
    endpoint: API_ENDPOINTS.patientIntakeComplete,
    method: "POST",
    body: payload,
    headers: intakeHeaders(accessToken),
  });
}
