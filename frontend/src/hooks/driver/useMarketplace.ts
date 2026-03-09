import { useState, useEffect, useCallback } from "react";
import type { DriverMarketplaceListing, DriverBid, DriverMarketplaceStats, DriverSortBy } from "@/types/driver/marketplace";
import {
  fetchMarketplaceListings,
  fetchMyBids,
  fetchDriverMarketplaceStats,
  placeBid,
} from "@/services/driver/marketplace";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Driver: browse available orders */
export function useDriverListings(sortBy?: DriverSortBy) {
  const [state, setState] = useState<AsyncState<DriverMarketplaceListing[]>>({ data: null, loading: true, error: null });

  const refetch = useCallback(async (sort?: DriverSortBy) => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchMarketplaceListings(sort ?? sortBy);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [sortBy]);

  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}

/** Driver: place a bid */
export function usePlaceBid() {
  const [loading, setLoading] = useState(false);

  const submitBid = useCallback(async (orderId: string, price: number, message?: string) => {
    setLoading(true);
    try {
      const result = await placeBid(orderId, price, message);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  return { submitBid, loading };
}

/** Driver: my bids list */
export function useMyBids() {
  const [state, setState] = useState<AsyncState<DriverBid[]>>({ data: null, loading: true, error: null });

  const refetch = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchMyBids();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}

/** Driver: marketplace stats */
export function useDriverMarketplaceStats() {
  const [state, setState] = useState<AsyncState<DriverMarketplaceStats>>({ data: null, loading: true, error: null });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDriverMarketplaceStats();
        setState({ data, loading: false, error: null });
      } catch (err) {
        setState({ data: null, loading: false, error: (err as Error).message });
      }
    })();
  }, []);

  return state;
}
