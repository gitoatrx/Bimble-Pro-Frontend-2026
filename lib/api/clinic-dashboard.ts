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

export async function fetchAvailableServices() {
  return apiRequest<AvailableServiceRecord[]>({
    endpoint: API_ENDPOINTS.servicesCatalog,
  });
}

export type FeeScheduleServiceRecord = {
  service_code: string;
  service_name: string;
  user_friendly_service_name: string;
  price: string;
  anesthesia_intensity_level?: number | null;
  referral_flag?: string | null;
  specialty_code_1?: string | null;
  specialty_code_2?: string | null;
  specialty_code_3?: string | null;
  specialty_code_4?: string | null;
  specialty_code_5?: string | null;
  time_dependency_flag?: string | null;
  service_clarification_flag?: string | null;
  restriction_flag?: string | null;
  bcma_status_flag?: string | null;
  source_effective_date?: string | null;
  source_file_name?: string | null;
};

function normalizeFeeScheduleResponse(response: unknown): FeeScheduleServiceRecord[] {
  if (Array.isArray(response)) {
    return response as FeeScheduleServiceRecord[];
  }

  if (response && typeof response === "object") {
    const maybeItems = (response as { items?: unknown }).items;
    if (Array.isArray(maybeItems)) {
      return maybeItems as FeeScheduleServiceRecord[];
    }
  }

  return [];
}

export async function searchFeeScheduleServices(
  accessToken: string,
  query: string,
) {
  return searchFeeScheduleServicesInternal(query, authHeaders(accessToken));
}

export async function searchFeeScheduleServicesPublic(query: string) {
  return searchFeeScheduleServicesInternal(query);
}

async function searchFeeScheduleServicesInternal(
  query: string,
  headers?: Record<string, string>,
) {
  const response = await apiRequest<unknown>({
    endpoint: `${API_ENDPOINTS.mspFeeScheduleSearch}?query=${encodeURIComponent(query)}&q=${encodeURIComponent(query)}`,
    headers,
  });

  return normalizeFeeScheduleResponse(response);
}

export async function saveClinicServiceSelections(
  accessToken: string,
  serviceCodes: string[],
) {
  return apiRequest<
    {
      items: Array<{
        service_code: string;
        service_name: string;
        price: string;
        user_friendly_service_name: string;
      }>;
      missing_service_codes: string[];
    },
    { service_codes: string[] }
  >({
    endpoint: API_ENDPOINTS.mspFeeScheduleSelection,
    method: "POST",
    body: { service_codes: serviceCodes },
    headers: authHeaders(accessToken),
  });
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
    endpoint: API_ENDPOINTS.clinicMeSettingsSms,
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
    endpoint: API_ENDPOINTS.clinicMeSettingsFax,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function startAcceptingAppointments(
  accessToken: string,
  doctorIds: number[],
) {
  return apiRequest<
    {
      clinic_id: number;
      accepting_appointments: boolean;
      enabled_doctor_ids: number[];
      active_doctor_count: number;
      setup_status: string;
      setup_completed: boolean;
      completed_steps: number;
      total_steps: number;
      completion_percent: number;
    },
    { enabled: boolean; doctor_ids: number[] }
  >({
    endpoint: API_ENDPOINTS.clinicSetupStartAcceptingAppointments,
    method: "PATCH",
    body: { enabled: true, doctor_ids: doctorIds },
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicSetupState(accessToken: string) {
  return apiRequest<ClinicSetupStateRecord>({
    endpoint: API_ENDPOINTS.clinicMeSetupStatus,
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
  payload: { email: string },
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
