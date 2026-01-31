/**
 * useHistoryList Hook
 *
 * Custom hook that manages workout history list state and API calls.
 */

import { useReducer, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { historyListReducer, getInitialState } from "./historyListReducer";
import type { HistoryListState, HistoryFilters, ListWorkoutsResponse, ListExercisesResponse } from "../../types";

/**
 * Actions returned by useHistoryList hook
 */
export interface HistoryListActions {
  loadMore: () => Promise<void>;
  applyFilters: (filters: HistoryFilters) => Promise<void>;
  resetFilters: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Build query string from filters and pagination
 */
const buildQueryString = (filters: HistoryFilters, limit: number, offset: number): string => {
  const params = new URLSearchParams();
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());
  params.append("order", "desc"); // Always newest first

  if (filters.start_date) {
    params.append("start_date", filters.start_date);
  }

  if (filters.end_date) {
    params.append("end_date", filters.end_date);
  }

  // Note: exercise_id filter needs to be handled client-side or backend needs to be extended
  // For now, we'll filter on the client side in the component

  return params.toString();
};

/**
 * Fetch workouts from API
 */
const fetchWorkouts = async (filters: HistoryFilters, limit: number, offset: number): Promise<ListWorkoutsResponse> => {
  const queryString = buildQueryString(filters, limit, offset);
  const response = await fetch(`/api/workouts?${queryString}`);

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch workouts");
  }

  return response.json();
};

/**
 * Fetch available exercises for filtering
 */
const fetchExercises = async (): Promise<ListExercisesResponse> => {
  const response = await fetch("/api/exercises?include_archived=false");

  if (!response.ok) {
    throw new Error("Failed to fetch exercises");
  }

  return response.json();
};

/**
 * Custom hook for workout history list
 */
export const useHistoryList = () => {
  const [state, dispatch] = useReducer(historyListReducer, getInitialState());

  // Fetch available exercises on mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchExercises();
        dispatch({ type: "SET_AVAILABLE_EXERCISES", payload: data.exercises });
      } catch (error) {
        console.error("Error fetching exercises:", error);
        toast.error("Nie udało się załadować listy ćwiczeń");
      }
    };

    loadExercises();
  }, []);

  // Fetch initial workouts on mount and when filters change
  useEffect(() => {
    const loadWorkouts = async () => {
      dispatch({ type: "LOAD_WORKOUTS_START" });

      try {
        const data = await fetchWorkouts(state.filters, state.pagination.limit, 0);
        dispatch({
          type: "LOAD_WORKOUTS_SUCCESS",
          payload: {
            workouts: data.workouts,
            pagination: data.pagination,
          },
        });
      } catch (error) {
        console.error("Error loading workouts:", error);
        dispatch({ type: "LOAD_WORKOUTS_ERROR", payload: "Nie udało się załadować treningów" });
        toast.error("Nie udało się załadować treningów");
      }
    };

    loadWorkouts();
  }, [state.filters]); // Reload when filters change

  // Actions
  const actions: HistoryListActions = {
    loadMore: useCallback(async () => {
      if (!state.pagination.has_more || state.isLoadingMore) {
        return;
      }

      dispatch({ type: "LOAD_MORE_START" });

      try {
        const newOffset = state.pagination.offset + state.pagination.limit;
        const data = await fetchWorkouts(state.filters, state.pagination.limit, newOffset);

        dispatch({
          type: "LOAD_MORE_SUCCESS",
          payload: {
            workouts: data.workouts,
            pagination: data.pagination,
          },
        });
      } catch (error) {
        console.error("Error loading more workouts:", error);
        dispatch({ type: "LOAD_WORKOUTS_ERROR", payload: "Nie udało się załadować kolejnych treningów" });
        toast.error("Nie udało się załadować kolejnych treningów");
      }
    }, [state.filters, state.pagination, state.isLoadingMore]),

    applyFilters: useCallback(async (filters: HistoryFilters) => {
      // Validate date range
      if (filters.start_date && filters.end_date) {
        const startDate = new Date(filters.start_date);
        const endDate = new Date(filters.end_date);

        if (startDate > endDate) {
          toast.error("Data początkowa nie może być późniejsza niż data końcowa");
          return;
        }
      }

      dispatch({ type: "SET_FILTERS", payload: filters });
      // useEffect will trigger reload
    }, []),

    resetFilters: useCallback(async () => {
      dispatch({ type: "RESET_FILTERS" });
      // useEffect will trigger reload
    }, []),

    reload: useCallback(async () => {
      dispatch({ type: "LOAD_WORKOUTS_START" });

      try {
        const data = await fetchWorkouts(state.filters, state.pagination.limit, 0);
        dispatch({
          type: "LOAD_WORKOUTS_SUCCESS",
          payload: {
            workouts: data.workouts,
            pagination: data.pagination,
          },
        });
      } catch (error) {
        console.error("Error reloading workouts:", error);
        dispatch({ type: "LOAD_WORKOUTS_ERROR", payload: "Nie udało się przeładować treningów" });
        toast.error("Nie udało się przeładować treningów");
      }
    }, [state.filters, state.pagination.limit]),
  };

  return {
    state,
    actions,
  };
};
