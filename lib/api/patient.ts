import { apiRequest } from "@/lib/api/request";
import type {
  PatientFulfillment,
  PatientFamilyMember,
  PatientOtpStartResponse,
  PatientPhoneOtpVerifyResponse,
  PatientOtpVerifyResponse,
  PatientPharmacyChoice,
  PatientPortalAppointment,
  PatientPortalAppointmentsPayload,
  PatientPortalClinic,
  PatientPortalDashboard,
  PatientPortalRequest,
  PatientRescheduleOptionsResponse,
  PatientPortalService,
  PatientProfile,
  PatientVisitType,
} from "@/lib/patient/types";

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export function submitPatientPhoneLogin(payload: {
  phone: string;
}) {
  return apiRequest<PatientOtpStartResponse, typeof payload>({
    endpoint: "/api/v1/patients/auth/phone",
    method: "POST",
    body: payload,
  });
}

export function submitPatientVerifyPhoneOtp(payload: {
  otp_token: string;
  otp_code: string;
}) {
  return apiRequest<PatientPhoneOtpVerifyResponse, typeof payload>({
    endpoint: "/api/v1/patients/auth/phone/verify",
    method: "POST",
    body: payload,
  });
}

export function submitPatientPhoneProfileLogin(payload: {
  otp_token: string;
  date_of_birth: string;
  phn: string;
}) {
  return apiRequest<PatientOtpVerifyResponse, typeof payload>({
    endpoint: "/api/v1/patients/auth/phone/profile",
    method: "POST",
    body: payload,
  });
}

export function fetchPatientProfile(accessToken: string) {
  return apiRequest<PatientProfile>({
    endpoint: "/api/v1/patients/me",
    headers: authHeaders(accessToken),
  });
}

