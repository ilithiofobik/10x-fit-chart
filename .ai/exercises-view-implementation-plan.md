# Plan implementacji widoku Bazy Ćwiczeń

## 1. Przegląd

Widok Bazy Ćwiczeń (`/app/exercises`) umożliwia użytkownikom zarządzanie słownikiem ćwiczeń - dodawanie własnych definicji, edycję nazw oraz archiwizację (soft delete) nieużywanych ćwiczeń. Widok wyświetla zarówno ćwiczenia systemowe (predefiniowane), jak i prywatne ćwiczenia użytkownika, umożliwiając zarządzanie wyłącznie własnymi pozycjami.

## 2. Routing widoku

- **Ścieżka**: `/app/exercises`
- **Typ**: Chroniony (wymaga autoryzacji)
- **Plik Astro**: `src/pages/app/exercises.astro`

## 3. Struktura komponentów

```
ExercisesPage (Astro Layout)
└── ExerciseManager (React Client Component)
    ├── ExerciseHeader
    │   ├── PageTitle ("Baza Ćwiczeń")
    │   └── AddExerciseButton (otwiera Dialog)
    ├── ExerciseFilters
    │   ├── SearchInput (filtrowanie po nazwie)
    │   └── TypeFilter (All/Siłowe/Cardio)
    ├── ExerciseList
    │   └── ExerciseCard[] (lista ćwiczeń)
    │       ├── ExerciseName
    │       ├── ExerciseBadge (typ + status)
    │       └── ExerciseActions
    │           ├── EditButton (tylko własne)
    │           └── ArchiveButton (tylko własne)
    ├── ExerciseFormDialog (Create/Edit)
    │   ├── DialogHeader
    │   ├── ExerciseForm
    │   │   ├── NameInput
    │   │   └── TypeSelect (tylko przy tworzeniu)
    │   └── DialogFooter (Anuluj/Zapisz)
    └── ConfirmArchiveDialog
        ├── DialogHeader
        ├── WarningMessage
        └── DialogFooter (Anuluj/Archiwizuj)
```

## 4. Szczegóły komponentów

### ExerciseManager (główny kontener)

**Opis**: Główny komponent zarządzający stanem widoku, odpowiedzialny za pobieranie danych z API, zarządzanie filtrami oraz orchestrację dialogów i akcji użytkownika.

**Główne elementy**:

- Kontener `div` z responsywną siatką
- `ExerciseHeader` - nagłówek z przyciskiem dodawania
- `ExerciseFilters` - sekcja filtrów
- `ExerciseList` - lista ćwiczeń
- `ExerciseFormDialog` - dialog tworzenia/edycji
- `ConfirmArchiveDialog` - dialog potwierdzenia archiwizacji

**Obsługiwane interakcje**:

- Inicjalizacja: pobieranie listy ćwiczeń przy montowaniu komponentu
- Filtrowanie: zmiana filtrów typu i wyszukiwania
- Otwieranie dialogu dodawania nowego ćwiczenia
- Otwieranie dialogu edycji ćwiczenia
- Otwieranie dialogu archiwizacji ćwiczenia
- Obsługa odpowiedzi API (sukces/błąd)

**Obsługiwana walidacja**:

- Walidacja odpowiedzi API (status 200/201/400/401/403/404/409)
- Walidacja dostępności danych przed renderowaniem
- Walidacja uprawnień do edycji/archiwizacji (tylko własne ćwiczenia)

**Typy**:

- `ExercisesViewState` (stan widoku)
- `ExerciseDTO` (pojedyncze ćwiczenie)
- `ExerciseType` (typ ćwiczenia)
- `ListExercisesResponse` (odpowiedź API)

**Propsy**: Brak (główny komponent widoku)

---

### ExerciseHeader

**Opis**: Nagłówek widoku zawierający tytuł strony i przycisk do dodawania nowych ćwiczeń.

**Główne elementy**:

- Element `header` z klasami Tailwind dla layoutu
- Element `h1` z tytułem "Baza Ćwiczeń"
- Komponent `Button` (Shadcn/ui) z ikoną plus

**Obsługiwane interakcje**:

- Kliknięcie przycisku "Dodaj ćwiczenie" - wywołuje callback `onAddClick`

**Obsługiwana walidacja**: Brak (komponent prezentacyjny)

**Typy**:

- `ExerciseHeaderProps` (interfejs propsów)

**Propsy**:

```typescript
interface ExerciseHeaderProps {
  onAddClick: () => void;
}
```

---

### ExerciseFilters

**Opis**: Sekcja filtrów umożliwiająca wyszukiwanie ćwiczeń po nazwie oraz filtrowanie po typie.

**Główne elementy**:

- Kontener `div` z flexbox layoutem
- Komponent `Input` (Shadcn/ui) dla wyszukiwania
- Komponent `Select` (Shadcn/ui) dla wyboru typu
- Ikona `Search` przy polu wyszukiwania

**Obsługiwane interakcje**:

- Wpisywanie tekstu w pole wyszukiwania - callback `onSearchChange` z debounce 300ms
- Zmiana filtra typu - callback `onTypeFilterChange`
- Czyszczenie filtrów - wewnętrzna funkcja resetująca stan

**Obsługiwana walidacja**:

- Walidacja długości tekstu wyszukiwania (max 100 znaków)
- Walidacja poprawności wartości filtra typu (enum)

**Typy**:

- `ExerciseFiltersProps`
- `ExerciseTypeFilter` = 'all' | 'strength' | 'cardio'

**Propsy**:

```typescript
interface ExerciseFiltersProps {
  searchQuery: string;
  typeFilter: ExerciseTypeFilter;
  onSearchChange: (query: string) => void;
  onTypeFilterChange: (type: ExerciseTypeFilter) => void;
}
```

---

### ExerciseList

**Opis**: Kontener wyświetlający listę ćwiczeń w formie kart, z obsługą stanów ładowania i braku danych.

**Główne elementy**:

- Element `div` z CSS Grid (responsive columns)
- Tablica komponentów `ExerciseCard`
- Skeleton loader dla stanu ładowania
- Empty state dla braku wyników

**Obsługiwane interakcje**:

- Delegacja akcji edycji do `onEdit`
- Delegacja akcji archiwizacji do `onArchive`

**Obsługiwana walidacja**: Brak (walidacja na poziomie pojedynczych kart)

**Typy**:

- `ExerciseListProps`
- `ExerciseDTO[]`

**Propsy**:

```typescript
interface ExerciseListProps {
  exercises: ExerciseDTO[];
  isLoading: boolean;
  onEdit: (exercise: ExerciseDTO) => void;
  onArchive: (exercise: ExerciseDTO) => void;
}
```

---

### ExerciseCard

**Opis**: Pojedyncza karta reprezentująca jedno ćwiczenie, wyświetlająca nazwę, typ, status oraz przyciski akcji.

**Główne elementy**:

- Komponent `Card` (Shadcn/ui) jako kontener
- Element `h3` z nazwą ćwiczenia
- Komponent `Badge` (Shadcn/ui) dla typu
- Komponent `Badge` dla statusu (Systemowe/Własne/Zarchiwizowane)
- Komponent `DropdownMenu` (Shadcn/ui) dla akcji
- Ikony `Edit` i `Archive` (lucide-react)

**Obsługiwane interakcje**:

- Kliknięcie "Edytuj" - wywołuje `onEdit(exercise)`
- Kliknięcie "Archiwizuj" - wywołuje `onArchive(exercise)`
- Hover na karcie - wizualna zmiana (border/shadow)

**Obsługiwana walidacja**:

