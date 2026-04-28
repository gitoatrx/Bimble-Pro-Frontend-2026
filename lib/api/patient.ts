import { apiRequest } from "@/lib/api/request";
import type {
  PatientFamilyMember,
  PatientOtpStartResponse,
  PatientPhoneOtpVerifyResponse,
  PatientOtpVerifyResponse,
  PatientPortalAppointment,
  PatientPortalAppointmentsPayload,
  PatientPortalClinic,
  PatientPortalDashboard,
  PatientPortalRequest,
  PatientPortalService,
  PatientProfile,
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

export function fetchPatientRequests(accessToken: string) {
  return apiRequest<PatientPortalRequest[]>({
    endpoint: "/api/v1/patient/requests",
    headers: authHeaders(accessToken),
  });
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
  },
) {
  return apiRequest<PatientPortalAppointment, typeof payload>({
    endpoint: "/api/v1/appointments/direct",
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
    endpoint: `/api/v1/appointments/${appointmentId}/cancel`,
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
  payload: { details?: string; clinic_id?: number },
) {
  return apiRequest<PatientPortalRequest, { request_type: "RESCHEDULE"; details?: string; clinic_id?: number }>({
    endpoint: `/api/v1/patient/appointments/${appointmentId}/reschedule-request`,
    method: "POST",
    headers: authHeaders(accessToken),
    body: {
      request_type: "RESCHEDULE",
      details: payload.details,
      clinic_id: payload.clinic_id,
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
