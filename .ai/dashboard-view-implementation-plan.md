# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard to główna strona aplikacji po zalogowaniu, która prezentuje użytkownikowi szybki podgląd statusu treningowego i postępów z ostatnich 3 miesięcy. Dostarcza kluczowych wskaźników KPI (liczba treningów, objętość, serie), listę ostatnich aktywności oraz główny wykres pokazujący postęp treningowy. Widok wykorzystuje client-side fetching z wyświetlaniem Skeleton UI podczas ładowania danych.

## 2. Routing widoku

- **Ścieżka**: `/app/dashboard`
- **Typ**: Chroniony (wymaga autoryzacji)
- **Layout**: `LayoutApp` (wspólny dla wszystkich chronionych widoków aplikacji)
- **Plik Astro**: `src/pages/app/dashboard.astro`
- **Komponent główny**: `<Dashboard />` (React)

## 3. Struktura komponentów

```
dashboard.astro (Astro Page)
└── Dashboard (React Island - Client-side)
    ├── DashboardHeader
    ├── StatsGrid
    │   ├── StatCard (Łącznie treningów)
    │   ├── StatCard (Łącznie serii)
    │   ├── StatCard (Objętość)
    │   └── StatCard (Unikalne ćwiczenia)
    ├── RecentWorkoutsList
    │   ├── RecentWorkoutsHeader
    │   └── WorkoutSummaryCard[] (lista kart)
    └── ProgressChartWidget
        ├── ChartHeader (z filtrem okresu)
        └── ProgressChart (Recharts)
```

## 4. Szczegóły komponentów

### 4.1. Dashboard (Główny komponent kontenera)

**Opis komponentu:**
Główny komponent React zarządzający całym widokiem Dashboard. Odpowiada za pobranie danych z API, zarządzanie stanem ładowania i błędów, oraz renderowanie podkomponentów z odpowiednimi danymi.

**Główne elementy:**

- Kontener z `max-w-7xl` i paddingiem
- Conditional rendering: Skeleton UI podczas ładowania, komunikat błędu w przypadku niepowodzenia, normalna zawartość po załadowaniu
- Grid layout dla organizacji sekcji

**Obsługiwane interakcje:**

- Automatyczne pobranie danych przy montowaniu komponentu (`useEffect`)
- Odświeżanie danych po zmianie filtru okresu

**Warunki walidacji:**

- Sprawdzenie dostępności danych przed renderowaniem
- Obsługa przypadku braku danych (nowy użytkownik bez treningów)

**Typy:**

- `DashboardSummaryDTO` (odpowiedź z API)
- `DashboardState` (lokalny stan)

**Propsy:**

- Brak (komponent główny)

### 4.2. DashboardHeader

**Opis komponentu:**
Nagłówek sekcji Dashboard z tytułem i filtrem wyboru okresu czasu.

**Główne elementy:**

- `<h1>` z tytułem "Dashboard"
- `<Select>` (Shadcn/ui) do wyboru okresu (1, 3, 6, 12 miesięcy)
- Flexbox layout z przestrzenią między elementami

**Obsługiwane interakcje:**

- Zmiana wartości w select trigguje wywołanie callbacku `onMonthsChange`

**Warunki walidacji:**

- Wartość musi być jedną z dostępnych opcji (1, 3, 6, 12)

**Typy:**

- `DashboardHeaderProps`

**Propsy:**

```typescript
interface DashboardHeaderProps {
  selectedMonths: number;
  onMonthsChange: (months: number) => void;
}
```

### 4.3. StatsGrid

**Opis komponentu:**
Siatka kart KPI wyświetlająca cztery główne statystyki: łączną liczbę treningów, serii, objętość i unikalne ćwiczenia z wybranego okresu.

**Główne elementy:**

- Grid z 4 kolumnami (responsywny: 1 kolumna na mobile, 2 na tablet, 4 na desktop)
- 4 komponenty `StatCard` z różnymi danymi i ikonami

**Obsługiwane interakcje:**

- Brak (komponent prezentacyjny)

**Warunki walidacji:**

- Wszystkie wartości statystyk muszą być liczbami nieujemnymi
- Formatowanie objętości z separatorem tysięcy

**Typy:**

- `StatsGridProps`
- `SummaryStatsDTO`

**Propsy:**

```typescript
interface StatsGridProps {
  stats: SummaryStatsDTO;
  isLoading: boolean;
}
```

### 4.4. StatCard

**Opis komponentu:**
Pojedyncza karta statystyki wyświetlająca ikonę, etykietę i wartość KPI. Wspiera stan ładowania z Skeleton UI.

**Główne elementy:**

- `Card` (Shadcn/ui) jako kontener
- Ikona (Lucide React)
- Etykieta tekstowa
- Wartość liczbowa (duża czcionka, bold)
- Skeleton variant dla stanu ładowania

