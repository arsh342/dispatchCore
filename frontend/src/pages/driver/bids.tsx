import { useState, useEffect, useMemo } from "react";
import { DriverSidebar } from "@/components/dashboard/driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  MapPin,
  ArrowRight,
  Gavel,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { fetchMyBids, type DriverBid } from "@/services/driver/marketplace";
import { formatINR } from "@/lib/currency";

/* ─── Types ─── */
type BidStatus = "pending" | "accepted" | "rejected" | "expired";

const statusConfig: Record<
  BidStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "text-green-500 bg-green-50 dark:bg-green-900/20",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-400 bg-red-50 dark:bg-red-900/20",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    color: "text-gray-400 bg-secondary",
    icon: Clock,
  },
};

export default function DriverBidsPage() {
  const { isDark, setIsDark } = useTheme();
  const [filter, setFilter] = useState<BidStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<DriverBid[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchMyBids();
      setBids(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? bids : bids.filter((b) => b.status === filter)),
    [bids, filter],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bids.length };
    bids.forEach((b) => {
      c[b.status] = (c[b.status] ?? 0) + 1;
    });
    return c;
  }, [bids]);

  return (
    <div className="flex min-h-screen w-full">
      <DriverSidebar isDark={isDark} setIsDark={setIsDark} />
      <div className="flex-1 bg-background overflow-auto">
        <header className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">
            My Bids
          </h1>
          <p className="text-sm text-muted-foreground">
            {bids.length} total bids
          </p>
          <div className="flex items-center gap-1 mt-3">
            {(
              ["all", "pending", "accepted", "rejected", "expired"] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-3xl text-xs font-medium transition-colors ${filter === s ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-secondary"}`}
              >
                {s === "all" ? "All" : statusConfig[s].label}
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full">
                  {counts[s] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </header>

        <div className="p-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <LoadingPackage />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Gavel className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No bids found</p>
            </div>
          ) : (
            filtered.map((bid) => {
              const sc = statusConfig[bid.status];
              const Icon = sc.icon;
              const savings = bid.listedPrice - bid.offeredPrice;
              return (
                <div
                  key={bid.id}
                  className={`p-5 rounded-3xl bg-card border border-border shadow-sm ${bid.status === "expired" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {bid.orderId}
                      </span>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${sc.color}`}
                    >
                      <Icon className="h-3 w-3" /> {sc.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{bid.pickupAddress}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-gray-300" />
                    <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span className="truncate">{bid.deliveryAddress}</span>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-full bg-muted/50 mb-3">
                    <div>
                      <p className="text-[10px] uppercase text-gray-400">
                        Your Offer
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {formatINR(bid.offeredPrice)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-300">vs</div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400">
                        Listed
                      </p>
                      <p className="text-lg font-semibold text-gray-400">
                        {formatINR(bid.listedPrice)}
                      </p>
                    </div>
                    {savings > 0 && (
                      <div className="ml-auto">
                        <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                          -{formatINR(savings)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      {bid.message && (
                        <span className="flex items-center gap-1 italic">
                          <MessageSquare className="h-3 w-3" /> "{bid.message}"
                        </span>
                      )}
                    </div>
                    <span>{new Date(bid.createdAt).toLocaleDateString()}</span>
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
