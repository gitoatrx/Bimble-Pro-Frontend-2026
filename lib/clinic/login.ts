import type { ClinicLoginFormData, ClinicLoginRequest } from "@/lib/clinic/types";

export function buildClinicLoginPayload(
  formData: ClinicLoginFormData,
): ClinicLoginRequest {
  return {
    clinic_slug: formData.clinicSlug.trim().toLowerCase(),
    username: formData.username.trim(),
    password: formData.password,
  };
}