**Obsługiwane interakcje:**

- Brak (komponent prezentacyjny)

**Warunki walidacji:**

- Wartość musi być liczbą lub undefined (w przypadku ładowania)
- Formatowanie liczb według typu (standardowe, z separatorem, z jednostką)

**Typy:**

- `StatCardProps`

**Propsy:**

```typescript
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  formatter?: (value: number) => string;
  isLoading: boolean;
}
```

### 4.5. RecentWorkoutsList

**Opis komponentu:**
Sekcja wyświetlająca listę ostatnich 5 treningów z podstawowymi informacjami (data, liczba ćwiczeń, liczba serii). Zawiera nagłówek z linkiem do pełnej historii.

**Główne elementy:**

- `RecentWorkoutsHeader` (nagłówek sekcji)
- Lista `WorkoutSummaryCard` (maksymalnie 5 elementów)
- Empty state jeśli brak treningów
- Skeleton cards podczas ładowania

**Obsługiwane interakcje:**

- Kliknięcie karty treningu → nawigacja do szczegółów (`/app/history/:id`)
- Kliknięcie "Zobacz wszystkie" → nawigacja do `/app/history`

**Warunki walidacji:**

- Wyświetl maksymalnie 5 ostatnich treningów
- Sortowanie według daty (najnowsze pierwsze)

**Typy:**

- `RecentWorkoutsListProps`
- `RecentWorkoutDTO[]`

**Propsy:**

```typescript
interface RecentWorkoutsListProps {
  workouts: RecentWorkoutDTO[];
  isLoading: boolean;
}
```

### 4.6. RecentWorkoutsHeader

**Opis komponentu:**
Nagłówek sekcji ostatnich treningów z tytułem i linkiem do pełnej historii.

**Główne elementy:**

- `<h2>` z tytułem "Ostatnie treningi"
- `<Link>` (lub Button as link) do `/app/history` z tekstem "Zobacz wszystkie"
- Flexbox layout z przestrzenią między elementami

**Obsługiwane interakcje:**

- Kliknięcie linku → nawigacja do `/app/history`

**Warunki walidacji:**

- Brak

**Typy:**

- Brak propsów

**Propsy:**

- Brak

### 4.7. WorkoutSummaryCard

**Opis komponentu:**
Kompaktowa karta pojedynczego treningu pokazująca datę, liczbę ćwiczeń i liczbę serii. Klikalna, prowadzi do szczegółów treningu.

**Główne elementy:**

- `Card` (Shadcn/ui) jako klikalny kontener
- Data treningu (sformatowana w formacie polski: "dd MMM yyyy" lub relatywny "Dzisiaj", "Wczoraj")
- Ikona + liczba ćwiczeń
- Ikona + liczba serii
- Hover effect (podświetlenie)

**Obsługiwane interakcje:**

- Kliknięcie całej karty → nawigacja do `/app/history/${workout.id}`

**Warunki walidacji:**

- ID treningu musi być poprawnym UUID
- Liczby ćwiczeń i serii muszą być > 0

**Typy:**

- `WorkoutSummaryCardProps`
- `RecentWorkoutDTO`

**Propsy:**

```typescript
interface WorkoutSummaryCardProps {
  workout: RecentWorkoutDTO;
  onClick: (workoutId: string) => void;
}
```

### 4.8. ProgressChartWidget

**Opis komponentu:**
Widget wykresu pokazującego postęp treningowy w czasie. Zawiera nagłówek z filtrem i wykres liniowy (Recharts).

**Główne elementy:**

- `ChartHeader` (nagłówek z filtrem metryki)
- `Card` jako kontener wykresu
- `ResponsiveContainer` + `LineChart` (Recharts)
- Skeleton podczas ładowania
- Empty state jeśli brak danych do wizualizacji

**Obsługiwane interakcje:**

- Zmiana metryki w filtrze
- Hover nad punktami wykresu → tooltip z szczegółami
- Kliknięcie punktu → potencjalnie nawigacja do szczegółów (opcjonalnie)

**Warunki walidacji:**

- Dane punktów muszą być posortowane chronologicznie
- Wykres renderuje się tylko gdy są dostępne dane

**Typy:**

- `ProgressChartWidgetProps`
- `ChartDataPoint[]`

**Propsy:**

```typescript
interface ProgressChartWidgetProps {
  data: ChartDataPoint[];
  isLoading: boolean;
}
```

### 4.9. ChartHeader

**Opis komponentu:**
Nagłówek sekcji wykresu z tytułem i opcjonalnym selectem do wyboru metryki (dla przyszłego rozszerzenia funkcjonalności).

**Główne elementy:**

- `<h2>` z tytułem "Postęp treningowy"
- Opcjonalny `<Select>` do wyboru metryki (MVP: może być placeholder)
- Flexbox layout

**Obsługiwane interakcje:**

