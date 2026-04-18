import { proxyClinicBackendRequest } from "@/lib/api/clinic-proxy";

export async function GET(request: Request) {
  return proxyClinicBackendRequest(request, "/clinics/me/services");
}

export async function POST(request: Request) {
  return proxyClinicBackendRequest(request, "/clinics/me/services");
}
