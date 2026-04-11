import { useRef, useCallback, useEffect } from "react";
import {
  MapPin,
  MapPinCheckInside,
  MapPinHouse,
  MapPinMinusInside,
  MapPinPlusInside,
  MapPinXInside,
} from "lucide-react";
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

        let PinIcon = MapPin;
        if (type === "pickup") {
          PinIcon = MapPinPlusInside;
        } else if (type === "delivery") {
          PinIcon = MapPinCheckInside;
        } else if (type === "driver") {
          if (marker.status === "offline") {
            PinIcon = MapPinXInside;
          } else if (marker.status === "busy") {
            PinIcon = MapPinMinusInside;
          } else {
            PinIcon = MapPin;
          }
        } else {
          if (marker.status === "offline") {
            PinIcon = MapPinXInside;
          } else if (marker.status === "busy") {
            PinIcon = MapPinMinusInside;
          } else if (marker.status === "available") {
            PinIcon = MapPinHouse;
          } else {
            PinIcon = MapPin;
          }
        }

        return (
          <Marker
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="bottom"
            onClick={() => handleMarkerClick(marker)}
          >
            <div
              className="relative cursor-pointer transition-transform hover:scale-110"
              title={marker.label}
            >
              {marker.status === "available" && (
                <span
                  className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: color }}
                />
              )}
              <PinIcon
                className="h-8 w-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.28)]"
                style={{ color }}
                strokeWidth={2.2}
              />
            </div>
          </Marker>
        );
      })}

        {children}
      </Map>
    </div>
  );
}
