import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";

export type DoctorHlth2870Signature = {
  signature_data_url: string;
  signature_label: string;
};

export type DoctorHlth2870Request = {
  msp_billing_number: string;
  principal_practitioner_name: string;
  principal_practitioner_number: string;
  effective_date: string;
  cancel_date: string;
  signature: DoctorHlth2870Signature;
};

export type DoctorHlth2870Response = {
  packet_id: number;
  doctor_id: number;
  clinic_id: number;
  clinic_slug: string;
  form_code: string;
  payment_direction: string;
  status: string;
  generated_at: string;
  missing_fields: string[];
  field_values: Record<string, string>;
  download_url: string;
};

export type DoctorHlth2950Signature = DoctorHlth2870Signature;

export type DoctorHlth2950Declaration = {
  id: string;
  summary_text: string;
  full_text: string;
};

export type DoctorHlth2950UiContent = {
  part_c: {
    title: string;
    summary: string;
    consent_label: string;
    consent_required: boolean;
    declarations: DoctorHlth2950Declaration[];
  };
};

export type DoctorHlth2950SavedValues = {
  attachment_action: DoctorHlth2950Request["attachment_action"] | null;
  msp_practitioner_number: string | null;
  facility_or_practice_name: string | null;
  msp_facility_number: string | null;
  facility_physical_address: string | null;
  facility_physical_city: string | null;
  facility_physical_postal_code: string | null;
  contact_email: string | null;
  contact_phone_number: string | null;
  contact_fax_number: string | null;
  new_attachment_effective_date: string | null;
  new_attachment_cancellation_date: string | null;
  attachment_cancellation_date: string | null;
  change_attachment_effective_date: string | null;
  change_attachment_cancellation_date: string | null;
  confirm_declarations: boolean;
  signature: {
    signature_data_url: string | null;
    signature_label: string | null;
  };
};

export type DoctorHlth2950Request = {
  attachment_action: "ADD" | "CANCEL" | "CHANGE";
  msp_practitioner_number: string;
  facility_or_practice_name: string;
  msp_facility_number: string;
  facility_physical_address: string;
  facility_physical_city: string;
  facility_physical_postal_code: string;
  contact_email: string;
  contact_phone_number: string;
  contact_fax_number: string;
  new_attachment_effective_date: string;
  new_attachment_cancellation_date: string;
  attachment_cancellation_date?: string;
  change_attachment_effective_date?: string;
  change_attachment_cancellation_date?: string;
  confirm_declarations: boolean;
  signature: DoctorHlth2950Signature;
};

export type DoctorHlth2950Response = DoctorHlth2870Response;

export type DoctorHlth2950GetResponse = DoctorHlth2950Response & {
  saved_values: DoctorHlth2950SavedValues;
  ui_content: DoctorHlth2950UiContent;
};

export type DoctorHlth2832Signature = DoctorHlth2870Signature;

export type DoctorHlth2832Request = {
  msp_billing_number: string;
  payment_number: string;
  payee_name: string;
  institution_number: string;
  branch_number: string;
  account_number: string;
  institution_bank_name: string;
  branch_name: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  telephone: string;
  telephone2: string;
  signature: DoctorHlth2832Signature;
};

export type DoctorHlth2832Response = DoctorHlth2870Response & {
  signature_captured: boolean;
  signature_signed_at: string;
  signature_label: string;
  signature_data_url: string;
};

export type DoctorHlth2832SavedValues = {
  msp_billing_number: string | null;
  payment_number: string | null;
  payee_name: string | null;
  institution_number: string | null;
  branch_number: string | null;
  account_number: string | null;
  institution_bank_name: string | null;
  branch_name: string | null;
  street_address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  telephone: string | null;
  telephone2: string | null;
  signature: {
    signature_data_url: string | null;
    signature_label: string | null;
  };
};

export type DoctorHlth2832GetResponse = DoctorHlth2832Response & {
  saved_values: DoctorHlth2832SavedValues;
  ui_content: null;
};

