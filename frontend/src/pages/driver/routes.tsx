/**
 * Driver Routes Page — /driver/routes
 *
 * Independent drivers pre-register their travel plans so dispatchers
 * can proactively match them with packages heading the same direction.
 */

import { useState, useEffect, useCallback } from "react";
import { DriverSidebar } from "@/components/dashboard/driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import { AddressInput } from "@/components/AddressInput";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { get, post, del } from "@/lib/api";
import {
  Route,
  MapPin,
  ArrowRight,
  Plus,
  X,
  Loader2,
  Navigation,
  Trash2,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";

/* ─── Types ─── */
interface DriverRoute {
  id: number;
  driver_id: number;
  start_address: string | null;
  start_lat: string;
  start_lng: string;
  end_address: string | null;
  end_lat: string;
  end_lng: string;
  departure_time: string;
  is_active: boolean;
  createdAt: string;
}

/* ─── Component ─── */
export default function DriverRoutesPage() {
  const { isDark, setIsDark } = useTheme();
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [startAddress, setStartAddress] = useState("");
  const [startLat, setStartLat] = useState("");
  const [startLng, setStartLng] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [endLat, setEndLat] = useState("");
  const [endLng, setEndLng] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadRoutes = useCallback(async () => {
    try {
      const data = await get<DriverRoute[]>("/drivers/routes/mine");
      setRoutes(data);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleCreate = async () => {
    if (!startLat || !endLat || !departureDate || !departureTime) {
      setError("Please fill in all fields");
      return;
    }

    const dt = new Date(`${departureDate}T${departureTime}`);
    if (dt <= new Date()) {
      setError("Departure must be in the future");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await post("/drivers/routes", {
        start_lat: parseFloat(startLat),
        start_lng: parseFloat(startLng),
        end_lat: parseFloat(endLat),
        end_lng: parseFloat(endLng),
        start_address: startAddress,
        end_address: endAddress,
        departure_time: dt.toISOString(),
      });

      setShowModal(false);
      setStartAddress("");
      setStartLat("");
      setStartLng("");
      setEndAddress("");
      setEndLat("");
      setEndLng("");
      setDepartureDate("");
      setDepartureTime("");
      loadRoutes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create route");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (routeId: number) => {
    try {
      await del(`/drivers/routes/${routeId}`);
      setRoutes((prev) =>
        prev.map((r) => (r.id === routeId ? { ...r, is_active: false } : r)),
      );
    } catch {
      // no-op
    }
  };

  const activeRoutes = routes.filter((r) => r.is_active);
  const pastRoutes = routes.filter((r) => !r.is_active);

  const formatDeparture = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUpcoming = (iso: string) => new Date(iso) > new Date();

  return (
    <div className="flex min-h-screen w-full">
      <DriverSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              My Routes
            </h1>
            <p className="text-sm text-muted-foreground">
              Share your travel plans so dispatchers can offer you deliveries
              along the way
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Route
          </button>
        </div>

        <div className="p-6 max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingPackage />
            </div>
          ) : routes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Navigation className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">
                No routes yet
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Add your upcoming travel routes and dispatchers will be able to
                see them. If they have a package heading your direction, they
                can offer it to you!
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Your First Route
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active routes */}
              {activeRoutes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Active Routes ({activeRoutes.length})
                  </p>
                  <div className="space-y-3">
                    {activeRoutes.map((route) => (
                      <div
                        key={route.id}
                        className={`p-5 rounded-3xl bg-card border shadow-sm transition-all ${
                          isUpcoming(route.departure_time)
                            ? "border-primary/30 hover:border-primary/50"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Route path */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-foreground truncate">
                                  {route.start_address ||
                                    `${parseFloat(route.start_lat).toFixed(4)}, ${parseFloat(route.start_lng).toFixed(4)}`}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                  <MapPin className="h-4 w-4 text-green-500" />
                                </div>
                                <p className="text-sm font-medium text-foreground truncate">
                                  {route.end_address ||
                                    `${parseFloat(route.end_lat).toFixed(4)}, ${parseFloat(route.end_lng).toFixed(4)}`}
                                </p>
                              </div>
                            </div>

                            {/* Departure info */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CalendarClock className="h-3.5 w-3.5" />
                                <span>
                                  {formatDeparture(route.departure_time)}
                                </span>
                              </div>
                              {isUpcoming(route.departure_time) ? (
                                <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                  Upcoming
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                  Departed
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Deactivate button */}
                          <button
                            onClick={() => handleDeactivate(route.id)}
                            className="p-2 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Deactivate route"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past / deactivated routes */}
              {pastRoutes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Past Routes ({pastRoutes.length})
                  </p>
                  <div className="space-y-3">
                    {pastRoutes.map((route) => (
                      <div
                        key={route.id}
                        className="p-5 rounded-3xl bg-card border border-border shadow-sm opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <p className="text-sm text-muted-foreground truncate">
                              {route.start_address || "Start"}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <p className="text-sm text-muted-foreground truncate">
                              {route.end_address || "End"}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDeparture(route.departure_time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ Add Route Modal ═══ */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-secondary rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Route className="h-5 w-5 text-primary" />
                  Add Travel Route
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Start location */}
                <AddressInput
                  label="Starting from"
                  iconColor="text-blue-500"
                  value={startAddress}
                  lat={startLat}
                  lng={startLng}
                  onSelect={(addr, lat, lng) => {
                    setStartAddress(addr);
                    setStartLat(lat);
                    setStartLng(lng);
                  }}
                  onChange={setStartAddress}
                  placeholder="e.g. Chandigarh, Punjab"
                />
                {startLat && (
                  <p className="text-[10px] text-green-600 -mt-2 ml-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Coordinates captured
                  </p>
                )}

                {/* End location */}
                <AddressInput
                  label="Going to"
                  iconColor="text-green-500"
                  value={endAddress}
                  lat={endLat}
                  lng={endLng}
                  onSelect={(addr, lat, lng) => {
                    setEndAddress(addr);
                    setEndLat(lat);
                    setEndLng(lng);
                  }}
                  onChange={setEndAddress}
                  placeholder="e.g. Delhi, India"
                />
                {endLat && (
                  <p className="text-[10px] text-green-600 -mt-2 ml-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Coordinates captured
                  </p>
                )}

                {/* Departure date/time */}
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker
                    label="Date"
                    value={departureDate}
                    onChange={setDepartureDate}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <TimePicker
                    label="Time"
                    value={departureTime}
                    onChange={setDepartureTime}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {/* Hint */}
              <div className="mt-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">How it works:</strong>{" "}
                  Dispatchers will see your route and can offer you deliveries
                  along your path. You'll receive a bid notification if a
                  package matches your route.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  className="flex-1 py-2.5 rounded-full border border-border text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={
                    !startLat ||
                    !endLat ||
                    !departureDate ||
                    !departureTime ||
                    submitting
                  }
                  className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Route
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
