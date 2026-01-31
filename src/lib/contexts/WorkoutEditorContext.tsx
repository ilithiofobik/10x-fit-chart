/**
 * Workout Editor Context
 *
 * React Context for sharing workout editor state and actions across components.
 */

import { createContext } from "react";
import type { WorkoutEditorState } from "../hooks/workoutEditorReducer";
import type { WorkoutEditorActions } from "../hooks/useWorkoutEditor";

/**
 * Context value type
 */
export interface WorkoutEditorContextValue {
  state: WorkoutEditorState;
  actions: WorkoutEditorActions;
}

/**
 * Workout Editor Context
 */
export const WorkoutEditorContext = createContext<WorkoutEditorContextValue | null>(null);
