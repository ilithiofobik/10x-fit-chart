# Plan implementacji widoku Logger Treningowy

## 1. Przegląd

Logger Treningowy to główny widok do wprowadzania danych treningowych w aplikacji 10xFitChart. Jego celem jest umożliwienie użytkownikowi błyskawicznego wprowadzania danych za pomocą klawiatury ("keyboard-first"), z możliwością kopiowania ostatniego treningu, wyboru daty wstecznej i wprowadzania zarówno ćwiczeń siłowych (ciężar/powtórzenia), jak i cardio (dystans/czas).

Widok musi być wysoce responsywny, zachowywać stan w `localStorage` (ochrona przed F5), obsługiwać polimorfizm w wierszach serii (różne pola w zależności od typu ćwiczenia) oraz zapewniać agresywną nawigację klawiaturą (Tab, Enter).

## 2. Routing widoku

- **Ścieżka**: `/app/log`
- **Ochrona**: Dostępny tylko dla zalogowanych użytkowników (weryfikacja przez Astro middleware)
- **Layout**: Wykorzystuje wspólny `LayoutApp` z nawigacją

## 3. Struktura komponentów

Widok Logger Treningowy składa się z następującej hierarchii komponentów:

```
WorkoutLoggerPage (Astro Page)
└── WorkoutLoggerProvider (React Context Provider)
    ├── WorkoutHeader
    │   ├── DatePicker (Shadcn/ui)
    │   └── NotesTextarea
    ├── QuickActions
    │   └── CopyLastWorkoutButton
    ├── ExerciseList
    │   └── ExerciseCard (dla każdego ćwiczenia)
    │       ├── ExerciseHeader
    │       │   ├── ExerciseInfo (nazwa, typ)
    │       │   └── RemoveExerciseButton
    │       └── SetTable
    │           ├── SetRow (polimorficzny - strength/cardio)
    │           └── AddSetButton
    ├── ExerciseCombobox
    └── WorkoutActions
        ├── SaveWorkoutButton
        └── CancelButton
```

## 4. Szczegóły komponentów

### WorkoutLoggerPage (Astro Page)

- **Opis komponentu**: Główna strona widoku `/app/log`, renderowana przez Astro. Zapewnia SSR i osadzenie React Island z logiką loggera.
- **Główne elementy**:
  - Container strony z paddingiem i max-width
  - Tytuł strony "Nowy Trening"
  - Komponent `<WorkoutLoggerProvider client:load>`
- **Obsługiwane zdarzenia**: Brak (statyczny wrapper)
- **Warunki walidacji**: Weryfikacja autoryzacji użytkownika przez middleware
- **Typy**: Brak specyficznych
- **Propsy**: Brak

### WorkoutLoggerProvider (React Context Provider)

- **Opis komponentu**: Główny kontekst zarządzający stanem całego formularza loggera. Przechowuje strukturę treningu (data, notatki, lista ćwiczeń z seriami), synchronizuje stan z `localStorage`, udostępnia metody modyfikujące stan dla komponentów dzieci.
- **Główne elementy**:
  - React Context z wartościami: `workoutState`, `dispatch`, `actions`
  - Wrapper `<div>` renderujący wszystkie komponenty dzieci
  - useEffect do synchronizacji z `localStorage` (debounced)
  - useEffect do ładowania listy ćwiczeń z API przy montowaniu
- **Obsługiwane zdarzenia**:
  - Inicjalizacja: Ładowanie stanu z `localStorage` lub tworzenie pustego
  - Autoload exercises: Pobieranie listy ćwiczeń z `/api/exercises`
  - Autosave: Debounced zapis do `localStorage` przy każdej zmianie stanu
- **Warunki walidacji**: Brak (tylko orchestration)
- **Typy**: `WorkoutLoggerState`, `WorkoutLoggerActions`
- **Propsy**: `{ children: ReactNode }`

### WorkoutHeader

- **Opis komponentu**: Sekcja nagłówka formularza treningu, zawierająca pole daty (z możliwością backdatingu) i pole notatek.
- **Główne elementy**:
  - `<div>` container z flex layout
  - `DatePicker` (Shadcn/ui) do wyboru daty treningu
  - `Textarea` (Shadcn/ui) do notatek (opcjonalne, max 1000 znaków)
- **Obsługiwane zdarzenia**:
  - `onDateChange`: Aktualizacja daty w kontekście
  - `onNotesChange`: Aktualizacja notatek w kontekście
- **Warunki walidacji**:
  - Data nie może być w przyszłości
  - Data w formacie YYYY-MM-DD
  - Notatki max 1000 znaków
- **Typy**: `WorkoutHeaderProps`
- **Propsy**:
  ```typescript
  {
    date: string;
    notes: string | null;
    onDateChange: (date: string) => void;
    onNotesChange: (notes: string) => void;
  }
  ```

### QuickActions

- **Opis komponentu**: Sekcja z szybkimi akcjami, głównie przycisk "Kopiuj ostatni trening", który ładuje szablon z ostatniego treningu użytkownika.
- **Główne elementy**:
  - `<div>` container
  - `Button` (Shadcn/ui) "Kopiuj ostatni trening"
  - Loading state indicator podczas pobierania
- **Obsługiwane zdarzenia**:
  - `onClick`: Pobieranie ostatniego treningu z `/api/workouts/latest` i załadowanie do stanu
- **Warunki walidacji**:
  - Przycisk disabled gdy trening już zawiera ćwiczenia
  - Przycisk disabled podczas ładowania
- **Typy**: `QuickActionsProps`
- **Propsy**:
  ```typescript
  {
    onCopyLastWorkout: () => Promise<void>;
    hasExercises: boolean;
    isLoading: boolean;
  }
  ```

### ExerciseList

- **Opis komponentu**: Lista wszystkich ćwiczeń dodanych do treningu. Renderuje `ExerciseCard` dla każdego ćwiczenia w kolejności.
- **Główne elementy**:
  - `<div>` container z pionowym układem
  - Mapowanie przez tablicę ćwiczeń: `exercises.map(ex => <ExerciseCard key={ex.id} />)`
- **Obsługiwane zdarzenia**: Brak (przekazuje callbacki do dzieci)
- **Warunki walidacji**: Brak
- **Typy**: `ExerciseListProps`, `WorkoutExercise`
- **Propsy**:
  ```typescript
  {
    exercises: WorkoutExercise[];
    onRemoveExercise: (exerciseId: string) => void;
    onUpdateSet: (exerciseId: string, setIndex: number, data: Partial<SetData>) => void;
    onAddSet: (exerciseId: string) => void;
    onRemoveSet: (exerciseId: string, setIndex: number) => void;
  }
  ```

