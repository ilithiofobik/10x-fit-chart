/**
 * History List Context
 *
 * React Context for sharing workout history list state and actions across components.
 */

import { createContext } from "react";
import type { HistoryListState } from "../../types";
import type { HistoryListActions } from "../hooks/useHistoryList";

/**
 * Context value type
 */
export interface HistoryListContextValue {
  state: HistoryListState;
  actions: HistoryListActions;
}

/**
 * History List Context
 */
export const HistoryListContext = createContext<HistoryListContextValue | null>(null);
