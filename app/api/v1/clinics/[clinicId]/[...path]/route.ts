import { proxyClinicBackendRequest } from "@/lib/api/clinic-proxy";

async function proxy(
  request: Request,
  context: { params: Promise<{ clinicId: string; path?: string[] }> },
) {
  const params = await context.params;
  const suffix = params.path?.length ? `/${params.path.join("/")}` : "";

  return proxyClinicBackendRequest(request, `/clinics/${params.clinicId}${suffix}`);
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
