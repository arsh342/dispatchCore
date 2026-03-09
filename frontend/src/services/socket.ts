/**
 * Socket.io Client Service
 *
 * Singleton WebSocket connection to the dispatchCore backend.
 * Provides room join/leave helpers and typed event subscriptions.
 *
 * Rooms (match backend sockets/index.js):
 *   company:{id}:dispatchers  — Dispatcher real-time updates
 *   company:{id}:marketplace  — Marketplace listing/bid events
 *   driver:{id}               — Private driver channel
 *   order:{id}:tracking       — Public customer tracking room
 */

import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:8000";

let socket: Socket | null = null;

/** Get or create the singleton socket connection */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[WS] Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
    });
  }

  return socket;
}

/** Disconnect and destroy the singleton */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ── Room Helpers ──

export function joinCompanyRoom(companyId: string | number): void {
  getSocket().emit("join:company", { companyId: Number(companyId) });
}

export function joinMarketplaceRoom(companyId: string | number): void {
  getSocket().emit("join:marketplace", { companyId: Number(companyId) });
}

export function joinDriverRoom(driverId: string | number): void {
  getSocket().emit("join:driver", { driverId: Number(driverId) });
}

export function joinTrackingRoom(orderId: string | number): void {
  getSocket().emit("join:tracking", { orderId: Number(orderId) });
}

export function joinMessagesRoom(orderId: string | number): void {
  getSocket().emit("join:messages", { orderId: Number(orderId) });
}

export function joinChatRoom(orderId: string | number, channel: string): void {
  getSocket().emit("join:messages", {
    orderId: Number(orderId),
    channel,
  });
}

export function leaveRoom(room: string): void {
  getSocket().emit("leave:room", { room });
}

// ── Typed Event Subscriptions ──

export interface LocationUpdate {
  driverId: number;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  recordedAt: string;
}

export interface OrderStatusUpdate {
  orderId: number;
  status: string;
  timestamp: string;
}

export interface BidUpdate {
  bidId: number;
  orderId: number;
  driverId: number;
  status: string;
  amount: number;
}

export interface ChatMessage {
  id: number;
  orderId: number;
  channel: string;
  senderType: "dispatcher" | "driver" | "recipient";
  senderId: number | null;
  senderName: string;
  text: string;
  isRead: boolean;
  time: string;
}

/** Subscribe to driver location updates in a tracking room */
export function onLocationUpdate(
  callback: (data: LocationUpdate) => void,
): () => void {
  const s = getSocket();
  s.on("location:update", callback);
  return () => {
    s.off("location:update", callback);
  };
}

/** Subscribe to order status changes */
export function onOrderStatusChange(
  callback: (data: OrderStatusUpdate) => void,
): () => void {
  const s = getSocket();
  s.on("order:statusChanged", callback);
  return () => {
    s.off("order:statusChanged", callback);
  };
}

/** Subscribe to new bid events */
export function onNewBid(callback: (data: BidUpdate) => void): () => void {
  const s = getSocket();
  s.on("bid:new", callback);
  return () => {
    s.off("bid:new", callback);
  };
}

/** Subscribe to bid status changes (accepted/rejected) */
export function onBidStatusChange(
  callback: (data: BidUpdate) => void,
): () => void {
  const s = getSocket();
  s.on("bid:statusChanged", callback);
  return () => {
    s.off("bid:statusChanged", callback);
  };
}

/** Subscribe to new chat messages in a messaging room */
export function onNewMessage(
  callback: (data: ChatMessage) => void,
): () => void {
  const s = getSocket();
  s.on("message:new", callback);
  return () => {
    s.off("message:new", callback);
  };
}
