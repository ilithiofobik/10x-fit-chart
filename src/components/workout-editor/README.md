# Workout Editor Components

This directory contains all components related to the Workout Editor feature.

## Overview

The Workout Editor feature allows users to edit existing workouts from their history. It re-uses most components from the Workout Logger but adds update and delete capabilities.

## Components

### WorkoutEditorProvider

Main provider component that manages state for the entire workout editor using React Context API.

**Props:**

- `workoutId`: UUID of the workout to edit

**Usage:**

```tsx
<WorkoutEditorProvider workoutId="uuid-here" client:load />
```

**Features:**

- Fetches workout details on mount
- Manages editor state (extends WorkoutLoggerState)
- Provides save (PUT) and delete (DELETE) actions
- Re-uses ExerciseCombobox and ExerciseList from workout-logger
- Loading and error states

### EditWorkoutHeader

Header section for the editor with date picker, notes textarea, and metadata.

**Props:**

- `date`: Current workout date
- `notes`: Current notes
- `createdAt`: Original creation timestamp (read-only)
- `onDateChange`: Callback for date changes
- `onNotesChange`: Callback for notes changes

**Features:**

- Date input with max=today validation
- Notes textarea with character counter (max 1000)
- Display of original creation timestamp
- Validation error messages (date in future, notes too long)

### WorkoutEditorActions

Action buttons panel at the bottom of the form.

**Props:**

- `isValid`: Whether form is valid for saving
- `isSaving`: Save operation in progress
- `isDeleting`: Delete operation in progress
- `onSave`: Callback to save changes
- `onDelete`: Callback to delete workout
- `onCancel`: Callback to cancel and return

**Features:**

- Save button (disabled when invalid or saving)
- Delete button with AlertDialog confirmation
- Cancel button with unsaved changes warning
- Loading states with spinners

## State Management

### useWorkoutEditor Hook

Custom hook managing all editor state and API calls.

**Parameters:**

- `workoutId`: UUID of workout to edit

**Returns:**

- `state`: Current editor state (WorkoutEditorState)
- `actions`: Available actions

**Actions:**

- `setDate(date)`: Update workout date
- `setNotes(notes)`: Update workout notes
- `addExercise(exercise)`: Add exercise to workout
- `removeExercise(exerciseId)`: Remove exercise
- `addSet(exerciseId)`: Add set to exercise
- `removeSet(exerciseId, setIndex)`: Remove set
- `updateSet(exerciseId, setIndex, data)`: Update set values
- `saveWorkout()`: Save changes (PUT request)
- `deleteWorkout()`: Delete workout (DELETE request)
- `cancelEdit()`: Cancel and navigate back

### workoutEditorReducer

Reducer handling all state mutations. Extends `workoutLoggerReducer` with editor-specific actions.

**Additional Actions:**

- `LOAD_WORKOUT_START`: Start loading workout
- `LOAD_WORKOUT_SUCCESS`: Workout loaded successfully
- `LOAD_WORKOUT_ERROR`: Error loading workout
- `SET_DELETING`: Set deleting state

## API Integration

### Endpoints Used

- `GET /api/workouts/:id` - Fetch workout details
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout
- `GET /api/exercises` - Available exercises for adding new

### Request/Response Types

**PUT Body (UpdateWorkoutCommand):**

```typescript
{
  date?: string;
  notes?: string | null;
  sets: UpdateWorkoutSetCommand[];
}
```

**DELETE Response:**

```typescript
{
  message: string;
}
```

## Re-used Components

From `workout-logger`:

- `ExerciseCombobox` - For adding new exercises
- `ExerciseList` - For displaying and editing exercise sets
- `ExerciseCard` - Individual exercise card
- `SetTable` - Table of sets
- `SetRow` - Editable set row

These components work seamlessly with the editor state.

## Validation

### Client-Side Validation

- Date cannot be in the future
- Notes max 1000 characters
- At least 1 exercise required
- Each exercise must have at least 1 set
- All sets must be complete:
  - Strength: weight and reps required
  - Cardio: distance and time required

### Error Handling

- 404: Workout not found → redirect to /app/history
- 400: Validation error → show toast with error message
- 500: Server error → show generic error toast
- Network error: Show connection error toast

## Navigation Flow

1. User clicks "Edytuj" on workout card in history list
2. Navigate to `/app/history/[id]`
3. Workout loads (loading state shown)
4. User edits workout
5. Save → redirect to `/app/history` with success toast
6. Delete → confirm dialog → redirect to `/app/history` with success toast
7. Cancel → confirm if unsaved changes → redirect to `/app/history`

## Unsaved Changes Protection

When user tries to cancel:

- If no changes: Navigate immediately
- If changes exist: Show browser confirm dialog
- User can choose to stay or leave

## Styling

Consistent with the rest of the app:

- Card-based layout with borders
- Muted colors for metadata
- Loading spinners for async operations
- Destructive button variant for delete
- Form validation error states (red borders)

## Differences from Workout Logger

| Feature             | Workout Logger     | Workout Editor                |
| ------------------- | ------------------ | ----------------------------- |
| Mode                | Create new workout | Edit existing                 |
| API Call            | POST /api/workouts | PUT /api/workouts/:id         |
| Delete              | Not available      | DELETE with confirmation      |
| Draft saving        | localStorage       | No (edits existing DB record) |
| Created timestamp   | Not shown          | Shown in header               |
| Cancel behavior     | Clear form         | Navigate back with confirm    |
| "Copy last workout" | Available          | Not available                 |

## Future Improvements

- [ ] Autosave draft to localStorage
- [ ] Undo/redo functionality
- [ ] Duplicate workout (save as new)
- [ ] History of edits (audit log)
- [ ] Inline validation without submit
- [ ] Keyboard shortcuts (Ctrl+S to save)
