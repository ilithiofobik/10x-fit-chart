# Exercises View - Struktura Plików

```
src/
├── pages/
│   └── app/
│       └── exercises.astro          ← Strona widoku (routing + autoryzacja)
│
├── components/
│   └── exercises/                   ← Moduł komponentów Exercises
│       ├── index.ts                 ← Eksport wszystkich komponentów
│       ├── README.md                ← Dokumentacja modułu
│       │
│       ├── ExerciseManager.tsx      ← Główny kontener (state + logic)
│       │   ├── useState (ExercisesViewState)
│       │   ├── useEffect (fetchExercises)
│       │   ├── useMemo (filteredExercises)
│       │   └── Handlers (CRUD operations)
│       │
│       ├── ExerciseHeader.tsx       ← Nagłówek (tytuł + przycisk Add)
│       ├── ExerciseFilters.tsx      ← Filtry (search + type)
│       │   ├── Search Input (debounce 300ms)
│       │   └── Type Select (All/Strength/Cardio)
│       │
│       ├── ExerciseList.tsx         ← Lista kontener
│       │   ├── Loading state (skeleton)
│       │   ├── Empty state (no results)
│       │   └── Success state (cards)
│       │
│       ├── ExerciseCard.tsx         ← Karta ćwiczenia
│       │   ├── Name + Badges
│       │   └── Actions Menu (Edit/Archive)
│       │
│       ├── ExerciseFormDialog.tsx   ← Dialog Create/Edit
│       │   ├── Name Input (validation)
│       │   ├── Type Select (disabled in edit)
│       │   └── Submit/Cancel
│       │
│       └── ConfirmArchiveDialog.tsx ← Dialog Archive
│           ├── Warning message
│           └── Confirm/Cancel
│
└── types.ts                         ← Typy TypeScript
    ├── ExercisesViewState
    ├── ExerciseTypeFilter
    ├── ExerciseFormData
    └── Props interfaces (7x)
```

## Hierarchia komponentów (runtime)

```
exercises.astro (Astro Layout)
│
└── ExerciseManager (React, client:load)
    │
    ├─┬ ExerciseHeader
    │ └── Button (Shadcn/ui)
    │
    ├─┬ ExerciseFilters
    │ ├── Input (Shadcn/ui)
    │ └── Select (Shadcn/ui)
    │
    ├─┬ ExerciseList
    │ └── ExerciseCard[] (loop)
    │     ├── Card (Shadcn/ui)
    │     ├── Badge (Shadcn/ui)
    │     └── DropdownMenu (Shadcn/ui)
    │
    ├─┬ ExerciseFormDialog
    │ ├── Dialog (Shadcn/ui)
    │ ├── Input (Shadcn/ui)
    │ ├── Select (Shadcn/ui)
    │ └── Button (Shadcn/ui)
    │
    └─┬ ConfirmArchiveDialog
      ├── AlertDialog (Shadcn/ui)
      └── Button (Shadcn/ui)
```

## Data Flow

```
API Endpoints
    ↓
ExerciseManager (state)
    ↓
    ├→ ExerciseHeader → onAddClick → openCreateDialog()
    │
    ├→ ExerciseFilters → onSearchChange → updateSearchQuery()
    │                  → onTypeFilterChange → updateTypeFilter()
    │
    ├→ ExerciseList → onEdit → openEditDialog(exercise)
    │              → onArchive → openArchiveDialog(exercise)
    │
    ├→ ExerciseFormDialog → onSubmit → handleCreateExercise()
    │                                 → handleUpdateExercise()
    │
    └→ ConfirmArchiveDialog → onConfirm → handleArchiveExercise()
```

## State Management

```typescript
ExercisesViewState {
  // Data
  exercises: ExerciseDTO[]
  
  // Filters
  searchQuery: string
  typeFilter: 'all' | 'strength' | 'cardio'
  
  // UI States
  isLoading: boolean
  error: string | null
  
  // Dialogs
  formDialog: {
    open: boolean
    mode: 'create' | 'edit'
    exercise: ExerciseDTO | null
    isSubmitting: boolean
  }
  
  archiveDialog: {
    open: boolean
    exercise: ExerciseDTO | null
    isDeleting: boolean
  }
}
```

## API Integration

```
GET    /api/exercises              → fetchExercises()
POST   /api/exercises              → handleCreateExercise()
PUT    /api/exercises/:id          → handleUpdateExercise()
DELETE /api/exercises/:id          → handleArchiveExercise()
```

## Bundle Size

```
ExerciseManager.js    14.05 kB (gzip: 4.57 kB)  ← State + Logic
ExerciseList.js       28.43 kB (gzip: 9.61 kB)  ← UI Components
```
