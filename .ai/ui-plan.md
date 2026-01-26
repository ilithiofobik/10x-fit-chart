# Architektura UI dla 10xFitChart (MVP)

## 1. Przegląd struktury UI

Interfejs użytkownika 10xFitChart został zaprojektowany zgodnie z podejściem **Desktop-First**, kładącym nacisk na szybkość wprowadzania danych (Keyboard Navigation) i czytelność na dużych ekranach. Aplikacja wykorzystuje architekturę hybrydową:
- **Astro**: Odpowiada za routing, strukturę strony, wstępne renderowanie (SSR) i ochronę tras (Middleware).
- **React**: Obsługuje interaktywne "wyspy" aplikacji (Logger, Dashboard, Edycja), zarządzając złożonym stanem lokalnym.
- **Shadcn/ui + Tailwind**: Zapewniają spójny system komponentów i dostępność (Accessibility).

Aplikacja podzielona jest na dwie główne strefy:
1.  **Strefa Publiczna**: Statyczna, zoptymalizowana pod SEO (Landing Page).
2.  **Strefa Aplikacji (`/app`)**: Chroniona autoryzacją, dynamiczna aplikacja SPA osadzona w Astro.

## 2. Lista widoków

### 2.1. Landing Page (Publiczny)
- **Ścieżka**: `/`
- **Główny cel**: Konwersja odwiedzającego w użytkownika (Rejestracja/Logowanie).
- **Kluczowe informacje**: Value Proposition, przyciski CTA, zrzuty ekranu.
- **Kluczowe komponenty**: `HeroSection`, `FeatureGrid`, `AuthButtons`.
- **UX/Auth**: Dostępny dla wszystkich. Wykrywa sesję (jeśli użytkownik jest zalogowany, przycisk zmienia się na "Idź do aplikacji").

### 2.2. Logowanie / Rejestracja
- **Ścieżka**: `/login`, `/register`
- **Główny cel**: Uwierzytelnienie użytkownika.
- **Kluczowe informacje**: Formularze email/hasło, komunikaty błędów.
- **Kluczowe komponenty**: `LoginForm`, `RegisterForm`, `AuthLayout`.
- **UX/Auth**: Walidacja klienta (długość hasła, format email). Po sukcesie przekierowanie do `/app/dashboard`.

### 2.3. Dashboard (Chroniony)
- **Ścieżka**: `/app/dashboard`
- **Główny cel**: Szybki podgląd statusu treningowego i postępów.
- **Kluczowe informacje**: Podsumowanie statystyk (ilość treningów, objętość), ostatnie aktywności, główny wykres postępu.
- **Kluczowe komponenty**:
    - `StatsGrid` (Karty z KPI).
    - `RecentWorkoutsList` (Skrócona lista).
    - `ProgressChartWidget` (Wykres liniowy z filtrami).
- **UX/Auth**: **Client-side fetching** (Skeleton UI podczas ładowania). Pobiera dane z `/api/analytics/dashboard`.

### 2.4. Logger Treningowy (Chroniony)
- **Ścieżka**: `/app/log`
- **Główny cel**: Błyskawiczne wprowadzenie danych treningowych ("Keyboard-first").
- **Kluczowe informacje**: Data treningu, lista ćwiczeń, serie (ciężar/powtórzenia lub dystans/czas).
- **Kluczowe komponenty**:
    - `WorkoutLoggerProvider` (Kontekst stanu).
    - `WorkoutHeader` (Data, Notatki).
    - `ExerciseCombobox` (Wyszukiwanie + Inline Creation).
    - `ExerciseCard` (Kontener na ćwiczenie).
    - `SetTable` z `SetRow` (Polimorficzne wiersze).
    - `QuickActions` (Kopiuj ostatni trening).
- **UX/Auth**:
    - Stan formularza trzymany w **React Context + localStorage** (ochrona przed F5).
    - "Smart Entry": Kopiowanie z `/api/workouts/latest`.
    - Agresywna nawigacja klawiaturą (`Tab`, `Enter` tworzy nowy wiersz).

### 2.5. Historia Treningów
- **Ścieżka**: `/app/history` (Lista) oraz `/app/history/[id]` (Edycja)
- **Główny cel**: Przeglądanie archiwum i korekta błędów.
- **Kluczowe informacje**: Lista chronologiczna, szczegóły wybranego treningu.
- **Kluczowe komponenty**:
    - `HistoryList` (Infinite Scroll).
    - `WorkoutSummaryCard`.
    - `WorkoutEditor` (Re-użycie logiki Loggera w trybie edycji).
- **UX/Auth**: Paginacja via `limit/offset`. Edycja wysyła `PUT` zamiast `POST`.

### 2.6. Baza Ćwiczeń (Słownik)
- **Ścieżka**: `/app/exercises`
- **Główny cel**: Zarządzanie definicjami ćwiczeń (CRUD).
- **Kluczowe informacje**: Lista ćwiczeń, kategoria (Siłowe/Cardio), status (Aktywne/Zarchiwizowane).
- **Kluczowe komponenty**: `ExerciseList`, `ExerciseFormModal`, `SearchInput`.
- **UX/Auth**: Możliwość edycji nazwy i Soft Delete (archiwizacja).