- Walidacja uprawnień: przyciski akcji widoczne tylko dla `!exercise.is_system`
- Walidacja statusu archiwizacji: inny styl dla `exercise.is_archived`

**Typy**:

- `ExerciseCardProps`
- `ExerciseDTO`

**Propsy**:

```typescript
interface ExerciseCardProps {
  exercise: ExerciseDTO;
  onEdit: (exercise: ExerciseDTO) => void;
  onArchive: (exercise: ExerciseDTO) => void;
}
```

---

### ExerciseFormDialog

**Opis**: Dialog modalny służący zarówno do tworzenia nowych ćwiczeń, jak i edycji istniejących. Zawiera formularz z walidacją.

**Główne elementy**:

- Komponent `Dialog` (Shadcn/ui) jako kontener modalny
- `DialogHeader` z dynamicznym tytułem ("Dodaj ćwiczenie" / "Edytuj ćwiczenie")
- Formularz z polami:
  - `Input` dla nazwy
  - `Select` dla typu (disabled w trybie edycji)
- `DialogFooter` z przyciskami Anuluj/Zapisz
- `Label` dla dostępności

**Obsługiwane interakcje**:

- Otwieranie/zamykanie dialogu - prop `open` + callback `onOpenChange`
- Wpisywanie w pole nazwy - lokalna walidacja real-time
- Wybór typu - tylko w trybie tworzenia
- Kliknięcie "Zapisz" - walidacja + wywołanie `onSubmit`
- Kliknięcie "Anuluj" - zamknięcie bez zapisywania
- Enter w ostatnim polu - submit formularza

**Obsługiwana walidacja**:

- **Nazwa**:
  - Wymagana (min. 1 znak po trim)
  - Max. 100 znaków
  - Wyświetlanie błędu walidacji pod polem
- **Typ**:
  - Wymagany przy tworzeniu
  - Enum: 'strength' | 'cardio'
- Blokowanie przycisku "Zapisz" gdy formularz niepoprawny
- Wyświetlanie błędów API (409 - duplikat nazwy)

**Typy**:

- `ExerciseFormDialogProps`
- `ExerciseFormData`
- `CreateExerciseCommand` | `UpdateExerciseCommand`

**Propsy**:

```typescript
interface ExerciseFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  exercise?: ExerciseDTO; // Tylko w trybie edit
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateExerciseCommand | UpdateExerciseCommand) => Promise<void>;
}

interface ExerciseFormData {
  name: string;
  type?: ExerciseType; // Tylko w trybie create
}
```

---

### ConfirmArchiveDialog

**Opis**: Dialog potwierdzenia archiwizacji ćwiczenia, informujący użytkownika o konsekwencjach (zniknięcie z listy wyboru, zachowanie historii).

**Główne elementy**:

- Komponent `AlertDialog` (Shadcn/ui) jako kontener
- `AlertDialogHeader` z tytułem i ikoną ostrzeżenia
- `AlertDialogDescription` z opisem konsekwencji
- Wyróżniony tekst z nazwą ćwiczenia
- `AlertDialogFooter` z przyciskami Anuluj/Archiwizuj

**Obsługiwane interakcje**:

- Otwieranie/zamykanie dialogu - prop `open` + callback `onOpenChange`
- Kliknięcie "Archiwizuj" - wywołanie `onConfirm`
- Kliknięcie "Anuluj" - zamknięcie bez akcji
- Escape - zamknięcie bez akcji

**Obsługiwana walidacja**:

- Walidacja obecności `exercise` przed renderowaniem treści
- Blokowanie przycisku podczas wykonywania akcji (`isDeleting`)

**Typy**:

- `ConfirmArchiveDialogProps`
- `ExerciseDTO`

**Propsy**:

```typescript
interface ConfirmArchiveDialogProps {
  open: boolean;
  exercise: ExerciseDTO | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}
```

## 5. Typy

### DTO i Command Types (zdefiniowane w `src/types.ts`)

```typescript
// Istniejące typy z src/types.ts
export type ExerciseDTO = Exercise & {
  is_system: boolean;
};

export interface CreateExerciseCommand {
  name: string;
  type: ExerciseType;
}

export interface UpdateExerciseCommand {
  name: string;
}

export interface ListExercisesResponse {
  exercises: ExerciseDTO[];
}

export type ExerciseType = "strength" | "cardio";
```

### ViewModel Types (nowe, do dodania w `src/types.ts`)

```typescript
/**
 * Stan widoku Bazy Ćwiczeń
 */
export interface ExercisesViewState {
  // Lista ćwiczeń
  exercises: ExerciseDTO[];

  // Filtry
  searchQuery: string;
  typeFilter: ExerciseTypeFilter;

  // Stany UI
  isLoading: boolean;
  error: string | null;

  // Dialogi
  formDialog: {
    open: boolean;
    mode: "create" | "edit";
    exercise: ExerciseDTO | null;
    isSubmitting: boolean;
  };

  archiveDialog: {
    open: boolean;
    exercise: ExerciseDTO | null;
    isDeleting: boolean;
  };
}

/**
 * Typ filtra ćwiczeń
 */
export type ExerciseTypeFilter = "all" | "strength" | "cardio";

/**
 * Dane formularza ćwiczenia
 */
export interface ExerciseFormData {
  name: string;
  type?: ExerciseType;
}

/**
 * Lista przefiltrowanych ćwiczeń (computed)
 */
export interface FilteredExercises {
  all: ExerciseDTO[];
  system: ExerciseDTO[];
  user: ExerciseDTO[];
  active: ExerciseDTO[];
  archived: ExerciseDTO[];
}
```

### Props Types (dla komponentów)

```typescript
// ExerciseHeader
export interface ExerciseHeaderProps {
  onAddClick: () => void;
}

// ExerciseFilters
export interface ExerciseFiltersProps {
  searchQuery: string;
  typeFilter: ExerciseTypeFilter;
  onSearchChange: (query: string) => void;
  onTypeFilterChange: (type: ExerciseTypeFilter) => void;
}

// ExerciseList
export interface ExerciseListProps {
  exercises: ExerciseDTO[];
  isLoading: boolean;
  onEdit: (exercise: ExerciseDTO) => void;
  onArchive: (exercise: ExerciseDTO) => void;
}

// ExerciseCard
export interface ExerciseCardProps {
  exercise: ExerciseDTO;
  onEdit: (exercise: ExerciseDTO) => void;
  onArchive: (exercise: ExerciseDTO) => void;
}

// ExerciseFormDialog
export interface ExerciseFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  exercise?: ExerciseDTO;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateExerciseCommand | UpdateExerciseCommand) => Promise<void>;
}

// ConfirmArchiveDialog
export interface ConfirmArchiveDialogProps {
  open: boolean;
  exercise: ExerciseDTO | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}
```

## 6. Zarządzanie stanem

### Strategia zarządzania stanem

Widok wykorzystuje **lokalny stan komponentu React** zarządzany przez hooki `useState`. Nie jest wymagany custom hook ani Context API, ponieważ:

- Stan nie jest współdzielony między różnymi częściami aplikacji
- Hierarchia komponentów jest płaska (max 2-3 poziomy)
- Brak złożonych interakcji wymagających centralizacji stanu

### Struktura stanu

```typescript
const [state, setState] = useState<ExercisesViewState>({
  exercises: [],
  searchQuery: "",
  typeFilter: "all",
  isLoading: true,
  error: null,
  formDialog: {
    open: false,
    mode: "create",
    exercise: null,
    isSubmitting: false,
  },
  archiveDialog: {
    open: false,
    exercise: null,
    isDeleting: false,
  },
});
```

