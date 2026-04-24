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

export type ClinicFacilityFormDeclaration = {
  id: string;
  summary_text: string;
  full_text: string;
};

export type ClinicFacilityFormUiContent = {
  field_labels: Record<string, string>;
  part_b?: {
    title: string;
    summary: string;
    selection_type: string;
    consent_style: string;
    options: Array<{
      value: string;
      label: string;
      full_text: string;
      summary_text: string;
    }>;
  };
  part_c?: {
    title: string;
    summary: string;
    consent_label: string;
    consent_required: boolean;
    declarations: ClinicFacilityFormDeclaration[];
  };
};

export type ClinicFacilityFormSignature = {
  signatureDataUrl: string;
  signatureLabel: string;
};

export type ClinicFacilityFormSubmission = {
  administratorLastName: string;
  administratorFirstName: string;
  mspPractitionerNumber: string;
  facilityOrPracticeName: string;
  facilityEffectiveDate: string;
  contactEmail?: string;
  contactPhoneNumber: string;
  contactFaxNumber?: string;
  facilityPhysicalAddress: string;
  facilityPhysicalCity: string;
  facilityPhysicalPostalCode: string;
  facilityMailingAddress?: string;
  facilityMailingCity?: string;
  facilityMailingPostalCode?: string;
  bcpAppliedToEligibleFees: boolean;
  confirmDeclarations: boolean;
  dateSigned: string;
  signature: ClinicFacilityFormSignature;
};

export type ClinicFacilityFormResponse = {
  form_code: string;
  title: string;
  saved_at: string;
  field_values: Record<string, unknown>;
  saved_values: Record<string, unknown>;
  missing_fields: string[];
  confirm_declarations: boolean;
  pdf_name: string | null;
  download_url: string | null;
  ui_content: ClinicFacilityFormUiContent;
};

export type ClinicTeleplan2820FacilityType =
  | "CLINIC"
  | "HOSPITAL"
  | "PRACTITIONER"
  | "SERVICE_BUREAU"
  | "VENDOR";

export type ClinicTeleplan2820Mode =
  | "NEW_DATA_CENTRE"
  | "EXISTING_DATA_CENTRE"
  | "SERVICE_BUREAU";

export type ClinicTeleplan2820Signature = {
  signature_data_url: string;
  signature_label: string;
};

export type ClinicTeleplan2820SavedValues = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone_number?: string | null;
  organization_name?: string | null;
  contact_person?: string | null;
  facility_type?: ClinicTeleplan2820FacilityType | null;
  teleplan_mode?: ClinicTeleplan2820Mode | null;
  new_data_centre_name?: string | null;
  new_data_centre_contact?: string | null;
  existing_data_centre_name?: string | null;
  existing_data_centre_number?: string | null;
  service_bureau_name?: string | null;
  service_bureau_number?: string | null;
  computer_make_model?: string | null;
  computer_make_model2?: string | null;
  modem_make_model?: string | null;
  modem_type?: string | null;
  modem_speed?: string | null;
  software_name?: string | null;
  vendor_name?: string | null;
  supplier?: string | null;
  msp_payee_number?: string | null;
  signature?: ClinicTeleplan2820Signature | null;
  Signature_Date?: string | null;
};

export type ClinicTeleplan2820Request = {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone_number: string;
  organization_name: string;
  contact_person: string;
  facility_type: ClinicTeleplan2820FacilityType;
  teleplan_mode: ClinicTeleplan2820Mode;
  new_data_centre_name: string | null;
  new_data_centre_contact: string | null;
  existing_data_centre_name: string | null;
  existing_data_centre_number: string | null;
  service_bureau_name: string | null;
  service_bureau_number: string | null;
  computer_make_model: string;
  computer_make_model2: string;
  modem_make_model: string;
  modem_type: string;
  modem_speed: string;
  software_name: string;
  vendor_name: string;
  supplier: string;
  msp_payee_number: string;
  Signature_Date: string;
  signature: ClinicTeleplan2820Signature;
};

export type ClinicTeleplan2820Response = {
  form_code: string;
  title: string;
  saved_at: string;
  field_values: Record<string, unknown>;
  saved_values: ClinicTeleplan2820SavedValues;
  missing_fields: string[];
  signature_captured?: boolean;
  signature_signed_at?: string | null;
  signature_label?: string | null;
  signature_data_url?: string | null;
  pdf_name: string | null;
  download_url: string | null;
  ui_content: null;
};

