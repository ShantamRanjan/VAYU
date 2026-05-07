import { useQuery } from "@tanstack/react-query";
import {
  fetchWindForecast,
  fetchWindAlerts,
  fetchWindAccuracy,
  type WindForecastResponse,
  type WindAlertsResponse,
  type WindAccuracyResponse,
} from "@/lib/api";

const STALE = 60_000; // 60s

export function useWindForecastApi() {
  return useQuery<WindForecastResponse>({
    queryKey: ["vayu", "wind", "forecast"],
    queryFn: fetchWindForecast,
    staleTime: STALE,
    retry: 1,
  });
}

export function useWindAlertsApi() {
  return useQuery<WindAlertsResponse>({
    queryKey: ["vayu", "wind", "alerts"],
    queryFn: fetchWindAlerts,
    staleTime: STALE,
    retry: 1,
  });
}

export function useWindAccuracyApi() {
  return useQuery<WindAccuracyResponse>({
    queryKey: ["vayu", "wind", "accuracy"],
    queryFn: fetchWindAccuracy,
    staleTime: STALE,
    retry: 1,
  });
}
