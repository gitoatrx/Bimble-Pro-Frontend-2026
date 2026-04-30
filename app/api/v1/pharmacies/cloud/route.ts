const CLOUD_PHARMACY_API_URL = "https://cloud.oatrx.ca/api/fetch-all-pharmacies";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const long = searchParams.get("long") ?? searchParams.get("lng");

  if (!lat || !long) {
    return Response.json(
      { message: "lat and long are required." },
      { status: 400 },
    );
  }

  const upstreamUrl = new URL(CLOUD_PHARMACY_API_URL);
  upstreamUrl.searchParams.set("lat", lat);
  upstreamUrl.searchParams.set("long", long);

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
