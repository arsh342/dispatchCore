import { useState, useMemo, useEffect } from "react";
import { DriverSidebar } from "@/components/dashboard/driver-sidebar";
import { useTheme } from "@/hooks/useTheme";
import {
  useDriverListings,
  useMyBids,
  useDriverMarketplaceStats,
  usePlaceBid,
} from "@/hooks/driver/useMarketplace";
import type {
  DriverSortBy,
  DriverMarketplaceListing,
} from "@/types/driver/marketplace";
import {
  MapPin,
  ArrowRight,
  Loader2,
  ChevronDown,
  Package,
  Gavel,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  X,
  MessageSquare,
  Send,
  TrendingUp,
  Building2,
  Ruler,
    Scale,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";

/* ─── Priority styles ─── */
const priorityDot: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-400",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};
const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const bidStatusStyles: Record<
  string,
  { bg: string; text: string; icon: typeof CheckCircle }
> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600",
    icon: Clock,
  },
  accepted: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600",
    icon: CheckCircle,
  },
  rejected: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-500",
    icon: XCircle,
  },
  expired: {
    bg: "bg-secondary",
    text: "text-gray-400",
    icon: Clock,
  },
};

/* ─── Driver Marketplace Page ─── */
export default function DriverMarketplacePage() {
  const { isDark, setIsDark } = useTheme();
  const [sortBy, setSortBy] = useState<DriverSortBy>("priority");
  const [bidModal, setBidModal] = useState<DriverMarketplaceListing | null>(
    null,
  );
  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");

  const {
    data: listings,
    loading: listingsLoading,
    refetch: refetchListings,
  } = useDriverListings(sortBy);
  const {
    data: myBids,
    loading: bidsLoading,
    refetch: refetchBids,
  } = useMyBids();
  const { data: stats } = useDriverMarketplaceStats();
  const { submitBid, loading: submitting } = usePlaceBid();

  useEffect(() => {
    refetchListings(sortBy);
  }, [sortBy]);

  // Orders the driver hasn't bid on yet
  const unbidListings = useMemo(() => {
    if (!listings || !myBids) return listings ?? [];
    const bidOrderIds = new Set(myBids.map((b) => b.orderId));
    return listings.filter((l) => !bidOrderIds.has(l.id));
  }, [listings, myBids]);

  const pendingBids = useMemo(
    () => myBids?.filter((b) => b.status === "pending") ?? [],
    [myBids],
  );
  const resolvedBids = useMemo(
    () => myBids?.filter((b) => b.status !== "pending") ?? [],
    [myBids],
  );

  const handlePlaceBid = async () => {
    if (!bidModal || !bidPrice) return;
    await submitBid(bidModal.id, parseFloat(bidPrice), bidMessage || undefined);
    setBidModal(null);
    setBidPrice("");
    setBidMessage("");
    refetchBids();
    refetchListings();
  };

  return (
    <div className="flex min-h-screen w-full">
      <DriverSidebar isDark={isDark} setIsDark={setIsDark} />

      <div className="flex-1 bg-background overflow-auto flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* ═══ LEFT — Browse Available Orders ═══ */}
          <div className="lg:w-[55%] border-r border-border flex flex-col">
            <div className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Available Orders
                </h1>
                <p className="text-sm text-muted-foreground">
                  {unbidListings.length} order
                  {unbidListings.length !== 1 ? "s" : ""} available to bid on
                </p>
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as DriverSortBy)}
                  className="appearance-none bg-card border border-border rounded-full px-4 py-2 pr-9 text-sm text-secondary-foreground cursor-pointer outline-none focus:border-primary"
                >
                  <option value="priority">Priority</option>
                  <option value="newest">Newest</option>
                  <option value="distance">Nearest</option>
                  <option value="price">Highest Pay</option>
                  <option value="weight">Lightest</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {listingsLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <LoadingPackage />
                </div>
              ) : unbidListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Package className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No available orders</p>
                  <p className="text-xs mt-1">
                    Check back later for new listings
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {unbidListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="p-5 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                    >
                      {/* Priority + ID + Company */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${priorityDot[listing.priority]}`}
                          />
                          <span className="text-xs font-mono font-medium text-muted-foreground">
                            {listing.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Building2 className="h-3 w-3" />
                          <span>{listing.companyName}</span>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm text-secondary-foreground leading-tight truncate">
                            {listing.pickupAddress}
                          </p>
                        </div>
                        <div className="pl-1">
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-secondary-foreground leading-tight truncate">
                            {listing.deliveryAddress}
                          </p>
                        </div>
                      </div>

                      {/* Price + Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xl font-bold text-foreground">
                          ${listing.listedPrice.toFixed(2)}
                        </p>
                        <div className="flex gap-1.5">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {listing.weight} kg
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {listing.distance} km
                          </span>
                        </div>
                      </div>

                      {/* Bids count + Priority */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Gavel className="h-3.5 w-3.5" />
                          <span>
                            {listing.bidsCount} bid
                            {listing.bidsCount !== 1 ? "s" : ""} so far
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            listing.priority === "urgent"
                              ? "bg-red-50 text-red-600 dark:bg-red-900/30"
                              : listing.priority === "high"
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                          }`}
                        >
                          {priorityLabel[listing.priority]}
                        </span>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => {
                          setBidModal(listing);
                          setBidPrice("");
                          setBidMessage("");
                        }}
                        className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Gavel className="h-3.5 w-3.5" />
                        Place Bid
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT — My Bids ═══ */}
          <div className="lg:w-[45%] flex flex-col">
            <div className="sticky top-0 z-10 bg-card backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  My Bids
                </h2>
                <p className="text-sm text-muted-foreground">
                  {pendingBids.length} pending, {resolvedBids.length} resolved
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {bidsLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                  <LoadingPackage />
                </div>
              ) : !myBids || myBids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Gavel className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No bids placed yet</p>
                  <p className="text-xs mt-1">
                    Browse orders and place your first bid!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pending bids first */}
                  {pendingBids.length > 0 && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      Pending
                    </p>
                  )}
                  {pendingBids.map((bid) => {
                    const style = bidStatusStyles[bid.status];
                    const Icon = style.icon;
                    return (
                      <div
                        key={bid.id}
                        className="p-4 rounded-3xl bg-card border border-border shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-medium text-gray-500">
                            {bid.orderId}
                          </span>
                          <span
                            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
                          >
                            <Icon className="h-3 w-3" />
                            {bid.status.charAt(0).toUpperCase() +
                              bid.status.slice(1)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-full bg-muted/50 mb-2">
                          <div className="flex-1">
                            <p className="text-[10px] uppercase text-gray-400 tracking-wide">
                              Your Offer
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              ${bid.offeredPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-xs text-gray-300">vs</div>
                          <div className="flex-1 text-right">
                            <p className="text-[10px] uppercase text-gray-400 tracking-wide">
                              Listed
                            </p>
                            <p className="text-lg font-semibold text-gray-400">
                              ${bid.listedPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {bid.message && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="italic">"{bid.message}"</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Resolved bids */}
                  {resolvedBids.length > 0 && (
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-4 mb-2">
                      History
                    </p>
                  )}
                  {resolvedBids.map((bid) => {
                    const style = bidStatusStyles[bid.status];
                    const Icon = style.icon;
                    return (
                      <div
                        key={bid.id}
                        className="p-4 rounded-3xl bg-card border border-border shadow-sm opacity-75"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-medium text-gray-500">
                            {bid.orderId}
                          </span>
                          <span
                            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
                          >
                            <Icon className="h-3 w-3" />
                            {bid.status.charAt(0).toUpperCase() +
                              bid.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-secondary-foreground">
                            ${bid.offeredPrice.toFixed(2)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-400 line-through">
                            ${bid.listedPrice.toFixed(2)}
                          </span>
                        </div>
                        {bid.status === "accepted" && bid.pickupAddress && (
                          <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-xs text-green-700 dark:text-green-300">
                            Assigned! Pickup: {bid.pickupAddress}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
              Available:{" "}
              <span className="font-bold text-foreground">
                {stats?.availableOrders ?? "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gavel className="h-4 w-4" />
              My Bids:{" "}
              <span className="font-bold text-foreground">
                {stats?.myActiveBids ?? "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              Won Today:{" "}
              <span className="font-bold text-foreground">
                {stats?.acceptedToday ?? "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Earnings:{" "}
              <span className="font-bold text-green-600">
                ${stats?.earnings?.toFixed(2) ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Place Bid Modal ═══ */}
        {bidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-secondary rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  Place Your Bid
                </h3>
                <button
                  onClick={() => setBidModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-3 rounded-3xl bg-muted/50">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Order</p>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {bidModal.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Listed Price</p>
                    <p className="text-lg font-bold text-foreground">
                      ${bidModal.listedPrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-3xl bg-muted/50 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-secondary-foreground">
                      {bidModal.pickupAddress}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-secondary-foreground">
                      {bidModal.deliveryAddress}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    <Scale className="h-3 w-3 inline mr-1" />
                    {bidModal.weight} kg
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    <Ruler className="h-3 w-3 inline mr-1" />
                    {bidModal.distance} km
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    <Building2 className="h-3 w-3 inline mr-1" />
                    {bidModal.companyName}
                  </span>
                </div>
              </div>

              {/* Price input */}
              <label className="block mb-3">
                <span className="text-sm font-medium text-secondary-foreground mb-1.5 block">
                  Your offer
                </span>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    placeholder={`e.g. ${(bidModal.listedPrice * 0.9).toFixed(2)}`}
                    className="w-full pl-9 pr-4 py-3 rounded-full border border-border bg-card text-foreground outline-none focus:border-primary text-lg font-bold"
                  />
                </div>
                {bidPrice && parseFloat(bidPrice) < bidModal.listedPrice && (
                  <p className="text-xs text-green-600 mt-1">
                    Saving the dispatcher $
                    {(bidModal.listedPrice - parseFloat(bidPrice)).toFixed(2)}{" "}
                    from listed price
                  </p>
                )}
              </label>

              {/* Message */}
              <label className="block mb-4">
                <span className="text-sm font-medium text-secondary-foreground mb-1.5 block">
                  Message (optional)
                </span>
                <textarea
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="e.g. I'm nearby, can pick up in 5 mins..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-full border border-border bg-card text-foreground outline-none focus:border-primary text-sm resize-none"
                />
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setBidModal(null)}
                  className="flex-1 py-2.5 rounded-full border border-border text-secondary-foreground text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceBid}
                  disabled={
                    !bidPrice || parseFloat(bidPrice) <= 0 || submitting
                  }
                  className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Bid
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
