# Plan implementacji widoku Historia Treningów

## 1. Przegląd

Widok Historia Treningów (Workout History) służy do przeglądania archiwum wszystkich treningów użytkownika w porządku chronologicznym oraz edycji błędnie wprowadzonych danych historycznych. Widok składa się z dwóch podstron: listy treningów (`/app/history`) oraz edytora konkretnego treningu (`/app/history/[id]`). Głównym celem jest umożliwienie użytkownikowi przeglądu historii i korekty błędów, które mogą negatywnie wpływać na wykresy postępów (US-012).

## 2. Routing widoku

### Routing główny (Lista)
- **Ścieżka**: `/app/history`
- **Plik Astro**: `src/pages/app/history/index.astro`
- **Typ**: Strona chroniona autoryzacją (middleware)

### Routing szczegółów (Edycja)
- **Ścieżka**: `/app/history/[id]`
- **Plik Astro**: `src/pages/app/history/[id].astro`
- **Typ**: Strona chroniona autoryzacją (middleware)
- **Parametr**: `id` - UUID treningu do edycji

## 3. Struktura komponentów

### Widok listy (`/app/history`)
```
HistoryPage (Astro)
└── HistoryListProvider (React Context)
    ├── HistoryListHeader
    │   ├── Title & Description
    │   └── FilterControls (Date range, Exercise filter)
    ├── HistoryList
    │   ├── WorkoutSummaryCard (repeatable)
    │   │   ├── WorkoutDateBadge
    │   │   ├── WorkoutMetadata (exercise count, set count)
    │   │   ├── WorkoutNotes (truncated)
    │   │   └── WorkoutActions (Edit button)
    │   └── LoadMoreButton (Infinite scroll trigger)
    └── EmptyState (when no workouts)
```

### Widok edycji (`/app/history/[id]`)
```
EditWorkoutPage (Astro)
└── WorkoutEditorProvider (React Context - reużycie logiki WorkoutLogger)
    ├── EditWorkoutHeader (Date, Notes, Original date display)
    ├── ExerciseCombobox (for adding new exercises)
    ├── ExerciseList
    │   └── ExerciseCard[]
    │       ├── ExerciseHeader
    │       └── SetTable
    │           └── SetRow[] (editable)
    └── WorkoutEditorActions
        ├── SaveButton (PUT request)
        ├── DeleteButton (DELETE request with confirmation)
        └── CancelButton (back to list)
```

## 4. Szczegóły komponentów

### 4.1. HistoryListProvider

**Opis komponentu**: 
Provider React Context zarządzający stanem listy treningów. Obsługuje paginację, filtrowanie, oraz infinite scroll. Odpowiada za pobieranie danych z API i zarządzanie stanem ładowania.

**Główne elementy HTML i komponenty dzieci**:
- `<div>` kontener główny
- `HistoryListHeader` - nagłówek z filtrami
- `HistoryList` - lista kart treningów
- `EmptyState` - stan pusty (gdy brak treningów)

**Obsługiwane zdarzenia**:
- `onLoadMore` - ładowanie kolejnej strony wyników (offset += limit)
- `onFilterChange` - zmiana filtrów daty lub ćwiczenia
- `onResetFilters` - reset filtrów do wartości domyślnych

**Warunki walidacji**:
- Daty: start_date <= end_date
- Limit: 1-100 (domyślnie 20)
- Offset: >= 0

**Typy**:
- `HistoryListState` (ViewModel)
- `ListWorkoutsResponse` (API DTO)
- `WorkoutListItemDTO` (API DTO)
- `HistoryFilters` (ViewModel)

**Propsy**: 
Brak (komponent root na stronie)

---

### 4.2. HistoryListHeader

**Opis komponentu**:
Nagłówek widoku listy zawierający tytuł, opis oraz kontrolki filtrowania po zakresie dat i ćwiczeniu.

**Główne elementy HTML i komponenty dzieci**:
- `<div>` kontener nagłówka
- `<h1>` tytuł "Historia Treningów"
- `<p>` opis widoku
- `FilterControls` (Popover z dwoma date-pickerami + select ćwiczenia)
- `Button` "Resetuj filtry"

**Obsługiwane zdarzenia**:
- `onFilterChange(filters: HistoryFilters)` - zmiana filtrów
- `onResetFilters()` - reset filtrów

**Warunki walidacji**:
- start_date musi być <= end_date
- Exercise filter: opcjonalny UUID z listy dostępnych ćwiczeń

**Typy**:
- `HistoryFilters` (ViewModel)

**Propsy**:
```typescript
interface HistoryListHeaderProps {
  filters: HistoryFilters;
  exercises: ExerciseDTO[];
  onFilterChange: (filters: HistoryFilters) => void;
  onResetFilters: () => void;
}
```

---

### 4.3. HistoryList

**Opis komponentu**:
Lista treningów wyświetlana w formie kart. Obsługuje infinite scroll poprzez "Load More" button. Renderuje pusty stan jeśli użytkownik nie ma treningów lub wszystkie zostały odfiltrowane.