- Zmiana metryki w select (jeśli zaimplementowany)

**Warunki walidacji:**

- Brak (w MVP może być statyczny)

**Typy:**

- `ChartHeaderProps`

**Propsy:**

```typescript
interface ChartHeaderProps {
  title: string;
  selectedMetric?: string;
  onMetricChange?: (metric: string) => void;
}
```

### 4.10. ProgressChart

**Opis komponentu:**
Rzeczywisty wykres liniowy wykorzystujący bibliotekę Recharts do wizualizacji danych treningowych w czasie.

**Główne elementy:**

- `ResponsiveContainer` (Recharts)
- `LineChart` z konfiguracją osi i linii
- `XAxis` (daty)
- `YAxis` (wartości metryki)
- `Tooltip` (niestandardowy tooltip z formatowaniem)
- `Line` (linia danych)
- `CartesianGrid` (siatka)

**Obsługiwane interakcje:**

- Hover nad punktami → wyświetlenie tooltip
- Opcjonalnie: kliknięcie punktu

**Warunki walidacji:**

- Dane muszą być w formacie obsługiwanym przez Recharts
- Daty muszą być prawidłowo sformatowane
- Wartości muszą być liczbami

**Typy:**

- `ProgressChartProps`
- `ChartDataPoint`

**Propsy:**

```typescript
interface ProgressChartProps {
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  lineColor?: string;
}
```

## 5. Typy

### 5.1. Typy API (już istniejące w types.ts)

**DashboardSummaryDTO** - główna odpowiedź z API:

```typescript
export interface DashboardSummaryDTO {
  period: PeriodDTO; // Okres danych
  summary: SummaryStatsDTO; // Podsumowanie statystyk
  recent_workouts: RecentWorkoutDTO[]; // Ostatnie treningi
}
```

**PeriodDTO** - metadane okresu:

```typescript
export interface PeriodDTO {
  start_date: string; // Format: "YYYY-MM-DD"
  end_date: string; // Format: "YYYY-MM-DD"
  months: number; // 1-12
}
```

**SummaryStatsDTO** - statystyki podsumowujące:

```typescript
export interface SummaryStatsDTO {
  total_workouts: number; // Łączna liczba treningów
  total_sets: number; // Łączna liczba serii
  total_volume: number; // Łączna objętość (kg)
  unique_exercises: number; // Liczba unikalnych ćwiczeń
}
```

**RecentWorkoutDTO** - podsumowanie pojedynczego treningu:

```typescript
export interface RecentWorkoutDTO {
  id: string; // UUID treningu
  date: string; // Format: "YYYY-MM-DD"
  exercise_count: number; // Liczba ćwiczeń
  set_count: number; // Liczba serii
}
```

### 5.2. Nowe typy ViewModels dla Dashboard

**DashboardState** - stan głównego komponentu Dashboard:

```typescript
export interface DashboardState {
  // Dane z API
  data: DashboardSummaryDTO | null;

  // Filtry
  selectedMonths: number; // 1, 3, 6, lub 12

  // Stany UI
  isLoading: boolean;
  error: string | null;
}
```

**ChartDataPoint** - pojedynczy punkt danych wykresu:

```typescript
export interface ChartDataPoint {
  date: string; // Sformatowana data do wyświetlenia
  dateValue: string; // ISO date dla sortowania
  value: number; // Wartość metryki
  label: string; // Etykieta dla tooltip
  workoutId?: string; // Opcjonalne ID treningu dla nawigacji
}
```

**DashboardMetrics** - metryki dla wykresu (przyszłe rozszerzenie):

```typescript
export type DashboardMetric =
  | "total_volume" // Łączna objętość
  | "total_workouts" // Liczba treningów
  | "avg_sets" // Średnia liczba serii
  | "unique_exercises"; // Unikalne ćwiczenia

export interface DashboardMetricConfig {
  key: DashboardMetric;
  label: string;
  unit: string;
  color: string;
  formatter: (value: number) => string;
}
```

### 5.3. Props Interfaces

**DashboardHeaderProps**:

```typescript
export interface DashboardHeaderProps {
  selectedMonths: number;
  onMonthsChange: (months: number) => void;
}
```

**StatsGridProps**:

```typescript
export interface StatsGridProps {
  stats: SummaryStatsDTO;
  isLoading: boolean;
}
```

**StatCardProps**:

```typescript
export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | undefined;
  formatter?: (value: number) => string;
  isLoading: boolean;
}
```

**RecentWorkoutsListProps**:

```typescript
export interface RecentWorkoutsListProps {
  workouts: RecentWorkoutDTO[];
  isLoading: boolean;
}
```

**WorkoutSummaryCardProps**:

```typescript
export interface WorkoutSummaryCardProps {
  workout: RecentWorkoutDTO;
  onClick: (workoutId: string) => void;
}
```

**ProgressChartWidgetProps**:

