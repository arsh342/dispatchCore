import { useState, useEffect } from "react";
import { EmployedDriverSidebar } from "@/components/dashboard/employed-driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  MapPin,
  CheckCircle2,
  Phone,
  Truck,
  Timer,
  Navigation,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import {
  fetchActiveDeliveries,
  type ActiveDelivery,
} from "@/services/employed-driver/dashboard";

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

export default function EmployedDriverDeliveriesPage() {
  const { isDark, setIsDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchActiveDeliveries();
      setDeliveries(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <EmployedDriverSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">
            Active Deliveries
          </h1>
          <p className="text-sm text-muted-foreground">
            {deliveries.length} in progress
          </p>
        </header>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <LoadingPackage />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Truck className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No active deliveries</p>
              <p className="text-xs mt-1">
                Start your next assigned order to begin a delivery
              </p>
            </div>
          ) : (
            deliveries.map((del) => {
              const sc = statusConfig[del.status];
              return (
                <div
                  key={del.id}
                  className="p-6 rounded-3xl bg-card border-2 border-border dark:border-border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
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
                      <span className="text-sm font-bold text-secondary-foreground">
                        {del.weight}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-3xl bg-muted/50 space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">
                          Pickup
                        </p>
                        <p className="text-sm text-secondary-foreground">
                          {del.pickupAddress}
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
                          {del.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-3xl bg-muted/50">
                      <p className="text-[10px] uppercase text-gray-400 mb-1">
                        Customer
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {del.customerName}
                      </p>
                      <a
                        href={`tel:${del.customerPhone}`}
                        className="text-xs text-primary flex items-center gap-1 mt-1"
                      >
                        <Phone className="h-3 w-3" />
                        {del.customerPhone}
                      </a>
                    </div>
                    <div className="p-3 rounded-3xl bg-muted/50">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-gray-400">Weight</p>
                          <p className="text-sm font-bold text-foreground">
                            {del.weight}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Dist</p>
                          <p className="text-sm font-bold text-foreground">
                            {del.distance}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {del.notes && (
                    <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 mb-4">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {del.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${del.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {del.progress}%
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Timer className="h-3 w-3" /> ETA {del.estimatedTime}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-3 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <Navigation className="h-4 w-4" /> Navigate
                    </button>
                    <button className="flex-1 py-3 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Mark Delivered
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
