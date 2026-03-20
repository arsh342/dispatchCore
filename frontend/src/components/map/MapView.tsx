import { useRef, useCallback, useEffect } from "react";
import Map, {
  Marker,
  NavigationControl,
  Source,
  Layer,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef } from "react-map-gl/maplibre";
import type { LngLatBoundsLike } from "maplibre-gl";

/* ── OpenFreeMap — free, no API key needed ── */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  status?: "available" | "busy" | "offline";
  markerType?: "dot" | "pickup" | "delivery" | "driver";
}

export interface MapRoute {
  id: string;
  coordinates: [number, number][];
  color?: string;
  highlighted?: boolean;
}

interface MapViewProps {
  markers?: MapMarker[];
  routes?: MapRoute[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  bounds?: [[number, number], [number, number]]; // [[sw_lng, sw_lat], [ne_lng, ne_lat]]
  className?: string;
  interactive?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  children?: React.ReactNode;
}

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  busy: "#f59e0b",
  offline: "#9ca3af",
};

export default function MapView({
  markers = [],
  routes = [],
  center = [76.78, 30.73], // Default: Punjab, India
  zoom = 11,
  bounds,
  className = "",
  interactive = true,
  onMarkerClick,
  children,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);

  // Fit map to bounds when they change
  useEffect(() => {
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds as LngLatBoundsLike, {
        padding: 60,
        maxZoom: 15,
        duration: 800,
      });
    }
  }, [bounds]);

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      onMarkerClick?.(marker);
      mapRef.current?.flyTo({
        center: [marker.lng, marker.lat],
        zoom: 14,
        duration: 800,
      });
    },
    [onMarkerClick],
  );

  return (
    <div className={`h-full w-full ${className}`.trim()}>
      <Map
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
        style={{ width: "100%", height: "100%" }}
        interactive={interactive}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

      {/* Route polylines */}
      {routes.map((route) => (
        <Source
          key={route.id}
          id={`route-${route.id}`}
          type="geojson"
          data={{
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: route.coordinates },
          }}
        >
          {/* Outer glow */}
          <Layer
            id={`route-glow-${route.id}`}
            type="line"
            paint={{
              "line-color": route.color || "#2563eb",
              "line-width": route.highlighted ? 10 : 6,
              "line-opacity": route.highlighted ? 0.25 : 0.15,
              "line-blur": route.highlighted ? 4 : 3,
            }}
          />
          {/* Main line */}
          <Layer
            id={`route-line-${route.id}`}
            type="line"
            paint={{
              "line-color": route.color || "#2563eb",
              "line-width": route.highlighted ? 3.5 : 2,
              "line-opacity": route.highlighted ? 1 : 0.45,
            }}
          />
        </Source>
      ))}

      {/* Markers */}
      {markers.map((marker) => {
        const color =
          marker.color ||
          STATUS_COLORS[marker.status || "offline"] ||
          "#2563eb";
        const type = marker.markerType || "dot";

        return (
          <Marker
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor={type === "dot" ? "center" : "bottom"}
            onClick={() => handleMarkerClick(marker)}
          >
            {type === "dot" ? (
              <div
                className="flex items-center justify-center cursor-pointer transition-transform hover:scale-125"
                title={marker.label}
              >
                {marker.status === "available" && (
                  <span
                    className="absolute size-6 rounded-full animate-ping opacity-25"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span
                  className="relative size-3.5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: color }}
                />
              </div>
            ) : type === "driver" ? (
              /* Driver location pin — truck icon inside a pin */
              <div
                className="cursor-pointer transition-transform hover:scale-110"
                title={marker.label}
              >
                <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
                  <path
                    d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z"
                    fill={color}
                  />
                  <path
                    d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z"
                    fill="black"
                    fillOpacity="0.1"
                  />
                  <circle cx="16" cy="15" r="10" fill="white" />
                  {/* Truck icon */}
                  <path
                    d="M10 13h8v4h-8zM18 14h2.5l1.5 2v1h-4zM11 17.5a1 1 0 102 0 1 1 0 00-2 0zM19 17.5a1 1 0 102 0 1 1 0 00-2 0z"
                    fill={color}
                  />
                </svg>
              </div>
            ) : (
              /* Pickup / Delivery location pin */
              <div
                className="cursor-pointer transition-transform hover:scale-110"
                title={marker.label}
              >
                <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
                  <path
                    d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z"
                    fill={color}
                  />
                  <circle cx="14" cy="13" r="8" fill="white" />
                  {type === "pickup" ? (
                    /* Up arrow for pickup */
                    <path d="M14 8l4 5h-2.5v4h-3v-4H10l4-5z" fill={color} />
                  ) : (
                    /* Down arrow for delivery */
                    <path d="M14 18l-4-5h2.5V9h3v4H18l-4 5z" fill={color} />
                  )}
                </svg>
              </div>
            )}
          </Marker>
        );
      })}

        {children}
      </Map>
    </div>
  );
}
