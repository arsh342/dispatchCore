/* eslint-disable react-hooks/set-state-in-effect -- All hooks here use the standard fetch-on-mount pattern via useEffect + refetch callback */
import { useState, useEffect, useCallback } from "react";
import type { MarketplaceOrder, Bid, MarketplaceStats, MarketplaceSortBy } from "@/types/dispatcher/marketplace";
import {
  fetchUnassignedOrders,
  fetchListedOrders,
  fetchBids,
  fetchMarketplaceStats,
  respondToBid,
  listOrderOnMarketplace,
} from "@/services/dispatcher/marketplace";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Dispatcher: orders they can list on the marketplace */
export function useUnassignedOrders() {
  const [state, setState] = useState<AsyncState<MarketplaceOrder[]>>({ data: null, loading: true, error: null });

  const refetch = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchUnassignedOrders();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}

/** Dispatcher: orders already listed on the marketplace */
export function useListedOrders(sortBy?: MarketplaceSortBy) {
  const [state, setState] = useState<AsyncState<MarketplaceOrder[]>>({ data: null, loading: true, error: null });

  const refetch = useCallback(async (sort?: MarketplaceSortBy) => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchListedOrders(sort ?? sortBy);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [sortBy]);

  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}

/** Dispatcher: list an unassigned order on marketplace */
export function useListOrder() {
  const [loading, setLoading] = useState(false);

  const listOrder = useCallback(async (orderId: string, price: number) => {
    setLoading(true);
    try {
      const result = await listOrderOnMarketplace(orderId, price);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  return { listOrder, loading };
}

/** Dispatcher: incoming bids (optionally scoped to a single order) */
export function useBids(orderId?: string) {
  const [state, setState] = useState<AsyncState<Bid[]>>({ data: null, loading: true, error: null });

  const refetch = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchBids(orderId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [orderId]);

  useEffect(() => { refetch(); }, [refetch]);

  const respond = useCallback(async (bidId: string, action: "accepted" | "rejected") => {
    await respondToBid(bidId, action);
    setState((prev) => ({
      ...prev,
      data: prev.data?.map((b) => (b.id === bidId ? { ...b, status: action } : b)) ?? null,
    }));
  }, []);

  return { ...state, refetch, respond };
}

/** Marketplace stats */
export function useMarketplaceStats() {
  const [state, setState] = useState<AsyncState<MarketplaceStats>>({ data: null, loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMarketplaceStats();
        setState({ data, loading: false, error: null });
      } catch (err) {
        setState({ data: null, loading: false, error: (err as Error).message });
      }
    })();
  }, []);

  return state;
}
