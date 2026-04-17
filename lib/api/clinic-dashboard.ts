import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function withQuery(base: string, params: Record<string, string | number | undefined>) {
  const url = new URL(base, "http://local.test");

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return `${url.pathname}${url.search}`;
}

export type ClinicMeRecord = Record<string, unknown>;

export type ClinicSetupStatusRecord = Record<string, unknown>;
export type ClinicTodayRecord = Record<string, unknown>;
export type ClinicAppointmentRecord = Record<string, unknown>;
export type ClinicDoctorRecord = Record<string, unknown>;
export type ClinicDoctorInviteRecord = Record<string, unknown>;
export type ClinicServiceMappingRecord = Record<string, unknown>;
export type ClinicAvailabilityRecord = Record<string, unknown>;
export type ClinicAnalyticsRecord = Record<string, unknown>;
export type ClinicSettingsRecord = Record<string, unknown>;
export type ClinicSetupStateRecord = Record<string, unknown>;

export type AvailableServiceRecord = {
  service_id: number;
  service_code: string;
  service_name: string;
  description: string | null;
  requires_phn_billing: boolean;
  is_active: boolean;
  created_at: string;
};

export type SavedServiceMappingRecord = {
  mapping_id: number;
  platform_service_id: number;
  doctor_id: number | null;
  is_active: boolean;
  created_at: string;
};

export async function fetchAvailableServices() {
  return apiRequest<AvailableServiceRecord[]>({
    endpoint: API_ENDPOINTS.servicesCatalog,
  });
}

export async function fetchClinicServiceMappings(accessToken: string) {
  return apiRequest<SavedServiceMappingRecord[]>({
    endpoint: API_ENDPOINTS.clinicServices,
    headers: authHeaders(accessToken),
  });
}

export async function saveClinicServiceMappings(
  accessToken: string,
  serviceIds: number[],
) {
  return apiRequest<{ clinic_id: number; mapped_service_ids: number[] }, { service_ids: number[] }>(
    {
      endpoint: API_ENDPOINTS.clinicServices,
      method: "POST",
      body: { service_ids: serviceIds },
      headers: authHeaders(accessToken),
    },
  );
}