### Kluczowe funkcje zarządzające stanem

```typescript
// Pobieranie listy ćwiczeń
async function fetchExercises(): Promise<void>;

// Otwieranie dialogu dodawania
function openCreateDialog(): void;

// Otwieranie dialogu edycji
function openEditDialog(exercise: ExerciseDTO): void;

// Otwieranie dialogu archiwizacji
function openArchiveDialog(exercise: ExerciseDTO): void;

// Zamykanie dialogów
function closeDialogs(): void;

// Aktualizacja filtrów
function updateSearchQuery(query: string): void;
function updateTypeFilter(type: ExerciseTypeFilter): void;

// Obsługa submitów
async function handleCreateExercise(data: CreateExerciseCommand): Promise<void>;
async function handleUpdateExercise(data: UpdateExerciseCommand): Promise<void>;
async function handleArchiveExercise(): Promise<void>;
```

### Computed values (useMemo)

```typescript
// Filtrowana lista ćwiczeń
const filteredExercises = useMemo(() => {
  return state.exercises
    .filter((ex) => {
      // Filtr typu
      if (state.typeFilter !== "all" && ex.type !== state.typeFilter) {
        return false;
      }

      // Filtr wyszukiwania
      if (state.searchQuery) {
        return ex.name.toLowerCase().includes(state.searchQuery.toLowerCase());
      }

      return true;
    })
    .sort((a, b) => {
      // Systemowe na górze, potem własne
      if (a.is_system && !b.is_system) return -1;
      if (!a.is_system && b.is_system) return 1;
      // Alfabetycznie
      return a.name.localeCompare(b.name, "pl");
    });
}, [state.exercises, state.searchQuery, state.typeFilter]);
```

### Side effects (useEffect)

```typescript
// Pobieranie danych przy montowaniu
useEffect(() => {
  fetchExercises();
}, []);
```

## 7. Integracja API

### Endpointy wykorzystywane przez widok

#### 1. GET /api/exercises - Pobieranie listy ćwiczeń

**Kiedy wywoływane**:

- Przy montowaniu komponentu (`useEffect`)
- Po utworzeniu nowego ćwiczenia (odświeżenie)
- Po edycji ćwiczenia (odświeżenie)
- Po archiwizacji ćwiczenia (odświeżenie)

**Query parameters**:

```typescript
{
  type?: 'strength' | 'cardio',
  include_archived?: boolean // domyślnie false
}
```

**Typ żądania**: Brak body (GET)

**Typ odpowiedzi**:

```typescript
// Sukces (200)
interface ListExercisesResponse {
  exercises: ExerciseDTO[];
}

// Błąd (401)
interface ErrorResponse {
  message: string;
}
```

**Implementacja w komponencie**:

