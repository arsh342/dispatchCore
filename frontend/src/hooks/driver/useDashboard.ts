/* eslint-disable react-hooks/set-state-in-effect -- All hooks here use the standard fetch-on-mount pattern via useEffect + refetch callback */
import { useState, useEffect, useCallback } from "react";
import type {
  DriverStats,
  DriverUser,
  ActiveDelivery,
  RecentBid,
  EarningsChart,
} from "@/types/driver/dashboard";
import {
  fetchDriverUser,
  fetchDriverStats,
  fetchActiveDeliveries,
  fetchCompletedDeliveries,
  fetchRecentBids,
  fetchEarningsChart,
} from "@/services/driver/dashboard";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useDriverUser() {
  const [state, setState] = useState<AsyncState<DriverUser>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDriverUser();
        setState({ data, loading: false, error: null });
      } catch (err) {
        setState({ data: null, loading: false, error: (err as Error).message });
      }
    })();
  }, []);

  return state;
}

export function useDriverStats() {
  const [state, setState] = useState<AsyncState<DriverStats>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchDriverStats();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);
  return { ...state, refetch };
}

export function useActiveDeliveries() {
  const [state, setState] = useState<AsyncState<ActiveDelivery[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchActiveDeliveries();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);
  return { ...state, refetch };
}

export function useCompletedDeliveries() {
  const [state, setState] = useState<AsyncState<ActiveDelivery[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchCompletedDeliveries();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);
  return { ...state, refetch };
}

export function useRecentBids() {
  const [state, setState] = useState<AsyncState<RecentBid[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await fetchRecentBids();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);
  return { ...state, refetch };
}

export function useEarningsChart() {
  const [state, setState] = useState<AsyncState<EarningsChart[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEarningsChart();
        setState({ data, loading: false, error: null });
      } catch (err) {
        setState({ data: null, loading: false, error: (err as Error).message });
      }
    })();
  }, []);

  return state;
}
