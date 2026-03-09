/**
 * AddressInput — Autocomplete address field with geocoding
 *
 * Uses OSM Nominatim to suggest addresses as the user types.
 * When a suggestion is selected the lat/lng are passed back via onSelect.
 * The lat/lng coordinate fields are shown read-only for transparency.
 */

import { useRef, useState, useEffect } from "react";
import {
  useAddressGeocode,
  type GeocodeSuggestion,
} from "@/hooks/useAddressGeocode";
import { Loader2, MapPin } from "lucide-react";

interface AddressInputProps {
  label: string;
  iconColor?: string;
  value: string;
  lat: string;
  lng: string;
  onSelect: (address: string, lat: string, lng: string) => void;
  onChange: (address: string) => void;
  placeholder?: string;
}

export function AddressInput({
  label,
  iconColor = "text-blue-500",
  value,
  lat,
  lng,
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
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-gray-800 text-sm text-foreground outline-none focus:border-primary pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 border-gray-100 dark:border-gray-700/50 transition-colors"
              >
                <span className="line-clamp-2">{s.displayName}</span>
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Read-only coordinates — shown after selection */}
      {(lat || lng) && (
        <div className="flex gap-3">
          <div className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-xs text-muted-foreground font-mono">
            Lat: {lat}
          </div>
          <div className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-xs text-muted-foreground font-mono">
            Lng: {lng}
          </div>
        </div>
      )}
    </div>
  );
}
