import { proxyClinicBackendRequest } from "@/lib/api/clinic-proxy";

export async function PATCH(request: Request) {
  return proxyClinicBackendRequest(request, "/clinics/setup/email-notifications");
}