### ExerciseCard

- **Opis komponentu**: Karta pojedynczego ćwiczenia w treningu, zawierająca nazwę ćwiczenia, typ i tabelę z seriami. Kontener logiczny grupujący wszystkie serie danego ćwiczenia.
- **Główne elementy**:
  - `Card` (Shadcn/ui) jako container
  - `ExerciseHeader` z nazwą i przyciskiem usuwania
  - `SetTable` z wierszami serii
  - `AddSetButton` do dodawania nowych serii
- **Obsługiwane zdarzenia**:
  - Przekazywanie zdarzeń z SetTable do rodzica
  - Obsługa usuwania ćwiczenia
- **Warunki walidacji**:
  - Ćwiczenie musi mieć przynajmniej jedną serię (UI wskazówka, nie blokada)
- **Typy**: `ExerciseCardProps`, `WorkoutExercise`
- **Propsy**:
  ```typescript
  {
    exercise: WorkoutExercise;
    onRemove: () => void;
    onUpdateSet: (setIndex: number, data: Partial<SetData>) => void;
    onAddSet: () => void;
    onRemoveSet: (setIndex: number) => void;
  }
  ```

### ExerciseHeader

- **Opis komponentu**: Nagłówek karty ćwiczenia, wyświetlający nazwę ćwiczenia, typ (badge "Siłowe"/"Cardio") i przycisk usuwania.
- **Główne elementy**:
  - `<div>` z flex layout
  - `<h3>` z nazwą ćwiczenia
  - `Badge` (Shadcn/ui) z typem ćwiczenia
  - `Button` ikona (X) do usunięcia ćwiczenia
- **Obsługiwane zdarzenia**:
  - `onRemove`: Usunięcie ćwiczenia z treningu
- **Warunki walidacji**: Brak
- **Typy**: `ExerciseHeaderProps`
- **Propsy**:
  ```typescript
  {
    exerciseName: string;
    exerciseType: ExerciseType;
    onRemove: () => void;
  }
  ```

### SetTable

- **Opis komponentu**: Tabela serii dla danego ćwiczenia. Renderuje nagłówki kolumn (dynamiczne w zależności od typu) i wiersze SetRow dla każdej serii.
- **Główne elementy**:
  - `<table>` z Tailwind styling
  - `<thead>` z dynamicznymi nagłówkami (Ciężar/Powtórzenia dla siłowych, Dystans/Czas dla cardio)
  - `<tbody>` z mapowaniem serii: `sets.map((set, idx) => <SetRow key={idx} />)`
- **Obsługiwane zdarzenia**: Przekazywanie callbacks do SetRow
- **Warunki walidacji**: Brak (delegacja do SetRow)
- **Typy**: `SetTableProps`, `SetData`
- **Propsy**:
  ```typescript
  {
    exerciseType: ExerciseType;
    sets: SetData[];
    onUpdateSet: (setIndex: number, data: Partial<SetData>) => void;
    onRemoveSet: (setIndex: number) => void;
  }
  ```

### SetRow (Polimorficzny Komponent)

- **Opis komponentu**: Polimorficzny wiersz tabeli, który renderuje różne pola input w zależności od typu ćwiczenia (strength: weight/reps, cardio: distance/time). To kluczowy komponent dla szybkiego wprowadzania danych z klawiaturą.
- **Główne elementy**:
  - `<tr>` container
  - **Dla strength**:
    - `<td>` z `Input` type="number" dla ciężaru (step 0.5, min 0)
    - `<td>` z `Input` type="number" dla powtórzeń (step 1, min 1)
  - **Dla cardio**:
    - `<td>` z `Input` type="number" dla dystansu (step 0.01, min 0)
    - `<td>` z `Input` type="number" dla czasu w minutach (step 0.1, min 0, konwersja na sekundy)
  - `<td>` z `Button` ikona (trash) do usunięcia serii
- **Obsługiwane zdarzenia**:
  - `onChange`: Aktualizacja wartości pola i propagacja do rodzica
  - `onKeyDown`:
    - Enter w ostatnim polu → automatyczne dodanie nowej serii i focus
    - Tab naturalnie przechodzi między polami
  - `onRemove`: Usunięcie serii
- **Warunki walidacji**:
  - **Strength**:
    - `weight` >= 0, max 999.99
    - `reps` >= 1, integer
    - `distance` i `time` muszą być null
  - **Cardio**:
    - `distance` >= 0, max 999999.99
    - `time` >= 0, integer (sekundy)
    - `weight` i `reps` muszą być null
  - Walidacja wizualna: czerwona ramka przy błędnych wartościach
- **Typy**: `SetRowProps`, `SetData`, `ExerciseType`
- **Propsy**:
  ```typescript
  {
    exerciseType: ExerciseType;
    setIndex: number;
    setData: SetData;
    isLastSet: boolean;
    onUpdate: (data: Partial<SetData>) => void;
    onRemove: () => void;
    onEnterPressed: () => void;
  }
  ```

### ExerciseCombobox

- **Opis komponentu**: Zaawansowany komponent wyboru ćwiczenia z wyszukiwaniem i możliwością tworzenia nowego ćwiczenia inline. Bazuje na `Command` z Shadcn/ui.
- **Główne elementy**:
  - `Popover` (Shadcn/ui) jako wrapper
  - `Button` trigger z ikoną i tekstem "Dodaj ćwiczenie"
  - `Command` (Shadcn/ui) z:
    - `CommandInput` do wyszukiwania
    - `CommandList` z wynikami
    - `CommandGroup` dla aktywnych ćwiczeń
    - `CommandEmpty` z przyciskiem "Utwórz nowe ćwiczenie"
  - Modal do tworzenia nowego ćwiczenia (nazwa + typ)
- **Obsługiwane zdarzenia**:
  - `onSelect`: Dodanie wybranego ćwiczenia do treningu
  - `onCreateNew`: Otwarcie modala tworzenia
  - `onCreate`: Wysłanie POST `/api/exercises` i dodanie do treningu
- **Warunki walidacji**:
  - Wyszukiwanie: filtrowanie case-insensitive
  - Tworzenie: nazwa 1-100 znaków, unikalna, typ wymagany
- **Typy**: `ExerciseComboboxProps`, `ExerciseDTO`
- **Propsy**:
  ```typescript
  {
    exercises: ExerciseDTO[];
    onAddExercise: (exercise: ExerciseDTO) => void;
    onCreateExercise: (name: string, type: ExerciseType) => Promise<ExerciseDTO>;
  }
  ```

### WorkoutActions