### 2.7. Profil Użytkownika
- **Ścieżka**: `/app/profile`
- **Główny cel**: Zarządzanie kontem.
- **Kluczowe informacje**: Email użytkownika, strefa niebezpieczna.
- **Kluczowe komponenty**: `SignOutButton`, `DeleteAccountButton` (z potwierdzeniem).
- **UX/Auth**: Usuwanie konta czyści wszystkie dane w Supabase (kaskadowo).

## 3. Mapa podróży użytkownika

### Główny scenariusz: Zapis treningu "po fakcie"
1.  **Start**: Użytkownik wchodzi na `/app/log`.
2.  **Inicjalizacja**:
    - System pobiera listę ćwiczeń (`GET /api/exercises`).
    - Sprawdza `localStorage` w poszukiwaniu niezapisanego draftu.
3.  **Wybór metody**:
    - *Opcja A*: Użytkownik klika "Kopiuj ostatni" -> System pobiera szablon z `/api/workouts/latest` -> Wypełnia formularz.
    - *Opcja B*: Użytkownik ręcznie wybiera datę i dodaje pierwsze ćwiczenie przez `ExerciseCombobox`.
4.  **Wprowadzanie danych**:
    - Focus w polu "Ciężar". Użytkownik wpisuje `100` -> `Tab` -> `8` -> `Enter`.
    - System automatycznie dodaje nowy pusty wiersz i przenosi focus.
5.  **Dodawanie nowego ćwiczenia (Edge Case)**:
    - Użytkownik wpisuje w Combobox nazwę, której nie ma.
    - Klika "Utwórz". Wybiera typ "Siłowe".
    - System wysyła `POST /api/exercises`, po sukcesie wybiera nowe ćwiczenie.
6.  **Zapis**:
    - Użytkownik klika "Zakończ trening".
    - System waliduje dane i wysyła `POST /api/workouts`.
    - Po sukcesie (201): Czyści `localStorage`, pokazuje Toast "Zapisano", przekierowuje na Dashboard.

## 4. Układ i struktura nawigacji

### Layout Aplikacji (`LayoutApp`)
Dla MVP zastosowano prosty układ z górnym paskiem nawigacyjnym (Header), co ułatwia implementację RWD.

1.  **Header (Sticky)**:
    - **Logo/Brand**: Link do Dashboardu.
    - **Desktop Nav**: Linki tekstowe: `Dashboard`, `Loguj`, `Historia`, `Ćwiczenia`.
    - **User Menu** (Prawa strona): Dropdown z opcjami `Profil`, `Wyloguj`.
    - **Mobile Nav**: Hamburger menu otwierające Drawer z linkami.
2.  **Main Content**:
    - Kontener centralny z maksymalną szerokością (`max-w-7xl`), paddingiem bocznym.
3.  **Toaster**:
    - Komponent globalny do powiadomień, umieszczony w prawym dolnym lub górnym rogu.

### Nawigacja między widokami
- Przejścia są realizowane przez router Astro (przeładowanie widoku), ale stan wewnątrz React Islands (np. Logger) jest zachowany dzięki `localStorage`.
- Powrót z podstron (np. z Edycji Treningu) realizowany przyciskiem "Wróć" lub breadcrumbs.

## 5. Kluczowe komponenty

### `ExerciseCombobox` (Smart Component)
Zaawansowany select oparty na `Command` z Shadcn/ui.
- Filtruje listę ćwiczeń lokalnie.
- Obsługuje stan "No results" z przyciskiem akcji "Create".
- Zwraca `exercise_id` i `type` do rodzica.

### `SetRow` (Polymorphic Component)
Wiersz tabeli, który zmienia swój wygląd w zależności od `type` ćwiczenia.
- **Props**: `type: 'strength' | 'cardio'`, `data`, `onChange`, `onEnter`.
- **Logic**:
    - Jeśli `strength`: Renderuje inputy `weight` (step 0.5) i `reps` (int). Blokuje `distance`/`time`.
    - Jeśli `cardio`: Renderuje inputy `distance` (step 0.01) i `time` (minuty -> konwersja na sekundy).
- **Accessibility**: Zarządza `tabIndex`, aby Enter przenosił do początku nowego wiersza.

### `WorkoutLoggerProvider` (State Management)
Wrapper Context API.
- Przechowuje obiekt: `{ date, notes, exercises: [{ id, sets: [...] }] }`.
- Udostępnia metody: `addExercise`, `removeExercise`, `updateSet`, `addSet`, `loadTemplate`.
- Synchronizuje stan z `localStorage` przy każdej zmianie (debounce).

### `ProgressChartWidget` (Data Visualization)
Wrapper na bibliotekę **Recharts**.
- Przyjmuje dane historyczne.
- Posiada wewnętrzny przełącznik metryki (np. 1RM / Volume).
- Formatuj tooltipy i osie w zależności od jednostki (kg vs km).