```typescript
export interface ProgressChartWidgetProps {
  data: ChartDataPoint[];
  isLoading: boolean;
}
```

**ChartHeaderProps**:

```typescript
export interface ChartHeaderProps {
  title: string;
  selectedMetric?: string;
  onMetricChange?: (metric: string) => void;
}
```

**ProgressChartProps**:

```typescript
export interface ProgressChartProps {
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  lineColor?: string;
}
```

## 6. Zarządzanie stanem

### 6.1. Lokalny stan komponentu Dashboard

Dashboard wykorzystuje lokalny stan React zarządzany przez `useState`:

```typescript
const [state, setState] = useState<DashboardState>({
  data: null,
  selectedMonths: 3,
  isLoading: true,
  error: null,
});
```

### 6.2. Custom hook: useDashboard

Dla lepszej organizacji i reużywalności, logika pobierania danych powinna być wydzielona do custom hooka `useDashboard`:

**Lokalizacja**: `src/lib/hooks/useDashboard.ts`

**Odpowiedzialność:**

- Pobieranie danych z API przy montowaniu i przy zmianie `selectedMonths`
- Zarządzanie stanami ładowania i błędów
- Odświeżanie danych (opcjonalnie)

**Interfejs:**

```typescript
export function useDashboard(initialMonths: number = 3) {
  const [data, setData] = useState<DashboardSummaryDTO | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(initialMonths);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funkcja pobierająca dane
  const fetchDashboardData = useCallback(async (months: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/dashboard?months=${months}`);

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const result: DashboardSummaryDTO = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efekt pobierający dane przy montowaniu i zmianie months
  useEffect(() => {
    fetchDashboardData(selectedMonths);
  }, [selectedMonths, fetchDashboardData]);

  // Handler zmiany okresu
  const handleMonthsChange = useCallback((months: number) => {
    setSelectedMonths(months);
  }, []);

  return {
    data,
    selectedMonths,
    isLoading,
    error,
    onMonthsChange: handleMonthsChange,
    refetch: () => fetchDashboardData(selectedMonths),
  };
}
```

**Użycie w komponencie Dashboard:**

```typescript
const Dashboard = () => {
  const { data, selectedMonths, isLoading, error, onMonthsChange } = useDashboard(3);

  // Reszta logiki renderowania...
};
```

### 6.3. Brak globalnego stanu

Dashboard nie wymaga globalnego zarządzania stanem (Context API, Redux) gdyż:

- Dane są specyficzne tylko dla tego widoku
- Nie ma potrzeby współdzielenia stanu z innymi komponentami
- Lokalny stan + custom hook są wystarczające

## 7. Integracja API

### 7.1. Endpoint

**URL**: `GET /api/analytics/dashboard`

**Query Parameters:**

- `months` (optional): Liczba miesięcy wstecz (1-12), domyślnie: 3

**Przykładowe zapytanie:**

```
GET /api/analytics/dashboard?months=3
```

### 7.2. Request Type

Brak body (GET request).

Query params jako `URLSearchParams`:

```typescript
const params = new URLSearchParams({ months: "3" });
```

### 7.3. Response Type

**Success (200):**

```typescript
type DashboardSummaryDTO = {
  period: {
    start_date: string; // "2025-10-31"
    end_date: string; // "2026-01-31"
    months: number; // 3
  };
  summary: {
    total_workouts: number; // 36
    total_sets: number; // 540
    total_volume: number; // 125000.00
    unique_exercises: number; // 12
  };
  recent_workouts: Array<{
    id: string; // "uuid"
    date: string; // "2026-01-30"
    exercise_count: number; // 5
    set_count: number; // 15
  }>;
};
```

**Error (401):**

```typescript
{
  message: "Unauthorized";
}
```

**Error (500):**

```typescript
{
  message: "Internal server error";
}
```

### 7.4. Wywołanie w komponencie

**Fetch z obsługą błędów:**

```typescript
async function fetchDashboardData(months: number): Promise<DashboardSummaryDTO> {
  const response = await fetch(`/api/analytics/dashboard?months=${months}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Dla przekazania cookies sesji
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Przekierowanie do logowania
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
```

### 7.5. Autoryzacja

- Endpoint jest chroniony i wymaga aktywnej sesji użytkownika
- Autoryzacja poprzez cookies (httpOnly) ustawione przez Supabase Auth
- W przypadku 401: automatyczne przekierowanie do `/login`

## 8. Interakcje użytkownika

### 8.1. Zmiana okresu danych

**Trigger**: Użytkownik wybiera inny okres z dropdown w `DashboardHeader`

**Flow:**

1. Użytkownik klika select i wybiera wartość (1, 3, 6, lub 12 miesięcy)
2. Event `onMonthsChange` wywołuje handler w `Dashboard`
3. Stan `selectedMonths` jest aktualizowany
4. `useEffect` w `useDashboard` wykrywa zmianę i ponownie pobiera dane
5. Stan `isLoading` ustawia się na `true`
6. Wyświetlane są Skeleton components
7. Po otrzymaniu danych, stan `data` jest aktualizowany
8. Komponenty renderują się z nowymi danymi

**Obsługa błędów:**

- Jeśli request się nie powiedzie, wyświetl komunikat Toast z błędem
- Zachowaj poprzednie dane (nie czyść ich podczas ładowania)

### 8.2. Kliknięcie karty ostatniego treningu

**Trigger**: Użytkownik klika na `WorkoutSummaryCard`

**Flow:**

1. Handler `onClick` w karcie wywołuje callback przekazany z rodzica
2. Nawigacja do `/app/history/${workoutId}` używając `window.location.href` lub Astro navigate
3. Widok szczegółów treningu się ładuje

**Warunek:**

- `workoutId` musi być poprawnym UUID

### 8.3. Przejście do pełnej historii

**Trigger**: Użytkownik klika link "Zobacz wszystkie" w `RecentWorkoutsHeader`

**Flow:**

1. Nawigacja do `/app/history`
2. Lista wszystkich treningów się ładuje

### 8.4. Interakcja z wykresem

**Trigger**: Użytkownik najeżdża na punkt na wykresie

**Flow:**

1. Recharts wykrywa hover
2. Wyświetla się tooltip z:
   - Datą (sformatowana)
   - Wartością metryki (z jednostką)
   - Opcjonalnie: szczegóły treningu
3. Po zjechaniu kursorem, tooltip znika

**Opcjonalne - kliknięcie punktu:**

- Nawigacja do szczegółów treningu (`/app/history/${workoutId}`)
- Wymaga przekazania `workoutId` w `ChartDataPoint`

### 8.5. Odświeżanie danych

**Trigger**: Automatyczne przy zmianie okresu lub ręczne (opcjonalny przycisk refresh)

**Flow:**

- Wywołanie metody `refetch()` z `useDashboard`
- Powtórne pobranie danych bez zmiany `selectedMonths`

## 9. Warunki i walidacja

### 9.1. Walidacja query parameters

**Komponent**: `Dashboard` / `useDashboard`

**Warunek**: Parametr `months` musi być liczbą z zakresu 1-12

**Walidacja:**

```typescript
const VALID_MONTHS = [1, 3, 6, 12];

function isValidMonths(value: number): boolean {
  return VALID_MONTHS.includes(value);
}

// Użycie
if (!isValidMonths(selectedMonths)) {
  setSelectedMonths(3); // Fallback do domyślnej wartości
}
```

**Wpływ na UI**: Niepoprawna wartość jest resetowana do domyślnej (3)

### 9.2. Walidacja danych z API

**Komponent**: `useDashboard` (custom hook)

**Warunki:**

- Odpowiedź musi zawierać wszystkie wymagane pola (`period`, `summary`, `recent_workouts`)
- Liczby w statystykach muszą być >= 0
- Daty muszą być w formacie ISO 8601
- ID treningów muszą być prawidłowymi UUID

**Walidacja:**

```typescript
function validateDashboardData(data: unknown): data is DashboardSummaryDTO {
  if (typeof data !== "object" || data === null) return false;

  const d = data as DashboardSummaryDTO;

  // Sprawdź strukturę
  if (!d.period || !d.summary || !Array.isArray(d.recent_workouts)) {
    return false;
  }

  // Sprawdź wartości
  if (d.summary.total_workouts < 0 || d.summary.total_sets < 0) {
    return false;
  }

  // Sprawdź daty
  if (!isValidISODate(d.period.start_date) || !isValidISODate(d.period.end_date)) {
    return false;
  }

  return true;
}
```

**Wpływ na UI**: Jeśli walidacja się nie powiedzie, wyświetl błąd "Niepoprawne dane z serwera"

### 9.3. Walidacja stanu "brak danych"

**Komponent**: `Dashboard`, `StatsGrid`, `RecentWorkoutsList`, `ProgressChartWidget`

**Warunek**: Nowy użytkownik bez żadnych treningów

**Sprawdzenie:**

```typescript
const hasNoData = data?.summary.total_workouts === 0;
```

**Wpływ na UI:**

- `StatsGrid`: Wyświetl wszystkie statystyki jako "0"
- `RecentWorkoutsList`: Wyświetl empty state z komunikatem "Brak treningów. Zacznij logować swoje treningi!"
- `ProgressChartWidget`: Wyświetl empty state z komunikatem "Brak danych do wyświetlenia"

### 9.4. Walidacja formatowania liczb

**Komponenty**: `StatCard`, `ProgressChart` tooltip

**Warunki:**

- Liczby całkowite (treningi, serie, ćwiczenia): bez miejsc po przecinku
- Objętość: formatowanie z separatorem tysięcy (np. "125 000 kg")
- Wartości na wykresie: 1-2 miejsca po przecinku

**Formatowanie:**

```typescript
// Separator tysięcy
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("pl-PL").format(value);
};

// Objętość z jednostką
const formatVolume = (value: number): string => {
  return `${formatNumber(value)} kg`;
};

// Wartość wykresu
const formatChartValue = (value: number): string => {
  return value.toFixed(2);
};
```

**Wpływ na UI**: Prawidłowe wyświetlanie liczb według polskich standardów

### 9.5. Walidacja dat

**Komponenty**: `WorkoutSummaryCard`, `ProgressChart`

**Warunki:**

- Data musi być w formacie ISO 8601
- Data nie może być w przyszłości
- Data musi być parsowalna przez `new Date()`

**Formatowanie:**

```typescript
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

const formatWorkoutDate = (dateString: string): string => {
  const date = parseISO(dateString);

  if (isToday(date)) return "Dzisiaj";
  if (isYesterday(date)) return "Wczoraj";

  return format(date, "d MMM yyyy", { locale: pl });
};
```

**Wpływ na UI**: Czytelne wyświetlanie dat w polskim formacie

## 10. Obsługa błędów

### 10.1. Błąd sieciowy (Network Error)

**Scenariusz**: Brak połączenia z internetem lub serwer niedostępny

**Wykrywanie:**

```typescript
catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    setError('Brak połączenia z serwerem. Sprawdź połączenie internetowe.');
  }
}
```

**UI:**

- Wyświetl komunikat Alert (Shadcn/ui) z ikoną błędu
- Przycisk "Spróbuj ponownie" → wywołuje `refetch()`
- Nie ukrywaj poprzednich danych (jeśli istnieją)

### 10.2. Błąd autoryzacji (401)

**Scenariusz**: Sesja użytkownika wygasła lub nie istnieje

**Wykrywanie:**

```typescript
if (response.status === 401) {
  window.location.href = "/login";
  throw new Error("Unauthorized");
}
```

**UI:**

- Automatyczne przekierowanie do `/login`
- Opcjonalnie: Toast z informacją "Sesja wygasła. Zaloguj się ponownie."

### 10.3. Błąd serwera (500)

**Scenariusz**: Wewnętrzny błąd serwera

**Wykrywanie:**

```typescript
if (response.status >= 500) {
  throw new Error("Błąd serwera. Spróbuj ponownie później.");
}
```

**UI:**

- Alert z komunikatem "Wystąpił błąd serwera"
- Przycisk "Spróbuj ponownie"
- Opcjonalnie: link do kontaktu lub zgłoszenia błędu

### 10.4. Brak danych (Empty State)

**Scenariusz**: Nowy użytkownik bez żadnych treningów

**Wykrywanie:**

```typescript
const isEmpty = data?.summary.total_workouts === 0;
```

**UI:**

- `StatsGrid`: Pokaż statystyki z wartością 0
- `RecentWorkoutsList`: Empty state z ilustracją + tekst "Brak treningów do wyświetlenia. Dodaj swój pierwszy trening!" + Button "Zaloguj trening" → nawigacja do `/app/log`
- `ProgressChartWidget`: Empty state "Brak danych do wyświetlenia na wykresie"

### 10.5. Błąd walidacji danych

**Scenariusz**: API zwróciło dane w nieprawidłowym formacie

**Wykrywanie:**

```typescript
if (!validateDashboardData(data)) {
  throw new Error("Nieprawidłowy format danych z serwera");
}
```

**UI:**

- Alert z komunikatem "Otrzymano nieprawidłowe dane"
- Przycisk "Odśwież stronę"
- Logowanie błędu do konsoli (dla developera)

### 10.6. Timeout

**Scenariusz**: Request trwa zbyt długo

**Wykrywanie:**

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === "AbortError") {
    setError("Żądanie przekroczyło limit czasu. Spróbuj ponownie.");
  }
}
```

**UI:**

- Alert "Ładowanie trwa zbyt długo"
- Przycisk "Spróbuj ponownie"

### 10.7. Częściowy błąd (np. brak wykres, ale statystyki OK)

**Scenariusz**: Część danych załadowała się poprawnie, ale inna nie

**Obsługa:**

- Renderuj komponenty z dostępnymi danymi
- Pokaż placeholder/komunikat dla komponentów bez danych
- Nie blokuj całego widoku

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utwórz plik strony Astro: `src/pages/app/dashboard.astro`
2. Utwórz folder komponentów: `src/components/dashboard/`
3. Utwórz plik custom hooka: `src/lib/hooks/useDashboard.ts`
4. Utwórz plik pomocniczy dla formatowania: `src/lib/utils/formatters.ts`

### Krok 2: Dodanie typów do types.ts

1. Otwórz `src/types.ts`
2. Dodaj nowe typy ViewModels:
   - `DashboardState`
   - `ChartDataPoint`
   - `DashboardMetric` i `DashboardMetricConfig`
3. Dodaj interfaces dla propsów wszystkich komponentów Dashboard
4. Zweryfikuj, że typy API (DashboardSummaryDTO, etc.) są już obecne

### Krok 3: Implementacja custom hooka useDashboard

1. Utwórz plik `src/lib/hooks/useDashboard.ts`
2. Zaimplementuj funkcję `fetchDashboardData` z pełną obsługą błędów
3. Zaimplementuj hook `useDashboard` z:
   - Stanem (`data`, `selectedMonths`, `isLoading`, `error`)
   - Efektem pobierającym dane
   - Handlerem zmiany okresu
   - Metodą `refetch`
4. Dodaj walidację parametrów i odpowiedzi
5. Przetestuj hook w izolacji

### Krok 4: Implementacja funkcji pomocniczych formatowania

1. Utwórz plik `src/lib/utils/formatters.ts`
2. Zaimplementuj funkcje:
   - `formatNumber(value: number): string` - separator tysięcy
   - `formatVolume(value: number): string` - objętość z jednostką
   - `formatWorkoutDate(dateString: string): string` - formatowanie dat
   - `formatChartValue(value: number): string` - wartości wykresu
3. Dodaj testy jednostkowe (opcjonalnie)

### Krok 5: Implementacja komponentu StatCard

1. Utwórz `src/components/dashboard/StatCard.tsx`
2. Zaimplementuj UI z użyciem Shadcn/ui Card
3. Dodaj wariant Skeleton dla stanu ładowania
4. Zintegruj funkcje formatowania
5. Przetestuj wizualnie wszystkie stany

### Krok 6: Implementacja komponentu StatsGrid

1. Utwórz `src/components/dashboard/StatsGrid.tsx`
2. Zdefiniuj grid layout (responsywny)
3. Zrenderuj 4 komponenty `StatCard` z odpowiednimi danymi i ikonami:
   - Dumbbell icon → Łącznie treningów
   - ListChecks icon → Łącznie serii
   - Weight icon → Objętość
   - Activity icon → Unikalne ćwiczenia
4. Przekaż odpowiednie formattery do każdej karty
5. Przetestuj responsywność

### Krok 7: Implementacja komponentu WorkoutSummaryCard

1. Utwórz `src/components/dashboard/WorkoutSummaryCard.tsx`
2. Zaimplementuj kliknięty Card z:
   - Sformatowaną datą
   - Ikoną i liczbą ćwiczeń
   - Ikoną i liczbą serii
3. Dodaj hover effect
4. Zintegruj funkcję formatowania daty
5. Dodaj obsługę onClick

### Krok 8: Implementacja komponentów RecentWorkouts

1. Utwórz `src/components/dashboard/RecentWorkoutsHeader.tsx`:
   - Nagłówek "Ostatnie treningi"
   - Link "Zobacz wszystkie" → `/app/history`
2. Utwórz `src/components/dashboard/RecentWorkoutsList.tsx`:
   - Renderuj listę `WorkoutSummaryCard` (max 5)
   - Dodaj Skeleton cards dla ładowania
   - Dodaj empty state z przyciskiem "Zaloguj trening"
3. Obsłuż kliknięcie karty → nawigacja do szczegółów

### Krok 9: Implementacja komponentu ProgressChart (Recharts)

1. Zainstaluj zależność: `npm install recharts`
2. Utwórz `src/components/dashboard/ProgressChart.tsx`
3. Zaimplementuj wykres używając:
   - `ResponsiveContainer`
   - `LineChart`
   - `XAxis`, `YAxis`
   - `Tooltip` (niestandardowy z formatowaniem)
   - `Line`
   - `CartesianGrid`
4. Dostosuj style (kolory, czcionki) do dark mode
5. Przetestuj z przykładowymi danymi

### Krok 10: Implementacja ProgressChartWidget

1. Utwórz `src/components/dashboard/ChartHeader.tsx`
2. Utwórz `src/components/dashboard/ProgressChartWidget.tsx`:
   - Integruj `ChartHeader`
   - Integruj `ProgressChart`
   - Dodaj Skeleton dla ładowania
   - Dodaj empty state
3. Opcjonalnie: dodaj filtr metryki (przygotowanie na przyszłość)
4. Obsłuż transformację danych API → `ChartDataPoint[]`

### Krok 11: Implementacja komponentu DashboardHeader

1. Utwórz `src/components/dashboard/DashboardHeader.tsx`
2. Zaimplementuj layout z tytułem i selectem
3. Skonfiguruj Select (Shadcn/ui) z opcjami: 1, 3, 6, 12 miesięcy
4. Dodaj obsługę zdarzenia `onMonthsChange`

### Krok 12: Implementacja głównego komponentu Dashboard

1. Utwórz `src/components/dashboard/Dashboard.tsx`
2. Zintegruj hook `useDashboard`
3. Zaimplementuj conditional rendering:
   - Skeleton UI (podczas `isLoading`)
   - Alert błędu (jeśli `error`)
   - Normalna zawartość (jeśli `data`)
4. Zrenderuj wszystkie podkomponenty:
   - `DashboardHeader`
   - `StatsGrid`
   - `RecentWorkoutsList`
   - `ProgressChartWidget`
5. Dodaj layout grid/flex dla organizacji sekcji
6. Obsłuż przypadek "brak danych" (empty state)

### Krok 13: Utworzenie strony Astro

1. Utwórz `src/pages/app/dashboard.astro`
2. Zaimportuj `LayoutApp`
3. Osadź komponent `<Dashboard client:load />` jako React Island
4. Upewnij się, że middleware sprawdza autoryzację
5. Przetestuj routing

### Krok 14: Utworzenie pliku index dla łatwego importu

1. Utwórz `src/components/dashboard/index.ts`
2. Eksportuj wszystkie komponenty Dashboard:
   ```typescript
   export { default as Dashboard } from "./Dashboard";
   export { default as DashboardHeader } from "./DashboardHeader";
   export { default as StatsGrid } from "./StatsGrid";
   export { default as StatCard } from "./StatCard";
   export { default as RecentWorkoutsList } from "./RecentWorkoutsList";
   export { default as WorkoutSummaryCard } from "./WorkoutSummaryCard";
   export { default as ProgressChartWidget } from "./ProgressChartWidget";
   export { default as ProgressChart } from "./ProgressChart";
   ```

### Krok 15: Testowanie integracyjne

1. Uruchom aplikację lokalnie: `npm run dev`
2. Zaloguj się jako testowy użytkownik
3. Przejdź do `/app/dashboard`
4. Zweryfikuj:
   - Poprawne załadowanie danych
   - Skeleton UI podczas ładowania
   - Wyświetlanie wszystkich statystyk
   - Lista ostatnich treningów
   - Wykres (jeśli dane dostępne)
5. Przetestuj zmianę okresu (1, 3, 6, 12 miesięcy)
6. Przetestuj kliknięcia:
   - Karta treningu → nawigacja do szczegółów
   - "Zobacz wszystkie" → nawigacja do historii
7. Przetestuj przypadki brzegowe:
   - Nowy użytkownik bez danych
   - Symulacja błędu sieciowego (offline)
   - Długi czas odpowiedzi (throttling)

### Krok 16: Testowanie responsywności (RWD)

1. Otwórz DevTools i testuj różne rozmiary ekranu:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1024px, 1440px)
2. Zweryfikuj:
   - Grid StatsGrid dostosowuje się (1 → 2 → 4 kolumny)
   - Header jest czytelny na małych ekranach
   - Wykres skaluje się poprawnie
   - Karty treningów są czytelne
3. Popraw ewentualne problemy z layoutem

### Krok 17: Optymalizacja wydajności

1. Sprawdź, czy komponenty nie rerenderują się niepotrzebnie (React DevTools)
2. Użyj `React.memo` dla komponentów prezentacyjnych (StatCard, WorkoutSummaryCard)
3. Upewnij się, że callbacki są zmemoizowane (`useCallback`)
4. Sprawdź wydajność wykresu Recharts z dużą ilością danych

### Krok 18: Obsługa błędów i edge cases

1. Dodaj obsługę błędów we wszystkich komponentach
2. Zaimplementuj graceful fallbacks
3. Dodaj komunikaty Toast dla operacji (sukces/błąd)
4. Przetestuj wszystkie scenariusze błędów z sekcji 10

### Krok 19: Dodanie animacji i transitions (opcjonalnie)

1. Dodaj fade-in animations dla komponentów po załadowaniu
2. Dodaj transitions dla zmian w wykresie
3. Użyj Framer Motion lub CSS transitions
4. Zachowaj subtle effects (nie przesadzaj)

### Krok 20: Code review i dokumentacja

1. Przejrzyj cały kod pod kątem:
   - Zgodności z przewodnikiem stylu projektu
   - Poprawności typów TypeScript
   - Dostępności (a11y)
   - Czytelności i maintainability
2. Dodaj komentarze JSDoc do skomplikowanych funkcji
3. Zaktualizuj README (jeśli potrzeba)
4. Zrób commit z opisem implementacji

### Krok 21: Deployment i weryfikacja produkcyjna

1. Upewnij się, że zmiany są zmergowane do głównej gałęzi
2. Zweryfikuj, że CI/CD pipeline przeszedł pomyślnie
3. Przetestuj na środowisku produkcyjnym (Cloudflare Pages)
4. Monitoruj logi pod kątem błędów
5. Zbierz feedback od użytkowników (jeśli dostępni)