- **Opis komponentu**: Sekcja z przyciskami akcji dla całego treningu (Zapisz, Anuluj).
- **Główne elementy**:
  - `<div>` container z flex layout
  - `Button` (Shadcn/ui) "Zapisz trening" (primary)
  - `Button` (Shadcn/ui) "Anuluj" (secondary)
- **Obsługiwane zdarzenia**:
  - `onSave`: Walidacja + wysłanie POST `/api/workouts`
  - `onCancel`: Potwierdzenie i czyszczenie stanu + localStorage
- **Warunki walidacji**:
  - Przycisk Zapisz disabled jeśli:
    - Brak ćwiczeń w treningu
    - Któreś ćwiczenie nie ma serii
    - Trwa zapisywanie (loading state)
    - Błędy walidacji w polach
- **Typy**: `WorkoutActionsProps`
- **Propsy**:
  ```typescript
  {
    onSave: () => Promise<void>;
    onCancel: () => void;
    isValid: boolean;
    isSaving: boolean;
  }
  ```

## 5. Typy

### Typy związane ze stanem loggera

```typescript
/**
 * Stan pojedynczej serii w formularzu
 */
interface SetData {
  // Strength fields
  weight: number | null;
  reps: number | null;
  // Cardio fields
  distance: number | null;
  time: number | null; // w sekundach
}

/**
 * Ćwiczenie w kontekście treningu (z przypisanymi seriami)
 */
interface WorkoutExercise {
  id: string; // temporary ID dla UI (nie exercise_id z bazy)
  exercise_id: string; // ID z tabeli exercises
  exercise_name: string;
  exercise_type: ExerciseType;
  sets: SetData[];
}

/**
 * Główny stan formularza loggera
 */
interface WorkoutLoggerState {
  date: string; // YYYY-MM-DD
  notes: string | null;
  exercises: WorkoutExercise[];
  availableExercises: ExerciseDTO[];
  isLoadingExercises: boolean;
  isSaving: boolean;
}

/**
 * Akcje dostępne w kontekście
 */
interface WorkoutLoggerActions {
  setDate: (date: string) => void;
  setNotes: (notes: string | null) => void;
  addExercise: (exercise: ExerciseDTO) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateSet: (exerciseId: string, setIndex: number, data: Partial<SetData>) => void;
  loadTemplate: (template: WorkoutDetailsDTO) => void;
  resetWorkout: () => void;
  saveWorkout: () => Promise<void>;
}
```

### Typy komponentów (Props)

```typescript
interface WorkoutHeaderProps {
  date: string;
  notes: string | null;
  onDateChange: (date: string) => void;
  onNotesChange: (notes: string) => void;
}

interface QuickActionsProps {
  onCopyLastWorkout: () => Promise<void>;
  hasExercises: boolean;
  isLoading: boolean;
}

interface ExerciseListProps {
  exercises: WorkoutExercise[];
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateSet: (exerciseId: string, setIndex: number, data: Partial<SetData>) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setIndex: number) => void;
}

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onRemove: () => void;
  onUpdateSet: (setIndex: number, data: Partial<SetData>) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
}

interface ExerciseHeaderProps {
  exerciseName: string;
  exerciseType: ExerciseType;
  onRemove: () => void;
}

interface SetTableProps {
  exerciseType: ExerciseType;
  sets: SetData[];
  onUpdateSet: (setIndex: number, data: Partial<SetData>) => void;
  onRemoveSet: (setIndex: number) => void;
}

interface SetRowProps {
  exerciseType: ExerciseType;
  setIndex: number;
  setData: SetData;
  isLastSet: boolean;
  onUpdate: (data: Partial<SetData>) => void;
  onRemove: () => void;
  onEnterPressed: () => void;
}

interface ExerciseComboboxProps {
  exercises: ExerciseDTO[];
  onAddExercise: (exercise: ExerciseDTO) => void;
  onCreateExercise: (name: string, type: ExerciseType) => Promise<ExerciseDTO>;
}

interface WorkoutActionsProps {
  onSave: () => Promise<void>;
  onCancel: () => void;
  isValid: boolean;
  isSaving: boolean;
}
```

### ViewModels i pomocnicze typy

```typescript
/**
 * Payload do wysłania przy zapisie treningu
 */
interface SaveWorkoutPayload extends CreateWorkoutCommand {
  date: string;
  notes: string | null;
  sets: CreateWorkoutSetCommand[];
}

/**
 * Szablon treningu po załadowaniu z API
 */
type WorkoutTemplate = WorkoutDetailsDTO;

/**
 * Klucz localStorage
 */
const WORKOUT_DRAFT_KEY = "workout_draft";
```

## 6. Zarządzanie stanem

Stan w widoku Logger Treningowy jest zarządzany za pomocą **React Context API** z custom hookiem `useWorkoutLogger`.

### Struktura zarządzania stanem

1. **WorkoutLoggerContext**:
   - Przechowuje główny stan `WorkoutLoggerState`
   - Udostępnia akcje `WorkoutLoggerActions`
   - Provider opakowuje całą treść widoku

2. **Custom Hook: useWorkoutLogger**:

   ```typescript
   function useWorkoutLogger() {
     const [state, dispatch] = useReducer(workoutLoggerReducer, initialState);

     // Effects
     useEffect(() => {
       // Load draft from localStorage on mount
       const draft = localStorage.getItem(WORKOUT_DRAFT_KEY);
       if (draft) {
         const parsed = JSON.parse(draft);
         dispatch({ type: "LOAD_DRAFT", payload: parsed });
       }
     }, []);

     useEffect(() => {
       // Fetch available exercises
       fetchExercises().then((exercises) => {
         dispatch({ type: "SET_AVAILABLE_EXERCISES", payload: exercises });
       });
     }, []);

     useEffect(() => {
       // Debounced save to localStorage
       const timeout = setTimeout(() => {
         localStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(state));
       }, 500);
       return () => clearTimeout(timeout);
     }, [state]);

     // Actions
     const actions: WorkoutLoggerActions = {
       setDate: (date) => dispatch({ type: "SET_DATE", payload: date }),
       setNotes: (notes) => dispatch({ type: "SET_NOTES", payload: notes }),
       addExercise: (exercise) => dispatch({ type: "ADD_EXERCISE", payload: exercise }),
       removeExercise: (id) => dispatch({ type: "REMOVE_EXERCISE", payload: id }),
       addSet: (exerciseId) => dispatch({ type: "ADD_SET", payload: exerciseId }),
       removeSet: (exerciseId, setIndex) => dispatch({ type: "REMOVE_SET", payload: { exerciseId, setIndex } }),
       updateSet: (exerciseId, setIndex, data) =>
         dispatch({ type: "UPDATE_SET", payload: { exerciseId, setIndex, data } }),
       loadTemplate: (template) => dispatch({ type: "LOAD_TEMPLATE", payload: template }),
       resetWorkout: () => {
         dispatch({ type: "RESET" });
         localStorage.removeItem(WORKOUT_DRAFT_KEY);
       },
       saveWorkout: async () => {
         dispatch({ type: "SET_SAVING", payload: true });
         try {
           const payload = transformStateToPayload(state);
           await fetch("/api/workouts", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(payload),
           });
           localStorage.removeItem(WORKOUT_DRAFT_KEY);
           // Show success toast
           // Redirect to dashboard
         } catch (error) {
           // Show error toast
         } finally {
           dispatch({ type: "SET_SAVING", payload: false });
         }
       },
     };

     return { state, actions };
   }
   ```