export function updatePatientProfile(
  accessToken: string,
  payload: Partial<PatientProfile>,
) {
  return apiRequest<PatientProfile, Partial<PatientProfile>>({
    endpoint: "/api/v1/patients/me",
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export function fetchPatientDashboard(accessToken: string) {
  return apiRequest<PatientPortalDashboard>({
    endpoint: "/api/v1/patient/dashboard",
    headers: authHeaders(accessToken),
  });
}

export function fetchPatientAppointments(accessToken: string) {
  return apiRequest<PatientPortalAppointmentsPayload>({
    endpoint: "/api/v1/patient/appointments",
    headers: authHeaders(accessToken),
  });
}

export function fetchPatientRescheduleOptions(
  accessToken: string,
  appointmentId: number,
  days = 14,
) {
  return apiRequest<PatientRescheduleOptionsResponse>({
    endpoint: `/api/v1/patient/appointments/${appointmentId}/reschedule-options?days=${days}`,
    headers: authHeaders(accessToken),
  });
}

export function fetchPatientRequests(accessToken: string) {
  return apiRequest<PatientPortalRequest[]>({
    endpoint: "/api/v1/patient/requests",
    headers: authHeaders(accessToken),
  });
}

export async function downloadPatientRequestAttachment(
  accessToken: string,
  requestId: number,
) {
  const response = await fetch(`/api/v1/patient/requests/${requestId}/attachment/download`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    const responseData = await response.json().catch(() => null);
    const message =
      responseData &&
      typeof responseData === "object" &&
      "detail" in responseData &&
      typeof responseData.detail === "string"
        ? responseData.detail
        : "Request failed.";
    throw new Error(message);
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const filenameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
  const filename = filenameMatch?.[1] ? decodeURIComponent(filenameMatch[1].replace(/"/g, "")) : null;
  const blob = await response.blob();
  return {
    blob,
    filename,
    contentType: response.headers.get("content-type") ?? blob.type ?? "application/octet-stream",
  };
}

export function fetchPatientFamilyMembers(accessToken: string) {
  return apiRequest<PatientFamilyMember[]>({
    endpoint: "/api/v1/patient/family-members",
    headers: authHeaders(accessToken),
  });
}

export function createPatientFamilyMember(
  accessToken: string,
  payload: {
    first_name: string;
    last_name: string;
    relationship_label: string;
    date_of_birth?: string;
    phn?: string;
    email?: string;
    phone?: string;
    notes?: string;
  },
) {
  return apiRequest<PatientFamilyMember, typeof payload>({
    endpoint: "/api/v1/patient/family-members",
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export function deletePatientFamilyMember(accessToken: string, familyMemberId: number) {
  return apiRequest<null>({
    endpoint: `/api/v1/patient/family-members/${familyMemberId}`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

export function fetchPatientClinics(accessToken: string) {
  return apiRequest<PatientPortalClinic[]>({
    endpoint: "/api/v1/patient/clinics",
    headers: authHeaders(accessToken),
  });
}

export function fetchPatientServices() {
  return apiRequest<PatientPortalService[]>({
    endpoint: "/api/v1/services",
  });
}

export function createPatientDirectAppointment(
  accessToken: string,
  payload: {
    clinic_id: number;
    service_id?: number;
    chief_complaint?: string;
    visit_type?: PatientVisitType;
    appointment_date?: string;
    appointment_time?: string;
    fulfillment?: PatientFulfillment;
    pharmacy_choice?: PatientPharmacyChoice;
    preferred_pharmacy_name?: string;
    preferred_pharmacy_address?: string;
    preferred_pharmacy_city?: string;
    preferred_pharmacy_postal_code?: string;
    preferred_pharmacy_phone?: string;
    care_location?: string;
  },
) {
  return apiRequest<PatientPortalAppointment, typeof payload>({
    endpoint: "/api/v1/appointments/direct",
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export function createPatientPoolAppointment(
  accessToken: string,
  payload: {
    service_id?: number;
    chief_complaint?: string;
    visit_type?: PatientVisitType;
    appointment_date?: string;
    appointment_time?: string;
    fulfillment?: PatientFulfillment;
    pharmacy_choice?: PatientPharmacyChoice;
    preferred_pharmacy_name?: string;
    preferred_pharmacy_address?: string;
    preferred_pharmacy_city?: string;
    preferred_pharmacy_postal_code?: string;
    preferred_pharmacy_phone?: string;
    care_location?: string;
  },
) {
  return apiRequest<PatientPortalAppointment, typeof payload>({
    endpoint: "/api/v1/appointments/pool",
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export function cancelPatientAppointment(
  accessToken: string,
  appointmentId: number,
  payload: { reason?: string },
) {
  return apiRequest<PatientPortalAppointment, typeof payload>({
    endpoint: `/api/v1/patient/appointments/${appointmentId}/cancel`,
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export function createPatientPortalRequest(
  accessToken: string,
  payload: {
    request_type: "RESCHEDULE" | "PRESCRIPTION" | "LAB_REPORT";
    appointment_id?: number;
    clinic_id?: number;
    details?: string;
  },
) {
  return apiRequest<PatientPortalRequest, typeof payload>({
    endpoint: "/api/v1/patient/requests",
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export function createPatientRescheduleRequest(
  accessToken: string,
  appointmentId: number,
  payload: {
    details?: string;
    clinic_id?: number;
    requested_appointment_date: string;
    requested_appointment_time: string;
    requested_doctor_id?: number;
  },
) {
  return apiRequest<
    PatientPortalRequest,
    {
      request_type: "RESCHEDULE";
      details?: string;
      clinic_id?: number;
      requested_appointment_date: string;
      requested_appointment_time: string;
      requested_doctor_id?: number;
    }
  >({
    endpoint: `/api/v1/patient/appointments/${appointmentId}/reschedule-request`,
    method: "POST",
    headers: authHeaders(accessToken),
    body: {
      request_type: "RESCHEDULE",
      details: payload.details,
      clinic_id: payload.clinic_id,
      requested_appointment_date: payload.requested_appointment_date,
      requested_appointment_time: payload.requested_appointment_time,
      requested_doctor_id: payload.requested_doctor_id,
    },
  });
}

export function createPatientDocumentRequest(
  accessToken: string,
  appointmentId: number,
  payload: {
    request_type: "PRESCRIPTION" | "LAB_REPORT";
    details?: string;
    clinic_id?: number;
  },
) {
  return apiRequest<PatientPortalRequest, typeof payload>({
    endpoint: `/api/v1/patient/appointments/${appointmentId}/document-request`,
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}
