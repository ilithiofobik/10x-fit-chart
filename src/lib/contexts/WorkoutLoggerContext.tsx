/**
 * Workout Logger Context
 * 
 * Provides state management for the workout logger feature using React Context API.
 */

import { createContext } from "react";
import type { WorkoutLoggerState, WorkoutLoggerActions } from "../../components/workout-logger/types";

/**
 * Context value type
 */
export interface WorkoutLoggerContextValue {
  state: WorkoutLoggerState;
  actions: WorkoutLoggerActions;
}

/**
 * Workout Logger Context
 */
export const WorkoutLoggerContext = createContext<WorkoutLoggerContextValue | null>(null);