export type ClinicPayment2876Modality = "CONTRACT" | "SESSIONAL" | "SALARY";

export type ClinicPayment2876UiContent = {
  field_labels: Record<string, string>;
  payment_modality_options: Array<{
    value: ClinicPayment2876Modality;
    label: string;
  }>;
  notes?: string[];
};

export type ClinicPayment2876SavedValues = {
  mspPractitionerNumber?: string | null;
  currentFullNameOrGroupName?: string | null;
  currentMspPaymentNumbers?: string[] | null;
  currentPaymentMailingAddress?: string | null;
  contractName?: string | null;
  paymentModality?: ClinicPayment2876Modality | null;
  dataCentreNumber?: string | null;
  effectiveDate?: string | null;
  responsiblePractitionerMspNumber?: string | null;
  responsiblePractitionerName?: string | null;
  telephoneNumber?: string | null;
  faxNumber?: string | null;
  emailAddress?: string | null;
  serviceDescription?: string | null;
  encounterReportingOnly?: boolean | null;
  signature?: ClinicFacilityFormSignature | null;
};

export type ClinicPayment2876Request = {
  mspPractitionerNumber: string;
  currentFullNameOrGroupName: string;
  currentMspPaymentNumbers: string[];
  currentPaymentMailingAddress: string;
  contractName: string;
  paymentModality: ClinicPayment2876Modality;
  dataCentreNumber: string;
  effectiveDate: string;
  responsiblePractitionerMspNumber: string;
  responsiblePractitionerName: string;
  telephoneNumber: string;
  faxNumber: string;
  emailAddress: string;
  serviceDescription: string;
  encounterReportingOnly: boolean;
  signature: ClinicFacilityFormSignature;
};

export type ClinicPayment2876Response = {
  form_code: string;
  title: string;
  saved_at: string;
  field_values: Record<string, unknown>;
  saved_values: ClinicPayment2876SavedValues;
  missing_fields: string[];
  pdf_name: string | null;
  download_url: string | null;
  ui_content: ClinicPayment2876UiContent;
};

export type ClinicPhysicianChangeOfficeHourSlot = {
  from: string;
  to: string;
  lunchFrom: string;
  lunchTo: string;
};

export type ClinicPhysicianChangeOfficeHours = {
  sunday: ClinicPhysicianChangeOfficeHourSlot;
  monday: ClinicPhysicianChangeOfficeHourSlot;
  tuesday: ClinicPhysicianChangeOfficeHourSlot;
  wednesday: ClinicPhysicianChangeOfficeHourSlot;
  thursday: ClinicPhysicianChangeOfficeHourSlot;
  friday: ClinicPhysicianChangeOfficeHourSlot;
  saturday: ClinicPhysicianChangeOfficeHourSlot;
};

export type ClinicPhysicianChangeInformationSavedValues = {
  formType?: string | null;
  name?: string | null;
  mohBillingNumber?: string | null;
  address?: string | null;
  specialty?: string | null;
  officeContactName?: string | null;
  officePhone?: string | null;
  officeFax?: string | null;
  officePrivatePhone?: string | null;
  officeEmailAddress?: string | null;
  officeHours?: Partial<ClinicPhysicianChangeOfficeHours> | null;
  afterHoursPhone?: string | null;
  afterHoursDescription?: string | null;
  afterHoursBeeper?: string | null;
  afterHoursCellPhone?: string | null;
  afterHoursHomePhone?: string | null;
  backupPhysicianNumber?: string | null;
  backupName?: string | null;
  backupPhone?: string | null;
  hospitalAffiliation?: string | null;
  hospitalPhone?: string | null;
  otherAffiliation?: string | null;
  otherPhone?: string | null;
  specialHandling?: string | null;
};

export type ClinicPhysicianChangeInformationRequest = {
  formType: string;
  name: string;
  mohBillingNumber: string;
  address: string;
  specialty: string;
  officeContactName: string;
  officePhone: string;
  officeFax: string;
  officePrivatePhone: string;
  officeEmailAddress: string;
  officeHours: ClinicPhysicianChangeOfficeHours;
  afterHoursPhone: string;
  afterHoursDescription: string;
  afterHoursBeeper: string;
  afterHoursCellPhone: string;
  afterHoursHomePhone: string;
  backupPhysicianNumber: string;
  backupName: string;
  backupPhone: string;
  hospitalAffiliation: string;
  hospitalPhone: string;
  otherAffiliation: string;
  otherPhone: string;
  specialHandling: string;
};