**Główne elementy HTML i komponenty dzieci**:
- `<div>` kontener listy z grid layout
- `WorkoutSummaryCard[]` - karty treningów (array)
- `LoadMoreButton` - przycisk ładowania kolejnych treningów
- `Skeleton` (podczas ładowania)

**Obsługivane zdarzenia**:
- `onLoadMore()` - kliknięcie "Pokaż więcej"
- `onEditWorkout(workoutId: string)` - przekierowanie do edycji

**Warunki walidacji**:
Brak - komponent prezentacyjny

**Typy**:
- `WorkoutListItemDTO[]` (API DTO)
- `PaginationDTO` (API DTO)

**Propsy**:
```typescript
interface HistoryListProps {
  workouts: WorkoutListItemDTO[];
  pagination: PaginationDTO;
  isLoading: boolean;
  onLoadMore: () => void;
}
```

---

### 4.4. WorkoutSummaryCard

**Opis komponentu**:
Karta podsumowująca pojedynczy trening. Wyświetla datę, liczbę ćwiczeń, liczbę serii, skrócone notatki oraz przycisk edycji.

**Główne elementy HTML i komponenty dzieci**:
- `<Card>` z Shadcn/ui
- `<CardHeader>`
  - `WorkoutDateBadge` - data treningu
  - `Badge` - indicator (np. "Dzisiaj", "Wczoraj")
- `<CardContent>`
  - Ikona + tekst: liczba ćwiczeń
  - Ikona + tekst: liczba serii
  - `<p>` notatki (truncated do 100 znaków)
- `<CardFooter>`
  - `Button` "Edytuj" (link do `/app/history/[id]`)

**Obsługiwane zdarzenia**:
- `onEdit()` - kliknięcie przycisku edycji (przekierowanie)

**Warunki walidacji**:
Brak - komponent prezentacyjny

**Typy**:
- `WorkoutListItemDTO` (API DTO)

**Propsy**:
```typescript
interface WorkoutSummaryCardProps {
  workout: WorkoutListItemDTO;
}
```

---

### 4.5. WorkoutEditorProvider

**Opis komponentu**:
Provider React Context zarządzający stanem edytowanego treningu. Re-używa logikę `WorkoutLoggerProvider`, ale działa w trybie edycji (PUT zamiast POST). Pobiera szczegóły treningu z API przy inicjalizacji (`GET /api/workouts/:id`), umożliwia edycję i zapisuje zmiany (`PUT /api/workouts/:id`).

**Główne elementy HTML i komponenty dzieci**:
- `<div>` kontener główny
- `EditWorkoutHeader` - nagłówek z datą i notatkami
- `ExerciseCombobox` - dodawanie nowych ćwiczeń
- `ExerciseList` - lista ćwiczeń z seriami (edytowalne)
- `WorkoutEditorActions` - przyciski akcji (Zapisz, Usuń, Anuluj)

**Obsługiwane zdarzenia**:
- `onSave()` - zapisanie zmian (PUT)
- `onDelete()` - usunięcie treningu (DELETE z potwierdzeniem)
- `onCancel()` - anulowanie (powrót do listy)

**Warunki walidacji**:
- Data: format YYYY-MM-DD, nie może być w przyszłości
- Notatki: max 1000 znaków
- Minimum 1 ćwiczenie
- Każda seria musi mieć wypełnione pola zgodnie z typem ćwiczenia:
  - Strength: weight > 0, reps > 0
  - Cardio: distance > 0, time > 0

**Typy**:
- `WorkoutEditorState` (ViewModel, rozszerzenie `WorkoutLoggerState`)
- `WorkoutDetailsDTO` (API DTO)
- `UpdateWorkoutCommand` (API Command)

**Propsy**:
```typescript
interface WorkoutEditorProviderProps {
  workoutId: string;
}
```

---

### 4.6. EditWorkoutHeader

**Opis komponentu**:
Nagłówek widoku edycji treningu. Wyświetla kontrolki do edycji daty i notatek. Dodatkowo pokazuje oryginalną datę utworzenia dla transparentności (read-only).

**Główne elementy HTML i komponenty dzieci**:
- `<div>` kontener nagłówka
- `<h1>` "Edytuj Trening"
- `<Label>` + `<Input type="date">` - edycja daty treningu
- `<Label>` + `<Textarea>` - edycja notatek
- `<p>` muted text: "Utworzono: {created_at}" (read-only)

**Obsługiwane zdarzenia**:
- `onDateChange(date: string)` - zmiana daty
- `onNotesChange(notes: string)` - zmiana notatek

**Warunki walidacji**:
- Data: nie może być w przyszłości (max: today)
- Notatki: max 1000 znaków

**Typy**:
- `string` (date)
- `string | null` (notes)

**Propsy**:
```typescript
interface EditWorkoutHeaderProps {
  date: string;
  notes: string | null;
  createdAt: string;
  onDateChange: (date: string) => void;
  onNotesChange: (notes: string | null) => void;
}
```

---

### 4.7. WorkoutEditorActions

**Opis komponentu**:
Panel z przyciskami akcji dla widoku edycji: Zapisz, Usuń, Anuluj. Odpowiada za walidację przed zapisem i potwierdzenie przed usunięciem.

