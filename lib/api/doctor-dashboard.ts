import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function withQuery(base: string, params: Record<string, string | undefined>) {
  const url = new URL(base, "http://local.test");
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export type DoctorMeTodayStats = {
  date?: string;
  appointment_count?: number;
  assigned?: number;
  in_progress?: number;
  seen_today?: number;
};

export type DoctorSummary = {
  doctor_id: number;
  clinic_doctor_id: number;
  clinic_id: number;
  clinic_slug: string;
  clinic_name: string;
  doctor_name: string;
  email: string;
  specialty: string | null;
  status: string;
  app_url: string;
  today?: DoctorMeTodayStats;
};

export type DoctorAppointment = {
  id: number;
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  service: string;
  service_name: string;
  user_friendly_service_name: string;
  status: string;
  channel: string;
  chief_complaint: string | null;
  notes: string | null;
  prescription_notes: string | null;
  time: string;
  date_key: string;
  date: string;
  queued_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type DoctorTodayResponse = {
  date: string;
  appointments: DoctorAppointment[];
  counts?: {
    total: number;
    assigned: number;
    in_progress: number;
    seen_today: number;
  };
};

export type DoctorAppointmentsResponse = {
  appointments: DoctorAppointment[];
};

export type DoctorPoolResponse = {
  appointments: DoctorAppointment[];
};

export type DoctorPatient = {
  id: number;
  patient_id: number;
  name: string;
  dob: string;
  dob_label: string;
  last_seen: string | null;
  last_seen_label: string;
  total_visits: number;
  status: string;
};

export type DoctorPatientsResponse = {
  patients: DoctorPatient[];
};

export type DoctorPrescription = {
  id: number;
  appointment_id: number;
  patient_name: string;
  medication: string;
  dosage: string;
  written_at: string;
  written_at_label: string;
  status: string;
};

export type DoctorPrescriptionsResponse = {
  prescriptions: DoctorPrescription[];
};

export type DoctorScheduleEntry = {
  id: number;
  mode: string;
  days: string;
  start_time: string;
  end_time: string;
  effective_from: string | null;
  effective_until: string | null;
  specific_date: string | null;
  note: string | null;
};

export type DoctorScheduleResponse = {
  schedule: DoctorScheduleEntry[];
};

export type DoctorProfile = {
  doctor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  clinic_slug: string;
  clinic_name: string;
  specialty: string | null;
};

export type DoctorOscarLaunch = {
  redirect_url: string;
  app_url: string;
  clinic_slug: string;
  doctor_id: number;
  clinic_doctor_id: number;
};

export async function fetchDoctorSummary(accessToken: string) {
  return apiRequest<DoctorSummary>({
    endpoint: API_ENDPOINTS.doctorMe,
    headers: authHeaders(accessToken),
  });
}

export async function fetchDoctorToday(accessToken: string) {
  return apiRequest<DoctorTodayResponse>({
    endpoint: API_ENDPOINTS.doctorMeToday,
    headers: authHeaders(accessToken),
  });
}

export async function fetchDoctorAppointments(
  accessToken: string,
  options: { date?: string; from?: string; to?: string } = {},
) {
  return apiRequest<DoctorAppointmentsResponse>({
    endpoint: withQuery(API_ENDPOINTS.doctorMeAppointments, options),
    headers: authHeaders(accessToken),
  });
}

export async function fetchDoctorPool(accessToken: string) {
  return apiRequest<DoctorPoolResponse>({
    endpoint: API_ENDPOINTS.doctorMePool,
    headers: authHeaders(accessToken),
  });
}

export async function claimDoctorPoolAppointment(accessToken: string, appointmentId: number) {
  return apiRequest<{ appointment: DoctorAppointment }, never>({
    endpoint: `${API_ENDPOINTS.doctorMePool}/${appointmentId}/claim`,
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

export async function fetchDoctorPatients(accessToken: string, query?: string) {
  return apiRequest<DoctorPatientsResponse>({
    endpoint: withQuery(API_ENDPOINTS.doctorMePatients, { q: query?.trim() || undefined }),
    headers: authHeaders(accessToken),
  });
}

export async function fetchDoctorPrescriptions(accessToken: string) {
  return apiRequest<DoctorPrescriptionsResponse>({
    endpoint: API_ENDPOINTS.doctorMePrescriptions,
    headers: authHeaders(accessToken),
  });
}

export async function fetchDoctorSchedule(accessToken: string) {
  return apiRequest<DoctorScheduleResponse>({
    endpoint: API_ENDPOINTS.doctorMeSchedule,
    headers: authHeaders(accessToken),
  });
}

export async function fetchDoctorProfile(accessToken: string) {
  return apiRequest<DoctorProfile>({
    endpoint: API_ENDPOINTS.doctorMeSettingsProfile,
    headers: authHeaders(accessToken),
  });
}

export async function updateDoctorProfile(
  accessToken: string,
  payload: Pick<DoctorProfile, "first_name" | "last_name" | "email">,
) {
  return apiRequest<Pick<DoctorProfile, "first_name" | "last_name" | "email">, typeof payload>({
    endpoint: API_ENDPOINTS.doctorMeSettingsProfile,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function updateDoctorPassword(
  accessToken: string,
  payload: {
    current_password: string;
    new_password: string;
  },
) {
  return apiRequest<unknown, typeof payload>({
    endpoint: API_ENDPOINTS.doctorMeSettingsCredentials,
    method: "PATCH",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchDoctorOscarLaunch(accessToken: string) {
  return apiRequest<DoctorOscarLaunch>({
    endpoint: API_ENDPOINTS.doctorMeOscarLaunch,
    headers: authHeaders(accessToken),
  });
}