export type ClinicPhysicianChangeInformationResponse = {
  form_code: string;
  title: string;
  saved_at: string;
  field_values: Record<string, unknown>;
  saved_values: ClinicPhysicianChangeInformationSavedValues;
  missing_fields: string[];
  pdf_name: string | null;
  download_url: string | null;
  ui_content: null;
};

export type ClinicExcellerisDeliveryMethod = "LAUNCHPAD" | "EMR" | "FAX";

export type ClinicExcellerisAcknowledgement = {
  id: string;
  summary_text: string;
  full_text: string;
};

export type ClinicExcellerisUiContent = {
  field_labels: Record<string, string>;
  delivery_method_options: Array<{
    value: ClinicExcellerisDeliveryMethod;
    label: string;
    summary_text: string;
  }>;
  acknowledgements: ClinicExcellerisAcknowledgement[];
  consent_label: string;
  consent_required: boolean;
};

export type ClinicExcellerisSavedValues = {
  providerName?: string | null;
  mspNumber?: string | null;
  clinicNameAndAddress?: string | null;
  dateSigned?: string | null;
  telephoneNumber?: string | null;
  emailAddress?: string | null;
  faxNumber?: string | null;
  deliveryMethod?: ClinicExcellerisDeliveryMethod | null;
  launchpadUserNames?: string[] | null;
  emrName?: string | null;
  emrFaxNumber?: string | null;
  reportFaxNumber?: string | null;
  confirmAcknowledgement?: boolean | null;
  signature?: ClinicFacilityFormSignature | null;
};

export type ClinicExcellerisRequest = {
  providerName: string;
  mspNumber: string;
  clinicNameAndAddress: string;
  dateSigned: string;
  telephoneNumber: string;
  emailAddress: string;
  faxNumber: string;
  deliveryMethod: ClinicExcellerisDeliveryMethod;
  launchpadUserNames: string[];
  emrName: string | null;
  emrFaxNumber: string | null;
  reportFaxNumber: string | null;
  confirmAcknowledgement: boolean;
  signature: ClinicFacilityFormSignature;
};

export type ClinicExcellerisResponse = {
  form_code: string;
  title: string;
  saved_at: string;
  field_values: Record<string, unknown>;
  saved_values: ClinicExcellerisSavedValues;
  missing_fields: string[];
  confirm_acknowledgement: boolean;
  pdf_name: string | null;
  download_url: string | null;
  ui_content: ClinicExcellerisUiContent;
};

export type ClinicHl7SetupInstruction = "NEW" | "ADD_EXISTING";
export type ClinicHl7SupportedContentType =
  | "TRANSCRIPTIONS"
  | "NOTIFICATIONS"
  | "PDF_REPORTS"
  | "RTF_REPORTS"
  | "VIHA_DIAGNOSTIC_IMAGING"
  | "VIHA_CLINICAL_DOCUMENTS"
  | "BCCA_SCREENING";

export type ClinicHl7HealthCareProviderSetupUiContent = {
  field_labels: Record<string, string>;
  setup_instruction_options: Array<{
    value: ClinicHl7SetupInstruction;
    label: string;
  }>;
  supported_content_options: Array<{
    value: ClinicHl7SupportedContentType;
    label: string;
  }>;
};

export type ClinicHl7HealthCareProviderSetupSavedValues = {
  clinicName?: string | null;
  primaryContact?: string | null;
  address?: string | null;
  telephoneNumber?: string | null;
  email?: string | null;
  setupInstruction?: ClinicHl7SetupInstruction | null;
  existingExcellerisUserId?: string | null;
  additionalSpecialInstructions?: string | null;
  providerNamesAndMspNumbers?: string | null;
  emrName?: string | null;
  emrVersion?: string | null;
  emrContact?: string | null;
  emrTelephoneNumber?: string | null;
  emrEmail?: string | null;
  implementationDate?: string | null;
  supportedContentTypes?: ClinicHl7SupportedContentType[] | null;
  fallbackFaxNumber?: string | null;
};

export type ClinicHl7HealthCareProviderSetupRequest = {
  clinicName: string;
  primaryContact: string;
  address: string;
  telephoneNumber: string;
  email: string;
  setupInstruction: ClinicHl7SetupInstruction;
  existingExcellerisUserId: string | null;
  additionalSpecialInstructions: string;
  providerNamesAndMspNumbers: string;
  emrName: string;
  emrVersion: string;
  emrContact: string;
  emrTelephoneNumber: string;
  emrEmail: string;
  implementationDate: string;
  supportedContentTypes: ClinicHl7SupportedContentType[];
  fallbackFaxNumber: string;
};