```typescript
async function fetchExercises() {
  try {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const params = new URLSearchParams();
    if (state.typeFilter !== "all") {
      params.append("type", state.typeFilter);
    }
    params.append("include_archived", "false");

    const response = await fetch(`/api/exercises?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Nie udało się pobrać listy ćwiczeń");
    }

    const data: ListExercisesResponse = await response.json();

    setState((prev) => ({
      ...prev,
      exercises: data.exercises,
      isLoading: false,
    }));
  } catch (error) {
    setState((prev) => ({
      ...prev,
      error: error.message,
      isLoading: false,
    }));
    toast.error("Błąd podczas pobierania ćwiczeń");
  }
}
```

---

#### 2. POST /api/exercises - Tworzenie ćwiczenia

**Kiedy wywoływane**: Po submicie formularza dodawania nowego ćwiczenia

**Typ żądania**:

```typescript
interface CreateExerciseCommand {
  name: string;
  type: "strength" | "cardio";
}
```

**Typ odpowiedzi**:

```typescript
// Sukces (201)
interface ExerciseDTO {
  id: string;
  user_id: string;
  name: string;
  type: "strength" | "cardio";
  is_archived: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// Błąd (400) - Walidacja
interface ErrorResponse {
  message: string;
  errors?: object;
}

// Błąd (409) - Duplikat nazwy
interface ErrorResponse {
  message: string; // "Exercise with this name already exists"
}
```

**Implementacja w komponencie**:

```typescript
async function handleCreateExercise(data: CreateExerciseCommand) {
  try {
    setState((prev) => ({
      ...prev,
      formDialog: { ...prev.formDialog, isSubmitting: true },
    }));

    const response = await fetch("/api/exercises", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Nie udało się utworzyć ćwiczenia");
    }

    // Sukces - odśwież listę i zamknij dialog
    await fetchExercises();
    closeDialogs();
    toast.success("Ćwiczenie zostało dodane");
  } catch (error) {
    toast.error(error.message);
  } finally {
    setState((prev) => ({
      ...prev,
      formDialog: { ...prev.formDialog, isSubmitting: false },
    }));
  }
}
```

---

#### 3. PUT /api/exercises/:id - Edycja ćwiczenia

**Kiedy wywoływane**: Po submicie formularza edycji ćwiczenia

**Typ żądania**:

```typescript
interface UpdateExerciseCommand {
  name: string;
}
```

**Typ odpowiedzi**:

```typescript
// Sukces (200)
interface ExerciseDTO { ... }

// Błąd (403) - Próba edycji systemowego
interface ErrorResponse {
  message: string; // "Cannot modify system exercise"
}

// Błąd (404) - Nie znaleziono
interface ErrorResponse {
  message: string; // "Exercise not found"
}

// Błąd (409) - Duplikat nazwy
interface ErrorResponse {
  message: string; // "Exercise with this name already exists"
}
```

**Implementacja w komponencie**:

```typescript
async function handleUpdateExercise(data: UpdateExerciseCommand) {
  if (!state.formDialog.exercise) return;

  try {
    setState((prev) => ({
      ...prev,
      formDialog: { ...prev.formDialog, isSubmitting: true },
    }));

    const response = await fetch(`/api/exercises/${state.formDialog.exercise.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Nie udało się zaktualizować ćwiczenia");
    }

    // Sukces - odśwież listę i zamknij dialog
    await fetchExercises();
    closeDialogs();
    toast.success("Ćwiczenie zostało zaktualizowane");
  } catch (error) {
    toast.error(error.message);
  } finally {
    setState((prev) => ({
      ...prev,
      formDialog: { ...prev.formDialog, isSubmitting: false },
    }));
  }
}
```

---

#### 4. DELETE /api/exercises/:id - Archiwizacja ćwiczenia

**Kiedy wywoływane**: Po potwierdzeniu archiwizacji w dialogu

**Typ żądania**: Brak body (DELETE)

**Typ odpowiedzi**:

```typescript
// Sukces (200)
interface ArchiveExerciseResponse {
  id: string;
  is_archived: boolean;
  message: string; // "Exercise archived successfully"
}

// Błąd (403) - Próba archiwizacji systemowego
interface ErrorResponse {
  message: string; // "Cannot archive system exercise"
}

// Błąd (404) - Nie znaleziono
interface ErrorResponse {
  message: string; // "Exercise not found"
}
```

**Implementacja w komponencie**:

```typescript
async function handleArchiveExercise() {
  if (!state.archiveDialog.exercise) return;

  try {
    setState((prev) => ({
      ...prev,
      archiveDialog: { ...prev.archiveDialog, isDeleting: true },
    }));

    const response = await fetch(`/api/exercises/${state.archiveDialog.exercise.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Nie udało się zarchiwizować ćwiczenia");
    }

    // Sukces - odśwież listę i zamknij dialog
    await fetchExercises();
    closeDialogs();
    toast.success("Ćwiczenie zostało zarchiwizowane");
  } catch (error) {
    toast.error(error.message);
  } finally {
    setState((prev) => ({
      ...prev,
      archiveDialog: { ...prev.archiveDialog, isDeleting: false },
    }));
  }
}
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie listy ćwiczeń

**Kroki**:

1. Użytkownik wchodzi na `/app/exercises`
2. System wyświetla skeleton loader
3. System pobiera listę ćwiczeń z API
4. System renderuje karty ćwiczeń posortowane: systemowe → własne, alfabetycznie

**Szczegóły**:

- Ćwiczenia systemowe mają badge "Systemowe" (szary)
- Własne ćwiczenia mają badge "Własne" (niebieski)
- Przyciski akcji widoczne tylko dla własnych ćwiczeń
- Lista domyślnie sortowana alfabetycznie w obrębie grup

---

### 8.2. Wyszukiwanie ćwiczeń

**Kroki**:

1. Użytkownik wpisuje tekst w pole "Szukaj ćwiczenia..."
2. System filtruje listę po 300ms (debounce)
3. System wyświetla tylko pasujące wyniki (case-insensitive)
4. Jeśli brak wyników - wyświetla komunikat "Nie znaleziono ćwiczeń"

**Szczegóły**:

- Wyszukiwanie po nazwie ćwiczenia
- Ignoruje wielkość liter
- Działa łącznie z filtrem typu
- Wyszukiwanie lokalne (bez zapytania do API)

---

### 8.3. Filtrowanie po typie

**Kroki**:

1. Użytkownik wybiera opcję z dropdown "Typ ćwiczenia"
   - Wszystkie (domyślne)
   - Siłowe
   - Cardio
2. System natychmiast filtruje listę
3. System zachowuje aktywny filtr wyszukiwania

**Szczegóły**:

- Filtrowanie lokalne (bez zapytania do API)
- Działa łącznie z wyszukiwaniem
- Wizualne wskazanie aktywnego filtra w dropdown

---

### 8.4. Dodawanie nowego ćwiczenia

**Kroki**:

1. Użytkownik klika przycisk "Dodaj ćwiczenie"
2. System otwiera dialog modalny z formularzem
3. Użytkownik:
   - Wpisuje nazwę ćwiczenia (wymagane, 1-100 znaków)
   - Wybiera typ: Siłowe lub Cardio (wymagane)
4. Użytkownik klika "Zapisz"
5. System:
   - Waliduje dane
   - Wysyła POST /api/exercises
   - Wyświetla loader na przycisku "Zapisz"
6. **Sukces** (201):
   - System zamyka dialog
   - Odświeża listę ćwiczeń
   - Wyświetla toast "Ćwiczenie zostało dodane"
7. **Błąd** (409 - duplikat):
   - System wyświetla błąd pod polem nazwy: "Ćwiczenie o tej nazwie już istnieje"
   - Dialog pozostaje otwarty
8. **Błąd** (400/500):
   - System wyświetla toast z komunikatem błędu
   - Dialog pozostaje otwarty

**Obsługa klawiatury**:

- Tab: przejście między polami
- Enter w ostatnim polu: submit formularza
- Escape: zamknięcie dialogu (z potwierdzeniem jeśli są zmiany)

---

### 8.5. Edycja nazwy ćwiczenia

**Kroki**:

1. Użytkownik klika ikonę "⋮" (menu) na karcie **własnego** ćwiczenia
2. Użytkownik wybiera "Edytuj" z dropdown menu
3. System otwiera dialog modalny z formularzem
4. System wstępnie wypełnia pole nazwy
5. System **blokuje pole typu** (disabled, tylko do odczytu)
6. Użytkownik modyfikuje nazwę
7. Użytkownik klika "Zapisz"
8. System:
   - Waliduje dane
   - Wysyła PUT /api/exercises/:id
   - Wyświetla loader na przycisku "Zapisz"
9. **Sukces** (200):
   - System zamyka dialog
   - Odświeża listę ćwiczeń
   - Wyświetla toast "Ćwiczenie zostało zaktualizowane"
10. **Błąd** (409 - duplikat):
    - System wyświetla błąd pod polem nazwy
    - Dialog pozostaje otwarty
11. **Błąd** (403 - systemowe):
    - System wyświetla toast "Nie można edytować ćwiczenia systemowego"
    - Zamyka dialog
12. **Błąd** (404/500):
    - System wyświetla toast z komunikatem błędu
    - Dialog pozostaje otwarty

**Zabezpieczenia**:

- Przycisk "Edytuj" niewidoczny dla ćwiczeń systemowych
- Backend dodatkowo weryfikuje uprawnienia (403)

---

### 8.6. Archiwizacja ćwiczenia

**Kroki**:

1. Użytkownik klika ikonę "⋮" (menu) na karcie **własnego** ćwiczenia
2. Użytkownik wybiera "Archiwizuj" z dropdown menu
3. System otwiera dialog potwierdzenia z ostrzeżeniem:
   - "Czy na pewno chcesz zarchiwizować ćwiczenie **[Nazwa]**?"
   - "Ćwiczenie zniknie z listy wyboru przy dodawaniu treningu."
   - "Historyczne treningi zawierające to ćwiczenie pozostaną bez zmian."
4. Użytkownik klika "Archiwizuj"
5. System:
   - Wysyła DELETE /api/exercises/:id
   - Wyświetla loader na przycisku
6. **Sukces** (200):
   - System zamyka dialog
   - Odświeża listę (ćwiczenie znika, bo `include_archived=false`)
   - Wyświetla toast "Ćwiczenie zostało zarchiwizowane"
7. **Błąd** (403 - systemowe):
   - System wyświetla toast "Nie można zarchiwizować ćwiczenia systemowego"
   - Zamyka dialog
8. **Błąd** (404/500):
   - System wyświetla toast z komunikatem błędu
   - Dialog pozostaje otwarty

**Zabezpieczenia**:

- Przycisk "Archiwizuj" niewidoczny dla ćwiczeń systemowych
- Backend dodatkowo weryfikuje uprawnienia (403)
- Dialog wymaga potwierdzenia (zapobiega przypadkowym usunięciom)

---

### 8.7. Anulowanie operacji

**Scenariusze**:

- Kliknięcie "Anuluj" w dialogu formularza → zamknięcie bez zmian
- Kliknięcie "Anuluj" w dialogu archiwizacji → zamknięcie bez akcji
- Kliknięcie "X" (close) w dialogu → zamknięcie bez zmian
- Kliknięcie poza dialogiem (overlay) → zamknięcie bez zmian
- Naciśnięcie Escape → zamknięcie bez zmian

**Obsługa niezapisanych zmian**:

- Jeśli użytkownik wprowadził zmiany w formularzu i próbuje zamknąć dialog:
  - System **nie** wyświetla dodatkowego potwierdzenia (MVP - uproszczenie UX)
  - Dialog zamyka się natychmiast
  - Dane formularza są resetowane

## 9. Warunki i walidacja

### 9.1. Walidacja po stronie klienta (Formularz)

#### Pole "Nazwa ćwiczenia"

**Komponent**: `ExerciseFormDialog` → `Input`

**Warunki walidacji**:

1. **Wymagane**: Pole nie może być puste
   - Warunek: `name.trim().length > 0`
   - Komunikat: "Nazwa ćwiczenia jest wymagana"
   - Moment: Po blur lub próbie submitu

2. **Maksymalna długość**: Max 100 znaków
   - Warunek: `name.length <= 100`
   - Komunikat: "Nazwa nie może przekraczać 100 znaków"
   - Moment: Real-time podczas wpisywania

3. **Whitespace**: Automatyczne trimowanie
   - Przed walidacją i submitem: `name = name.trim()`
   - Zapobiega zapisaniu pustych stringów

**Wpływ na UI**:

- Błąd walidacji → czerwona ramka wokół pola
- Komunikat błędu → wyświetlany pod polem (czerwony tekst)
- Przycisk "Zapisz" → disabled gdy formularz niepoprawny

**Implementacja**:

```typescript
const [errors, setErrors] = useState<{ name?: string }>({});

function validateName(value: string): string | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Nazwa ćwiczenia jest wymagana";
  }

  if (value.length > 100) {
    return "Nazwa nie może przekraczać 100 znaków";
  }

  return undefined;
}

function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
  const value = e.target.value;
  setFormData((prev) => ({ ...prev, name: value }));

  // Real-time walidacja długości
  const error = validateName(value);
  setErrors((prev) => ({ ...prev, name: error }));
}
```

---

#### Pole "Typ ćwiczenia"

**Komponent**: `ExerciseFormDialog` → `Select`

**Warunki walidacji**:

1. **Wymagane** (tylko w trybie create): Użytkownik musi wybrać typ
   - Warunek: `type === 'strength' || type === 'cardio'`
   - Komunikat: "Wybierz typ ćwiczenia"
   - Moment: Po próbie submitu

2. **Disabled w trybie edit**: Pole zablokowane, wyświetla aktualny typ
   - Warunek: `mode === 'edit'`
   - Wpływ: `disabled={true}`, wartość z `exercise.type`

**Wpływ na UI**:

- Brak wyboru → czerwona ramka + komunikat błędu
- Tryb edycji → pole szare (disabled), z ikoną kłódki (opcjonalnie)
- Przycisk "Zapisz" → disabled gdy brak wyboru (create)

---

### 9.2. Walidacja po stronie serwera (API)

#### Warunki weryfikowane przez API

**POST /api/exercises** i **PUT /api/exercises/:id**:

1. **Unikalność nazwy** (409 Conflict)
   - Warunek: Nazwa ćwiczenia musi być unikalna w obrębie użytkownika
   - API zwraca: `{ message: "Exercise with this name already exists" }`
   - Reakcja UI:
     - Wyświetlenie błędu pod polem "Nazwa"
     - Dialog pozostaje otwarty
     - Focus wraca do pola nazwy

2. **Format danych** (400 Bad Request)
   - Warunki:
     - `name` jest stringiem o długości 1-100 (po trim)
     - `type` jest enumem: 'strength' | 'cardio'
   - API zwraca: `{ message: "Invalid request body", errors: {...} }`
   - Reakcja UI:
     - Toast z komunikatem błędu
     - Dialog pozostaje otwarty

3. **Uprawnienia** (403 Forbidden)
   - Warunki:
     - Edycja: `exercise.user_id === current_user_id`
     - Archiwizacja: `exercise.user_id === current_user_id`
     - Nie można modyfikować ćwiczeń systemowych (`user_id IS NULL`)
   - API zwraca: `{ message: "Cannot modify system exercise" }`
   - Reakcja UI:
     - Toast: "Nie można edytować ćwiczenia systemowego"
     - Zamknięcie dialogu

4. **Istnienie zasobu** (404 Not Found)
   - Warunek: Ćwiczenie o podanym ID istnieje i należy do użytkownika
   - API zwraca: `{ message: "Exercise not found" }`
   - Reakcja UI:
     - Toast: "Nie znaleziono ćwiczenia"
     - Zamknięcie dialogu
     - Odświeżenie listy

---

### 9.3. Warunki widoczności komponentów

#### Przyciski akcji (Edytuj / Archiwizuj)

**Komponent**: `ExerciseCard` → `DropdownMenu`

**Warunek widoczności**:

```typescript
const canModify = !exercise.is_system;
```

**Implementacja**:

```tsx
{
  canModify && (
    <DropdownMenu>
      <DropdownMenuItem onClick={() => onEdit(exercise)}>Edytuj</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onArchive(exercise)}>Archiwizuj</DropdownMenuItem>
    </DropdownMenu>
  );
}
```

**Opis**:

- Jeśli `exercise.is_system === true`: Menu akcji nie renderuje się
- Jeśli `exercise.is_system === false`: Menu akcji widoczne
- Zabezpiecza przed próbą edycji/archiwizacji ćwiczeń systemowych na poziomie UI

---

#### Pole "Typ ćwiczenia" w trybie edycji

**Komponent**: `ExerciseFormDialog` → `Select`

**Warunek blokady**:

```typescript
const isTypeDisabled = mode === "edit";
```

**Implementacja**:

```tsx
<Select
  disabled={isTypeDisabled}
  value={formData.type}
  onValueChange={(value) => setFormData({ ...formData, type: value })}
>
  {/* Options */}
</Select>
```

**Opis**:

- W trybie create: pole aktywne, wymagane
- W trybie edit: pole zablokowane, wyświetla aktualny typ
- Zapobiega zmianie typu ćwiczenia (wymaganie biznesowe)

---

### 9.4. Walidacja stanu UI

#### Disabled state przycisku "Zapisz"

**Komponent**: `ExerciseFormDialog` → `Button[type="submit"]`

**Warunki**:

```typescript
const isFormInvalid =
  !formData.name.trim() ||
  formData.name.length > 100 ||
  (mode === 'create' && !formData.type) ||
  isSubmitting;

<Button disabled={isFormInvalid} type="submit">
  {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
</Button>
```

**Wpływ na UI**:

- Przycisk nieaktywny (szary, brak hover)
- Kursor: `cursor-not-allowed`
- Zapobiega submisji niepoprawnego formularza

---

#### Loading state podczas operacji API

**Komponenty**: `ExerciseFormDialog`, `ConfirmArchiveDialog`

**Warunki**:

- Form dialog: `isSubmitting === true`
- Archive dialog: `isDeleting === true`

**Wpływ na UI**:

- Przycisk akcji: Wyświetla loader + tekst "Zapisywanie..." / "Archiwizowanie..."
- Pozostałe przyciski: Disabled
- Dialog: Blokada zamknięcia przez overlay/escape
- Zapobiega wielokrotnym submitom i przypadkowym zamknięciom

---

#### Empty state listy

**Komponent**: `ExerciseList`

**Warunki**:

```typescript
const hasNoResults = !isLoading && filteredExercises.length === 0;
```

**Implementacja**:

```tsx
{
  hasNoResults && (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Nie znaleziono ćwiczeń</p>
      {(searchQuery || typeFilter !== "all") && (
        <p className="text-sm text-muted-foreground mt-2">Spróbuj zmienić filtry</p>
      )}
    </div>
  );
}
```

**Opis**:

- Wyświetla się gdy lista jest pusta po zastosowaniu filtrów
- Sugeruje zmianę filtrów jeśli są aktywne
- Nie wyświetla się podczas ładowania (skeleton loader ma priorytet)

## 10. Obsługa błędów

### 10.1. Błędy sieciowe

#### Brak połączenia z internetem

**Scenariusz**: Użytkownik nie ma dostępu do sieci

**Obsługa**:

```typescript
try {
  const response = await fetch("/api/exercises");
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    setState((prev) => ({
      ...prev,
      error: "Brak połączenia z internetem",
      isLoading: false,
    }));
    toast.error("Sprawdź połączenie z internetem i spróbuj ponownie");
  }
}
```

**UI**:

- Toast z komunikatem błędu
- Stan `error` w widoku → wyświetla error boundary
- Przycisk "Spróbuj ponownie" → ponowne wywołanie `fetchExercises()`

---

#### Timeout zapytania

**Scenariusz**: Zapytanie trwa zbyt długo (>30s)

**Obsługa**:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch("/api/exercises", {
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  if (error.name === "AbortError") {
    toast.error("Zapytanie przekroczyło limit czasu. Spróbuj ponownie.");
  }
}
```

**UI**:

- Toast z komunikatem
- Widok pozostaje w stanie ostatnich danych lub empty state
- Przycisk "Odśwież" dostępny

---

### 10.2. Błędy autoryzacji

#### 401 Unauthorized - Brak sesji

**Scenariusz**: Sesja użytkownika wygasła lub nie istnieje

**Obsługa**:

```typescript
if (response.status === 401) {
  toast.error("Sesja wygasła. Zaloguj się ponownie.");
  // Przekierowanie do strony logowania
  window.location.href = "/login?redirect=/app/exercises";
}
```

**UI**:

- Toast z komunikatem
- Automatyczne przekierowanie do `/login`
- Query param `redirect` zachowuje intencję użytkownika

---

### 10.3. Błędy walidacji API

#### 400 Bad Request - Niepoprawne dane

**Scenariusz**: Dane formularza nie przeszły walidacji po stronie serwera

**Obsługa**:

```typescript
if (response.status === 400) {
  const error = await response.json();

  // Jeśli API zwraca szczegóły błędów walidacji
  if (error.errors) {
    Object.entries(error.errors).forEach(([field, message]) => {
      setErrors((prev) => ({ ...prev, [field]: message }));
    });
  } else {
    toast.error(error.message || "Niepoprawne dane formularza");
  }
}
```

**UI**:

- Błędy walidacji wyświetlane pod odpowiednimi polami
- Dialog pozostaje otwarty
- Focus przenoszony na pierwsze pole z błędem

---

#### 409 Conflict - Duplikat nazwy

**Scenariusz**: Użytkownik próbuje utworzyć/edytować ćwiczenie o nazwie, która już istnieje

**Obsługa**:

```typescript
if (response.status === 409) {
  setErrors((prev) => ({
    ...prev,
    name: "Ćwiczenie o tej nazwie już istnieje",
  }));
  // Focus na pole nazwy
  nameInputRef.current?.focus();
}
```

**UI**:

- Komunikat błędu pod polem "Nazwa"
- Czerwona ramka wokół pola
- Dialog pozostaje otwarty
- Użytkownik może poprawić nazwę

---

### 10.4. Błędy uprawnień

#### 403 Forbidden - Próba modyfikacji systemowego ćwiczenia

**Scenariusz**:

- Użytkownik obchodzi zabezpieczenie UI i próbuje edytować/archiwizować ćwiczenie systemowe
- Błąd w logice aplikacji (race condition, cache)

**Obsługa**:

```typescript
if (response.status === 403) {
  const error = await response.json();
  toast.error(error.message || "Nie masz uprawnień do wykonania tej operacji");
  closeDialogs();
  await fetchExercises(); // Odśwież listę
}
```

**UI**:

- Toast z komunikatem błędu
- Automatyczne zamknięcie dialogu
- Odświeżenie listy (synchronizacja stanu)

---

### 10.5. Błędy zasobów

#### 404 Not Found - Ćwiczenie nie istnieje

**Scenariusz**:

- Użytkownik próbuje edytować/archiwizować ćwiczenie, które zostało już usunięte
- Inny użytkownik ma dostęp do URL lub ID (race condition)

**Obsługa**:

```typescript
if (response.status === 404) {
  toast.error("Ćwiczenie nie zostało znalezione. Lista zostanie odświeżona.");
  closeDialogs();
  await fetchExercises();
}
```

**UI**:

- Toast z komunikatem
- Zamknięcie dialogu
- Odświeżenie listy (usunięcie nieistniejącego ćwiczenia z UI)

---

### 10.6. Błędy serwera

#### 500 Internal Server Error

**Scenariusz**: Nieoczekiwany błąd po stronie serwera

**Obsługa**:

```typescript
if (response.status === 500) {
  toast.error("Wystąpił błąd serwera. Spróbuj ponownie za chwilę.");
  // Opcjonalnie: logowanie błędu do systemu monitoringu
  console.error("Server error:", await response.text());
}
```

**UI**:

- Toast z ogólnym komunikatem
- Stan widoku bez zmian
- Użytkownik może ponowić akcję

---

### 10.7. Obsługa błędów w komponencie

#### Error Boundary dla całego widoku

**Komponent**: `ExerciseManager` (wrapper)

**Implementacja**:

```typescript
if (state.error && !state.exercises.length) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-destructive text-lg mb-4">
        Nie udało się załadować listy ćwiczeń
      </p>
      <p className="text-muted-foreground mb-6">{state.error}</p>
      <Button onClick={fetchExercises}>Spróbuj ponownie</Button>
    </div>
  );
}
```

**UI**:

- Ikona błędu
- Komunikat z opisem problemu
- Przycisk "Spróbuj ponownie"
- Zachowana nawigacja aplikacji

---

### 10.8. Mechanizm retry

#### Automatyczne ponowienie przy przejściowych błędach

**Implementacja**:

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // Jeśli sukces lub błąd klienta (4xx) - nie retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Jeśli błąd serwera (5xx) - retry z exponential backoff
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

**Zastosowanie**:

- GET /api/exercises - 3 próby
- POST/PUT/DELETE - bez retry (operacje nie-idempotentne)

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

**Zadanie**: Przygotowanie struktury katalogów i plików dla widoku Bazy Ćwiczeń.

**Akcje**:

1. Utwórz plik strony Astro:
   - `src/pages/app/exercises.astro`
2. Utwórz katalog dla komponentów React:
   - `src/components/exercises/`
3. Utwórz pliki komponentów:
   - `src/components/exercises/ExerciseManager.tsx` (główny kontener)
   - `src/components/exercises/ExerciseHeader.tsx`
   - `src/components/exercises/ExerciseFilters.tsx`
   - `src/components/exercises/ExerciseList.tsx`
   - `src/components/exercises/ExerciseCard.tsx`
   - `src/components/exercises/ExerciseFormDialog.tsx`
   - `src/components/exercises/ConfirmArchiveDialog.tsx`

**Rezultat**: Pusta struktura plików gotowa do implementacji.

---

### Krok 2: Rozszerzenie typów w `src/types.ts`

**Zadanie**: Dodanie nowych typów ViewModels dla widoku Bazy Ćwiczeń.

**Akcje**:

1. Otwórz plik `src/types.ts`
2. Dodaj na końcu pliku nowe typy:
   - `ExercisesViewState`
   - `ExerciseTypeFilter`
   - `ExerciseFormData`
   - `FilteredExercises`
   - Interfejsy propsów dla wszystkich komponentów (sekcja 5 tego planu)
3. Upewnij się, że typy są eksportowane

**Kod do dodania**: (Zobacz sekcję 5 tego planu - "Typy / ViewModel Types")

**Rezultat**: Wszystkie typy dostępne do importu w komponentach.

---

### Krok 3: Implementacja strony Astro `/app/exercises`

**Zadanie**: Utworzenie strony Astro integrującej komponent React z layoutem aplikacji.

**Akcje**:

1. Otwórz plik `src/pages/app/exercises.astro`
2. Zaimportuj layout aplikacji (np. `LayoutApp`)
3. Zaimportuj komponent `ExerciseManager` (client:load)
4. Dodaj middleware dla autoryzacji (jeśli nie jest globalny)
5. Ustaw meta tags (tytuł, opis)

**Przykładowa implementacja**:

```astro
---
import LayoutApp from "@/layouts/LayoutApp.astro";
import ExerciseManager from "@/components/exercises/ExerciseManager";

// Sprawdzenie autoryzacji
const {
  data: { user },
} = await locals.supabase.auth.getUser();
if (!user) {
  return Astro.redirect("/login?redirect=/app/exercises");
}
---

<LayoutApp title="Baza Ćwiczeń - 10xFitChart">
  <ExerciseManager client:load />
</LayoutApp>
```

**Rezultat**: Strona dostępna pod `/app/exercises`, wymaga logowania.

---

### Krok 4: Implementacja `ExerciseManager` (stan i logika)

**Zadanie**: Stworzenie głównego komponentu zarządzającego stanem widoku.

**Akcje**:

1. Otwórz `src/components/exercises/ExerciseManager.tsx`
2. Zaimportuj hooki React: `useState`, `useEffect`, `useMemo`
3. Zaimportuj typy z `src/types.ts`
4. Zaimportuj komponent `Toaster` (Shadcn/ui) i funkcję `toast`
5. Zdefiniuj początkowy stan typu `ExercisesViewState`
6. Zaimportuj funkcję `fetchExercises()`:
   - Obsługa GET /api/exercises
   - Ustawienie `isLoading`, `error`, `exercises`
7. Zaimplementuj `useEffect(() => { fetchExercises(); }, [])`
8. Zaimplementuj funkcje obsługi dialogów:
   - `openCreateDialog()`
   - `openEditDialog(exercise)`
   - `openArchiveDialog(exercise)`
   - `closeDialogs()`
9. Zaimplementuj funkcje obsługi filtrów:
   - `updateSearchQuery(query)` z debounce
   - `updateTypeFilter(type)`
10. Zaimplementuj `useMemo` dla `filteredExercises`
11. Zaimplementuj funkcje submitów:
    - `handleCreateExercise(data)` → POST /api/exercises
    - `handleUpdateExercise(data)` → PUT /api/exercises/:id
    - `handleArchiveExercise()` → DELETE /api/exercises/:id
12. Dodaj obsługę błędów w każdej funkcji API (try/catch + toast)
13. Renderuj komponenty potomne z odpowiednimi propsami (placeholder na razie)

**Rezultat**: Komponent z pełną logiką, gotowy do integracji z UI.

---

### Krok 5: Implementacja `ExerciseHeader`

**Zadanie**: Stworzenie nagłówka widoku z przyciskiem dodawania.

**Akcje**:

1. Otwórz `src/components/exercises/ExerciseHeader.tsx`
2. Zaimportuj komponent `Button` (Shadcn/ui)
3. Zaimportuj ikonę `Plus` (lucide-react)
4. Zdefiniuj interfejs `ExerciseHeaderProps`
5. Zaimplementuj komponent:
   - Element `header` z flexbox (space-between)
   - Element `h1` z tekstem "Baza Ćwiczeń"
   - `Button` z ikoną `Plus` i tekstem "Dodaj ćwiczenie"
   - onClick → wywołanie `props.onAddClick()`

**Rezultat**: Komponent wyświetla nagłówek i przycisk akcji.

---

### Krok 6: Implementacja `ExerciseFilters`

**Zadanie**: Stworzenie sekcji filtrów (wyszukiwanie + typ).

**Akcje**:

1. Otwórz `src/components/exercises/ExerciseFilters.tsx`
2. Zaimportuj `Input`, `Select` (Shadcn/ui)
3. Zaimportuj ikonę `Search` (lucide-react)
4. Zaimportuj hook `useDebouncedCallback` (lub zaimplementuj własny)
5. Zdefiniuj interfejs `ExerciseFiltersProps`
6. Zaimplementuj komponent:
   - Kontener `div` z flexbox/grid (responsywny)
   - `Input` dla wyszukiwania:
     - Placeholder: "Szukaj ćwiczenia..."
     - Icon: `Search`
     - value: `props.searchQuery`
     - onChange: debounced `props.onSearchChange(value)`
   - `Select` dla typu:
     - Label: "Typ ćwiczenia"
     - Options: Wszystkie / Siłowe / Cardio
     - value: `props.typeFilter`
     - onValueChange: `props.onTypeFilterChange(value)`

**Rezultat**: Komponent z działającymi filtrami (debounce 300ms dla search).

---

### Krok 7: Implementacja `ExerciseCard`

**Zadanie**: Stworzenie karty pojedynczego ćwiczenia.

**Akcje**:

1. Otwórz `src/components/exercises/ExerciseCard.tsx`
2. Zaimportuj `Card`, `Badge`, `DropdownMenu` (Shadcn/ui)
3. Zaimportuj ikony `MoreVertical`, `Edit`, `Archive` (lucide-react)
4. Zdefiniuj interfejs `ExerciseCardProps`
5. Zaimplementuj logikę:
   - `const canModify = !props.exercise.is_system`
   - Mapowanie typu na badge label/color
   - Mapowanie statusu na badge (Systemowe/Własne/Zarchiwizowane)
6. Zaimplementuj layout:
   - `Card` jako kontener
   - Header: nazwa ćwiczenia + menu (MoreVertical)
   - Body: badges (typ + status)
   - Menu: `DropdownMenu` z opcjami Edytuj/Archiwizuj (warunkowo)
7. Podłącz callbacki:
   - Edytuj → `props.onEdit(props.exercise)`
   - Archiwizuj → `props.onArchive(props.exercise)`

**Rezultat**: Karta wyświetla ćwiczenie z menu akcji (tylko dla własnych).

---

### Krok 8: Implementacja `ExerciseList`

**Zadanie**: Stworzenie kontenera listy ćwiczeń.

**Akcje**:

1. Otwórz `src/components/exercises/ExerciseList.tsx`
2. Zaimportuj `ExerciseCard` (własny komponent)
3. Zaimportuj `Skeleton` (Shadcn/ui) lub komponent loadera
4. Zdefiniuj interfejs `ExerciseListProps`
5. Zaimplementuj logikę stanów:
   - **Loading**: Renderuj 6x `Skeleton` w grid
   - **Empty**: Renderuj empty state (ikona + tekst + sugestia zmiany filtrów)
   - **Success**: Renderuj listę `ExerciseCard`
6. Zaimplementuj layout:
   - CSS Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
   - Gap: `gap-4`
   - Responsive padding

**Rezultat**: Lista z obsługą loading/empty/success states.

---

### Krok 9: Implementacja `ExerciseFormDialog`

**Zadanie**: Stworzenie dialogu formularza (create/edit).

**Akcje**:

1. Otwórz `src/components/exercises/ExerciseFormDialog.tsx`
2. Zaimportuj `Dialog`, `Input`, `Select`, `Label`, `Button` (Shadcn/ui)
3. Zdefiniuj interfejs `ExerciseFormDialogProps`
4. Zaimplementuj lokalny stan formularza:
   - `formData: ExerciseFormData`
   - `errors: { name?: string }`
5. Zaimplementuj `useEffect` dla inicjalizacji:
   - W trybie edit: wstępnie wypełnij pole nazwy
   - W trybie create: wyczyść formularz
6. Zaimplementuj funkcję walidacji `validateName(value)`
7. Zaimplementuj handlery:
   - `handleNameChange` (real-time walidacja)
   - `handleTypeChange` (tylko create)
   - `handleSubmit` (walidacja + wywołanie `props.onSubmit`)
8. Zaimplementuj layout dialogu:
   - `DialogHeader`: Dynamiczny tytuł (Dodaj/Edytuj)
   - Formularz:
     - `Label` + `Input` dla nazwy (error state)
     - `Label` + `Select` dla typu (disabled w edit)
   - `DialogFooter`: Anuluj + Zapisz (disabled gdy invalid/submitting)
9. Obsługa reset formularza przy zamknięciu

**Rezultat**: Dialog z formularzem, walidacją i obsługą obu trybów.

---

### Krok 10: Implementacja `ConfirmArchiveDialog`

**Zadanie**: Stworzenie dialogu potwierdzenia archiwizacji.

**Akcje**:

1. Otwórz `src/components/exercises/ConfirmArchiveDialog.tsx`
2. Zaimportuj `AlertDialog` (Shadcn/ui)
3. Zaimportuj ikonę `AlertTriangle` (lucide-react)
4. Zdefiniuj interfejs `ConfirmArchiveDialogProps`
5. Zaimplementuj layout:
   - `AlertDialogHeader`: Ikona ostrzeżenia + tytuł
   - `AlertDialogDescription`:
     - "Czy na pewno chcesz zarchiwizować ćwiczenie **[Nazwa]**?"
     - Konsekwencje (znika z listy, historia zachowana)
   - `AlertDialogFooter`: Anuluj + Archiwizuj
6. Obsługa stanu `isDeleting`:
   - Przycisk "Archiwizuj" wyświetla loader
   - Przycisk "Anuluj" disabled podczas akcji
7. Callbacki:
   - Anuluj → `props.onOpenChange(false)`
   - Archiwizuj → `props.onConfirm()`

**Rezultat**: Dialog z ostrzeżeniem i potwierdzeniem akcji.

---

### Krok 11: Integracja komponentów w `ExerciseManager`

**Zadanie**: Połączenie wszystkich komponentów w głównym kontenerze.

**Akcje**:

1. Otwórz `src/components/exercises/ExerciseManager.tsx`
2. Zaimportuj wszystkie komponenty utworzone w krokach 5-10
3. Zastąp placeholdery rzeczywistymi komponentami:
   - `<ExerciseHeader onAddClick={openCreateDialog} />`
   - `<ExerciseFilters ... />`
   - `<ExerciseList ... />`
   - `<ExerciseFormDialog ... />`
   - `<ConfirmArchiveDialog ... />`
4. Upewnij się, że wszystkie propsy są poprawnie przekazane
5. Dodaj obsługę error boundary (conditional rendering)

**Rezultat**: Pełna integracja widoku, wszystkie funkcjonalności działają.

---

### Krok 12: Stylizacja i responsywność

**Zadanie**: Dopracowanie stylów Tailwind i RWD.

**Akcje**:

1. Przejrzyj każdy komponent i dostosuj klasy Tailwind:
   - Padding/margin dla spójności
   - Responsywne breakpoints (sm/md/lg)
   - Kolory zgodne z dark mode (primary, muted, destructive)
2. Przetestuj widok na różnych rozdzielczościach:
   - Desktop (1920px)
   - Laptop (1366px)
   - Tablet (768px)
   - Mobile (375px)
3. Upewnij się, że:
   - Karty ćwiczeń układają się w grid (1/2/3 kolumny)
   - Dialogi są wycentrowane i responsywne
   - Filtry układają się w kolumnie na mobile

**Rezultat**: Widok wygląda profesjonalnie na wszystkich urządzeniach.

---

### Krok 13: Testowanie funkcjonalności

**Zadanie**: Manualne przetestowanie wszystkich user stories.

**Akcje**:

1. **US-004: Dodawanie własnego ćwiczenia**
   - Otwórz dialog dodawania
   - Wypełnij formularz (nazwa + typ)
   - Zweryfikuj walidację (puste pole, duplikat nazwy)
   - Zapisz i sprawdź, czy ćwiczenie pojawia się na liście
2. **US-005: Archiwizacja ćwiczenia**
   - Otwórz menu akcji na własnym ćwiczeniu
   - Kliknij "Archiwizuj"
   - Potwierdź w dialogu
   - Sprawdź, czy ćwiczenie zniknęło z listy
3. **Edycja nazwy**
   - Otwórz menu akcji → Edytuj
   - Zmień nazwę
   - Zweryfikuj, że typ jest zablokowany
   - Zapisz i sprawdź aktualizację
4. **Filtrowanie**
   - Wpisz tekst w wyszukiwarkę
   - Zmień filtr typu
   - Sprawdź, czy lista się aktualizuje
5. **Obsługa błędów**
   - Spróbuj utworzyć ćwiczenie z duplikatem nazwy
   - Symuluj błąd sieciowy (offline mode)
   - Sprawdź wyświetlanie toastów i komunikatów

**Rezultat**: Wszystkie funkcjonalności działają zgodnie z wymaganiami.

---

### Krok 14: Obsługa linterów i formatowanie

**Zadanie**: Upewnienie się, że kod spełnia standardy projektu.

**Akcje**:

1. Uruchom linter: `npm run lint`
2. Napraw wszystkie błędy i ostrzeżenia
3. Uruchom formatter: `npm run format`
4. Sprawdź TypeScript errors: `npm run type-check`
5. Upewnij się, że:
   - Brak nieużywanych importów
   - Wszystkie zmienne są typowane
   - Brak `any` types
   - Przestrzegane są zasady z `.cursor/rules/shared.mdc`

**Rezultat**: Kod jest czysty i zgodny ze standardami projektu.

---

### Krok 15: Dodanie nawigacji w layout aplikacji

**Zadanie**: Dodanie linku do widoku Bazy Ćwiczeń w głównej nawigacji.

**Akcje**:

1. Otwórz plik layoutu aplikacji (np. `src/layouts/LayoutApp.astro`)
2. Znajdź sekcję nawigacji (Desktop Nav)
3. Dodaj link:
   ```astro
   <a href="/app/exercises" class="nav-link"> Ćwiczenia </a>
   ```
4. Dodaj link w mobile menu (jeśli istnieje)
5. Opcjonalnie: Dodaj ikonę (np. `Dumbbell` z lucide-react)
6. Upewnij się, że link podświetla się na aktywnej stronie

**Rezultat**: Użytkownik może łatwo nawigować do widoku Bazy Ćwiczeń.

---

### Krok 16: Dokumentacja i cleanup

**Zadanie**: Ostateczne porządki i dokumentacja.

**Akcje**:

1. Dodaj komentarze JSDoc do wszystkich funkcji publicznych
2. Upewnij się, że wszystkie komponenty mają `displayName`
3. Usuń nieużywany kod (console.logs, komentarze TODO)
4. Zaktualizuj README projektu (jeśli potrzebne)
5. Sprawdź, czy wszystkie typy są wyeksportowane i używane
6. Sprawdź, czy nie ma zduplikowanego kodu (DRY)

**Rezultat**: Kod jest czytelny, udokumentowany i gotowy do code review.

---

### Krok 17: Finalne testy i deployment

**Zadanie**: Ostateczna weryfikacja przed wdrożeniem.

**Akcje**:

1. Uruchom aplikację lokalnie: `npm run dev`
2. Przejdź przez pełny flow użytkownika (od logowania do archiwizacji)
3. Przetestuj w różnych przeglądarkach (Chrome, Firefox, Safari)
4. Sprawdź performance (Lighthouse):
   - Performance: >80
   - Accessibility: >95
   - Best Practices: >90
5. Sprawdź Network tab (żadne zapytania nie duplikują się)
6. Stwórz Pull Request z opisem zmian
7. Poczekaj na code review
8. Po aprobacie: Merge do main i deploy na Cloudflare Pages

**Rezultat**: Widok Bazy Ćwiczeń jest gotowy i wdrożony na produkcję.
