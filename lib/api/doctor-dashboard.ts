import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiRequestError, apiRequest } from "@/lib/api/request";

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
  available_clinics?: Array<{
    clinic_id: number;
    clinic_slug: string;
    clinic_name: string;
    current: boolean;
  }>;
  today?: DoctorMeTodayStats;
};

export type DoctorClinicListItem = {
  clinic_id: number;
  clinic_slug: string;
  clinic_name: string;
  current: boolean;
  app_url?: string | null;
  oscar_app_url?: string | null;
  emr_launch_url?: string | null;
};

export type DoctorAppointment = {
  id: number;
  appointment_id: number;
  patient_id: number;
  patient_name: string;
  patient_date_of_birth?: string | null;
  patient_age?: number | null;
  service: string;
  service_name: string | null;
  user_friendly_service_name: string;
  status: string;
  channel: string;
  chief_complaint: string | null;
  notes: string | null;
  prescription_notes: string | null;
  visit_type?: string | null;
  fulfillment?: string | null;
  pharmacy_choice?: string | null;
  appointment_date?: string | null;
  appointment_time?: string | null;
  care_location?: string | null;
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

export type DoctorAppointmentStartResponse = {
  appointment: DoctorAppointment;
  treatment_url: string;
  oscar: {
    appointment_no: number | null;
    demographic_no: number;
    provider_no: string;
  };
};

export type DoctorDrugSearchItem = {
  source_id: number;
  drug_code: string | null;
  name: string;
  brand_name: string | null;
  descriptor: string | null;
  drug_identification_number: string | null;
  route?: string | null;
  drug_category?: string | null;
  is_narcotic?: boolean;
  suggested_sig?: string | null;
  technical_reasons?: Array<{
    technical_reason: string;
    sigs: string[];
  }>;
};

type OatRxDrugSearchItem = {
  id: number;
  group_name: string;
  drug_category?: string | null;
  dosage_form?: string | null;
  route?: string | null;
  is_narcotic?: boolean;
  drugs?: Array<{
    id?: number;
    name?: string | null;
    din?: string | null;
    drug_family?: string | null;
  }>;
  active_ingredients?: Array<{
    ingredient_name?: string | null;
    drug_code?: string | number | null;
    strength?: string | number | null;
    strength_unit?: string | null;
  }>;
  technical_reasons?: Array<{
    technical_reason?: string | null;
    sigs?: Array<{ sig?: string | null }>;
  }>;
};

type OatRxDrugSearchResponse = {
  success?: boolean;
  data?: OatRxDrugSearchItem[];
  message?: string;
};

export type DoctorPrescriptionMedicationPayload = {
  drug_catalog_source_id?: number | null;
  drug_code?: string | null;
  drug_name: string;
  ingredient?: string | null;
  instructions?: string | null;
  dosage?: string | null;
  quantity?: string | null;
  repeats?: number | null;
  route?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
};

export type DoctorPrescriptionPayload = {
  drug_catalog_source_id?: number | null;
  drug_code?: string | null;
  drug_name: string;
  ingredient?: string | null;
  instructions: string;
  medications?: DoctorPrescriptionMedicationPayload[];
  quantity?: string | null;
  repeats?: number | null;
  no_substitution?: boolean;
  prn?: boolean;
  long_term?: string | null;
  method?: string | null;
  route?: string | null;
  frequency?: string | null;
  take_min?: number | null;
  take_max?: number | null;
  duration?: string | null;
  duration_unit?: string | null;
  additional_note?: string | null;
  signature_data_url?: string | null;
  signature_label?: string | null;
  pdf_size?: string | null;
};

export type DoctorPrescriptionRecord = DoctorPrescriptionPayload & {
  prescription_id: number;
  appointment_id: number;
  patient_id: number;
  status: string;
  oscar_drug_id: number | null;
  created_at: string | null;
  medication_items?: DoctorPrescriptionMedicationPayload[];
};

export type DoctorPrescriptionSaveResponse = {
  prescription: DoctorPrescriptionRecord;
  appointment: DoctorAppointment;
  print_url: string;
  document?: {
    document_id: number;
    document_name: string;
    download_url: string;
  };
};

export type DoctorPrescriptionPrintResponse = {
  ok: boolean;
  message: string;
  document_id?: number;
  document_name?: string;
  method?: string | null;
  printer?: string | null;
  reader_path?: string | null;
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

export async function fetchDoctorClinics(accessToken: string) {
  return apiRequest<DoctorClinicListItem[]>({
    endpoint: API_ENDPOINTS.doctorMeClinics,
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

export async function fetchDoctorAppointment(accessToken: string, appointmentId: number) {
  return apiRequest<{ appointment: DoctorAppointment }>({
    endpoint: `${API_ENDPOINTS.doctorMeAppointments}/${appointmentId}`,
    headers: authHeaders(accessToken),
  });
}

export async function startDoctorAppointment(accessToken: string, appointmentId: number) {
  return apiRequest<DoctorAppointmentStartResponse, never>({
    endpoint: `${API_ENDPOINTS.doctorMeAppointments}/${appointmentId}/start`,
    method: "POST",
    headers: authHeaders(accessToken),
  });
}

function firstValue(values: Array<string | number | null | undefined>) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim()) ?? null;
}

function mapOatRxDrug(item: OatRxDrugSearchItem): DoctorDrugSearchItem {
  const primaryDrug = item.drugs?.[0];
  const primaryIngredient = item.active_ingredients?.[0];
  const technicalReasons = (item.technical_reasons ?? []).map((reason) => ({
    technical_reason: reason.technical_reason ?? "",
    sigs: (reason.sigs ?? [])
      .map((sig) => sig.sig?.trim())
      .filter((sig): sig is string => Boolean(sig)),
  }));

  return {
    source_id: item.id,
    drug_code: firstValue([primaryIngredient?.drug_code, primaryDrug?.id])?.toString() ?? null,
    name: item.group_name,
    brand_name: primaryDrug?.name ?? null,
    descriptor: firstValue([
      item.dosage_form,
      primaryIngredient?.ingredient_name,
      primaryDrug?.drug_family,
    ])?.toString() ?? null,
    drug_identification_number: primaryDrug?.din ?? null,
    route: item.route ?? null,
    drug_category: item.drug_category ?? null,
    is_narcotic: item.is_narcotic,
    suggested_sig: technicalReasons.flatMap((reason) => reason.sigs)[0] ?? null,
    technical_reasons: technicalReasons,
  };
}

export async function searchDoctorDrugs(
  _accessToken: string,
  query: string,
  options: { signal?: AbortSignal } = {},
) {
  const search = query.trim();
  if (search.length < 2) return { drugs: [] };

  const url = new URL("/oatrx/api/fetch-drug-data", window.location.origin);
  url.searchParams.set("search", search);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: options.signal,
  });

  const data = (await response.json().catch(() => null)) as OatRxDrugSearchResponse | null;
  if (!response.ok || data?.success === false) {
    throw new ApiRequestError(data?.message || "Drug search failed.", response.status, data);
  }

  return { drugs: (data?.data ?? []).map(mapOatRxDrug) };
}

export async function saveDoctorPrescription(
  accessToken: string,
  appointmentId: number,
  payload: DoctorPrescriptionPayload,
) {
  return apiRequest<DoctorPrescriptionSaveResponse, DoctorPrescriptionPayload>({
    endpoint: `${API_ENDPOINTS.doctorMeAppointments}/${appointmentId}/prescriptions`,
    method: "POST",
    headers: authHeaders(accessToken),
    body: payload,
  });
}

export async function printDoctorPrescription(accessToken: string, prescriptionId: number) {
  return apiRequest<DoctorPrescriptionPrintResponse, never>({
    endpoint: `/api/v1/doctors/me/prescriptions/${prescriptionId}/print`,
    method: "POST",
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

export type MspSpecialtyRecord = {
  code: string;
  name: string;
  category: string;
  description: string;
};

export type DoctorSpecialtySelectionResponse = {
  clinic_id?: number | null;
  doctor_id?: number | null;
  specialty_codes: string[];
  items: MspSpecialtyRecord[];
  missing_specialty_codes: string[];
};

export async function fetchMspSpecialties() {
  return apiRequest<MspSpecialtyRecord[]>({
    endpoint: API_ENDPOINTS.specialtiesCatalog,
  });
}

export async function fetchDoctorSpecialtySelections(accessToken: string) {
  return apiRequest<DoctorSpecialtySelectionResponse>({
    endpoint: API_ENDPOINTS.doctorMeSpecialties,
    headers: authHeaders(accessToken),
  });
}

export async function saveDoctorSpecialtySelections(
  accessToken: string,
  specialtyCodes: string[],
) {
  return apiRequest<DoctorSpecialtySelectionResponse, { specialty_codes: string[] }>({
    endpoint: API_ENDPOINTS.doctorMeSpecialties,
    method: "POST",
    body: { specialty_codes: specialtyCodes },
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

export type DoctorDuplicatePrescriptionPadOrderAddressDetailsOption =
  | "INCLUDE_PRIMARY"
  | "INCLUDE_ALTERNATE";

export type DoctorDuplicatePrescriptionPadOrderDeliveryOption =
  | "PRIMARY_ADDRESS"
  | "ALTERNATE_ADDRESS";

export type DoctorDuplicatePrescriptionPadOrderSignature = {
  signature_data_url?: string | null;
  signature_label?: string | null;
};

export type DoctorDuplicatePrescriptionPadOrderSavedValues = {
  surname?: string | null;
  given_names?: string | null;
  college_id_number?: string | null;
  primary_address?: string | null;
  primary_phone?: string | null;
  address_details_option?: DoctorDuplicatePrescriptionPadOrderAddressDetailsOption | null;
  alternate_address?: string | null;
  alternate_phone?: string | null;
  delivery_option?: DoctorDuplicatePrescriptionPadOrderDeliveryOption | null;
  delivery_address?: string | null;
  delivery_phone?: string | null;
  order_quantity?: string | null;
  signature?: DoctorDuplicatePrescriptionPadOrderSignature | null;
};

export type DoctorDuplicatePrescriptionPadOrderRequest = {
  surname: string;
  given_names: string;
  college_id_number: string;
  primary_address: string;
  primary_phone: string;
  address_details_option: DoctorDuplicatePrescriptionPadOrderAddressDetailsOption;
  alternate_address: string | null;
  alternate_phone: string | null;
  delivery_option: DoctorDuplicatePrescriptionPadOrderDeliveryOption;
  delivery_address: string | null;
  delivery_phone: string | null;
  order_quantity: string;
  signature: {
    signature_data_url: string;
    signature_label: string;
  };
};

export type DoctorDuplicatePrescriptionPadOrderResponse = {
  packet_id: number;
  doctor_id: number;
  clinic_id: number;
  clinic_slug: string;
  form_code: string;
  payment_direction: string;
  status: string;
  generated_at: string;
  signature_captured?: boolean;
  signature_signed_at?: string | null;
  signature_label?: string | null;
  signature_data_url?: string | null;
  missing_fields: string[];
  field_values: Record<string, unknown>;
  saved_values: DoctorDuplicatePrescriptionPadOrderSavedValues;
  download_url: string | null;
  ui_content: null;
};

export type DoctorDuplicatePrescriptionPadOrderGetResponse =
  DoctorDuplicatePrescriptionPadOrderResponse;

export async function fetchDoctorDuplicatePrescriptionPadOrder(accessToken: string) {
  return apiRequest<DoctorDuplicatePrescriptionPadOrderResponse>({
    endpoint: API_ENDPOINTS.doctorMeSettingsDuplicatePrescriptionPadOrder,
    headers: authHeaders(accessToken),
  });
}

export async function submitDoctorDuplicatePrescriptionPadOrder(
  accessToken: string,
  payload: DoctorDuplicatePrescriptionPadOrderRequest,
) {
  return apiRequest<
    DoctorDuplicatePrescriptionPadOrderResponse,
    DoctorDuplicatePrescriptionPadOrderRequest
  >({
    endpoint: API_ENDPOINTS.doctorMeSettingsDuplicatePrescriptionPadOrder,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}