**Główne elementy HTML i komponenty dzieci**:
- `<div>` kontener z flexbox
- `Button` "Zapisz zmiany" (primary, disabled gdy invalid)
- `AlertDialog` + `Button` "Usuń trening" (destructive)
- `Button` "Anuluj" (ghost)

**Obsługiwane zdarzenia**:
- `onSave()` - zapis zmian (PUT)
- `onDelete()` - usunięcie treningu (DELETE)
- `onCancel()` - anulowanie (powrót)

**Warunki walidacji**:
- Zapisz: wyłączony gdy `!isValid` (brak ćwiczeń lub niepełne serie)
- Usuń: wymaga potwierdzenia w `AlertDialog`

**Typy**:
Brak dodatkowych typów (używa callback functions)

**Propsy**:
```typescript
interface WorkoutEditorActionsProps {
  isValid: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}
```

---

### 4.8. LoadMoreButton

**Opis komponentu**:
Przycisk do ładowania kolejnej strony treningów (infinite scroll trigger). Wyświetla stan ładowania oraz informację o braku kolejnych wyników.

**Główne elementy HTML i komponenty dzieci**:
- `Button` "Pokaż więcej" z loaderem
- Alternatywnie: `<p>` "Brak kolejnych treningów"

**Obsługiwane zdarzenia**:
- `onClick()` - ładowanie kolejnych wyników

**Warunki walidacji**:
Brak - komponent prezentacyjny

**Typy**:
- `boolean` (hasMore, isLoading)

**Propsy**:
```typescript
interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
}
```

---

## 5. Typy

### 5.1. ViewModel Types (nowe typy dla widoku)

```typescript
/**
 * Filtry dla listy historii treningów
 */
export interface HistoryFilters {
  start_date?: string | null;
  end_date?: string | null;
  exercise_id?: string | null;
}

/**
 * Stan listy historii treningów
 */
export interface HistoryListState {
  workouts: WorkoutListItemDTO[];
  pagination: PaginationDTO;
  filters: HistoryFilters;
  availableExercises: ExerciseDTO[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

/**
 * Stan edytora treningu (rozszerzenie WorkoutLoggerState)
 */
export interface WorkoutEditorState extends Omit<WorkoutLoggerState, 'isSaving'> {
  workoutId: string;
  originalDate: string;
  createdAt: string;
  isSaving: boolean;
  isDeleting: boolean;
  isLoading: boolean;
}
```

### 5.2. Typy API (istniejące, używane w widoku)

**Request/Response dla listy:**
- Request: `GET /api/workouts?limit={limit}&offset={offset}&start_date={start_date}&end_date={end_date}&order=desc`
- Response: `ListWorkoutsResponse` (zawiera `workouts: WorkoutListItemDTO[]`, `pagination: PaginationDTO`)

**Request/Response dla szczegółów:**
- Request: `GET /api/workouts/:id`
- Response: `WorkoutDetailsDTO` (zawiera `sets: WorkoutSetDTO[]`)

**Request/Response dla aktualizacji:**
- Request: `PUT /api/workouts/:id` z body `UpdateWorkoutCommand`
- Response: `WorkoutDetailsDTO`

**Request/Response dla usunięcia:**
- Request: `DELETE /api/workouts/:id`
- Response: `MessageResponse`

## 6. Zarządzanie stanem

### 6.1. Lista treningów (HistoryListProvider)

**Zarządzanie stanem**: React Context API + `useReducer` hook

**Stan przechowuje**:
- `workouts: WorkoutListItemDTO[]` - załadowane treningi
- `pagination: PaginationDTO` - metadata paginacji
- `filters: HistoryFilters` - aktualne filtry
- `availableExercises: ExerciseDTO[]` - lista ćwiczeń do filtrowania
- `isLoading: boolean` - pierwszy load
- `isLoadingMore: boolean` - ładowanie kolejnych stron
- `error: string | null` - błędy API

**Akcje reducera**:
- `LOAD_WORKOUTS_START` - rozpoczęcie ładowania
- `LOAD_WORKOUTS_SUCCESS` - sukces (replace workouts)
- `LOAD_MORE_START` - rozpoczęcie load more
- `LOAD_MORE_SUCCESS` - sukces (append workouts)
- `LOAD_WORKOUTS_ERROR` - błąd
- `SET_FILTERS` - zmiana filtrów (reset workouts + reload)
- `RESET_FILTERS` - reset do wartości domyślnych
- `SET_AVAILABLE_EXERCISES` - załadowanie listy ćwiczeń

**Custom hook**: `useHistoryList`
- Inicjalizacja: pobiera listę ćwiczeń (`GET /api/exercises`) oraz pierwszą stronę treningów (`GET /api/workouts`)
- `loadMore()` - zwiększa offset i doładowuje kolejne treningi
- `applyFilters(filters)` - resetuje offset do 0 i pobiera odfiltrowane wyniki
- `resetFilters()` - resetuje filtry i przeładowuje listę

**Persistence**: 
Brak (nie ma potrzeby zapisywania stanu w localStorage - użytkownik tylko przegląda)

---

### 6.2. Edytor treningu (WorkoutEditorProvider)

**Zarządzanie stanem**: Re-użycie logiki `WorkoutLoggerProvider` z rozszerzeniem

