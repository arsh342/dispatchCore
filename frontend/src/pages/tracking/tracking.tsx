/**
 * Customer Tracking Page — /track/:trackingCode
 *
 * Public page (no login required) that shows:
 *  - Full order details (addresses, weight, priority, notes)
 *  - Recipient information
 *  - Company / dispatcher details with chat icon
 *  - Driver details with chat icon
 *  - Live driver location on a MapLibre map with pickup→delivery route
 *  - Order status timeline with delivery events
 *  - Real-time updates via Socket.io
 *  - 1-on-1 chat modals (driver-recipient, dispatcher-recipient)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import MapView from "@/components/map/MapView";
import type { MapMarker } from "@/components/map/MapView";
import { useOrderTracking, useOrderMessages } from "@/hooks/useSocket";
import {
  fetchMessages,
  sendChatMessage,
  markMessagesRead,
  type ChatMsg,
  type ChatChannel,
} from "@/services/messaging";
import {
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Navigation,
  Box,
  Phone,
  Mail,
  User,
  Building2,
  Weight,
  Flag,
  FileText,
  Clock,
  Copy,
  Check,
  MessageCircle,
  Send,
  X,
  Headphones,
} from "lucide-react";
import LoadingPackage from "@/components/ui/loading-package";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// ── Types ──

interface TrackingData {
  order: {
    id: number;
    trackingCode: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    priority: string;
    weightKg: string | null;
    notes: string | null;
    recipientName: string | null;
    recipientPhone: string | null;
    recipientEmail: string | null;
    createdAt: string | null;
  };
  company: { id: number; name: string; address: string | null } | null;
  driver: {
    id: number;
    name: string;
    phone: string | null;
    type: string;
    status: string;
  } | null;
  lastLocation: {
    lat: number;
    lng: number;
    speed: number | null;
    heading: number | null;
    recordedAt: string;
  } | null;
  estimatedArrival?: string;
  events: Array<{ type: string; timestamp: string; notes: string | null }>;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Status timeline config ──

const statusSteps = [
  {
    key: "UNASSIGNED",
    label: "Order Placed",
    icon: Package,
    description: "Your order has been received",
  },
  {
    key: "ASSIGNED",
    label: "Driver Assigned",
    icon: Truck,
    description: "A driver has been assigned",
  },
  {
    key: "PICKED_UP",
    label: "Picked Up",
    icon: Box,
    description: "Package picked up from sender",
  },
  {
    key: "EN_ROUTE",
    label: "En Route",
    icon: Navigation,
    description: "Driver is on the way",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    icon: CheckCircle2,
    description: "Package delivered!",
  },
];

const statusAliases: Record<string, string> = { LISTED: "UNASSIGNED" };

function getStatusIndex(status: string): number {
  const normalized = statusAliases[status] ?? status;
  const idx = statusSteps.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

const statusColors: Record<string, string> = {
  UNASSIGNED: "text-muted-foreground",
  LISTED: "text-muted-foreground",
  ASSIGNED: "text-amber-500",
  PICKED_UP: "text-blue-500",
  EN_ROUTE: "text-indigo-500",
  DELIVERED: "text-green-600",
  CANCELLED: "text-red-500",
};

const priorityLabels: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-secondary text-secondary-foreground" },
  NORMAL: { label: "Normal", color: "bg-blue-50 text-blue-600" },
  HIGH: { label: "High", color: "bg-orange-50 text-orange-600" },
  URGENT: { label: "Urgent", color: "bg-red-50 text-red-600" },
};

// ── Inline Chat Modal Component ──

function InlineChatModal({
  open,
  onClose,
  orderId,
  channel,
  trackingCode,
  recipientName,
  otherName,
  headerColor,
}: {
  open: boolean;
  onClose: () => void;
  orderId: number;
  channel: ChatChannel;
  trackingCode: string;
  recipientName: string;
  otherName: string;
  headerColor: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const msgs = await fetchMessages(
        orderId,
        channel,
        "recipient",
        trackingCode,
      );
      setMessages(msgs);
      await markMessagesRead(orderId, channel, "recipient");
    } catch (err) {
      console.error("Failed to load chat:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, channel, trackingCode]);

  useEffect(() => {
    if (open) loadMessages();
  }, [open, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useOrderMessages(
    open ? orderId : null,
    {
      onMessage: (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg as unknown as ChatMsg];
        });
        if (msg.senderType !== "recipient") {
          markMessagesRead(orderId, channel, "recipient");
        }
      },
    },
    channel,
  );

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    try {
      const sent = await sendChatMessage(orderId, channel, {
        sender_type: "recipient",
        sender_name: recipientName,
        text,
        tracking_code: trackingCode,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err) {
      console.error("Failed to send:", err);
      setInput(text);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col z-50 overflow-hidden">
      <div
        className={`px-4 py-3 border-b border-border ${headerColor} text-white flex items-center justify-between rounded-t-2xl`}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-semibold">Chat with {otherName}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingPackage />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Send a message to start
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderType === "recipient";
            return (
              <div
                key={msg.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%]">
                  {!mine && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1">
                      {msg.senderName}{" "}
                      <span className="text-muted-foreground/60">
                        · {msg.senderType}
                      </span>
                    </p>
                  )}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm ${mine ? "bg-primary text-white rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}
                  >
                    {msg.text}
                  </div>
                  <p
                    className={`text-[10px] mt-0.5 ${mine ? "text-right mr-1" : "ml-1"} text-muted-foreground`}
                  >
                    {new Date(msg.time).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`p-2 rounded-xl transition-colors ${input.trim() ? "bg-primary text-white hover:bg-primary/90" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component ──

export default function CustomerTrackingPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  // Channel-based chat state
  const [chatChannel, setChatChannel] = useState<ChatChannel | null>(null);
  const [chatOtherName, setChatOtherName] = useState("");
  const [chatHeaderColor, setChatHeaderColor] = useState("bg-primary");

  // ── Use browser system preference for dark/light (not the persisted dc_theme) ──
  useEffect(() => {
    const html = document.documentElement;
    const savedHadDark = html.classList.contains("dark");

    const applySystem = (prefersDark: boolean) => {
      if (prefersDark) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    };

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applySystem(mq.matches);

    const handler = (e: MediaQueryListEvent) => applySystem(e.matches);
    mq.addEventListener("change", handler);

    return () => {
      mq.removeEventListener("change", handler);
      // Restore the dashboard theme when navigating away
      if (savedHadDark) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    };
  }, []);

  const fetchTracking = useCallback(async () => {
    if (!trackingCode) return;
    try {
      const res = await fetch(`${API_BASE}/location/track/${trackingCode}`);
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "Order not found");
        setLoading(false);
        return;
      }
      setData(body.data);
      if (body.data.lastLocation) {
        setDriverLocation({
          lat: parseFloat(body.data.lastLocation.lat),
          lng: parseFloat(body.data.lastLocation.lng),
        });
      }
      setLoading(false);
    } catch {
      setError("Could not connect to server");
      setLoading(false);
    }
  }, [trackingCode]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  useEffect(() => {
    if (
      !data ||
      data.order.status === "DELIVERED" ||
      data.order.status === "CANCELLED"
    )
      return;
    const interval = setInterval(fetchTracking, 15000);
    return () => clearInterval(interval);
  }, [data, fetchTracking]);

  useOrderTracking(data?.order?.id ?? null, {
    onLocation: (loc) => setDriverLocation({ lat: loc.lat, lng: loc.lng }),
    onStatusChange: (update) =>
      setData((prev) =>
        prev
          ? { ...prev, order: { ...prev.order, status: update.status } }
          : prev,
      ),
  });

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recipientName = data?.order?.recipientName || "Recipient";

  const openChat = (channel: ChatChannel, otherName: string, color: string) => {
    setChatChannel(channel);
    setChatOtherName(otherName);
    setChatHeaderColor(color);
  };

  const closeChat = () => {
    setChatChannel(null);
    setChatOtherName("");
  };

  // ── Map markers ──
  const markers: MapMarker[] = [];
  if (data) {
    const pLat = parseFloat(String(data.order.pickupLat));
    const pLng = parseFloat(String(data.order.pickupLng));
    const dLat = parseFloat(String(data.order.deliveryLat));
    const dLng = parseFloat(String(data.order.deliveryLng));
    if (!isNaN(pLat) && !isNaN(pLng)) {
      markers.push({
        id: "pickup",
        lat: pLat,
        lng: pLng,
        label: "Pickup",
        color: "#2563eb",
        status: "available",
      });
    }
    if (!isNaN(dLat) && !isNaN(dLng)) {
      markers.push({
        id: "delivery",
        lat: dLat,
        lng: dLng,
        label: "Delivery",
        color: "#22c55e",
        status: "available",
      });
    }
  }
  if (driverLocation) {
    markers.push({
      id: "driver",
      lat: driverLocation.lat,
      lng: driverLocation.lng,
      label: "Driver",
      color: "#f59e0b",
      status: "busy",
    });
  }

  const mapRoutes = data
    ? (() => {
        const pLat = parseFloat(String(data.order.pickupLat));
        const pLng = parseFloat(String(data.order.pickupLng));
        const dLat = parseFloat(String(data.order.deliveryLat));
        const dLng = parseFloat(String(data.order.deliveryLng));
        if (!isNaN(pLat) && !isNaN(pLng) && !isNaN(dLat) && !isNaN(dLng)) {
          return [
            {
              id: "route",
              coordinates: [
                [pLng, pLat],
                [dLng, dLat],
              ] as [number, number][],
              color: "#6366f1",
            },
          ];
        }
        return [];
      })()
    : [];

  const mapCenter: [number, number] = driverLocation
    ? [driverLocation.lng, driverLocation.lat]
    : data
      ? [
          parseFloat(String(data.order.deliveryLng)) || 76.78,
          parseFloat(String(data.order.deliveryLat)) || 30.73,
        ]
      : [76.78, 30.73];

  const currentStatusIndex = data ? getStatusIndex(data.order.status) : 0;

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingPackage />
          <p className="text-muted-foreground text-sm">
            Loading tracking information...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">
            Order Not Found
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {error ?? "We couldn't find this order."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isActive = ["ASSIGNED", "PICKED_UP", "EN_ROUTE"].includes(
    data.order.status,
  );
  const isDelivered = data.order.status === "DELIVERED";
  const isCancelled = data.order.status === "CANCELLED";
  const priority = priorityLabels[data.order.priority] ?? priorityLabels.NORMAL;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="dispatchCore"
              className="h-8 w-8 object-contain"
            />
            <span className="text-sm font-bold text-foreground">
              dispatchCore
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-secondary px-3 py-1.5 rounded-lg text-secondary-foreground">
              {data.order.trackingCode}
            </span>
            <button
              onClick={handleCopyTracking}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Copy tracking link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* ── Status Banner ── */}
        <div
          className={`rounded-2xl p-6 mb-6 ${isDelivered ? "bg-green-50 border border-green-200" : isCancelled ? "bg-red-50 border border-red-200" : "bg-card border border-border"}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isDelivered ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : isCancelled ? (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                ) : (
                  <Truck className="h-6 w-6 text-primary" />
                )}
                <h1
                  className={`text-xl font-bold ${isDelivered ? "text-green-800" : isCancelled ? "text-red-800" : "text-foreground"}`}
                >
                  {isDelivered
                    ? "Package Delivered! 🎉"
                    : isCancelled
                      ? "Order Cancelled"
                      : isActive
                        ? "Your package is on its way!"
                        : "Order is being processed"}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Order #{data.order.id} · Placed{" "}
                {formatDateTime(data.order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${priority.color}`}
              >
                {priority.label} Priority
              </span>
              <span
                className={`text-sm font-medium px-3 py-1.5 rounded-full ${statusColors[data.order.status] ?? "text-muted-foreground"} ${isDelivered ? "bg-green-100" : isCancelled ? "bg-red-100" : "bg-secondary"}`}
              >
                {data.order.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column: Map + Route + Order Details ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live Map */}
            <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
              <div className="h-[420px]">
                <MapView
                  markers={markers}
                  center={mapCenter}
                  zoom={driverLocation ? 14 : 11}
                  interactive
                  routes={mapRoutes}
                />
              </div>
              <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                {driverLocation ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      Live tracking active
                    </span>
                    <span>
                      Last update:{" "}
                      {data.lastLocation?.recordedAt
                        ? new Date(
                            data.lastLocation.recordedAt,
                          ).toLocaleTimeString()
                        : "—"}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {isActive
                      ? "Waiting for driver location..."
                      : isDelivered
                        ? "Delivery completed"
                        : "Map shows pickup → delivery route"}
                  </span>
                )}
              </div>
            </div>

            {/* Route Details */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4">
                Route Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">
                      PICKUP
                    </p>
                    <p className="text-sm text-foreground">
                      {data.order.pickupAddress || "Coordinates provided"}
                    </p>
                  </div>
                </div>
                <div className="ml-4 border-l-2 border-dashed border-border h-4" />
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">
                      DELIVERY
                    </p>
                    <p className="text-sm text-foreground">
                      {data.order.deliveryAddress || "Coordinates provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4">
                Order Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {data.order.weightKg && (
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="text-sm font-medium text-foreground">
                        {data.order.weightKg} kg
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className="text-sm font-medium text-foreground">
                      {priority.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatShortDate(data.order.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              {data.order.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-2.5">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Special Instructions
                      </p>
                      <p className="text-sm text-secondary-foreground">
                        {data.order.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: Timeline + Driver + Recipient + Company ── */}
          <div className="space-y-4">
            {/* Status Timeline */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-5">
                Delivery Status
              </h3>
              {isCancelled ? (
                <div className="text-center py-6">
                  <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-600">
                    This order has been cancelled.
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const StepIcon = step.icon;
                    // Find matching event for timestamp
                    const matchingEvent = data.events.find(
                      (e) => e.type === step.key,
                    );
                    return (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isCurrent ? "bg-primary text-white shadow-md shadow-primary/30" : isCompleted ? "bg-green-100 text-green-600" : "bg-secondary text-muted-foreground/40"}`}
                          >
                            {isCompleted && !isCurrent ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <StepIcon className="h-4 w-4" />
                            )}
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div
                              className={`w-0.5 h-10 ${isCompleted && index < currentStatusIndex ? "bg-green-300" : "bg-border"}`}
                            />
                          )}
                        </div>
                        <div className="pt-1.5 pb-3">
                          <p
                            className={`text-sm font-medium ${isCurrent ? "text-foreground" : isCompleted ? "text-green-700" : "text-muted-foreground"}`}
                          >
                            {step.label}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${isCompleted ? "text-muted-foreground" : "text-muted-foreground/40"}`}
                          >
                            {matchingEvent
                              ? new Date(
                                  matchingEvent.timestamp,
                                ).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Driver Info */}
            {data.driver && (
              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">
                    Your Driver
                  </h3>
                  <button
                    onClick={() =>
                      openChat(
                        "driver-recipient",
                        data.driver?.name || "Driver",
                        "bg-amber-500",
                      )
                    }
                    title="Chat with driver"
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold">
                    {data.driver.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {data.driver.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {data.driver.type.toLowerCase()} driver
                    </p>
                  </div>
                </div>
                {data.driver.phone && (
                  <a
                    href={`tel:${data.driver.phone}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-secondary transition-colors text-sm text-secondary-foreground"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {data.driver.phone}
                  </a>
                )}
              </div>
            )}

            {/* Recipient Info */}
            {(data.order.recipientName ||
              data.order.recipientPhone ||
              data.order.recipientEmail) && (
              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-3">
                  Recipient
                </h3>
                <div className="space-y-2.5">
                  {data.order.recipientName && (
                    <div className="flex items-center gap-2.5 text-sm text-secondary-foreground">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      {data.order.recipientName}
                    </div>
                  )}
                  {data.order.recipientPhone && (
                    <a
                      href={`tel:${data.order.recipientPhone}`}
                      className="flex items-center gap-2.5 text-sm text-secondary-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      {data.order.recipientPhone}
                    </a>
                  )}
                  {data.order.recipientEmail && (
                    <a
                      href={`mailto:${data.order.recipientEmail}`}
                      className="flex items-center gap-2.5 text-sm text-secondary-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      {data.order.recipientEmail}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Company / Dispatch Info */}
            {data.company && (
              <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">
                    Dispatched By
                  </h3>
                  <button
                    onClick={() =>
                      openChat(
                        "dispatcher-recipient",
                        data.company?.name || "Dispatcher",
                        "bg-indigo-500",
                      )
                    }
                    title="Chat with dispatcher"
                    className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {data.company.name}
                    </p>
                    {data.company.address && (
                      <p className="text-xs text-muted-foreground">
                        {data.company.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Estimated Arrival */}
            {data.estimatedArrival && isActive && (
              <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-indigo-900 mb-1">
                  Estimated Arrival
                </h3>
                <p className="text-lg font-bold text-indigo-700">
                  {new Date(data.estimatedArrival).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            {/* Contact Support */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-2">
                Need Help?
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Chat directly with your driver or dispatcher, or contact
                support.
              </p>
              <div className="space-y-2">
                {data.driver && (
                  <button
                    onClick={() =>
                      openChat(
                        "driver-recipient",
                        data.driver?.name || "Driver",
                        "bg-amber-500",
                      )
                    }
                    className="w-full py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Chat with Driver
                  </button>
                )}
                {data.company && (
                  <button
                    onClick={() =>
                      openChat(
                        "dispatcher-recipient",
                        data.company?.name || "Dispatcher",
                        "bg-indigo-500",
                      )
                    }
                    className="w-full py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Chat with Dispatcher
                  </button>
                )}
                <button
                  className="w-full py-2 rounded-xl bg-muted text-secondary-foreground text-sm font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                  onClick={() =>
                    window.open("mailto:support@dispatchcore.com", "_blank")
                  }
                >
                  <Headphones className="h-4 w-4" />
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Channel-based Chat Modal ── */}
      {chatChannel && data && trackingCode && (
        <InlineChatModal
          open={!!chatChannel}
          onClose={closeChat}
          orderId={data.order.id}
          channel={chatChannel}
          trackingCode={trackingCode}
          recipientName={recipientName}
          otherName={chatOtherName}
          headerColor={chatHeaderColor}
        />
      )}

      {/* ── Footer ── */}
      <footer className="mt-12 border-t border-border py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 dispatchCore</span>
          <span>Powered by real-time logistics</span>
        </div>
      </footer>
    </div>
  );
}
