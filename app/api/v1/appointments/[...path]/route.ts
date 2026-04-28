import { proxyPatientBackendRequest } from "@/lib/api/patient-proxy";

async function proxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const params = await context.params;
  const suffix = params.path?.length ? `/${params.path.join("/")}` : "";

  return proxyPatientBackendRequest(request, `/appointments${suffix}`);
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