3. **Reducer**:
   - Czysty reducer obsługujący wszystkie akcje
   - Immutable updates dla zagnieżdżonych struktur (exercises.sets)

4. **localStorage Persistence**:
   - Klucz: `workout_draft`
   - Zapis: Debounced (500ms) po każdej zmianie stanu
   - Odczyt: Przy montowaniu komponentu
   - Usuwanie: Po zapisie treningu lub anulowaniu

### Przepływ danych

```
User Action
  → Component Event Handler
    → Context Action (dispatch)
      → Reducer
        → New State
          → localStorage (debounced)
            → Component Re-render
```

## 7. Integracja API

### Endpointy wykorzystywane przez widok

#### 1. GET /api/exercises

- **Cel**: Pobranie listy dostępnych ćwiczeń do wyboru
- **Moment wywołania**: Przy montowaniu komponentu WorkoutLoggerProvider
- **Request**: Brak body, opcjonalne query params `include_archived=false`
- **Response**: `ListExercisesResponse`
  ```typescript
  {
    exercises: ExerciseDTO[]
  }
  ```
- **Obsługa błędów**:
  - 401: Przekierowanie do logowania
  - 500: Toast z komunikatem błędu

#### 2. GET /api/workouts/latest

- **Cel**: Pobranie ostatniego treningu jako szablon do skopiowania
- **Moment wywołania**: Po kliknięciu przycisku "Kopiuj ostatni trening"
- **Request**: Brak body i params
- **Response**: `WorkoutDetailsDTO`
  ```typescript
  {
    id: string;
    user_id: string;
    date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    sets: WorkoutSetDTO[];
  }
  ```
- **Obsługa błędów**:
  - 404: Toast "Nie masz jeszcze żadnych treningów"
  - 401: Przekierowanie do logowania
  - 500: Toast z komunikatem błędu

#### 3. POST /api/exercises

- **Cel**: Tworzenie nowego ćwiczenia (inline w Combobox)
- **Moment wywołania**: Po wypełnieniu formularza w modalu "Utwórz ćwiczenie"
- **Request Body**: `CreateExerciseCommand`
  ```typescript
  {
    name: string;
    type: ExerciseType;
  }
  ```
- **Response**: `ExerciseDTO`
  ```typescript
  {
    id: string;
    user_id: string;
    name: string;
    type: ExerciseType;
    is_archived: boolean;
    is_system: boolean;
    created_at: string;
    updated_at: string;
  }
  ```
- **Obsługa błędów**:
  - 400: Toast "Nieprawidłowe dane"
  - 409: Toast "Ćwiczenie o tej nazwie już istnieje"
  - 500: Toast z komunikatem błędu

#### 4. POST /api/workouts

- **Cel**: Zapisanie nowego treningu z seriami
- **Moment wywołania**: Po kliknięciu "Zapisz trening"
- **Request Body**: `CreateWorkoutCommand`
  ```typescript
  {
    date: string; // YYYY-MM-DD
    notes: string | null;
    sets: CreateWorkoutSetCommand[];
  }
  ```
  gdzie `CreateWorkoutSetCommand`:
  ```typescript
  {
    exercise_id: string;
    sort_order: number;
    weight?: number | null;
    reps?: number | null;
    distance?: number | null;
    time?: number | null;
  }
  ```
- **Response**: `WorkoutDetailsDTO` (201 Created)
  ```typescript
  {
    id: string;
    user_id: string;
    date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    sets: WorkoutSetDTO[];
  }
  ```
- **Obsługa błędów**:
  - 400: Toast z szczegółami walidacji
  - 404: Toast "Wybrane ćwiczenie nie istnieje"
  - 500: Toast "Błąd podczas zapisywania"

### Transformacja danych

Przed wysłaniem do API, stan formularza musi zostać przetransformowany:

```typescript
function transformStateToPayload(state: WorkoutLoggerState): CreateWorkoutCommand {
  const sets: CreateWorkoutSetCommand[] = [];
  let sortOrder = 1;

  state.exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      sets.push({
        exercise_id: exercise.exercise_id,
        sort_order: sortOrder++,
        weight: set.weight,
        reps: set.reps,
        distance: set.distance,
        time: set.time,
      });
    });
  });

  return {
    date: state.date,
    notes: state.notes,
    sets,
  };
}
```

Po załadowaniu szablonu z `/api/workouts/latest`, dane muszą być przekształcone do stanu UI:

```typescript
function transformTemplateToState(template: WorkoutDetailsDTO): Partial<WorkoutLoggerState> {
  // Group sets by exercise_id
  const exercisesMap = new Map<string, WorkoutExercise>();

  template.sets.forEach((set) => {
    if (!exercisesMap.has(set.exercise_id)) {
      exercisesMap.set(set.exercise_id, {
        id: generateTempId(),
        exercise_id: set.exercise_id,
        exercise_name: set.exercise_name,
        exercise_type: set.exercise_type,
        sets: [],
      });
    }

    exercisesMap.get(set.exercise_id)!.sets.push({
      weight: set.weight,
      reps: set.reps,
      distance: set.distance,
      time: set.time,
    });
  });

  return {
    date: new Date().toISOString().split("T")[0], // today, not template date
    notes: null, // clear notes
    exercises: Array.from(exercisesMap.values()),
  };
}
```

## 8. Interakcje użytkownika

### 8.1. Rozpoczęcie nowego treningu

1. Użytkownik wchodzi na `/app/log`
2. System sprawdza `localStorage` pod kluczem `workout_draft`
3. **Jeśli draft istnieje**: Ładuje dane do formularza, pokazuje Toast "Załadowano zapisany draft"
4. **Jeśli brak draft**: Inicjalizuje pusty formularz z dzisiejszą datą

