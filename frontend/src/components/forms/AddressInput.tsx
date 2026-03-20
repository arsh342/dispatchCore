/**
 * AddressInput — Autocomplete address field with geocoding
 *
 * Uses OSM Nominatim to suggest addresses as the user types.
 * When a suggestion is selected the lat/lng are passed back via onSelect.
 * The lat/lng values stay in state but are not shown in the UI.
 */

import { useRef, useState, useEffect } from "react";
import {
  useAddressGeocode,
  type GeocodeSuggestion,
} from "@/hooks/location/useAddressGeocode";
import { Loader2, MapPin } from "lucide-react";

interface AddressInputProps {
  label: string;
  iconColor?: string;
  value: string;
  onSelect: (address: string, lat: string, lng: string) => void;
  onChange: (address: string) => void;
  placeholder?: string;
}

export function AddressInput({
  label,
  iconColor = "text-blue-500",
  value,
  onSelect,
  onChange,
  placeholder = "Start typing an address...",
}: AddressInputProps) {
  const { query, setQuery, suggestions, setSuggestions, loading } =
    useAddressGeocode();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value → internal query (e.g. form reset)
  useEffect(() => {
    if (value !== query) setQuery(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange(text);
    setOpen(true);
  };

  const handleSelect = (s: GeocodeSuggestion) => {
    setQuery(s.displayName);
    setSuggestions([]);
    setOpen(false);
    onSelect(s.displayName, String(s.lat), String(s.lng));
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        <MapPin className={`h-3.5 w-3.5 ${iconColor}`} /> {label}
      </h3>

      {/* Address text input */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length) setOpen(true);
          }}
          className="w-full rounded-full border border-border bg-card px-4 py-2.5 pr-9 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <ul className="dc-scrollbar absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-3xl border border-border bg-card shadow-lg">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="cursor-pointer border-b border-border px-4 py-2.5 text-sm text-foreground transition-colors last:border-b-0 hover:bg-muted/70"
              >
                <span className="line-clamp-2">{s.displayName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