**Stan przechowuje** (wszystko z `WorkoutLoggerState` plus):
- `workoutId: string` - ID edytowanego treningu
- `originalDate: string` - oryginalna data (do porównania)
- `createdAt: string` - timestamp utworzenia (read-only display)
- `isLoading: boolean` - ładowanie szczegółów treningu
- `isDeleting: boolean` - stan usuwania

**Akcje reducera** (wszystkie z `workoutLoggerReducer` plus):
- `LOAD_WORKOUT_START` - rozpoczęcie ładowania szczegółów
- `LOAD_WORKOUT_SUCCESS` - sukces (populate state)
- `LOAD_WORKOUT_ERROR` - błąd
- `SET_DELETING` - ustawienie stanu usuwania

**Custom hook**: `useWorkoutEditor`
- Inicjalizacja: pobiera szczegóły treningu (`GET /api/workouts/:id`) i populuje stan
- `saveWorkout()` - wysyła `PUT /api/workouts/:id` z `UpdateWorkoutCommand`
- `deleteWorkout()` - wysyła `DELETE /api/workouts/:id`, po sukcesie redirect do `/app/history`
- `cancelEdit()` - powrót do listy (`/app/history`) z opcjonalnym potwierdzeniem przy zmianach

**Persistence**:
Brak (edycja istniejącego rekordu, nie ma potrzeby localStorage)

## 7. Integracja API

### 7.1. Lista treningów

**Endpoint**: `GET /api/workouts`

**Query Parameters**:
- `limit` (optional): 1-100, default 20
- `offset` (optional): >= 0, default 0
- `start_date` (optional): YYYY-MM-DD
- `end_date` (optional): YYYY-MM-DD
- `order` (optional): `asc` | `desc`, default `desc`

**Request Headers**:
- `Authorization: Bearer {access_token}` (automatycznie z middleware)

**Response Type**: `ListWorkoutsResponse`

```typescript
{
  workouts: WorkoutListItemDTO[];
  pagination: PaginationDTO;
}
```

**Błędy**:
- `401 Unauthorized` - brak sesji (redirect do `/login`)
- `500 Internal Server Error` - błąd serwera (toast error)

---

### 7.2. Szczegóły treningu

**Endpoint**: `GET /api/workouts/:id`

**Path Parameter**:
- `id` - UUID treningu

**Request Headers**:
- `Authorization: Bearer {access_token}`

**Response Type**: `WorkoutDetailsDTO`

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

**Błędy**:
- `401 Unauthorized` - brak sesji
- `404 Not Found` - trening nie istnieje lub nie należy do użytkownika (redirect do `/app/history`)
- `500 Internal Server Error` - błąd serwera

---

### 7.3. Aktualizacja treningu

**Endpoint**: `PUT /api/workouts/:id`

**Path Parameter**:
- `id` - UUID treningu

