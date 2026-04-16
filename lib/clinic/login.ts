import type { ClinicLoginFormData, ClinicLoginRequest } from "@/lib/clinic/types";

export function buildClinicLoginPayload(
  formData: ClinicLoginFormData,
): ClinicLoginRequest {
  return {
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
  };
}
