# Workout Logger Components

Kompletny zestaw komponentów do logowania treningów w aplikacji 10xFitChart.

## Struktura

```
workout-logger/
├── index.ts                      # Barrel exports
├── types.ts                      # TypeScript type definitions
├── WorkoutLoggerProvider.tsx     # Main provider with context
├── WorkoutHeader.tsx             # Date picker and notes
├── QuickActions.tsx              # Quick action buttons
├── ExerciseCombobox.tsx          # Exercise selection with search
├── ExerciseList.tsx              # List of exercises
├── ExerciseCard.tsx              # Single exercise card
├── ExerciseHeader.tsx            # Exercise name and type badge
├── SetTable.tsx                  # Table of sets
├── SetRow.tsx                    # Polymorphic set row
└── WorkoutActions.tsx            # Save/Cancel buttons
```

## Kluczowe funkcje

### 1. Zarządzanie stanem
- React Context API dla globalnego stanu
- Custom reducer dla immutable updates
- localStorage persistence z debouncing (500ms)
- Auto-save draft przy każdej zmianie

### 2. Polimorfizm typów ćwiczeń
- **Strength**: weight (kg) + reps
- **Cardio**: distance (km) + time (min → seconds)
- Dynamiczne pola w zależności od typu
- Walidacja specyficzna dla typu

### 3. Keyboard-first UX
- Tab navigation między polami
- Enter w ostatnim polu dodaje nową serię
- Auto-focus na nowych polach
- Brak keyboard traps

### 4. Smart Features
- Copy last workout (GET /api/workouts/latest)
- Inline exercise creation
- Backdating support (past dates only)
- Auto-save to localStorage

### 5. Walidacja
- Real-time field validation
- Visual feedback (red borders)
- Form-level validation before save
- Server-side error handling

## Usage

```tsx
import { WorkoutLoggerProvider } from '@/components/workout-logger';

// In Astro page
<WorkoutLoggerProvider client:load />
```

## API Integration

### Endpoints używane:
- `GET /api/exercises` - Pobieranie listy ćwiczeń
- `POST /api/exercises` - Tworzenie nowego ćwiczenia
- `GET /api/workouts/latest` - Pobieranie ostatniego treningu
- `POST /api/workouts` - Zapisywanie treningu

## State Management

### WorkoutLoggerState
```typescript
{
  date: string;              // YYYY-MM-DD
  notes: string | null;
  exercises: WorkoutExercise[];
  availableExercises: ExerciseDTO[];
  isLoadingExercises: boolean;
  isSaving: boolean;
}
```

### WorkoutLoggerActions
- `setDate(date: string)`
- `setNotes(notes: string | null)`
- `addExercise(exercise: ExerciseDTO)`
- `removeExercise(exerciseId: string)`
- `addSet(exerciseId: string)`
- `removeSet(exerciseId: string, setIndex: number)`
- `updateSet(exerciseId, setIndex, data)`
- `loadTemplate(template: WorkoutDetailsDTO)`
- `resetWorkout()`
- `saveWorkout()` - Async

## Accessibility

- ARIA labels na wszystkich inputach
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Error states z aria-invalid

## Performance

- React.memo nie jest potrzebne (komponenty lekkie)
- useCallback dla event handlers
- Debounced localStorage save
- Optimistic UI updates
