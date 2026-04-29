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

type CloudPharmacyRecord = {
  id?: string | number | null;
  name?: string | null;
  pharmacy_name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
  long?: string | number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  distance?: string | number | null;
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

const CLOUD_PHARMACY_API_URL = "https://cloud.oatrx.ca/api/fetch-all-pharmacies";
const FALLBACK_PATIENT_LATITUDE = 28.6139;
const FALLBACK_PATIENT_LONGITUDE = 77.209;

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function distanceInKm(
  fromLat: number,
  fromLng: number,
  toLat: number | null,
  toLng: number | null,
): number | null {
  if (toLat == null || toLng == null) return null;
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(distanceKm: number | null) {
  if (distanceKm == null) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
  return `${Math.round(distanceKm)} km`;
}

function extractCloudPharmacyRecords(payload: unknown): CloudPharmacyRecord[] {
  if (Array.isArray(payload)) return payload as CloudPharmacyRecord[];
  if (payload && typeof payload === "object") {
    const record = payload as {
      pharmacies?: unknown;
      data?: unknown;
      results?: unknown;
    };
    if (Array.isArray(record.pharmacies)) return record.pharmacies as CloudPharmacyRecord[];
    if (Array.isArray(record.data)) return record.data as CloudPharmacyRecord[];
    if (Array.isArray(record.results)) return record.results as CloudPharmacyRecord[];
  }
  return [];
}

export async function fetchBimblePharmacies(lat?: number | null, lng?: number | null) {
  const patientLat = lat ?? FALLBACK_PATIENT_LATITUDE;
  const patientLng = lng ?? FALLBACK_PATIENT_LONGITUDE;
  const url = new URL(CLOUD_PHARMACY_API_URL);
  url.searchParams.set("lat", String(patientLat));
  url.searchParams.set("long", String(patientLng));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not load pharmacies right now.");
  }

  const payload: unknown = await response.json();
  const pharmacies = extractCloudPharmacyRecords(payload)
    .map((item, index): PatientBimblePharmacy | null => {
      const latitude = parseNumber(item.latitude ?? item.lat);
      const longitude = parseNumber(item.longitude ?? item.lng ?? item.long);
      const distanceKm = distanceInKm(patientLat, patientLng, latitude, longitude);
      const name = (item.name ?? item.pharmacy_name ?? "").trim();
      if (!name) return null;
      return {
        id: String(item.id ?? `${name}-${index}`),
        name,
        address: item.address?.trim() ?? "",
        city: item.city?.trim() ?? "",
        province: item.province?.trim() ?? null,
        postal_code: (item.postal_code ?? item.zip_code)?.trim() ?? null,
        phone: item.phone?.trim() ?? null,
        fax: item.fax?.trim() ?? null,
        email: item.email?.trim() ?? null,
        latitude,
        longitude,
        distance_km: distanceKm,
        distance_label: formatDistanceLabel(distanceKm),
        drive_minutes: null,
        delivery_eta_minutes: null,
        delivery_eta_label: null,
      };
    })
    .filter((item): item is PatientBimblePharmacy => Boolean(item))
    .sort((a, b) => {
      if (a.distance_km == null && b.distance_km == null) return a.name.localeCompare(b.name);
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });

  return { pharmacies };
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
