import { useState, useEffect } from "react";
import { DriverSidebar } from "@/components/dashboard/driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  MapPin,
  ArrowRight,
  Navigation,
  CheckCircle2,
  Truck,
  Timer,
  Box,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchActiveDeliveries,
  type ActiveDelivery,
} from "@/services/driver/dashboard";

/* ─── Status Config ─── */
const statusConfig: Record<string, { label: string; color: string }> = {
  ASSIGNED: {
    label: "Assigned",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  },
  PICKED_UP: {
    label: "Picked Up",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  },
  EN_ROUTE: {
    label: "En Route",
    color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
  },
};

export default function DriverDeliveriesPage() {
  const { isDark, setIsDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [selected, setSelected] = useState<ActiveDelivery | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchActiveDeliveries();
      // Active Deliveries page only shows orders already picked up (not ASSIGNED)
      setDeliveries(data.filter(d => d.status !== "ASSIGNED"));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <DriverSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto flex flex-col lg:flex-row">
        {/* Left — Delivery List */}
        <div
          className={`${selected ? "lg:w-[55%]" : "w-full"} border-r border-border flex flex-col`}
        >
          <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
            <h1 className="text-xl font-bold text-foreground">
              Active Deliveries
            </h1>
            <p className="text-sm text-muted-foreground">
              {deliveries.length} in progress
            </p>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <LoadingPackage />
              </div>
            ) : deliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Truck className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No active deliveries</p>
                <p className="text-xs mt-1">
                  Browse available jobs to get started
                </p>
              </div>
            ) : (
              deliveries.map((del) => {
                const sc = statusConfig[del.status];
                return (
                  <div
                    key={del.id}
                    onClick={() =>
                      setSelected(selected?.id === del.id ? null : del)
                    }
                    className={`p-5 rounded-3xl bg-card border-2 transition-all cursor-pointer ${
                      selected?.id === del.id
                        ? "border-primary shadow-md"
                        : "border-border hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {del.id}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {del.trackingCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.color}`}
                        >
                          • {sc.label}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {del.payment}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">
                        {del.pickupAddress.split(",")[0]}
                      </span>
                      <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                      <MapPin className="h-3 w-3 text-green-500 shrink-0" />
                      <span className="truncate">
                        {del.deliveryAddress.split(",")[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${del.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500">
                        {del.progress}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>
                        <Box className="inline-block h-3 w-3 text-primary" /> {del.weight} · {del.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" /> ETA {del.estimatedTime}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right — Delivery Detail */}
        {selected && (
          <div className="lg:w-[45%] bg-card overflow-y-auto">
            <div className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Delivery Details
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {selected.id}
                  </p>
                  <p className="text-xs font-mono text-gray-400">
                    {selected.trackingCode}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusConfig[selected.status].color}`}
                >
                  {statusConfig[selected.status].label}
                </span>
              </div>

              {/* Route */}
              <div className="p-4 rounded-full bg-muted/50 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">
                      Pickup
                    </p>
                    <p className="text-sm text-secondary-foreground">
                      {selected.pickupAddress}
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-dashed border-border ml-2 h-4" />
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400">
                      Delivery
                    </p>
                    <p className="text-sm text-secondary-foreground">
                      {selected.deliveryAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer + Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-full bg-muted/50">
                  <p className="text-[10px] uppercase text-gray-400 mb-1">
                    Customer
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selected.customerName}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-muted/50">
                  <p className="text-[10px] uppercase text-gray-400 mb-1">
                    Payment
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {selected.payment}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {selected.dispatcherCompany}
                  </p>
                </div>
              </div>

              {/* Info row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                  <p className="text-[10px] uppercase text-gray-400">Weight</p>
                  <p className="text-sm font-bold text-foreground">
                    {selected.weight}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                  <p className="text-[10px] uppercase text-gray-400">
                    Distance
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {selected.distance}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 text-center">
                  <p className="text-[10px] uppercase text-gray-400">ETA</p>
                  <p className="text-sm font-bold text-foreground">
                    {selected.estimatedTime}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <p className="text-sm font-medium text-secondary-foreground mb-2">
                  Delivery Progress
                </p>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${selected.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right">
                  {selected.progress}%
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <Navigation className="h-4 w-4" /> Navigate
                </button>
                <button className="flex-1 py-3 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Mark Delivered
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
