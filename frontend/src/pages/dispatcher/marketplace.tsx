import { useState, useEffect, useMemo } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import {
  useListedOrders,
  useBids,
  useMarketplaceStats,
  useUnassignedOrders,
  useListOrder,
} from "@/hooks/dispatcher/useMarketplace";
import type {
  MarketplaceSortBy,
  MarketplaceOrder,
} from "@/types/dispatcher/marketplace";
import {
  MapPin,
  ArrowRight,
  Star,
  Loader2,
  ChevronDown,
  Package,
  Gavel,
  CheckCircle,
  Upload,
  IndianRupee,
  X,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";
import { formatINR } from "@/lib/currency";

/* ─── Priority styles ─── */
const priorityDot: Record<string, string> = {
  low: "bg-gray-400",
  normal: "bg-blue-400",
  medium: "bg-blue-400",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};
const priorityLabel: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/* ─── Marketplace Page (Dispatcher View) ─── */
export default function MarketplacePage() {
  const [sortBy, setSortBy] = useState<MarketplaceSortBy>("priority");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [listingModal, setListingModal] = useState<MarketplaceOrder | null>(
    null,
  );
  const [listingPrice, setListingPrice] = useState("");

  const {
    data: listedOrders,
    loading: listedLoading,
    refetch: refetchListed,
  } = useListedOrders(sortBy);
  const {
    data: unassignedOrders,
    loading: unassignedLoading,
    refetch: refetchUnassigned,
  } = useUnassignedOrders();
  const { data: allBids, loading: bidsLoading, respond } = useBids();
  const { data: stats } = useMarketplaceStats();
  const { listOrder, loading: listingLoading } = useListOrder();

  useEffect(() => {
    refetchListed(sortBy);
  }, [sortBy, refetchListed]);

  // Filter bids to show for selected order, or show all pending
  const visibleBids = useMemo(() => {
    if (!allBids) return [];
    const pending = allBids.filter((b) => b.status === "pending");
    if (selectedOrderId)
      return pending.filter((b) => b.orderId === selectedOrderId);
    return pending;
  }, [allBids, selectedOrderId]);

  const handleListOrder = async () => {
    if (!listingModal || !listingPrice) return;
    await listOrder(listingModal.id, parseFloat(listingPrice));
    setListingModal(null);
    setListingPrice("");
    refetchUnassigned();
    refetchListed();
  };

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />

      <div className="flex-1 min-h-screen bg-background overflow-auto lg:h-screen lg:min-h-0 lg:overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row lg:min-h-0 lg:h-full">
          {/* ═══ LEFT — Dispatcher's Marketplace Listings ═══ */}
          <div className="lg:w-[55%] border-r border-border flex flex-col lg:min-h-0 lg:h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Marketplace
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    List orders for independent drivers to bid on
                  </p>
                </div>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as MarketplaceSortBy)
                    }
                    className="appearance-none bg-card border border-border rounded-full px-4 py-2 pe-12 text-sm text-secondary-foreground cursor-pointer outline-none focus:border-primary"
                  >
                    <option value="priority">Priority</option>
                    <option value="newest">Newest</option>
                    <option value="distance">Distance</option>
                    <option value="price">Price</option>
                    <option value="weight">Weight</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Unassigned orders strip — dispatcher can list these */}
              {!unassignedLoading &&
                unassignedOrders &&
                unassignedOrders.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-full p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                      <Upload className="h-4 w-4" />
                      <span>
                        <strong>{unassignedOrders.length}</strong> unassigned
                        orders ready to list
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {unassignedOrders.slice(0, 3).map((o) => (
                        <button
                          key={o.id}
                          onClick={() => {
                            setListingModal(o);
                            setListingPrice("");
                          }}
                          className="text-xs bg-card text-secondary-foreground px-3 py-1.5 rounded-3xl border border-border hover:border-primary hover:text-primary transition-colors"
                        >
                          List {o.id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Listed orders */}
            <div className="dc-scrollbar flex-1 overflow-y-auto p-6 lg:min-h-0">
              {listedLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <LoadingPackage />
                </div>
              ) : listedOrders?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Package className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No listed orders</p>
                  <p className="text-xs mt-1">
                    List unassigned orders above to start receiving bids
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {listedOrders?.map((order) => {
                    const orderBids =
                      allBids?.filter(
                        (b) => b.orderId === order.id && b.status === "pending",
                      ) ?? [];
                    const isSelected = selectedOrderId === order.id;

                    return (
                      <div
                        key={order.id}
                        onClick={() =>
                          setSelectedOrderId(isSelected ? null : order.id)
                        }
                        className={`p-5 rounded-3xl bg-card border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary shadow-md"
                            : "border-border hover:border-gray-300 dark:hover:border-gray-700"
                        }`}
                      >
                        {/* Priority + ID */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${priorityDot[order.priority]}`}
                            />
                            <span className="text-xs font-mono font-medium text-muted-foreground">
                              {order.id}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
                              order.priority === "urgent"
                                ? "bg-red-50 text-red-600 dark:bg-red-900/30"
                                : order.priority === "high"
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                            }`}
                          >
                            {priorityLabel[order.priority]}
                          </span>
                        </div>

                        {/* Route */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <p className="text-sm text-secondary-foreground leading-tight truncate">
                              {order.pickupAddress}
                            </p>
                          </div>
                          <div className="pl-1">
                            <ArrowRight className="h-3 w-3 text-gray-300" />
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-secondary-foreground leading-tight truncate">
                              {order.deliveryAddress}
                            </p>
                          </div>
                        </div>

                        {/* Price + Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xl font-bold text-foreground">
                            {formatINR(order.listedPrice)}
                          </p>
                          <div className="flex gap-1.5">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {order.weight} kg
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {order.distance} km
                            </span>
                          </div>
                        </div>

                        {/* Bids count */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Gavel className="h-3.5 w-3.5" />
                            <span>
                              {orderBids.length} bid
                              {orderBids.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-xs text-primary font-medium">
                              Viewing bids →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT — Incoming Bids from Independent Drivers ═══ */}
          <div className="lg:w-[45%] flex flex-col lg:min-h-0 lg:h-full">
            <div className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-foreground">
                  {selectedOrderId
                    ? `Bids for ${selectedOrderId}`
                    : "All Incoming Bids"}
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Live
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedOrderId && (
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="text-xs px-3 py-1.5 bg-secondary text-gray-500 rounded-lg hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Show all
                  </button>
                )}
                <span className="text-sm text-gray-400">
                  {visibleBids.length} pending
                </span>
              </div>
            </div>

            <div className="dc-scrollbar flex-1 overflow-y-auto p-6 lg:min-h-0">
              {bidsLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <LoadingPackage />
                </div>
              ) : visibleBids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Gavel className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No bids yet</p>
                  <p className="text-xs mt-1">
                    Waiting for independent drivers...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="p-4 rounded-3xl bg-card border border-border shadow-sm"
                    >
                      {/* Driver info */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {bid.driverName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {bid.driverName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < Math.floor(bid.driverRating) ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-gray-700"}`}
                                  />
                                ))}
                                <span className="text-xs text-gray-400 ml-1">
                                  {bid.driverRating}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400">
                                • {bid.driverDeliveries} deliveries
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {bid.timestamp}
                        </span>
                      </div>

                      {/* Message from driver */}
                      {bid.message && (
                        <div className="mb-3 p-2.5 rounded-lg bg-muted/50 flex items-start gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-secondary-foreground italic">
                            "{bid.message}"
                          </p>
                        </div>
                      )}

                      {/* Price comparison */}
                      <div className="flex items-center gap-3 mb-3 p-3 rounded-full bg-muted/50">
                        <div className="flex-1">
                          <p className="text-[10px] uppercase text-gray-400 tracking-wide">
                            Offered
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {formatINR(bid.offeredPrice)}
                          </p>
                        </div>
                        <div className="text-xs text-gray-300">vs</div>
                        <div className="flex-1 text-right">
                          <p className="text-[10px] uppercase text-gray-400 tracking-wide">
                            Your Price
                          </p>
                          <p className="text-lg font-semibold text-gray-400 line-through">
                            {formatINR(bid.listedPrice)}
                          </p>
                        </div>
                        <div
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            bid.offeredPrice >= bid.listedPrice
                              ? "bg-green-50 text-green-600 dark:bg-green-900/30"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                          }`}
                        >
                          {bid.offeredPrice >= bid.listedPrice
                            ? "At price"
                            : `-${formatINR(bid.listedPrice - bid.offeredPrice)}`}
                        </div>
                      </div>

                      {/* Order reference */}
                      <p className="text-xs text-gray-400 mb-3">
                        Order:{" "}
                        <span className="font-mono font-medium text-secondary-foreground">
                          {bid.orderId}
                        </span>
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => respond(bid.id, "accepted")}
                          className="flex-1 py-2.5 rounded-full bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Accept & Assign
                        </button>
                        <button
                          onClick={() => respond(bid.id, "rejected")}
                          className="flex-1 py-2.5 rounded-full border-2 border-red-300 dark:border-red-800 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Bottom Stats Bar ═══ */}
        <div className="border-t border-border bg-card px-6 py-3">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              Listed:{" "}
              <span className="font-bold text-foreground">
                {stats?.totalListed ?? "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gavel className="h-4 w-4" />
              Active Bids:{" "}
              <span className="font-bold text-foreground">
                {stats?.activeBids ?? "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              Accepted Today:{" "}
              <span className="font-bold text-foreground">
                {stats?.acceptedToday ?? "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Avg Bid:{" "}
              <span className="font-bold text-foreground">
                {stats?.avgBidPrice !== undefined ? formatINR(stats.avgBidPrice) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ List Order Modal ═══ */}
        {listingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  List Order on Marketplace
                </h3>
                <button
                  onClick={() => setListingModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <div className="p-3 rounded-full bg-muted/50">
                  <p className="text-xs text-gray-400 mb-1">Order</p>
                  <p className="text-sm font-mono font-bold text-foreground">
                    {listingModal.id}
                  </p>
                </div>

                <div className="p-3 rounded-full bg-muted/50 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-secondary-foreground">
                      {listingModal.pickupAddress}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-secondary-foreground">
                      {listingModal.deliveryAddress}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {listingModal.weight} kg
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {listingModal.distance} km
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      listingModal.priority === "urgent"
                        ? "bg-red-50 text-red-600 dark:bg-red-900/30"
                        : listingModal.priority === "high"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}
                  >
                    {priorityLabel[listingModal.priority]}
                  </span>
                </div>
              </div>

              {/* Price input */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-secondary-foreground mb-1.5 block">
                  Set listed price
                </span>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="e.g. 15.00"
                    className="w-full pl-9 pr-4 py-3 rounded-full border border-border bg-card text-foreground outline-none focus:border-primary text-lg font-bold"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Independent drivers will bid against this price
                </p>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setListingModal(null)}
                  className="flex-1 py-2.5 rounded-full border border-border text-secondary-foreground text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleListOrder}
                  disabled={
                    !listingPrice ||
                    parseFloat(listingPrice) <= 0 ||
                    listingLoading
                  }
                  className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {listingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  List on Marketplace
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