**Request Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer {access_token}`

**Request Body Type**: `UpdateWorkoutCommand`

```typescript
{
  date?: string;
  notes?: string | null;
  sets: UpdateWorkoutSetCommand[];
}
```

**Response Type**: `WorkoutDetailsDTO`

**Błędy**:
- `400 Bad Request` - walidacja nie powiodła się (toast z komunikatem)
- `404 Not Found` - trening nie istnieje
- `500 Internal Server Error` - błąd serwera

---

### 7.4. Usunięcie treningu

**Endpoint**: `DELETE /api/workouts/:id`

**Path Parameter**:
- `id` - UUID treningu

**Request Headers**:
- `Authorization: Bearer {access_token}`

**Response Type**: `MessageResponse`

```typescript
{
  message: string;
}
```

**Błędy**:
- `404 Not Found` - trening nie istnieje
- `500 Internal Server Error` - błąd serwera

**Po sukcesie**: Redirect do `/app/history` + toast "Trening usunięty"

---

### 7.5. Lista ćwiczeń (do filtrów)

**Endpoint**: `GET /api/exercises`

**Query Parameters**:
- `include_archived` (optional): `false` (domyślnie)

**Response Type**: `ListExercisesResponse`

```typescript
{
  exercises: ExerciseDTO[];
}
```

## 8. Interakcje użytkownika

### 8.1. Widok listy treningów (`/app/history`)

**1. Przeglądanie listy**
- Użytkownik wchodzi na `/app/history`
- System pobiera pierwszą stronę treningów (20 najnowszych)
- Lista wyświetla karty treningów w kolejności malejącej (najnowsze na górze)
- Każda karta pokazuje: datę, liczbę ćwiczeń, liczbę serii, notatki (skrócone)

**2. Infinite scroll (Load More)**
- Na dole listy widoczny przycisk "Pokaż więcej" (gdy `pagination.has_more === true`)
- Kliknięcie: system zwiększa offset o limit i doładowuje kolejne treningi
- Nowe treningi appendowane do istniejącej listy
- Przycisk wyłączony podczas ładowania (spinner)
- Gdy brak kolejnych: przycisk znika, pojawia się tekst "To wszystkie treningi"

**3. Filtrowanie po dacie**
- Użytkownik klika przycisk "Filtry" w nagłówku
- Otwiera się Popover z dwoma date-pickerami (start_date, end_date)
- Wybór dat → zamknięcie Popover → reset offset → przeładowanie listy z filtrami
- System waliduje: start_date <= end_date, pokazuje toast błędu jeśli nieprawidłowe

**4. Filtrowanie po ćwiczeniu**
- W Popover filtrów dostępny Select z listą ćwiczeń
- Wybór ćwiczenia → przeładowanie listy (tylko treningi zawierające to ćwiczenie)
- **Uwaga**: Backend nie ma natywnego wsparcia dla tego filtru w `GET /api/workouts`
  - **Rozwiązanie**: Filtrowanie po stronie klienta (w reducerze) lub rozszerzenie API

**5. Reset filtrów**
- Przycisk "Resetuj filtry"
- Ustawia domyślne wartości: brak dat, brak exercise_id
- Przeładowuje listę bez filtrów

**6. Edycja treningu**
- Użytkownik klika przycisk "Edytuj" na karcie treningu
- Przekierowanie do `/app/history/[id]`

**7. Pusty stan**
- Jeśli użytkownik nie ma żadnych treningów: `EmptyState` z tekstem "Nie masz jeszcze żadnych treningów"
- Link "Zaloguj pierwszy trening" → `/app/log`

---

### 8.2. Widok edycji treningu (`/app/history/[id]`)

**1. Wczytywanie treningu**
- Użytkownik wchodzi na `/app/history/[id]`
- System pobiera szczegóły treningu (`GET /api/workouts/:id`)
- Formularz wypełnia się danymi: data, notatki, ćwiczenia z seriami
- Skeleton UI podczas ładowania

**2. Edycja daty**
- Użytkownik zmienia datę w date-pickerze
- Walidacja: nie może być w przyszłości (max: today)
- Toast błędu jeśli nieprawidłowa

**3. Edycja notatek**
- Użytkownik modyfikuje tekst w Textarea
- Walidacja: max 1000 znaków (licznik znaków poniżej pola)

**4. Edycja serii**
- Użytkownik zmienia wartości w istniejących seriach (weight, reps, distance, time)
- Walidacja w czasie rzeczywistym (zgodnie z typem ćwiczenia)
- Pola invalid highlight (border-red) przy błędnych wartościach

**5. Dodawanie serii**
- Użytkownik klika "Dodaj serię" w ramach ćwiczenia
- Nowy pusty wiersz pojawia się na końcu listy serii
- Focus przenosi się do pierwszego pola

**6. Usuwanie serii**
- Użytkownik klika ikonę kosza przy serii
- Seria usuwana bez potwierdzenia (można cofnąć przez Anuluj całej edycji)
- Nie można usunąć ostatniej serii (minimalnie 1 seria w ćwiczeniu)

**7. Dodawanie ćwiczenia**
- Użytkownik wybiera ćwiczenie z ExerciseCombobox
- Nowe ćwiczenie dodawane na koniec listy z 1 pustą serią

**8. Usuwanie ćwiczenia**
- Użytkownik klika przycisk "Usuń" w nagłówku ćwiczenia
- Ćwiczenie usuwane bez potwierdzenia
- Nie można usunąć ostatniego ćwiczenia (minimalnie 1 ćwiczenie w treningu)

**9. Zapisywanie zmian**
- Użytkownik klika "Zapisz zmiany"
- Walidacja całego formularza (min 1 ćwiczenie, wszystkie serie wypełnione)
- System wysyła `PUT /api/workouts/:id`
- Po sukcesie: Toast "Trening zaktualizowany" + redirect do `/app/history`
- Po błędzie: Toast z komunikatem błędu (pozostaje w widoku edycji)

**10. Usuwanie treningu**
- Użytkownik klika "Usuń trening"
- AlertDialog z potwierdzeniem: "Czy na pewno chcesz usunąć ten trening? Tej operacji nie można cofnąć."
- Po potwierdzeniu: System wysyła `DELETE /api/workouts/:id`
- Po sukcesie: Toast "Trening usunięty" + redirect do `/app/history`

**11. Anulowanie edycji**
- Użytkownik klika "Anuluj"
- Jeśli wprowadzono zmiany: Potwierdzenie "Masz niezapisane zmiany. Czy na pewno chcesz wyjść?"
- Po potwierdzeniu lub braku zmian: Redirect do `/app/history`

## 9. Warunki i walidacja

### 9.1. Walidacja w HistoryListHeader (Filtry)

**Komponent**: `FilterControls` w `HistoryListHeader`

**Warunki**:
1. **Zakres dat**:
   - `start_date` <= `end_date`
   - Jeśli naruszony: Toast "Data początkowa nie może być późniejsza niż data końcowa"
   - Filtry nie są aplikowane do momentu naprawy

2. **Exercise filter**:
   - Opcjonalny UUID z listy dostępnych ćwiczeń
   - Brak walidacji (select ogranicza wybór do prawidłowych wartości)

**Wpływ na UI**:
- Nieprawidłowe daty: przycisk "Zastosuj" wyłączony
- Brak wybranego ćwiczenia: filtr ignorowany (pokazuje wszystkie)

---

### 9.2. Walidacja w WorkoutEditorProvider (Edycja treningu)

**Komponent**: `EditWorkoutHeader`, `SetRow`, `WorkoutEditorActions`

**Warunki**:

1. **Data treningu** (`EditWorkoutHeader`):
   - Format: YYYY-MM-DD
   - Nie może być w przyszłości (max: today)
   - Jeśli naruszony: Border-red na input, tooltip "Data nie może być w przyszłości"
   - Przycisk "Zapisz" wyłączony

2. **Notatki** (`EditWorkoutHeader`):
   - Max 1000 znaków
   - Licznik: "500 / 1000" poniżej Textarea
   - Jeśli przekroczony: Border-red, licznik w kolorze czerwonym
   - Przycisk "Zapisz" wyłączony

3. **Ćwiczenia** (`ExerciseList`):
   - Minimum 1 ćwiczenie w treningu
   - Jeśli 0: Przycisk "Zapisz" wyłączony, komunikat "Dodaj co najmniej jedno ćwiczenie"

4. **Serie siłowe** (`SetRow` dla type="strength"`):
   - `weight`: wymagane, > 0, max 999.99
   - `reps`: wymagane, integer > 0
   - `distance`, `time`: muszą być null (automatycznie ignorowane w UI)
   - Jeśli naruszony: Border-red na input, przycisk "Zapisz" wyłączony