export type DoctorHlth2820Signature = DoctorHlth2870Signature;

export type DoctorHlth2820Request = {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone_number: string;
  organization_name: string;
  contact_person: string;
  facility_type: "HOSPITAL" | "PRACTITIONER" | "SERVICE_BUREAU" | "VENDOR" | "CLINIC";
  teleplan_mode: "NEW_DATA_CENTRE" | "EXISTING_DATA_CENTRE" | "SERVICE_BUREAU";
  new_data_centre_name: string | null;
  new_data_centre_contact: string | null;
  existing_data_centre_name: string | null;
  existing_data_centre_number: string | null;
  service_bureau_name: string | null;
  service_bureau_number: string | null;
  computer_make_model: string;
  computer_make_model2: string;
  modem_make_model: string;
  modem: string;
  modem_type: string;
  modem_speed: string;
  software_name: string;
  vendor_name: string;
  supplier: string;
  msp_payee_number: string;
  signature: DoctorHlth2820Signature;
};

export type DoctorHlth2820Response = {
  packet_id: number;
  doctor_id: number;
  clinic_id: number;
  clinic_slug: string;
  form_code: string;
  payment_direction: string;
  status: string;
  generated_at: string;
  signature_captured: boolean;
  signature_signed_at: string;
  signature_label: string;
  signature_data_url: string;
  missing_fields: string[];
  field_values: Record<string, string | boolean | null>;
  download_url: string;
};

export type DoctorHlth2820SavedValues = {
  name: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone_number: string | null;
  organization_name: string | null;
  contact_person: string | null;
  msp_payee_number: string | null;
  facility_type: DoctorHlth2820Request["facility_type"] | null;
  teleplan_mode: DoctorHlth2820Request["teleplan_mode"] | null;
  new_data_centre_name: string | null;
  new_data_centre_contact: string | null;
  existing_data_centre_name: string | null;
  existing_data_centre_number: string | null;
  service_bureau_name: string | null;
  service_bureau_number: string | null;
  computer_make_model: string | null;
  computer_make_model2: string | null;
  modem_make_model: string | null;
  modem_type: string | null;
  modem_speed: string | null;
  software_name: string | null;
  vendor_name: string | null;
  supplier: string | null;
  signature: {
    signature_data_url: string | null;
    signature_label: string | null;
  };
};

export type DoctorHlth2820GetResponse = DoctorHlth2820Response & {
  saved_values: DoctorHlth2820SavedValues;
  ui_content: null;
};

export type DoctorHlth2991Signature = DoctorHlth2870Signature;

export type DoctorHlth2991Declaration = {
  id: string;
  summary_text: string;
  full_text: string;
};

export type DoctorHlth2991UiContent = {
  part_4: {
    title: string;
    summary: string;
    consent_label: string;
    consent_required: boolean;
    declarations: DoctorHlth2991Declaration[];
  };
};

export type DoctorHlth2991SavedValues = {
  surname: string | null;
  given_name: string | null;
  given_name_second: string | null;
  date_of_birth: string | null;
  gender: DoctorHlth2991Request["gender"] | null;
  citizenship: string | null;
  status_in_canada: string | null;
  home_mailing_address: string | null;
  home_city: string | null;
  home_postal_code: string | null;
  home_phone_number: string | null;
  home_fax_number: string | null;
  home_email_address: string | null;
  business_mailing_address: string | null;
  business_city: string | null;
  business_postal_code: string | null;
  business_phone_number: string | null;
  business_fax_number: string | null;
  business_email_address: string | null;
  medical_school: string | null;
  date_of_graduation: string | null;
  royal_college_specialty: string | null;
  royal_college_subspecialty: string | null;
  non_royal_college_specialty: string | null;
  non_royal_college_subspecialty: string | null;
  certification_date_1: string | null;
  certification_date_2: string | null;
  certification_date_3: string | null;
  certification_date_4: string | null;
  date_of_registration: string | null;
  college_id: string | null;
  registrations: string | null;
  license_type: DoctorHlth2991Request["license_type"] | null;
  license_effective_date: string | null;
  msp_effective_date: string | null;
  cancellation_date: string | null;
  confirm_declarations: boolean;
  signature: DoctorHlth2991Signature;
};

