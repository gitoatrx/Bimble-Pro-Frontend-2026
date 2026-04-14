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

export async function submitClinicOnboarding(
  payload: ClinicOnboardingFormData,
  planCode: string,
): Promise<ClinicSignupResult> {
  const registerPayload = buildClinicRegisterPayload(payload, planCode);

  const response = await apiRequest<ClinicRegisterResponse, ClinicRegisterRequest>({
    endpoint: API_ENDPOINTS.clinicOnboarding,
    method: "POST",
    body: registerPayload,
  });

  return {
    clinicId: response.clinic_id,
    clinicCode: response.clinic_code,
    slug: response.slug,
    stripeCheckoutUrl: response.stripe_checkout_url,
    message: response.message,
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
