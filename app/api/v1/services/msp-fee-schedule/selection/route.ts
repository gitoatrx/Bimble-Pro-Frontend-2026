import { proxyClinicBackendRequest } from "@/lib/api/clinic-proxy";

export async function POST(request: Request) {
  return proxyClinicBackendRequest(request, "/services/msp-fee-schedule/selection");
}