### 8.2. Zmiana daty treningu (Backdating)

1. Użytkownik klika w pole daty
2. Otwiera się DatePicker (Shadcn/ui)
3. Użytkownik wybiera datę lub wpisuje ręcznie (YYYY-MM-DD)
4. System waliduje:
   - Data nie może być w przyszłości → Toast "Data nie może być w przyszłości"
   - Akceptuje daty przeszłe i dzisiejszą
5. Data aktualizowana w stanie

### 8.3. Kopiowanie ostatniego treningu

1. Użytkownik klika "Kopiuj ostatni trening"
2. Przycisk zmienia stan na loading
3. System wywołuje `GET /api/workouts/latest`
4. **Sukces (200)**:
   - Parsowanie odpowiedzi
   - Transformacja do struktury UI
   - Załadowanie ćwiczeń i serii do stanu
   - Toast "Załadowano szablon z ostatniego treningu"
5. **Błąd (404)**:
   - Toast "Nie masz jeszcze żadnych treningów"
6. **Błąd inny**:
   - Toast "Nie udało się załadować ostatniego treningu"

### 8.4. Dodawanie ćwiczenia

1. Użytkownik klika przycisk "Dodaj ćwiczenie" (ExerciseCombobox)
2. Otwiera się Popover z listą ćwiczeń
3. **Scenariusz A: Wybór istniejącego**:
   - Użytkownik wpisuje w search lub przewija listę
   - Kliknięcie na ćwiczenie
   - Zamknięcie Popover
   - Dodanie nowego `ExerciseCard` z pustą pierwszą serią
   - Auto-focus na pierwszym polu pierwszej serii
4. **Scenariusz B: Tworzenie nowego**:
   - Użytkownik wpisuje nazwę, której nie ma
   - Pokazuje się "Brak wyników. Utwórz nowe ćwiczenie?"
   - Kliknięcie otwiera modal
   - Użytkownik wpisuje nazwę i wybiera typ (Siłowe/Cardio)
   - Kliknięcie "Utwórz" → POST `/api/exercises`
   - Po sukcesie: Dodanie do listy dostępnych + dodanie do treningu
   - Auto-focus na pierwszym polu pierwszej serii

### 8.5. Wprowadzanie serii siłowej

1. Focus na polu "Ciężar"
2. Użytkownik wpisuje np. `100`
3. Naciśnięcie Tab → focus na "Powtórzenia"
4. Użytkownik wpisuje np. `8`
5. Naciśnięcie Enter:
   - Walidacja wprowadzonych wartości
   - Jeśli OK: Dodanie nowej pustej serii
   - Auto-focus na pole "Ciężar" nowej serii
6. Proces powtarza się dla kolejnych serii

### 8.6. Wprowadzanie serii cardio

1. Focus na polu "Dystans"
2. Użytkownik wpisuje np. `5.5` (km)
3. Naciśnięcie Tab → focus na "Czas"
4. Użytkownik wpisuje np. `30` (minuty)
5. System konwertuje minuty na sekundy (30 \* 60 = 1800)
6. Naciśnięcie Enter:
   - Walidacja
   - Dodanie nowej pustej serii
   - Auto-focus na pole "Dystans" nowej serii

### 8.7. Usuwanie serii

1. Użytkownik klika ikonę kosza przy serii
2. Seria usuwana natychmiast bez potwierdzenia (undo możliwe przez F5 dzięki localStorage)
3. Jeśli była to ostatnia seria ćwiczenia → pokazanie wskazówki "Dodaj przynajmniej jedną serię"

### 8.8. Usuwanie ćwiczenia

1. Użytkownik klika X w nagłówku ExerciseCard
2. Modal potwierdzenia: "Czy na pewno chcesz usunąć {nazwa}? Wszystkie serie zostaną usunięte."
3. Po potwierdzeniu: Usunięcie ćwiczenia ze stanu

### 8.9. Zapisywanie treningu

1. Użytkownik klika "Zapisz trening"
2. System wykonuje walidację front-endową:
   - Czy jest przynajmniej jedno ćwiczenie? ✓
   - Czy każde ćwiczenie ma przynajmniej jedną serię? ✓
   - Czy wszystkie wymagane pola są wypełnione? ✓
   - Czy wartości są w dozwolonym zakresie? ✓
3. Transformacja stanu do `CreateWorkoutCommand`
4. Wysłanie POST `/api/workouts`
5. **Sukces (201)**:
   - Toast "Trening zapisany!"
   - Usunięcie draft z localStorage
   - Przekierowanie do `/app/dashboard`
6. **Błąd (400)**:
   - Parsowanie błędów walidacji
   - Pokazanie toastów z konkretnymi błędami
   - Podświetlenie błędnych pól
7. **Błąd inny**:
   - Toast "Nie udało się zapisać treningu. Spróbuj ponownie."

### 8.10. Anulowanie / Wyjście z formularza

1. Użytkownik klika "Anuluj" lub próbuje opuścić stronę
2. **Jeśli są niezapisane zmiany**:
   - Modal potwierdzenia: "Masz niezapisane zmiany. Czy na pewno chcesz wyjść?"
   - Opcje: "Zapisz draft", "Odrzuć zmiany", "Kontynuuj edycję"
3. **"Zapisz draft"**: Draft pozostaje w localStorage, przekierowanie
4. **"Odrzuć zmiany"**: Usunięcie draft, przekierowanie
5. **"Kontynuuj edycję"**: Zamknięcie modala, pozostanie w widoku

### 8.11. Odświeżenie strony (F5)

1. Użytkownik naciska F5
2. React Island ponownie montuje
3. useEffect odczytuje `workout_draft` z localStorage
4. Formularz wypełnia się danymi z draft
5. Toast "Załadowano zapisany draft"

## 9. Warunki i walidacja

### 9.1. Walidacja na poziomie WorkoutHeader

**Data treningu**:

- **Warunek**: Data nie może być w przyszłości
- **Komponent**: WorkoutHeader
- **Metoda**:
  ```typescript
  const today = new Date().toISOString().split("T")[0];
  if (date > today) {
    // Show error
    return false;
  }
  ```
- **Wpływ na UI**: Disabled przycisk "Zapisz", czerwona ramka na polu, tooltip z błędem

**Notatki**:

- **Warunek**: Max 1000 znaków
- **Komponent**: WorkoutHeader
- **Metoda**:
  ```typescript
  if (notes && notes.length > 1000) {
    // Show warning
  }
  ```
- **Wpływ na UI**: Counter "950/1000", czerwony kolor po przekroczeniu