export type DoctorHlth2991Request = {
  surname: string;
  given_name: string;
  given_name_second: string;
  date_of_birth: string;
  gender: "FEMALE" | "MALE" | "OTHER";
  citizenship: string;
  status_in_canada: string | null;
  home_mailing_address: string;
  home_city: string;
  home_postal_code: string;
  home_phone_number: string;
  home_fax_number: string;
  home_email_address: string;
  business_mailing_address: string;
  business_city: string;
  business_postal_code: string;
  business_phone_number: string;
  business_fax_number: string;
  business_email_address: string;
  medical_school: string;
  date_of_graduation: string;
  royal_college_specialty: string;
  royal_college_subspecialty: string;
  non_royal_college_specialty: string;
  non_royal_college_subspecialty: string;
  certification_date_1: string;
  certification_date_2: string | null;
  certification_date_3: string | null;
  certification_date_4: string | null;
  date_of_registration: string;
  college_id: string;
  registrations: string;
  license_type: "FULL" | "TEMPORARY" | "EDUCATION";
  license_effective_date: string | null;
  msp_effective_date: string;
  cancellation_date: string;
  confirm_declarations: boolean;
  signature: DoctorHlth2991Signature;
};

export type DoctorHlth2991Response = DoctorHlth2820Response;

export type DoctorHlth2991GetResponse = DoctorHlth2991Response & {
  saved_values: DoctorHlth2991SavedValues;
  ui_content: DoctorHlth2991UiContent;
};

export async function submitDoctorHlth2870Onboarding(
  accessToken: string,
  payload: DoctorHlth2870Request,
) {
  return apiRequest<DoctorHlth2870Response, DoctorHlth2870Request>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingHlth2870,
    method: "POST",
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function submitDoctorHlth2950Onboarding(
  accessToken: string,
  payload: DoctorHlth2950Request,
) {
  return apiRequest<DoctorHlth2950Response, DoctorHlth2950Request>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingHlth2950,
    method: "POST",
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function fetchDoctorHlth2950Onboarding(
  accessToken: string,
) {
  return apiRequest<DoctorHlth2950GetResponse>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingHlth2950,
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function submitDoctorHlth2832Onboarding(
  accessToken: string,
  payload: DoctorHlth2832Request,
) {
  return apiRequest<DoctorHlth2832Response, DoctorHlth2832Request>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingHlth2832,
    method: "POST",
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function fetchDoctorHlth2832Onboarding(accessToken: string) {
  return apiRequest<DoctorHlth2832GetResponse>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingHlth2832,
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function submitDoctorHlth2820Onboarding(
  accessToken: string,
  payload: DoctorHlth2820Request,
) {
  return apiRequest<DoctorHlth2820Response, DoctorHlth2820Request>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingTeleplanHlth2820,
    method: "POST",
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function fetchDoctorHlth2820Onboarding(accessToken: string) {
  return apiRequest<DoctorHlth2820GetResponse>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingTeleplanHlth2820,
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function submitDoctorHlth2991Onboarding(
  accessToken: string,
  payload: DoctorHlth2991Request,
) {
  return apiRequest<DoctorHlth2991Response, DoctorHlth2991Request>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingEnrolmentHlth2991,
    method: "POST",
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function fetchDoctorHlth2991Onboarding(
  accessToken: string,
) {
  return apiRequest<DoctorHlth2991GetResponse>({
    endpoint: API_ENDPOINTS.doctorMeOnboardingEnrolmentHlth2991,
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
