import { useState, useEffect, useCallback } from "react";
import type { Shipment, DashboardStats, DashboardUser, DashboardFilters } from "@/types/dispatcher/dashboard";
import {
  fetchDashboardStats,
  fetchDashboardUser,
  fetchShipments,
} from "@/services/dispatcher/dashboard";

/* ─── Generic async state ─── */
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/* ─── useDashboardStats ─── */
export function useDashboardStats() {
  const [state, setState] = useState<AsyncState<DashboardStats>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchDashboardStats();
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

/* ─── useDashboardUser ─── */
export function useDashboardUser() {
  const [state, setState] = useState<AsyncState<DashboardUser>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDashboardUser();
        setState({ data, loading: false, error: null });
      } catch (err) {
        setState({ data: null, loading: false, error: (err as Error).message });
      }
    })();
  }, []);

  return state;
}

/* ─── useShipments ─── */
export function useShipments(filters?: DashboardFilters) {
  const [state, setState] = useState<AsyncState<Shipment[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async (newFilters?: DashboardFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchShipments(newFilters ?? filters);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [filters]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
