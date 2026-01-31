/**
 * History List Provider
 *
 * Main provider component that wraps the workout history list feature and provides
 * state management via Context API.
 */

import { useContext } from "react";
import { HistoryListContext } from "../../lib/contexts/HistoryListContext";
import { useHistoryList } from "../../lib/hooks/useHistoryList";
import { HistoryListHeader } from "./HistoryListHeader";
import { HistoryList } from "./HistoryList";
import { EmptyState } from "./EmptyState";

/**
 * Hook to use history list context
 */
export const useHistoryListContext = () => {
  const context = useContext(HistoryListContext);
  if (!context) {
    throw new Error("useHistoryListContext must be used within HistoryListProvider");
  }
  return context;
};

/**
 * History List Provider Component
 */
export const HistoryListProvider = () => {
  const { state, actions } = useHistoryList();

  // Show empty state if no workouts and not loading
  const showEmptyState = !state.isLoading && state.workouts.length === 0 && !state.error;

  return (
    <HistoryListContext.Provider value={{ state, actions }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <HistoryListHeader
          filters={state.filters}
          exercises={state.availableExercises}
          onFilterChange={actions.applyFilters}
          onResetFilters={actions.resetFilters}
        />

        {state.error && (
          <div className="mt-8 p-6 border border-destructive/50 bg-destructive/10 rounded-lg text-center">
            <p className="text-destructive font-medium mb-4">{state.error}</p>
            <button
              onClick={actions.reload}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

        {showEmptyState ? (
          <EmptyState />
        ) : (
          <HistoryList
            workouts={state.workouts}
            pagination={state.pagination}
            isLoading={state.isLoading}
            isLoadingMore={state.isLoadingMore}
            onLoadMore={actions.loadMore}
          />
        )}
      </div>
    </HistoryListContext.Provider>
  );
};
