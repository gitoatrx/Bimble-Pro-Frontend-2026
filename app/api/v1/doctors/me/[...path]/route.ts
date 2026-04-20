import { proxyDoctorBackendRequest } from "@/lib/api/doctor-proxy";

async function proxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const params = await context.params;
  const suffix = params.path?.length ? `/${params.path.join("/")}` : "";

  return proxyDoctorBackendRequest(request, `/doctors/me${suffix}`);
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
