import { proxyClinicBackendRequest } from "@/lib/api/clinic-proxy";

export async function GET(request: Request) {
  return proxyClinicBackendRequest(request, "/clinics/me/setup-status");
}