5. **Serie cardio** (`SetRow` dla `type="cardio"`):
   - `distance`: wymagane, > 0, max 999999.99
   - `time`: wymagane, integer > 0 (w sekundach)
   - `weight`, `reps`: muszą być null
   - Jeśli naruszony: Border-red na input, przycisk "Zapisz" wyłączony

6. **Minimum serii** (`ExerciseCard`):
   - Każde ćwiczenie musi mieć minimum 1 serię
   - Przycisk "Usuń serię" wyłączony gdy tylko 1 seria

**Wpływ na UI**:
- Wszystkie warunki muszą być spełnione aby `isValid === true`
- `isValid === false` → przycisk "Zapisz zmiany" wyłączony (disabled + tooltip)
- Invalid pola: czerwony border + pomocniczy tekst pod polem

---

### 9.3. Walidacja po stronie API (Backend)

API waliduje wszystkie warunki ponownie i zwraca błędy `400 Bad Request` z szczegółami.

**Obsługa błędów w UI**:
- `400` → Toast z komunikatem błędu z API (np. "Invalid date format")
- `404` → Toast "Trening nie został znaleziony" + redirect do `/app/history`
- `500` → Toast "Wystąpił błąd serwera. Spróbuj ponownie później."

## 10. Obsługa błędów

### 10.1. Błędy ładowania listy treningów

**Scenariusz**: Błąd podczas `GET /api/workouts`

**Obsługa**:
- Stan: `error: string` w `HistoryListState`
- UI: `ErrorState` komponent z komunikatem błędu + przycisk "Spróbuj ponownie"
- Kliknięcie: Ponowne wywołanie `loadWorkouts()`
- Jeśli błąd 401: Redirect do `/login`

---

### 10.2. Błędy load more

**Scenariusz**: Błąd podczas ładowania kolejnej strony

**Obsługa**:
- Toast: "Nie udało się załadować kolejnych treningów"
- Przycisk "Pokaż więcej" pozostaje aktywny (użytkownik może spróbować ponownie)
- Offset nie jest zwiększany (kolejna próba pobierze te same dane)

---

### 10.3. Błędy ładowania szczegółów treningu

**Scenariusz**: Błąd podczas `GET /api/workouts/:id`

**Obsługa**:
- `404`: Toast "Trening nie został znaleziony" + redirect do `/app/history`
- `401`: Redirect do `/login` (middleware powinien to obsłużyć wcześniej)
- `500`: Wyświetlenie `ErrorState` z komunikatem + przycisk "Spróbuj ponownie"

---

### 10.4. Błędy zapisu zmian

**Scenariusz**: Błąd podczas `PUT /api/workouts/:id`

**Obsługa**:
- `400`: Toast z komunikatem walidacji z API (np. "Date cannot be in the future")
- `404`: Toast "Trening nie został znaleziony" + redirect do `/app/history`
- `500`: Toast "Nie udało się zapisać zmian. Spróbuj ponownie."
- Stan formularza pozostaje niezmieniony (użytkownik może poprawić i spróbować ponownie)

---

### 10.5. Błędy usuwania treningu

**Scenariusz**: Błąd podczas `DELETE /api/workouts/:id`

**Obsługa**:
- `404`: Toast "Trening został już usunięty" + redirect do `/app/history`
- `500`: Toast "Nie udało się usunąć treningu. Spróbuj ponownie."
- AlertDialog pozostaje otwarty (użytkownik może zamknąć lub spróbować ponownie)

---

### 10.6. Błędy sieciowe (Network Error)

**Scenariusz**: Brak połączenia z internetem lub timeout

**Obsługa**:
- Catch w bloku `try/catch` dla wszystkich fetch calls
- Toast: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Przycisk akcji pozostaje aktywny (możliwość retry)

---

### 10.7. Edge case: Workout został usunięty przez inną sesję

**Scenariusz**: Użytkownik edytuje trening w jednej zakładce, a w drugiej go usuwa

