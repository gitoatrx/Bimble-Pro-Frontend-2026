import type { ClinicAddressSelection } from "@/lib/clinic/types";
import { provinceOptions } from "@/lib/clinic/onboarding";

type AddressComponent = {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types?: string[];
};

export type GooglePlaceDetails = {
  address_components?: AddressComponent[];
  addressComponents?: AddressComponent[];
  formatted_address?: string;
  formattedAddress?: string;
  displayName?: string;
  name?: string;
};

export type GooglePlacePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

export type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: {
      input: string;
      componentRestrictions?: { country: string };
      types?: string[];
    },
    callback: (
      predictions: GooglePlacePrediction[] | null,
      status: string,
    ) => void,
  ) => void;
};

export type GooglePlacesService = {
  getDetails: (
    request: { placeId: string; fields: string[] },
    callback: (place: GooglePlaceDetails | null, status: string) => void,
  ) => void;
};

export type GoogleMapsPlacesNamespace = {
  AutocompleteService: new () => GoogleAutocompleteService;
  PlacesService?: new (element: HTMLDivElement) => GooglePlacesService;
};

export type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      places?: GoogleMapsPlacesNamespace;
    };
  };
};

let googleMapsPlacesLoader: Promise<GoogleMapsPlacesNamespace> | null = null;

function getAddressComponent(
  components: AddressComponent[],
  type: string,
  useShortName = false,
) {
  const component = components.find((entry) => entry.types?.includes(type));

  if (!component) {
    return undefined;
  }

  if (useShortName) {
    return (
      component.short_name ??
      component.shortText ??
      component.long_name ??
      component.longText
    );
  }

  return (
    component.long_name ??
    component.longText ??
    component.short_name ??
    component.shortText
  );
}

const provinceShortNameMap: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NT: "Northwest Territories",
  NS: "Nova Scotia",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

export function parseClinicAddressSelection(
  place: GooglePlaceDetails,
): ClinicAddressSelection | null {
  const components = place.addressComponents ?? place.address_components ?? [];
  const streetNumber = getAddressComponent(components, "street_number");
  const route = getAddressComponent(components, "route");
  const subpremise = getAddressComponent(components, "subpremise");

  const addressParts = [subpremise ? `Unit ${subpremise}` : "", streetNumber, route]
    .filter(Boolean)
    .join(" ")
    .trim();

  const city =
    getAddressComponent(components, "locality") ??
    getAddressComponent(components, "postal_town") ??
    getAddressComponent(components, "sublocality_level_1") ??
    getAddressComponent(components, "sublocality") ??
    getAddressComponent(components, "administrative_area_level_2") ??
    "";

  const provinceLong = getAddressComponent(
    components,
    "administrative_area_level_1",
  );
  const provinceShort = getAddressComponent(
    components,
    "administrative_area_level_1",
    true,
  );
  const province =
    (provinceLong && provinceOptions.includes(provinceLong)
      ? provinceLong
      : provinceShort
        ? provinceShortNameMap[provinceShort.toUpperCase()]
        : undefined) ?? provinceLong ?? "";
  const postalCode = getAddressComponent(components, "postal_code") ?? "";

  if (!addressParts && !city && !province && !postalCode) {
    return null;
  }

  return {
    address:
      addressParts ||
      place.formattedAddress ||
      place.formatted_address ||
      place.displayName ||
      place.name ||
      "",
    city,
    province,
    postalCode,
  };
}

export function parseClinicAddressPrediction(
  prediction: GooglePlacePrediction,
): ClinicAddressSelection | null {
  const address = prediction.description.replace(/,\s*Canada\s*$/i, "").trim();
  const descriptionParts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const secondaryText = prediction.structured_formatting?.secondary_text
    ?.replace(/,\s*Canada\s*$/i, "")
    .trim();
  const secondaryParts = secondaryText
    ? secondaryText.split(",").map((part) => part.trim()).filter(Boolean)
    : [];
  const locationParts = secondaryParts.length > 0 ? secondaryParts : descriptionParts.slice(1);
  const city = locationParts[0] ?? "";
  const provincePostalCandidate = locationParts[1] ?? descriptionParts[2] ?? "";
  const provinceMatch = provincePostalCandidate.match(
    /\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/i,
  );
  const postalMatch = provincePostalCandidate.match(
    /\b([A-Z]\d[A-Z])\s?([A-Z]\d[A-Z])\b/i,
  );

  return address
    ? {
        address,
        city,
        province:
          provinceMatch && provinceShortNameMap[provinceMatch[1].toUpperCase()]
            ? provinceShortNameMap[provinceMatch[1].toUpperCase()]
            : provinceMatch?.[1].toUpperCase() ?? "",
        postalCode: postalMatch
          ? `${postalMatch[1].toUpperCase()} ${postalMatch[2].toUpperCase()}`
          : "",
      }
    : null;
}

function getGoogleMapsPlacesNamespace() {
  if (typeof window === "undefined") {
    return null;
  }

  const windowWithGoogle = window as GoogleMapsWindow;
  return windowWithGoogle.google?.maps?.places ?? null;
}

function waitForGooglePlacesNamespace(
  timeoutMs = 10000,
): Promise<GoogleMapsPlacesNamespace> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    function checkNamespace() {
      const placesNamespace = getGoogleMapsPlacesNamespace();

      if (placesNamespace?.AutocompleteService) {
        resolve(placesNamespace);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Google Maps Places did not finish loading."));
        return;
      }

      window.setTimeout(checkNamespace, 50);
    }

    checkNamespace();
  });
}

export function loadGoogleMapsPlaces(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  const existingNamespace = getGoogleMapsPlacesNamespace();

  if (existingNamespace?.AutocompleteService) {
    return Promise.resolve(existingNamespace);
  }

  if (googleMapsPlacesLoader) {
    return googleMapsPlacesLoader;
  }

  googleMapsPlacesLoader = new Promise((resolve, reject) => {
    const scriptId = "google-maps-places-script";
    const existingScript = document.getElementById(
      scriptId,
    ) as HTMLScriptElement | null;

    const finish = () => {
      void waitForGooglePlacesNamespace()
        .then((namespace) => {
          googleMapsPlacesLoader = null;
          resolve(namespace);
        })
        .catch((error) => {
          googleMapsPlacesLoader = null;
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;
      script.onerror = () => {
        googleMapsPlacesLoader = null;
        reject(new Error("Failed to load Google Maps Places."));
      };
      script.onload = () => {
        finish();
      };
      document.head.appendChild(script);
      return;
    }

    if (existingScript.src.includes("maps.googleapis.com/maps/api/js")) {
      finish();
      return;
    }

    existingScript.addEventListener("load", finish, { once: true });
    existingScript.addEventListener(
      "error",
      () => {
        googleMapsPlacesLoader = null;
        reject(new Error("Failed to load Google Maps Places."));
      },
      { once: true },
    );
  });

  return googleMapsPlacesLoader;
}
