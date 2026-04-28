/**
 * useRealtime — React hooks for Firebase RTDB real-time subscriptions
 *
 * Drop-in replacement for the old useSocket hooks.
 * Same API signatures, backed by Firebase RTDB instead of Socket.io.
 */

import { useEffect, useRef } from "react";
import {
  onDriverLocation,
  onOrderEvent,
  onCompanyEvent,
  onDriverEvent,
  onMarketplaceEvent,
  onChatMessage,
  type LocationUpdate,
  type RealtimeEvent,
  type BidEvent,
  type ChatMessage,
} from "@/services/shared/realtime";

/** Subscribe to live location + status updates for an order's driver */
export function useOrderTracking(
  orderId: string | number | null,
  callbacks: {
    onLocation?: (data: LocationUpdate) => void;
    onStatusChange?: (data: RealtimeEvent) => void;
  },
  driverId?: string | number | null,
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!orderId) return;

    const unsubs: (() => void)[] = [];

    // Subscribe to driver location if we know the driver
    if (driverId && callbacksRef.current.onLocation) {
      unsubs.push(
        onDriverLocation(driverId, callbacksRef.current.onLocation),
      );
    }

    // Subscribe to order status changes
    if (callbacksRef.current.onStatusChange) {
      unsubs.push(
        onOrderEvent(orderId, callbacksRef.current.onStatusChange),
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [orderId, driverId]);
}

/** Subscribe to company dispatcher events (assignments) */
export function useCompanyRoom(companyId: string | number | null) {
  useEffect(() => {
    if (!companyId) return;

    const unsub = onCompanyEvent(
      companyId,
      "assignment:created",
      () => {
        // Event received — consumers can add specific handling via other hooks
      },
    );

    return () => {
      unsub();
    };
  }, [companyId]);
}

/** Subscribe to a driver's personal event feed */
export function useDriverRoom(driverId: string | number | null) {
  useEffect(() => {
    if (!driverId) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onDriverEvent(driverId, "assignment:new", () => {}),
    );
    unsubs.push(
      onDriverEvent(driverId, "bid:accepted", () => {}),
    );
    unsubs.push(
      onDriverEvent(driverId, "bid:rejected", () => {}),
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [driverId]);
}

/** Subscribe to marketplace events (bids, listings) */
export function useMarketplaceRoom(
  companyId: string | number | null,
  callbacks?: {
    onNewBid?: (data: BidEvent) => void;
    onBidStatus?: (data: BidEvent) => void;
  },
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!companyId) return;

    const unsubs: (() => void)[] = [];

    if (callbacksRef.current?.onNewBid) {
      unsubs.push(
        onMarketplaceEvent(
          companyId,
          "bid:new",
          callbacksRef.current.onNewBid as (data: RealtimeEvent) => void,
        ),
      );
    }

    if (callbacksRef.current?.onBidStatus) {
      unsubs.push(
        onMarketplaceEvent(
          companyId,
          "bid:statusChanged",
          callbacksRef.current.onBidStatus as (data: RealtimeEvent) => void,
        ),
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [companyId]);
}

/** Subscribe to chat messages for a specific order + channel */
export function useOrderMessages(
  orderId: string | number | null,
  callbacks: {
    onMessage?: (data: ChatMessage) => void;
  },
  channel?: string,
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!orderId || !channel) return;

    const unsubs: (() => void)[] = [];

    if (callbacksRef.current.onMessage) {
      unsubs.push(
        onChatMessage(orderId, channel, callbacksRef.current.onMessage),
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [orderId, channel]);
}