export async function saveTextMessageNotifications(
  accessToken: string,
  payload: {
    enabled: boolean;
    provider_name?: string;
    account_identifier?: string;
    auth_secret?: string;
    from_number?: string;
  },
) {
  return apiRequest<
    {
      enabled: boolean;
      provider_name: string | null;
      account_identifier: string | null;
      auth_secret: string | null;
      from_number: string | null;
      updated_at: string;
    },
    typeof payload
  >({
    endpoint: API_ENDPOINTS.clinicSetupTextMessageNotifications,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function saveEmailNotifications(
  accessToken: string,
  payload: {
    enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    sender_name: string;
    sender_email: string;
  },
) {
  return apiRequest<
    {
      enabled: boolean;
      smtp_host: string;
      smtp_port: number;
      smtp_username: string;
      smtp_password: string;
      sender_name: string;
      sender_email: string;
      updated_at: string;
    },
    typeof payload
  >({
    endpoint: API_ENDPOINTS.clinicSetupEmailNotifications,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function saveFaxIntegration(
  accessToken: string,
  payload: {
    enabled: boolean;
    provider_name: string;
    account_identifier: string;
    auth_secret: string;
    fax_number: string;
    notes: string | null;
  },
) {
  return apiRequest<
    {
      enabled: boolean;
      provider_name: string;
      account_identifier: string;
      auth_secret: string;
      fax_number: string;
      notes: string | null;
      updated_at: string;
    },
    typeof payload
  >({
    endpoint: API_ENDPOINTS.clinicSetupFaxIntegration,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicSetupState(accessToken: string) {
  return apiRequest<ClinicSetupStateRecord>({
    endpoint: "/api/v1/clinics/setup",
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicMe(accessToken: string) {
  return apiRequest<ClinicMeRecord>({
    endpoint: API_ENDPOINTS.clinicMe,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicSetupStatus(accessToken: string) {
  return apiRequest<ClinicSetupStatusRecord>({
    endpoint: API_ENDPOINTS.clinicMeSetupStatus,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicToday(accessToken: string) {
  return apiRequest<ClinicTodayRecord>({
    endpoint: API_ENDPOINTS.clinicMeToday,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAppointmentsByDate(
  accessToken: string,
  date: string,
) {
  return apiRequest<ClinicAppointmentRecord[]>({
    endpoint: withQuery(API_ENDPOINTS.clinicMeAppointments, { date }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAppointmentsByRange(
  accessToken: string,
  from: string,
  to: string,
) {
  return apiRequest<ClinicAppointmentRecord[]>({
    endpoint: withQuery(API_ENDPOINTS.clinicMeAppointments, { from, to }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAppointment(
  accessToken: string,
  appointmentId: string | number,
) {
  return apiRequest<ClinicAppointmentRecord>({
    endpoint: `${API_ENDPOINTS.clinicMeAppointments}/${appointmentId}`,
    headers: authHeaders(accessToken),
  });
}

export async function updateClinicAppointmentStatus(
  accessToken: string,
  appointmentId: string | number,
  status: string,
) {
  return apiRequest<ClinicAppointmentRecord, { status: string }>({
    endpoint: `${API_ENDPOINTS.clinicMeAppointments}/${appointmentId}/status`,
    method: "PATCH",
    body: { status },
    headers: authHeaders(accessToken),
  });
}

export async function assignClinicAppointmentDoctor(
  accessToken: string,
  appointmentId: string | number,
  doctorId: string | number,
) {
  return apiRequest<ClinicAppointmentRecord, { doctorId: string | number }>({
    endpoint: `${API_ENDPOINTS.clinicMeAppointments}/${appointmentId}/assign-doctor`,
    method: "PATCH",
    body: { doctorId },
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicDoctors(accessToken: string) {
  return apiRequest<ClinicDoctorRecord[]>({
    endpoint: API_ENDPOINTS.clinicMeDoctors,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicDoctor(
  accessToken: string,
  doctorId: string | number,
) {
  return apiRequest<ClinicDoctorRecord>({
    endpoint: `${API_ENDPOINTS.clinicMeDoctors}/${doctorId}`,
    headers: authHeaders(accessToken),
  });
}

export async function updateClinicDoctorStatus(
  accessToken: string,
  doctorId: string | number,
  status: string,
) {
  return apiRequest<ClinicDoctorRecord, { status: string }>({
    endpoint: `${API_ENDPOINTS.clinicMeDoctors}/${doctorId}/status`,
    method: "PATCH",
    body: { status },
    headers: authHeaders(accessToken),
  });
}

export async function inviteClinicDoctor(
  accessToken: string,
  payload: { doctor_name?: string; email: string; specialty?: string; role?: string },
) {
  return apiRequest<ClinicDoctorInviteRecord, typeof payload>({
    endpoint: API_ENDPOINTS.clinicMeDoctorInvite,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicDoctorInvites(accessToken: string) {
  return apiRequest<ClinicDoctorInviteRecord[]>({
    endpoint: API_ENDPOINTS.clinicMeDoctorInvites,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicServices(accessToken: string) {
  return apiRequest<ClinicServiceMappingRecord[]>({
    endpoint: API_ENDPOINTS.clinicMeServices,
    headers: authHeaders(accessToken),
  });
}

export async function saveClinicServices(
  accessToken: string,
  serviceIds: number[],
) {
  return apiRequest<
    { clinic_id: number; mapped_service_ids: number[] },
    { service_ids: number[] }
  >({
    endpoint: API_ENDPOINTS.clinicMeServices,
    method: "POST",
    body: { service_ids: serviceIds },
    headers: authHeaders(accessToken),
  });
}

export async function deleteClinicDoctorInvite(
  accessToken: string,
  inviteId: string | number,
) {
  return apiRequest<ClinicDoctorInviteRecord>({
    endpoint: `${API_ENDPOINTS.clinicMeDoctorInvites}/${inviteId}`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

export async function resendClinicDoctorInvite(
  accessToken: string,
  inviteId: string | number,
) {
  return apiRequest<ClinicDoctorInviteRecord>({
    endpoint: `${API_ENDPOINTS.clinicMeDoctorInvites}/${inviteId}/resend`,
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAvailability(
  accessToken: string,
  query: {
    doctorId?: string | number | "all";
    mode?: string;
    effectiveOn?: string;
    from?: string;
    to?: string;
  } = {},
) {
  return apiRequest<ClinicAvailabilityRecord[]>({
    endpoint: withQuery(API_ENDPOINTS.clinicMeAvailability, {
      doctorId: query.doctorId === "all" ? undefined : query.doctorId,
      mode: query.mode,
      effectiveOn: query.effectiveOn,
      from: query.from,
      to: query.to,
    }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAvailabilityRule(
  accessToken: string,
  availabilityId: string | number,
) {
  return apiRequest<ClinicAvailabilityRecord>({
    endpoint: `${API_ENDPOINTS.clinicMeAvailability}/${availabilityId}`,
    headers: authHeaders(accessToken),
  });
}

export async function createClinicAvailability(
  accessToken: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<ClinicAvailabilityRecord, Record<string, unknown>>({
    endpoint: API_ENDPOINTS.clinicMeAvailability,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function updateClinicAvailability(
  accessToken: string,
  availabilityId: string | number,
  payload: Record<string, unknown>,
) {
  return apiRequest<ClinicAvailabilityRecord, Record<string, unknown>>({
    endpoint: `${API_ENDPOINTS.clinicMeAvailability}/${availabilityId}`,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function deleteClinicAvailability(
  accessToken: string,
  availabilityId: string | number,
) {
  return apiRequest<ClinicAvailabilityRecord>({
    endpoint: `${API_ENDPOINTS.clinicMeAvailability}/${availabilityId}`,
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAnalyticsOverview(
  accessToken: string,
  range = "30d",
) {
  return apiRequest<ClinicAnalyticsRecord>({
    endpoint: withQuery(API_ENDPOINTS.clinicMeAnalyticsOverview, { range }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAnalyticsAppointments(
  accessToken: string,
  range = "30d",
  groupBy = "month",
) {
  return apiRequest<ClinicAnalyticsRecord>({
    endpoint: withQuery(API_ENDPOINTS.clinicMeAnalyticsAppointments, {
      range,
      groupBy,
    }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAnalyticsDoctors(
  accessToken: string,
  range = "30d",
) {
  return apiRequest<ClinicAnalyticsRecord>({
    endpoint: withQuery(API_ENDPOINTS.clinicMeAnalyticsDoctors, { range }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAnalyticsPatients(
  accessToken: string,
  range = "30d",
) {
  return apiRequest<ClinicAnalyticsRecord>({
    endpoint: withQuery(API_ENDPOINTS.clinicMeAnalyticsPatients, { range }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicAnalyticsPool(
  accessToken: string,
  range = "30d",
) {
  return apiRequest<ClinicAnalyticsRecord>({
    endpoint: withQuery(API_ENDPOINTS.clinicMeAnalyticsPool, { range }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicSettingsProfile(accessToken: string) {
  return apiRequest<ClinicSettingsRecord>({
    endpoint: API_ENDPOINTS.clinicMeSettingsProfile,
    headers: authHeaders(accessToken),
  });
}

export async function updateClinicSettingsProfile(
  accessToken: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<ClinicSettingsRecord, Record<string, unknown>>({
    endpoint: API_ENDPOINTS.clinicMeSettingsProfile,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicSettingsSms(accessToken: string) {
  return apiRequest<ClinicSettingsRecord>({
    endpoint: API_ENDPOINTS.clinicMeSettingsSms,
    headers: authHeaders(accessToken),
  });
}

export async function updateClinicSettingsSms(
  accessToken: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<ClinicSettingsRecord, Record<string, unknown>>({
    endpoint: API_ENDPOINTS.clinicMeSettingsSms,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicSettingsFax(accessToken: string) {
  return apiRequest<ClinicSettingsRecord>({
    endpoint: API_ENDPOINTS.clinicMeSettingsFax,
    headers: authHeaders(accessToken),
  });
}

export async function updateClinicSettingsFax(
  accessToken: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<ClinicSettingsRecord, Record<string, unknown>>({
    endpoint: API_ENDPOINTS.clinicMeSettingsFax,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicSettingsSmtp(accessToken: string) {
  return apiRequest<ClinicSettingsRecord>({
    endpoint: API_ENDPOINTS.clinicMeSettingsSmtp,
    headers: authHeaders(accessToken),
  });
}

export async function updateClinicSettingsSmtp(
  accessToken: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<ClinicSettingsRecord, Record<string, unknown>>({
    endpoint: API_ENDPOINTS.clinicMeSettingsSmtp,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicSettingsCredentials(accessToken: string) {
  return apiRequest<ClinicSettingsRecord>({
    endpoint: API_ENDPOINTS.clinicMeSettingsCredentials,
    headers: authHeaders(accessToken),
  });
}

export async function updateClinicSettingsCredentials(
  accessToken: string,
  payload: Record<string, unknown>,
) {
  return apiRequest<ClinicSettingsRecord, Record<string, unknown>>({
    endpoint: API_ENDPOINTS.clinicMeSettingsCredentials,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}
