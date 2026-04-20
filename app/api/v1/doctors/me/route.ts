import { proxyDoctorBackendRequest } from "@/lib/api/doctor-proxy";

export async function GET(request: Request) {
  return proxyDoctorBackendRequest(request, "/doctors/me");
}