### 9.2. Walidacja na poziomie SetRow (Strength)

**Ciężar (weight)**:

- **Warunki**:
  - Wartość >= 0
  - Wartość <= 999.99
  - Dokładność do 2 miejsc po przecinku
- **Komponent**: SetRow
- **Metoda**: Regex `/^\d{1,3}(\.\d{0,2})?$/`
- **Wpływ na UI**: Czerwona ramka, tooltip "Ciężar musi być między 0 a 999.99 kg"

**Powtórzenia (reps)**:

- **Warunki**:
  - Wartość >= 1
  - Liczba całkowita
- **Komponent**: SetRow
- **Metoda**:
  ```typescript
  if (!Number.isInteger(reps) || reps < 1) {
    // Show error
  }
  ```
- **Wpływ na UI**: Czerwona ramka, tooltip "Powtórzenia muszą być liczbą całkowitą >= 1"

**Pola cardio (distance, time)**:

- **Warunek**: Muszą być `null` dla ćwiczeń siłowych
- **Komponent**: SetRow (sprawdzenie przed zapisem)
- **Metoda**: Type checking przy transformacji
- **Wpływ na UI**: Pola ukryte dla typu "strength"

### 9.3. Walidacja na poziomie SetRow (Cardio)

**Dystans (distance)**:

- **Warunki**:
  - Wartość >= 0
  - Wartość <= 999999.99
  - Dokładność do 2 miejsc po przecinku
- **Komponent**: SetRow
- **Metoda**: Regex `/^\d{1,6}(\.\d{0,2})?$/`
- **Wpływ na UI**: Czerwona ramka, tooltip "Dystans musi być między 0 a 999999.99 km"

**Czas (time)**:

- **Warunki**:
  - Wartość >= 0 (minuty w UI, sekundy w API)
  - Liczba całkowita lub zmiennoprzecinkowa
- **Komponent**: SetRow
- **Metoda**: Konwersja `minutes * 60` przed zapisem
- **Wpływ na UI**: Czerwona ramka, tooltip "Czas musi być >= 0 minut"

**Pola strength (weight, reps)**:

- **Warunek**: Muszą być `null` dla ćwiczeń cardio
- **Komponent**: SetRow
- **Metoda**: Type checking
- **Wpływ na UI**: Pola ukryte dla typu "cardio"

### 9.4. Walidacja na poziomie całego formularza (WorkoutActions)

**Obecność ćwiczeń**:

- **Warunek**: Trening musi zawierać przynajmniej jedno ćwiczenie
- **Komponent**: WorkoutActions
- **Metoda**: `state.exercises.length > 0`
- **Wpływ na UI**: Przycisk "Zapisz" disabled, tooltip "Dodaj przynajmniej jedno ćwiczenie"

**Obecność serii w ćwiczeniach**:

- **Warunek**: Każde ćwiczenie musi mieć przynajmniej jedną serię
- **Komponent**: WorkoutActions
- **Metoda**: `state.exercises.every(ex => ex.sets.length > 0)`
- **Wpływ na UI**: Przycisk "Zapisz" disabled, podświetlenie ćwiczeń bez serii

**Kompletność danych w seriach**:

- **Warunek**: Wszystkie wymagane pola w seriach muszą być wypełnione
- **Komponent**: WorkoutActions
- **Metoda**:
  ```typescript
  const allSetsValid = state.exercises.every((ex) =>
    ex.sets.every((set) => {
      if (ex.exercise_type === "strength") {
        return set.weight !== null && set.reps !== null;
      } else {
        return set.distance !== null && set.time !== null;
      }
    })
  );
  ```
- **Wpływ na UI**: Przycisk "Zapisz" disabled, podświetlenie niepełnych serii

### 9.5. Walidacja API (server-side)

Po wysłaniu POST `/api/workouts`, backend dodatkowo waliduje:

1. **Typ ćwiczenia vs pola serii**:
   - Strength: `weight` i `reps` wymagane, `distance` i `time` muszą być null
   - Cardio: `distance` i `time` wymagane, `weight` i `reps` muszą być null
   - **Błąd**: 400 + `ExerciseTypeMismatchError`

2. **Istnienie exercise_id**:
   - Każdy `exercise_id` musi istnieć w tabeli `exercises` i być dostępny dla użytkownika
   - **Błąd**: 404 + `ExerciseNotFoundError`

3. **Zakresy wartości**:
   - Zgodnie z schematem bazy danych
   - **Błąd**: 400 + szczegóły walidacji

**Obsługa błędów API w UI**:

- Parsowanie response body
- Pokazanie Toast z komunikatem
- Jeśli możliwe: Podświetlenie konkretnego błędnego pola

## 10. Obsługa błędów

### 10.1. Błędy sieciowe (Network Errors)

**Scenariusz**: Utracenie połączenia podczas zapisu treningu

**Obsługa**:

1. Catch blok w `saveWorkout()`
2. Sprawdzenie `error instanceof TypeError` (network error)
3. Toast: "Brak połączenia z internetem. Trening zapisano lokalnie jako draft."
4. Draft pozostaje w localStorage
5. Stan formularza wraca do edycji (nie czyści się)

### 10.2. Błędy autoryzacji (401 Unauthorized)

**Scenariusz**: Sesja wygasła podczas pracy

**Obsługa**:

1. Wykrycie statusu 401 w każdym API call
2. Toast: "Sesja wygasła. Za chwilę nastąpi przekierowanie do logowania."
3. Zapis draft do localStorage (zabezpieczenie danych)
4. Przekierowanie do `/login` z query param `?redirect=/app/log`
5. Po ponownym zalogowaniu → powrót do `/app/log` i odtworzenie draft

### 10.3. Błędy walidacji (400 Bad Request)

**Scenariusz**: Backend odrzuca dane mimo walidacji front-endowej

**Obsługa**:

1. Parsowanie response body z API
2. Mapowanie błędów do konkretnych pól:
   ```typescript
   if (error.errors?.sets?.[0]?.weight) {
     // Highlight weight field in first set
   }
   ```
3. Toast z ogólnym komunikatem: "Popraw błędne dane i spróbuj ponownie"
4. Scroll do pierwszego błędnego pola
5. Stan formularza pozostaje bez zmian

### 10.4. Błędy typu 404 (Exercise Not Found)

**Scenariusz**: Użytkownik próbuje zapisać trening z ćwiczeniem, które zostało usunięte

**Obsługa**:

1. Wykrycie `ExerciseNotFoundError` w response
2. Toast: "Ćwiczenie '{exercise_name}' nie istnieje. Usuń je z treningu."
3. Podświetlenie problematycznego ExerciseCard na czerwono
4. Opcja: Auto-usunięcie ćwiczenia i pokazanie Toast z pytaniem o ponowienie zapisu

### 10.5. Błędy serwera (500 Internal Server Error)

**Scenariusz**: Nieoczekiwany błąd po stronie backendu

**Obsługa**:

1. Catch błędu 500
2. Toast: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
3. Draft pozostaje w localStorage
4. Log błędu do console (dla debugowania)
5. Stan formularza pozostaje bez zmian

### 10.6. Błędy localStorage

**Scenariusz**: Browser ma pełny localStorage lub jest zablokowany

**Obsługa**:

1. Try-catch wokół `localStorage.setItem()`
2. Jeśli catch:
   - Wyłączenie auto-save
   - Toast: "Nie można zapisać draftu lokalnie. Upewnij się, że przeglądarka ma dostęp do localStorage."
3. Aplikacja nadal działa, ale bez ochrony przed F5

### 10.7. Błędy inline tworzenia ćwiczenia (409 Conflict)

**Scenariusz**: Użytkownik próbuje stworzyć ćwiczenie o nazwie, która już istnieje

**Obsługa**:

1. Wykrycie statusu 409 z POST `/api/exercises`
2. Toast: "Ćwiczenie o tej nazwie już istnieje. Wybierz je z listy."
3. Modal tworzenia pozostaje otwarty
4. Focus na polu nazwy
5. Highlight istniejącego ćwiczenia w liście po zamknięciu modala

### 10.8. Timeout podczas ładowania listy ćwiczeń

**Scenariusz**: GET `/api/exercises` trwa zbyt długo

**Obsługa**:

1. Timeout 10s na fetch
2. Jeśli przekroczony:
   - Toast: "Nie udało się załadować listy ćwiczeń. Odśwież stronę."
   - Przycisk "Odśwież" w Toast → retry fetcha
3. ExerciseCombobox pokazuje stan "Ładowanie..." → "Błąd"
4. Możliwość ręcznego retry

### 10.9. Błędy parsowania JSON z API

**Scenariusz**: API zwraca nieprawidłowy JSON

**Obsługa**:

1. Try-catch wokół `response.json()`
2. Jeśli catch:
   - Toast: "Błąd komunikacji z serwerem. Spróbuj ponownie."
   - Log błędu do console
3. Traktowanie jak błąd 500

### 10.10. Przypadki brzegowe (Edge Cases)

**Użytkownik dodaje ćwiczenie bez serii i próbuje zapisać**:

- Walidacja blokuje zapis
- Toast: "Każde ćwiczenie musi mieć przynajmniej jedną serię"
- Auto-scroll do ćwiczenia bez serii

**Użytkownik wpisuje wartości poza zakresem (np. 10000 kg)**:

- Walidacja na input level (max attribute)
- Jeśli ominie: Walidacja przed zapisem
- Toast: "Ciężar nie może przekraczać 999.99 kg"

**Użytkownik próbuje zapisać pusty trening**:

- Przycisk "Zapisz" disabled
- Tooltip: "Dodaj przynajmniej jedno ćwiczenie"

**Draft w localStorage jest uszkodzony (nieprawidłowy JSON)**:

- Try-catch przy parsowaniu
- Jeśli błąd: Usunięcie draft, inicjalizacja pustego formularza
- Toast: "Nie udało się przywrócić draftu. Rozpocznij od nowa."

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury projektu

1. Utworzenie folderu `src/pages/app/log/`
2. Utworzenie pliku `index.astro` jako główna strona widoku
3. Utworzenie folderu `src/components/workout-logger/` dla komponentów React
4. Utworzenie pliku `src/lib/hooks/useWorkoutLogger.ts` dla custom hook
5. Utworzenie pliku `src/lib/contexts/WorkoutLoggerContext.tsx` dla contextu

### Krok 2: Implementacja Context i State Management

1. Zdefiniowanie typów stanu w `WorkoutLoggerContext.tsx`:
   - `WorkoutLoggerState`
   - `WorkoutLoggerActions`
   - Action types dla reducer
2. Implementacja reducer `workoutLoggerReducer` z obsługą wszystkich akcji
3. Implementacja custom hook `useWorkoutLogger`:
   - useReducer z initialState
   - useEffect do ładowania draft z localStorage
   - useEffect do pobierania listy ćwiczeń
   - useEffect do zapisu draft (debounced)
   - Implementacja wszystkich akcji
4. Utworzenie `WorkoutLoggerProvider` opakowującego dzieci w Context.Provider

### Krok 3: Implementacja WorkoutHeader

1. Utworzenie komponentu `WorkoutHeader.tsx`
2. Import i konfiguracja DatePicker z Shadcn/ui
3. Implementacja walidacji daty (nie w przyszłości)
4. Implementacja pola notatek z licznikiem znaków
5. Podłączenie do contextu (useContext)
6. Styling Tailwind + responsywność

### Krok 4: Implementacja QuickActions

1. Utworzenie komponentu `QuickActions.tsx`
2. Implementacja przycisku "Kopiuj ostatni trening"
3. Implementacja fetcha do `/api/workouts/latest`
4. Implementacja transformacji odpowiedzi do stanu UI
5. Obsługa loading state i błędów (404, 401, 500)
6. Integracja z contextem (wywołanie loadTemplate)

### Krok 5: Implementacja SetRow (kluczowy komponent)

1. Utworzenie komponentu `SetRow.tsx`
2. Implementacja logiki polimorficznej:
   - Conditional rendering pól w zależności od `exerciseType`
   - Strength: weight + reps inputs
   - Cardio: distance + time inputs
3. Implementacja walidacji na poziomie input:
   - Atrybut `min`, `max`, `step`
   - Pattern regex dla number inputs
4. Implementacja obsługi klawiatury:
   - Tab: Naturalne przechodzenie
   - Enter w ostatnim polu: Wywołanie `onEnterPressed`
5. Implementacja przycisku usuwania serii (ikona trash)
6. Styling z focus states i error states

### Krok 6: Implementacja SetTable

1. Utworzenie komponentu `SetTable.tsx`
2. Implementacja dynamicznych nagłówków tabeli:
   - Conditional rendering w zależności od `exerciseType`
3. Mapowanie serii i renderowanie `SetRow` dla każdej
4. Przekazywanie callbacków do SetRow
5. Implementacja przycisku "Dodaj serię"
6. Styling tabeli (Tailwind) z responsywnością

### Krok 7: Implementacja ExerciseHeader

