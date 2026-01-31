/**
 * History List Reducer
 *
 * Handles all state mutations for the workout history list feature.
 */

import type { HistoryListState, HistoryFilters, WorkoutListItemDTO, PaginationDTO, ExerciseDTO } from "../../types";

/**
 * Action types for history list reducer
 */
export type HistoryListActionType =
  | { type: "LOAD_WORKOUTS_START" }
  | { type: "LOAD_WORKOUTS_SUCCESS"; payload: { workouts: WorkoutListItemDTO[]; pagination: PaginationDTO } }
  | { type: "LOAD_MORE_START" }
  | { type: "LOAD_MORE_SUCCESS"; payload: { workouts: WorkoutListItemDTO[]; pagination: PaginationDTO } }
  | { type: "LOAD_WORKOUTS_ERROR"; payload: string }
  | { type: "SET_FILTERS"; payload: HistoryFilters }
  | { type: "RESET_FILTERS" }
  | { type: "SET_AVAILABLE_EXERCISES"; payload: ExerciseDTO[] };

/**
 * Initial state for history list
 */
export const getInitialState = (): HistoryListState => ({
  workouts: [],
  pagination: {
    total: 0,
    limit: 20,
    offset: 0,
    has_more: false,
  },
  filters: {
    start_date: null,
    end_date: null,
    exercise_id: null,
  },
  availableExercises: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
});

/**
 * History List Reducer
 */
export const historyListReducer = (state: HistoryListState, action: HistoryListActionType): HistoryListState => {
  switch (action.type) {
    case "LOAD_WORKOUTS_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "LOAD_WORKOUTS_SUCCESS":
      return {
        ...state,
        workouts: action.payload.workouts,
        pagination: action.payload.pagination,
        isLoading: false,
        error: null,
      };

    case "LOAD_MORE_START":
      return {
        ...state,
        isLoadingMore: true,
        error: null,
      };

    case "LOAD_MORE_SUCCESS":
      return {
        ...state,
        workouts: [...state.workouts, ...action.payload.workouts],
        pagination: action.payload.pagination,
        isLoadingMore: false,
        error: null,
      };

    case "LOAD_WORKOUTS_ERROR":
      return {
        ...state,
        isLoading: false,
        isLoadingMore: false,
        error: action.payload,
      };

    case "SET_FILTERS":
      return {
        ...state,
        filters: action.payload,
        pagination: {
          ...state.pagination,
          offset: 0, // Reset offset when filters change
        },
      };

    case "RESET_FILTERS":
      return {
        ...state,
        filters: getInitialState().filters,
        pagination: {
          ...state.pagination,
          offset: 0,
        },
      };

    case "SET_AVAILABLE_EXERCISES":
      return {
        ...state,
        availableExercises: action.payload,
      };

    default:
      return state;
  }
};
