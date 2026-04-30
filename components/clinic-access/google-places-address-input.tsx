"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  loadGoogleMapsPlaces,
  parseClinicAddressPrediction,
  parseClinicAddressSelection,
} from "@/lib/clinic/google-places";
import type {
  GoogleAutocompleteService,
  GooglePlacePrediction,
  GooglePlacesService,
} from "@/lib/clinic/google-places";
import type { ClinicAddressSelection } from "@/lib/clinic/types";
import { stripCountrySuffix } from "@/lib/form-validation";

type GooglePlacesAddressInputProps = {
  id: string;
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  hasError?: boolean;
  onChange: (value: string) => void;
  onAddressSelected: (selection: ClinicAddressSelection) => void;
};

export function GooglePlacesAddressInput({
  id,
  value,
  placeholder,
  autoFocus,
  hasError,
  onChange,
  onAddressSelected,
}: GooglePlacesAddressInputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteServiceRef = useRef<GoogleAutocompleteService | null>(null);
  const placesServiceRef = useRef<GooglePlacesService | null>(null);
  const latestChangeHandler = useRef(onChange);
  const latestSelectionHandler = useRef(onAddressSelected);
  const requestCounterRef = useRef(0);
  const skipSearchForValueRef = useRef<string | null>(null);
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [loadingState, setLoadingState] = useState<
    "idle" | "loading" | "ready" | "error"
  >(() => (apiKey ? "loading" : "error"));
  const trimmedValue = value.trim();
  const fallbackPlaceholder = placeholder ?? "Enter the full clinic address";

  useEffect(() => {
    latestChangeHandler.current = onChange;
  }, [onChange]);

  useEffect(() => {
    latestSelectionHandler.current = onAddressSelected;
  }, [onAddressSelected]);

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    let cancelled = false;

    async function initializeGoogleServices() {
      try {
        const placesNamespace = await loadGoogleMapsPlaces(apiKey);

        if (cancelled) {
          return;
        }

        autocompleteServiceRef.current = new placesNamespace.AutocompleteService();

        try {
          if (placesNamespace.PlacesService) {
            placesServiceRef.current = new placesNamespace.PlacesService(
              document.createElement("div"),
            );
          } else {
            placesServiceRef.current = null;
          }
        } catch {
          placesServiceRef.current = null;
        }

        setLoadingState("ready");
      } catch {
        if (!cancelled) {
          setLoadingState("error");
        }
      }
    }

    void initializeGoogleServices();

    return () => {
      cancelled = true;
      autocompleteServiceRef.current = null;
      placesServiceRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    if (skipSearchForValueRef.current === trimmedValue) {
      skipSearchForValueRef.current = null;
      return;
    }

    if (loadingState !== "ready" || trimmedValue.length < 3) {
      return;
    }

    const requestId = requestCounterRef.current + 1;
    requestCounterRef.current = requestId;

    const timer = window.setTimeout(() => {
      const autocompleteService = autocompleteServiceRef.current;

      if (!autocompleteService) {
        setIsLoading(false);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      autocompleteService.getPlacePredictions(
        {
          input: trimmedValue,
          componentRestrictions: { country: "ca" },
          types: ["address"],
        },
        (results, status) => {
          if (requestId !== requestCounterRef.current) {
            return;
          }

          setIsLoading(false);

          if (status !== "OK" || !results?.length) {
            setPredictions([]);
            setShowDropdown(false);
            setSelectedIndex(-1);
            return;
          }

          setPredictions(results.slice(0, 6));
          setShowDropdown(true);
          setSelectedIndex(-1);
        },
      );
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadingState, trimmedValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectPrediction(prediction: GooglePlacePrediction) {
    setShowDropdown(false);
    setSelectedIndex(-1);
    setPredictions([]);
    setIsLoading(false);

    const placesService = placesServiceRef.current;
    const selectedAddress = stripCountrySuffix(prediction.description);
    skipSearchForValueRef.current = selectedAddress;

    latestChangeHandler.current(selectedAddress);

    if (!placesService) {
      const selection = parseClinicAddressPrediction(prediction);
      latestSelectionHandler.current({
        address: selectedAddress,
        city: selection?.city ?? "",
        province: selection?.province ?? "",
        postalCode: selection?.postalCode ?? "",
      });
      return;
    }

    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address", "name"],
      },
      (place, status) => {
        if (status === "OK" && place) {
          const selection = parseClinicAddressSelection(place);
          const resolvedAddress =
            stripCountrySuffix(place.formatted_address) ||
            selection?.address ||
            stripCountrySuffix(prediction.description);

          skipSearchForValueRef.current = resolvedAddress;
          latestChangeHandler.current(resolvedAddress);
          latestSelectionHandler.current({
            address: resolvedAddress,
            city: selection?.city ?? "",
            province: selection?.province ?? "",
            postalCode: selection?.postalCode ?? "",
          });
          return;
        }

        const fallbackSelection = parseClinicAddressPrediction(prediction);
        latestSelectionHandler.current({
          address: selectedAddress,
          city: fallbackSelection?.city ?? "",
          province: fallbackSelection?.province ?? "",
          postalCode: fallbackSelection?.postalCode ?? "",
        });
      },
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || predictions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) =>
        current < predictions.length - 1 ? current + 1 : current,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => (current > 0 ? current - 1 : -1));
      return;
    }

    if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault();
      handleSelectPrediction(predictions[selectedIndex]);
      return;
    }

    if (event.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            latestChangeHandler.current(nextValue);

            if (nextValue.trim().length < 3) {
              setShowDropdown(false);
              setPredictions([]);
              setSelectedIndex(-1);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={fallbackPlaceholder}
          className={`h-12 !bg-white pl-10 pr-10 !text-slate-900 !shadow-none placeholder:text-slate-400 ${
            hasError
              ? "!border-destructive/60 focus-visible:ring-destructive/20"
              : "!border-slate-200 focus-visible:ring-primary/20"
          }`}
          aria-invalid={Boolean(hasError)}
          autoFocus={autoFocus}
          autoComplete="off"
        />
        {isLoading ? (
          <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        ) : null}
      </div>

      {loadingState === "ready" && showDropdown && predictions.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              className={`flex w-full items-start gap-3 border-l-4 px-4 py-3 text-left transition-colors ${
                index === selectedIndex
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-slate-50"
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelectPrediction(prediction)}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {prediction.structured_formatting?.main_text ??
                    prediction.description}
                </span>
                {prediction.structured_formatting?.secondary_text ? (
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {prediction.structured_formatting.secondary_text}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-right text-xs text-slate-500">
              Powered by Google
            </p>
          </div>
        </div>
      ) : null}

    </div>
  );
}