1. Utworzenie komponentu `ExerciseHeader.tsx`
2. Layout z nazwą ćwiczenia, badge typu i przyciskiem X
3. Implementacja Badge z różnymi kolorami dla strength/cardio
4. Implementacja przycisku usuwania z ikoną
5. Styling Tailwind

### Krok 8: Implementacja ExerciseCard

1. Utworzenie komponentu `ExerciseCard.tsx`
2. Kompozycja z `ExerciseHeader` i `SetTable`
3. Przekazywanie propsów z rodzica do dzieci
4. Implementacja Card wrapper (Shadcn/ui)
5. Styling z marginesami i paddingiem

### Krok 9: Implementacja ExerciseList

1. Utworzenie komponentu `ExerciseList.tsx`
2. Mapowanie przez tablicę ćwiczeń
3. Renderowanie `ExerciseCard` dla każdego z unikalnym key
4. Przekazywanie callbacków z contextu
5. Layout pionowy z odstępami

### Krok 10: Implementacja ExerciseCombobox

1. Utworzenie komponentu `ExerciseCombobox.tsx`
2. Implementacja Popover z Command (Shadcn/ui)
3. Implementacja wyszukiwania (filtrowanie case-insensitive)
4. Renderowanie listy wyników z grupowaniem (System/Własne)
5. Implementacja stanu "No results" z przyciskiem "Utwórz"
6. Utworzenie modala do tworzenia nowego ćwiczenia:
   - Input nazwa
   - Select typ (Strength/Cardio)
   - Przyciski Anuluj/Utwórz
7. Implementacja POST `/api/exercises`
8. Obsługa błędów (409, 400, 500)
9. Dodanie nowego ćwiczenia do listy + do treningu po sukcesie
10. Styling i responsywność

### Krok 11: Implementacja WorkoutActions

1. Utworzenie komponentu `WorkoutActions.tsx`
2. Implementacja przycisków "Zapisz trening" i "Anuluj"
3. Implementacja walidacji całego formularza:
   - Funkcja `validateWorkout(state)`
   - Sprawdzenie wszystkich warunków
4. Implementacja obsługi zapisu:
   - Transformacja stanu do payload
   - POST `/api/workouts`
   - Obsługa loading state
   - Obsługa błędów (400, 404, 500)
   - Sukces: Toast + czyszczenie localStorage + redirect
5. Implementacja obsługi anulowania:
   - Modal potwierdzenia jeśli są zmiany
   - Czyszczenie stanu + localStorage
6. Disabled state przycisku w zależności od walidacji
7. Styling z loading spinnerami

### Krok 12: Integracja wszystkich komponentów w Provider

1. W `WorkoutLoggerProvider.tsx`:
   - Renderowanie `WorkoutHeader`
   - Renderowanie `QuickActions`
   - Renderowanie `ExerciseList`
   - Renderowanie `ExerciseCombobox`
   - Renderowanie `WorkoutActions`
2. Przekazywanie propsów z contextu do komponentów
3. Layout głównego kontenera (max-width, padding, spacing)

### Krok 13: Utworzenie strony Astro

1. W `src/pages/app/log/index.astro`:
   - Import `WorkoutLoggerProvider`
   - Renderowanie z dyrektywą `client:load`
   - Tytuł strony i meta tags
   - Wrapper w wspólnym Layout aplikacji

### Krok 14: Implementacja Toast notifications

1. Instalacja biblioteki toast (np. Sonner)
2. Dodanie `<Toaster />` do Layout aplikacji
3. Utworzenie helper funkcji `showToast` w utils
4. Integracja we wszystkich komponentach gdzie potrzebne:
   - Sukces zapisu
   - Błędy API
   - Kopiowanie treningu
   - Walidacja

### Krok 15: Implementacja localStorage persistence

1. Definicja klucza `WORKOUT_DRAFT_KEY = "workout_draft"`
2. W useEffect providera:
   - Load on mount
   - Save on state change (debounced 500ms)
3. Implementacja funkcji `clearDraft()`
4. Wywołanie `clearDraft()` po sukcesie zapisu
5. Obsługa błędów localStorage (try-catch)

### Krok 16: Accessibility i keyboard navigation

1. Dodanie odpowiednich `aria-label` do wszystkich przycisków i inputów
2. Konfiguracja `tabIndex` dla logicznego flow:
   - Data → Notatki → Dodaj ćwiczenie → Pola serii → Akcje
3. Implementacja focus trap w modalach
4. Implementacja escape key do zamykania modali
5. Testing z keyboard-only navigation
6. Testing z screen readerem

### Krok 17: Styling i responsywność

1. Implementacja Dark Mode (zgodnie z PRD: domyślny i jedyny)
2. Tailwind classes dla wszystkich komponentów
3. Responsive breakpoints:
   - Mobile: Stack pionowy, pełna szerokość
   - Tablet: Rozpoczęcie układu desktop
   - Desktop: Pełna szerokość formularzy, komfortowe marginesy
4. Focus states (ring-2, ring-offset-2)
5. Hover states
6. Disabled states
7. Error states (czerwone ramki, ikony)

### Krok 18: Testowanie integracyjne

1. Ręczne testowanie pełnego flow:
   - Rozpoczęcie nowego treningu
   - Dodanie ćwiczenia siłowego + wprowadzenie serii
   - Dodanie ćwiczenia cardio + wprowadzenie serii
   - Kopiowanie ostatniego treningu
   - Tworzenie nowego ćwiczenia inline
   - Walidacja błędnych danych
   - Zapisanie treningu
   - Anulowanie z potwierdzeniem
   - F5 i odtworzenie draft
2. Testowanie edge cases:
   - Brak internetu podczas zapisu
   - Sesja wygasła
   - Nieprawidłowe dane z API
   - localStorage pełny/zablokowany
3. Testowanie keyboard navigation
4. Testowanie na różnych przeglądarkach (Chrome, Firefox, Safari, Edge)

### Krok 19: Optymalizacja wydajności

1. Implementacja React.memo dla komponentów bez częstych zmian
2. Implementacja useMemo dla ciężkich obliczeń (np. walidacja)
3. Implementacja useCallback dla callbacks przekazywanych do dzieci
4. Debouncing dla localStorage save (już zaimplementowane)
5. Lazy loading dla modali
6. Code splitting jeśli bundle zbyt duży

### Krok 20: Dokumentacja i finalizacja

1. Dodanie komentarzy JSDoc do wszystkich komponentów i funkcji
2. Dokumentacja propsów (TypeScript interfaces wystarczą)
3. Update README jeśli potrzebne
4. Finalne review kodu
5. Merge do main branch
6. Deploy i weryfikacja na produkcji
