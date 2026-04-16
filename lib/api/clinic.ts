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
  return apiRequest<ClinicLoginResponse, ClinicOtpVerifyRequest>({
    endpoint: API_ENDPOINTS.clinicVerifyOtp,
    method: "POST",
    body: payload,
  });
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
