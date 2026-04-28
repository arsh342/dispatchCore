/**
 * Firebase Realtime Database Subscription Helpers
 *
 * Typed helpers for subscribing to RTDB paths. Replaces the
 * Socket.io client service (socket.ts).
 *
 * Each function returns an unsubscribe function — same pattern
 * as the old Socket.io helpers for seamless hook integration.
 */

import {
  ref,
  onChildAdded,
  onValue,
  query,
  orderByChild,
  limitToLast,
  type Unsubscribe,
} from "firebase/database";
import { rtdb } from "@/lib/firebase";

// ── Types ──

export interface LocationUpdate {
  driverId?: number;
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  status?: string;
  updatedAt: number;
}

export interface RealtimeEvent {
  type: string;
  timestamp: number;
  [key: string]: unknown;
}

export interface OrderStatusUpdate extends RealtimeEvent {
  type: "order:statusChanged";
  orderId: number;
  status: string;
}

export interface AssignmentEvent extends RealtimeEvent {
  type: "assignment:created" | "assignment:new";
  assignmentId: number;
  orderId: number;
  driverId?: number;
}

export interface BidEvent extends RealtimeEvent {
  type: "bid:new" | "bid:accepted" | "bid:rejected";
  bidId: number;
  orderId: number;
  driverId?: number;
  offeredPrice?: number;
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
  timestamp: number;
}

// ── Subscription Helpers ──

/**
 * Subscribe to a driver's live location updates.
 * Uses onValue since location is a single document overwritten each ping.
 */
export function onDriverLocation(
  driverId: string | number,
  callback: (data: LocationUpdate) => void,
): Unsubscribe {
  const locationRef = ref(rtdb, `locations/${driverId}`);
  return onValue(locationRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as LocationUpdate);
    }
  });
}

/**
 * Subscribe to company dispatcher events (assignments, etc).
 * Uses onChildAdded to only fire for new events.
 */
export function onCompanyEvent(
  companyId: string | number,
  eventType: string,
  callback: (data: RealtimeEvent) => void,
): Unsubscribe {
  const sanitizedType = eventType.replace(":", "_");
  const eventsRef = ref(
    rtdb,
    `events/companies/${companyId}/${sanitizedType}`,
  );
  const q = query(eventsRef, orderByChild("timestamp"), limitToLast(1));

  return onChildAdded(q, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RealtimeEvent);
    }
  });
}

/**
 * Subscribe to a driver's personal event feed (assignments, bids).
 */
export function onDriverEvent(
  driverId: string | number,
  eventType: string,
  callback: (data: RealtimeEvent) => void,
): Unsubscribe {
  const sanitizedType = eventType.replace(":", "_");
  const eventsRef = ref(
    rtdb,
    `events/drivers/${driverId}/${sanitizedType}`,
  );
  const q = query(eventsRef, orderByChild("timestamp"), limitToLast(1));

  return onChildAdded(q, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RealtimeEvent);
    }
  });
}

/**
 * Subscribe to marketplace events for a company (listings, bids).
 */
export function onMarketplaceEvent(
  companyId: string | number,
  eventType: string,
  callback: (data: RealtimeEvent) => void,
): Unsubscribe {
  const sanitizedType = eventType.replace(":", "_");
  const eventsRef = ref(
    rtdb,
    `events/marketplace/${companyId}/${sanitizedType}`,
  );
  const q = query(eventsRef, orderByChild("timestamp"), limitToLast(1));

  return onChildAdded(q, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RealtimeEvent);
    }
  });
}

/**
 * Subscribe to order tracking events (status changes).
 */
export function onOrderEvent(
  orderId: string | number,
  callback: (data: RealtimeEvent) => void,
): Unsubscribe {
  const eventsRef = ref(rtdb, `events/orders/${orderId}`);
  const q = query(eventsRef, orderByChild("timestamp"), limitToLast(1));

  return onChildAdded(q, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RealtimeEvent);
    }
  });
}

/**
 * Subscribe to chat messages for a specific order + channel.
 */
export function onChatMessage(
  orderId: string | number,
  channel: string,
  callback: (data: ChatMessage) => void,
): Unsubscribe {
  const messagesRef = ref(
    rtdb,
    `chats/${orderId}/${channel}/messages`,
  );
  const q = query(messagesRef, orderByChild("timestamp"), limitToLast(1));

  return onChildAdded(q, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as ChatMessage);
    }
  });
}
