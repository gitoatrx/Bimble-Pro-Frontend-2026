type ReverseGeocodeResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    county?: string;
    state?: string;
    region?: string;
    country_code?: string;
  };
  display_name?: string;
};

function compactLocation(payload: ReverseGeocodeResponse): string | null {
  const city =
    payload.address?.city ??
    payload.address?.town ??
    payload.address?.village ??
    payload.address?.hamlet ??
    payload.address?.county ??
    null;
  const region =
    payload.address?.state ??
    payload.address?.region ??
    payload.address?.country_code?.toUpperCase() ??
    null;

  const compact = [city, region].filter(Boolean).join(", ").trim();
  if (compact) {
    return compact;
  }

  if (payload.display_name?.trim()) {
    return payload.display_name
      .split(",")
      .slice(0, 2)
      .join(",")
      .trim();
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return Response.json(
      { message: "lat and lng are required." },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
    {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "BimbleFrontend/1.0",
      },
      next: { revalidate: 0 },
    },
  );

  if (!upstream.ok) {
    return Response.json(
      { message: "Reverse geocoding failed." },
      { status: upstream.status },
    );
  }

  const payload = (await upstream.json()) as ReverseGeocodeResponse;
  return Response.json({
    location: compactLocation(payload),
    display_name: payload.display_name ?? null,
  });
}