**Obsługa**:
- Podczas zapisu: API zwraca `404`
- Toast: "Trening został już usunięty" + redirect do `/app/history`

## 11. Kroki implementacji

### Krok 1: Przygotowanie endpointu aktualizacji treningu (Backend)

1. Utworzyć plik `src/pages/api/workouts/[id].ts` (nowy endpoint)
2. Zaimplementować handler `PUT` dla `UpdateWorkoutCommand`:
   - Walidacja z użyciem Zod schema
   - Wywołanie serwisu `updateWorkout()` (nowy w `workout.service.ts`)
   - Obsługa błędów (404, 400, 500)
3. Zaimplementować handler `DELETE`:
   - Walidacja ownership (RLS)
   - Usunięcie workout + cascade sets
   - Zwrot `MessageResponse`
4. Rozszerzyć `workout.service.ts`:
   - Dodać funkcję `updateWorkout(supabase, userId, workoutId, command)`
   - Dodać funkcję `deleteWorkout(supabase, userId, workoutId)`
   - Obsługa transakcji (update workout + replace sets)

**Akceptacja**: Postman/curl testy dla PUT i DELETE zwracają poprawne odpowiedzi

---

### Krok 2: Utworzenie typów ViewModel

1. Otworzyć `src/types.ts`
2. Dodać nowe typy:
   - `HistoryFilters`
   - `HistoryListState`
   - `WorkoutEditorState`
3. Sprawdzić kompilację TypeScript

**Akceptacja**: `npm run check` przechodzi bez błędów

---

### Krok 3: Implementacja listy treningów (Lista)

1. Utworzyć strukturę katalogów:
   ```
   src/pages/app/history/
   ├── index.astro
   src/components/history/
   ├── HistoryListProvider.tsx
   ├── HistoryListHeader.tsx
   ├── HistoryList.tsx
   ├── WorkoutSummaryCard.tsx
   ├── LoadMoreButton.tsx
   ├── FilterControls.tsx
   └── EmptyState.tsx
   ```

2. Zaimplementować custom hook `useHistoryList` w `src/lib/hooks/useHistoryList.ts`:
   - Reducer dla zarządzania stanem listy
   - Akcje: load, loadMore, setFilters, resetFilters
   - Fetch z `GET /api/workouts` + `GET /api/exercises`

3. Zaimplementować `HistoryListProvider`:
   - Context API wrapper
   - Integracja z `useHistoryList`
   - Przekazanie state/actions do dzieci

4. Zaimplementować komponenty prezentacyjne:
   - `HistoryListHeader` (tytuł + FilterControls)
   - `FilterControls` (Popover z date-pickerami + Select ćwiczeń)
   - `HistoryList` (grid kart + LoadMoreButton)
   - `WorkoutSummaryCard` (Card z datą, metadatą, notes, button)
   - `LoadMoreButton` (button z loaderem)
   - `EmptyState` (ilustracja + tekst + link do /app/log)

5. Utworzyć stronę Astro `src/pages/app/history/index.astro`:
   - Import `HistoryListProvider`
   - Layout: `LayoutApp`
   - SSR: pobieranie exercises server-side (opcjonalnie)

**Akceptacja**: 
- Widok `/app/history` renderuje listę treningów
- Infinite scroll działa poprawnie
- Filtry aplikują się i resetują bez błędów
- Kliknięcie "Edytuj" przekierowuje do `/app/history/[id]`

---

### Krok 4: Implementacja edytora treningu (Edycja)

1. Utworzyć strukturę katalogów:
   ```
   src/pages/app/history/
   ├── [id].astro
   src/components/workout-editor/
   ├── WorkoutEditorProvider.tsx
   ├── EditWorkoutHeader.tsx
   └── WorkoutEditorActions.tsx
   ```

2. Zaimplementować custom hook `useWorkoutEditor` w `src/lib/hooks/useWorkoutEditor.ts`:
   - Rozszerzenie `useWorkoutLogger` z dodatkowymi stanami (workoutId, createdAt, isDeleting)
   - Nowa akcja `LOAD_WORKOUT` do załadowania szczegółów
   - Modyfikacja `saveWorkout()` aby używać PUT zamiast POST
   - Nowa metoda `deleteWorkout()` z potwierdzeniem

3. Zaimplementować `WorkoutEditorProvider`:
   - Context wrapper reużywający komponenty z workout-logger
   - Fetch initial data: `GET /api/workouts/:id`
   - Populate state z WorkoutDetailsDTO
   - Obsługa save (PUT), delete (DELETE), cancel

4. Zaimplementować nowe komponenty:
   - `EditWorkoutHeader` (data + notes + created_at display)
   - `WorkoutEditorActions` (Save, Delete z AlertDialog, Cancel)

5. Re-użycie komponentów:
   - `ExerciseList` (z workout-logger)
   - `ExerciseCombobox` (z workout-logger)
   - `ExerciseCard`, `SetTable`, `SetRow` (bez zmian)

6. Utworzyć stronę Astro `src/pages/app/history/[id].astro`:
   - Import `WorkoutEditorProvider`
   - Layout: `LayoutApp`
   - Przekazanie `workoutId` z params do providera

