type NominatimPlace = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
};

function compactLabel(place: NominatimPlace) {
  const address = place.address ?? {};
  const street = [address.house_number, address.road].filter(Boolean).join(" ").trim();
  const locality =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.suburb ??
    address.neighbourhood ??
    address.county ??
    "";
  const region = address.state ?? address.country_code?.toUpperCase() ?? "";
  const main = street || locality || place.display_name?.split(",")[0]?.trim() || "Selected location";
  const secondary = [street ? locality : "", region, address.postcode].filter(Boolean).join(", ");

  return {
    main,
    secondary,
    label: [main, secondary].filter(Boolean).join(", "),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return Response.json({ results: [] });
  }

  const upstreamUrl = new URL("https://nominatim.openstreetmap.org/search");
  upstreamUrl.searchParams.set("format", "jsonv2");
  upstreamUrl.searchParams.set("addressdetails", "1");
  upstreamUrl.searchParams.set("limit", "8");
  upstreamUrl.searchParams.set("countrycodes", "ca");
  upstreamUrl.searchParams.set("q", query);

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "BimbleFrontend/1.0",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return Response.json(
      { message: "Location search failed.", results: [] },
      { status: upstream.status },
    );
  }

  const places = (await upstream.json()) as NominatimPlace[];
  const results = places
    .map((place) => {
      const lat = place.lat ? Number(place.lat) : null;
      const lng = place.lon ? Number(place.lon) : null;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const label = compactLabel(place);
      const address = place.address ?? {};
      return {
        id: String(place.place_id ?? `${lat},${lng}`),
        label: label.label,
        main_text: label.main,
        secondary_text: label.secondary,
        display_name: place.display_name ?? label.label,
        lat,
        lng,
        city: address.city ?? address.town ?? address.village ?? address.municipality ?? "",
        province: address.state ?? "",
        postal_code: address.postcode ?? "",
      };
    })
    .filter(Boolean);

  return Response.json({ results });
}
