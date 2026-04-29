import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";
import { buildClinicRegisterPayload } from "@/lib/clinic/onboarding";
import { buildClinicLoginPayload } from "@/lib/clinic/login";
import type {
  ClinicLoginFormData,
  ClinicLoginResponse,
  ClinicLoginStep1Response,
  ClinicOnboardingFormData,
  ClinicOtpResendRequest,
  ClinicOtpVerifyRequest,
  ClinicRegisterRequest,
  ClinicRegisterResponse,
  ClinicSignupResult,
} from "@/lib/clinic/types";

function pickStringValue(
  source: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function normalizeClinicLoginResponse(
  response: Record<string, unknown>,
): ClinicLoginResponse {
  return {
    access_token: pickStringValue(response, ["access_token", "accessToken"]) ?? "",
    token_type: pickStringValue(response, ["token_type", "tokenType"]) ?? "bearer",
    clinic_slug: pickStringValue(response, ["clinic_slug", "clinicSlug"]) ?? "",
    clinic_name: pickStringValue(response, ["clinic_name", "clinicName"]) ?? "",
    username: pickStringValue(response, ["username", "user_name", "userName"]) ?? "",
    temp_password: pickStringValue(response, ["temp_password", "tempPassword"]) ?? null,
    temp_pin: pickStringValue(response, ["temp_pin", "tempPin"]) ?? null,
    dashboard_url: pickStringValue(response, ["dashboard_url", "dashboardUrl"]) ?? "",
    app_url: pickStringValue(response, ["app_url", "appUrl"]) ?? "",
    bootstrap_url: pickStringValue(response, ["bootstrap_url", "bootstrapUrl"]) ?? "",
    emr_launch_url: pickStringValue(response, ["emr_launch_url", "emrLaunchUrl"]) ?? "",
    message: pickStringValue(response, ["message"]) ?? "",
  };
}

export async function submitClinicOnboarding(
  payload: ClinicOnboardingFormData,
  planCode: string,
): Promise<ClinicSignupResult> {
  const registerPayload = buildClinicRegisterPayload(payload, planCode);

  const response = await apiRequest<ClinicRegisterResponse, ClinicRegisterRequest>({
    endpoint: API_ENDPOINTS.clinicSignup,
    method: "POST",
    body: registerPayload,
  });

  const responseRecord = response as Record<string, unknown>;

  return {
    clinicId: response.clinic_id,
    clinicCode: response.clinic_code,
    slug: response.slug,
    stripeCheckoutUrl: response.stripe_checkout_url,
    message: response.message,
    clinicName: pickStringValue(responseRecord, [
      "clinic_name",
      "clinicName",
      "slug",
      "clinic_code",
    ]),
    username: pickStringValue(responseRecord, [
      "username",
      "clinic_username",
      "user_name",
      "login_username",
    ]),
    password: pickStringValue(responseRecord, [
      "password",
      "temp_password",
      "temporary_password",
      "clinic_password",
      "login_password",
    ]),
    pin: pickStringValue(responseRecord, [
      "pin",
      "temp_pin",
      "clinic_pin",
      "temporary_pin",
    ]),
    appUrl: pickStringValue(responseRecord, ["app_url", "appUrl"]),
    bootstrapUrl: pickStringValue(responseRecord, ["bootstrap_url", "bootstrapUrl"]),
    emrLaunchUrl: pickStringValue(responseRecord, ["emr_launch_url", "emrLaunchUrl"]),
  };
}

/**
 * Step 1 — Submit email + password.
 * On success the backend sends a 6-digit OTP to the admin's email and
 * returns an otp_token (UUID) that identifies this login attempt.
 */
export async function submitClinicLogin(
  formData: ClinicLoginFormData,
): Promise<ClinicLoginStep1Response> {
  const loginPayload = buildClinicLoginPayload(formData);

  return apiRequest<ClinicLoginStep1Response, typeof loginPayload>({
    endpoint: API_ENDPOINTS.clinicLogin,
    method: "POST",
    body: loginPayload,
  });
}

/**
 * Step 2 — Submit the otp_token + 6-digit code the user received by email.
 * On success returns a full session (JWT + bootstrap URL).
 */
export async function submitClinicVerifyOtp(
  payload: ClinicOtpVerifyRequest,
): Promise<ClinicLoginResponse> {
  const response = await apiRequest<Record<string, unknown>, ClinicOtpVerifyRequest>({
    endpoint: API_ENDPOINTS.clinicVerifyOtp,
    method: "POST",
    body: payload,
  });

  return normalizeClinicLoginResponse(response);
}

/**
 * Resend — invalidates the previous OTP and sends a fresh code to the same email.
 * Returns a new ClinicLoginStep1Response with a new otp_token.
 */
export async function submitClinicResendOtp(
  payload: ClinicOtpResendRequest,
): Promise<ClinicLoginStep1Response> {
  return apiRequest<ClinicLoginStep1Response, ClinicOtpResendRequest>({
    endpoint: API_ENDPOINTS.clinicResendOtp,
    method: "POST",
    body: payload,
  });
}

export type DoctorInviteRecord = {
  invite_id: number;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "REVOKED";
  sent_at: string;
  accepted_at: string | null;
};

export type ClinicDoctorInvite2870Draft = {
  locum_name?: string;
  locum_practitioner_number?: string;
  msp_billing_number?: string;
  principal_practitioner_name?: string;
  principal_practitioner_number?: string;
  principal_practitioner_payment_number?: string;
  effective_date?: string;
  cancel_date?: string;
  date_signed?: string;
  pay_signature_data_url?: string;
  pay_signature_label?: string;
};

export type ClinicDoctorInvite2950Draft = {
  attachment_action?: "ADD" | "CANCEL" | "CHANGE";
  msp_practitioner_number?: string;
  facility_or_practice_name?: string;
  msp_facility_number?: string;
  facility_physical_address?: string;
  facility_physical_city?: string;
  facility_physical_postal_code?: string;
  contact_email?: string;
  contact_phone_number?: string;
  contact_fax_number?: string;
  new_attachment_effective_date?: string;
  new_attachment_cancellation_date?: string;
  attachment_cancellation_date?: string;
  change_attachment_effective_date?: string;
  change_attachment_cancellation_date?: string;
  confirm_declarations?: boolean;
};

export type ClinicDoctorInviteFormDrafts = {
  HLTH_2870?: ClinicDoctorInvite2870Draft;
  HLTH_2950?: ClinicDoctorInvite2950Draft;
};

/**
 * Fetch all doctor invites for the current clinic.
 */
export async function fetchDoctorInvites(
  accessToken: string,
): Promise<DoctorInviteRecord[]> {
  return apiRequest<DoctorInviteRecord[], never>({
    endpoint: API_ENDPOINTS.clinicDoctorInvites,
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Invite a doctor by email.
 * Calls the Next.js proxy route which decodes clinic_id from the JWT and
 * forwards the request to POST /api/v1/clinics/{clinic_id}/doctors/invite.
 */
export async function inviteDoctor(
  email: string,
  accessToken: string,
  formDrafts?: ClinicDoctorInviteFormDrafts,
): Promise<void> {
  await apiRequest<unknown, { email: string; form_drafts?: ClinicDoctorInviteFormDrafts }>({
    endpoint: API_ENDPOINTS.clinicDoctorInvite,
    method: "POST",
    body: { email, ...(formDrafts ? { form_drafts: formDrafts } : {}) },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