**Akceptacja**:
- Widok `/app/history/[id]` ładuje szczegóły treningu
- Edycja daty, notatek, serii działa poprawnie
- Walidacja działa (invalid fields highlight, button disabled)
- Zapisanie zmian (PUT) aktualizuje trening i przekierowuje do listy
- Usunięcie (DELETE) usuwa trening i przekierowuje do listy
- Anulowanie pyta o potwierdzenie przy zmianach

---

### Krok 5: Integracja nawigacji w aplikacji

1. Dodać link "Historia" do `AppHeader` (desktop + mobile nav):
   - Link: `/app/history`
   - Ikona: History lub List
   - Aktywny state gdy pathname zawiera `/app/history`

2. Dodać "quick link" na Dashboard:
   - Sekcja "Ostatnie treningi" z 3 najnowszymi
   - Każdy trening klikalny → `/app/history/[id]`
   - Link "Zobacz wszystkie" → `/app/history`

3. Dodać link "Wróć do historii" w widoku edycji:
   - Breadcrumb: Dashboard > Historia > Edytuj trening

**Akceptacja**:
- Wszystkie linki działają poprawnie
- Aktywny state w nawigacji jest prawidłowy
- Breadcrumbs są widoczne i funkcjonalne

---

### Krok 6: Stylowanie i responsywność

1. Zastosować Tailwind classes zgodne z istniejącym stylem aplikacji
2. Przetestować responsywność na różnych rozmiarach ekranu:
   - Desktop: ≥1024px (domyślny, 2-3 kolumny w grid)
   - Tablet: 768-1023px (2 kolumny)
   - Mobile: <768px (1 kolumna, kompaktowe karty)
3. Dark mode: Upewnić się, że wszystkie komponenty używają zmiennych CSS z motywu
4. Accessibility:
   - ARIA labels dla przycisków akcji
   - Keyboard navigation (Tab, Enter)
   - Focus states na wszystkich interaktywnych elementach

**Akceptacja**:
- Widok wygląda spójnie z resztą aplikacji
- RWD działa na urządzeniach 320px - 1920px
- Dark mode poprawnie stosuje kolory
- Keyboard navigation działa płynnie

---

### Krok 7: Testowanie funkcjonalności

1. **Testy manualne**:
   - Utworzyć kilka testowych treningów różnych dat
   - Przetestować wszystkie scenariusze interakcji użytkownika (sekcja 8)
   - Przetestować wszystkie edge cases błędów (sekcja 10)

2. **Test walidacji**:
   - Próba zapisania z pustymi polami
   - Próba zapisania z datą w przyszłości
   - Próba zapisania z przekroczonymi limitami (notatki > 1000 znaków)
   - Weryfikacja komunikatów błędów

3. **Test infinite scroll**:
   - Utworzyć >40 treningów
   - Sprawdzić ładowanie kolejnych stron
   - Sprawdzić, czy "Load More" znika po załadowaniu wszystkich

4. **Test filtrów**:
   - Filtrowanie po zakresie dat (różne kombinacje)
   - Reset filtrów
   - Walidacja nieprawidłowych dat

5. **Test edycji**:
   - Edycja wszystkich pól treningu
   - Dodawanie/usuwanie ćwiczeń i serii
   - Zapisanie zmian (weryfikacja w bazie)
   - Usunięcie treningu (weryfikacja w bazie)

**Akceptacja**:
- Wszystkie testy manualne przechodzą bez błędów
- Brak błędów w konsoli przeglądarki
- Brak błędów w logach serwera

---

### Krok 8: Optymalizacja i finalne poprawki

1. **Performance**:
   - Dodać debouncing do wyszukiwania w filtrach (jeśli będzie search input)
   - Lazy loading dla LoadMoreButton (Intersection Observer)
   - Memoizacja komponentów kart (`React.memo`)

2. **UX improvements**:
   - Loading skeletons podczas fetch
   - Optimistic UI updates (np. usunięcie karty przed potwierdzeniem z API)
   - Smooth transitions (Framer Motion opcjonalnie)

3. **Code cleanup**:
   - Refaktoring duplikującego się kodu
   - Dodanie komentarzy JSDoc
   - Sprawdzenie ESLint warnings

4. **Dokumentacja**:
   - Dodać README.md w `src/components/history/`
   - Opisać strukturę i usage dla przyszłych developerów

**Akceptacja**:
- Ładowanie listy < 500ms (dla 20 treningów)
- Brak warnings w ESLint
- Kod jest czytelny i dobrze udokumentowany

---

### Krok 9: Deployment i weryfikacja produkcyjna

1. Utworzyć Pull Request z implementacją
2. Code review
3. Merge do `main`
4. Deployment na Cloudflare Pages (automatyczny via CI/CD)
5. Smoke tests na produkcji:
   - Sprawdzenie wszystkich głównych flow
   - Weryfikacja w różnych przeglądarkach (Chrome, Firefox, Safari)
6. Monitoring błędów (console errors, Sentry jeśli skonfigurowany)

**Akceptacja**:
- Widok działa poprawnie na produkcji
- Brak błędów w production logs
- User Stories US-011 i US-012 spełnione w 100%
