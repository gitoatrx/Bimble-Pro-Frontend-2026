import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";
import { buildClinicRegisterPayload } from "@/lib/clinic/onboarding";
import { buildClinicLoginPayload } from "@/lib/clinic/login";
import type {
  ClinicCredentials,
  ClinicLoginResponse,
  ClinicOnboardingFormData,
  ClinicRegisterRequest,
  ClinicRegisterResponse,
} from "@/lib/clinic/types";

export async function submitClinicOnboarding(
  payload: ClinicOnboardingFormData,
) {
  const registerPayload = buildClinicRegisterPayload(payload);
  const response = await apiRequest<
    ClinicRegisterResponse,
    ClinicRegisterRequest
  >({
    endpoint: API_ENDPOINTS.clinicOnboarding,
    method: "POST",
    body: registerPayload,
  });

  return {
    clinicName: response.clinic_name,
    username: response.username,
    password: response.password,
    pin: response.pin,
    internalClinicCode: response.internal_clinic_code,
  } satisfies ClinicCredentials;
}

type ClinicLoginApiResponse = {
  clinic_name: string;
  username: string;
  app_url: string;
  bootstrap_url: string;
  message: string;
};

export async function submitClinicLogin(credentials: ClinicCredentials) {
  const loginPayload = buildClinicLoginPayload(credentials);
  const response = await apiRequest<ClinicLoginApiResponse, typeof loginPayload>(
    {
      endpoint: API_ENDPOINTS.clinicLogin,
      method: "POST",
      body: loginPayload,
    },
  );

  return {
    clinicName: response.clinic_name,
    username: response.username,
    appUrl: response.app_url,
    bootstrapUrl: response.bootstrap_url,
    message: response.message,
  } satisfies ClinicLoginResponse;
}