export type ClinicHl7HealthCareProviderSetupResponse = {
  form_code: string;
  title: string;
  saved_at: string;
  field_values: Record<string, unknown>;
  saved_values: ClinicHl7HealthCareProviderSetupSavedValues;
  missing_fields: string[];
  pdf_name: string | null;
  download_url: string | null;
  ui_content: ClinicHl7HealthCareProviderSetupUiContent;
};

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

export async function fetchClinicFacilityForm(
  accessToken: string,
  formCode = "hlth-2948",
) {
  return apiRequest<ClinicFacilityFormResponse>({
    endpoint: `/api/v1/clinics/me/facility-forms/${formCode}`,
    headers: authHeaders(accessToken),
  });
}

export async function submitClinicFacilityForm(
  accessToken: string,
  formCode: string,
  payload: ClinicFacilityFormSubmission,
) {
  return apiRequest<ClinicFacilityFormResponse, ClinicFacilityFormSubmission>({
    endpoint: `/api/v1/clinics/me/facility-forms/${formCode}`,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicTeleplan2820Form(accessToken: string) {
  return apiRequest<ClinicTeleplan2820Response>({
    endpoint: API_ENDPOINTS.clinicMeTeleplanHlth2820,
    headers: authHeaders(accessToken),
  });
}

export async function submitClinicTeleplan2820Form(
  accessToken: string,
  payload: ClinicTeleplan2820Request,
) {
  return apiRequest<ClinicTeleplan2820Response, ClinicTeleplan2820Request>({
    endpoint: API_ENDPOINTS.clinicMeTeleplanHlth2820,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicPayment2876Form(accessToken: string) {
  return apiRequest<ClinicPayment2876Response>({
    endpoint: API_ENDPOINTS.clinicMePaymentHlth2876,
    headers: authHeaders(accessToken),
  });
}

export async function submitClinicPayment2876Form(
  accessToken: string,
  payload: ClinicPayment2876Request,
) {
  return apiRequest<ClinicPayment2876Response, ClinicPayment2876Request>({
    endpoint: API_ENDPOINTS.clinicMePaymentHlth2876,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicPhysicianChangeInformationForm(accessToken: string) {
  return apiRequest<ClinicPhysicianChangeInformationResponse>({
    endpoint: API_ENDPOINTS.clinicMePhysicianChangeInformation,
    headers: authHeaders(accessToken),
  });
}

export async function submitClinicPhysicianChangeInformationForm(
  accessToken: string,
  payload: ClinicPhysicianChangeInformationRequest,
) {
  return apiRequest<
    ClinicPhysicianChangeInformationResponse,
    ClinicPhysicianChangeInformationRequest
  >({
    endpoint: API_ENDPOINTS.clinicMePhysicianChangeInformation,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicExcellerisAcceptableUseForm(accessToken: string) {
  return apiRequest<ClinicExcellerisResponse>({
    endpoint: "/api/v1/clinics/me/report-delivery-forms/excelleris-acceptable-use",
    headers: authHeaders(accessToken),
  });
}

export async function submitClinicExcellerisAcceptableUseForm(
  accessToken: string,
  payload: ClinicExcellerisRequest,
) {
  return apiRequest<ClinicExcellerisResponse, ClinicExcellerisRequest>({
    endpoint: "/api/v1/clinics/me/report-delivery-forms/excelleris-acceptable-use",
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}

export async function fetchClinicHl7HealthCareProviderSetupForm(accessToken: string) {
  return apiRequest<ClinicHl7HealthCareProviderSetupResponse>({
    endpoint: API_ENDPOINTS.clinicMeReportDeliveryHl7HealthCareProviderSetup,
    headers: authHeaders(accessToken),
  });
}

export async function submitClinicHl7HealthCareProviderSetupForm(
  accessToken: string,
  payload: ClinicHl7HealthCareProviderSetupRequest,
) {
  return apiRequest<
    ClinicHl7HealthCareProviderSetupResponse,
    ClinicHl7HealthCareProviderSetupRequest
  >({
    endpoint: API_ENDPOINTS.clinicMeReportDeliveryHl7HealthCareProviderSetup,
    method: "POST",
    body: payload,
    headers: authHeaders(accessToken),
  });
}
