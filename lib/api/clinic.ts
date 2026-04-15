import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";
import { buildClinicRegisterPayload } from "@/lib/clinic/onboarding";
import { buildClinicLoginPayload } from "@/lib/clinic/login";
import type {
  ClinicLoginFormData,
  ClinicLoginResponse,
  ClinicOnboardingFormData,
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

export async function submitClinicLogin(
  formData: ClinicLoginFormData,
): Promise<ClinicLoginResponse> {
  const loginPayload = buildClinicLoginPayload(formData);

  return apiRequest<ClinicLoginResponse, typeof loginPayload>({
    endpoint: API_ENDPOINTS.clinicLogin,
    method: "POST",
    body: loginPayload,
  });
}
