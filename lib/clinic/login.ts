import type { ClinicCredentials, ClinicLoginRequest } from "@/lib/clinic/types";

export function buildClinicLoginPayload(
  credentials: ClinicCredentials,
): ClinicLoginRequest {
  return {
    clinic_name: credentials.clinicName.trim(),
    username: credentials.username.trim(),
    password: credentials.password,
    pin: credentials.pin.replace(/\D/g, "").slice(0, 4),
  };
}
