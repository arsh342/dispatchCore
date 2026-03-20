/**
 * useSocket — React hooks for Socket.io real-time subscriptions
 *
 * Handles connection lifecycle, room join/leave, and typed event callbacks.
 */

import { useEffect, useRef } from "react";
import {
  getSocket,
  joinTrackingRoom,
  leaveRoom,
  joinCompanyRoom,
  joinDriverRoom,
  joinMarketplaceRoom,
  joinMessagesRoom,
  joinChatRoom,
  onLocationUpdate,
  onOrderStatusChange,
  onNewBid,
  onBidStatusChange,
  onNewMessage,
  type LocationUpdate,
  type OrderStatusUpdate,
  type BidUpdate,
  type ChatMessage,
} from "@/services/shared/socket";

/** Join an order tracking room and subscribe to location + status updates */
export function useOrderTracking(
  orderId: string | number | null,
  callbacks: {
    onLocation?: (data: LocationUpdate) => void;
    onStatusChange?: (data: OrderStatusUpdate) => void;
  },
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => { callbacksRef.current = callbacks; });

  useEffect(() => {
    if (!orderId) return;

    // Ensure socket is connected
    getSocket();

    // Join the tracking room
    joinTrackingRoom(orderId);

    const unsubs: (() => void)[] = [];

    if (callbacksRef.current.onLocation) {
      unsubs.push(onLocationUpdate(callbacksRef.current.onLocation));
    }
    if (callbacksRef.current.onStatusChange) {
      unsubs.push(onOrderStatusChange(callbacksRef.current.onStatusChange));
    }

    return () => {
      unsubs.forEach((u) => u());
      leaveRoom(`order:${orderId}:tracking`);
    };
  }, [orderId]);
}

/** Join a company dispatcher room for real-time dashboard updates */
export function useCompanyRoom(companyId: string | number | null) {
  useEffect(() => {
    if (!companyId) return;
    getSocket();
    joinCompanyRoom(companyId);
    return () => {
      leaveRoom(`company:${companyId}:dispatchers`);
    };
  }, [companyId]);
}

/** Join a driver's private room for assignment/bid notifications */
export function useDriverRoom(driverId: string | number | null) {
  useEffect(() => {
    if (!driverId) return;
    getSocket();
    joinDriverRoom(driverId);
    return () => {
      leaveRoom(`driver:${driverId}`);
    };
  }, [driverId]);
}

/** Join marketplace room and subscribe to bid events */
export function useMarketplaceRoom(
  companyId: string | number | null,
  callbacks?: {
    onNewBid?: (data: BidUpdate) => void;
    onBidStatus?: (data: BidUpdate) => void;
  },
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => { callbacksRef.current = callbacks; });

  useEffect(() => {
    if (!companyId) return;
    getSocket();
    joinMarketplaceRoom(companyId);

    const unsubs: (() => void)[] = [];
    if (callbacksRef.current?.onNewBid) {
      unsubs.push(onNewBid(callbacksRef.current.onNewBid));
    }
    if (callbacksRef.current?.onBidStatus) {
      unsubs.push(onBidStatusChange(callbacksRef.current.onBidStatus));
    }

    return () => {
      unsubs.forEach((u) => u());
      leaveRoom(`company:${companyId}:marketplace`);
    };
  }, [companyId]);
}

/** Get a stable reference to the socket for imperative use */
export function useSocketRef() {
  const socketRef = useRef(getSocket());
  return socketRef;
}

/** Join an order messaging room and subscribe to new messages */
export function useOrderMessages(
  orderId: string | number | null,
  callbacks: {
    onMessage?: (data: ChatMessage) => void;
  },
  channel?: string,
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => { callbacksRef.current = callbacks; });

  useEffect(() => {
    if (!orderId) return;
    getSocket();

    // Join channel-scoped room if provided, otherwise legacy room
    if (channel) {
      joinChatRoom(orderId, channel);
    } else {
      joinMessagesRoom(orderId);
    }

    const unsubs: (() => void)[] = [];
    if (callbacksRef.current.onMessage) {
      unsubs.push(onNewMessage(callbacksRef.current.onMessage));
    }

    return () => {
      unsubs.forEach((u) => u());
      if (channel) {
        leaveRoom(`order:${orderId}:chat:${channel}`);
      } else {
        leaveRoom(`order:${orderId}:messages`);
      }
    };
  }, [orderId, channel]);
}
