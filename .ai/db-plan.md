# Schemat Bazy Danych - 10xFitChart

Dokument ten zawiera szczegółowy plan schematu bazy danych PostgreSQL dla aplikacji 10xFitChart, uwzględniający wymagania z PRD oraz decyzje podjęte podczas sesji planowania.

## 1. Tabele

### `auth.users` (Tabela Systemowa)
Tabela użytkowników zarządzana automatycznie przez Supabase Auth. Przechowuje dane uwierzytelniające i jest punktem odniesienia (kluczem obcym) dla pozostałych tabel. Nie tworzymy jej ręcznie w migracjach.

| Kolumna | Typ Danych | Ograniczenia (Constraints) | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PK` | Unikalny identyfikator użytkownika (`user_id`). |
| `email` | `varchar` | `UNIQUE` | Adres e-mail użytkownika. |
| `encrypted_password` | `varchar` | `NOT NULL` | Hash hasła (`password_hash`). |
| `created_at` | `timestamptz` | `NOT NULL` | Data utworzenia konta. |

### `exercises`
Słownik ćwiczeń zawierający zarówno ćwiczenia systemowe (wspólne dla wszystkich), jak i prywatne ćwiczenia użytkowników.

| Kolumna | Typ Danych | Ograniczenia (Constraints) | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator ćwiczenia. |
| `user_id` | `uuid` | `FK -> auth.users(id)`, `NULLABLE` | Właściciel ćwiczenia. `NULL` oznacza ćwiczenie systemowe/globalne. |
| `name` | `varchar(100)` | `NOT NULL` | Nazwa ćwiczenia (np. "Bench Press"). |
| `type` | `enum` | `NOT NULL` | Typ ćwiczenia: `'strength'` lub `'cardio'`. |
| `is_archived` | `boolean` | `DEFAULT false`, `NOT NULL` | Flaga dla "Soft Delete". |
| `created_at` | `timestamptz` | `DEFAULT now()`, `NOT NULL` | Data utworzenia rekordu. |
| `updated_at` | `timestamptz` | `DEFAULT now()`, `NOT NULL` | Data ostatniej modyfikacji rekordu. |

**Uwagi:**
- Relacja `ON DELETE CASCADE` nie jest wymagana dla `user_id` w tej tabeli w kontekście usuwania ćwiczenia, ale przy usuwaniu użytkownika jego prywatne ćwiczenia powinny zniknąć (więc `ON DELETE CASCADE` na kluczu obcym `user_id`).

### `workouts`
Nagłówek sesji treningowej. Reprezentuje jeden dzień treningowy użytkownika.

| Kolumna | Typ Danych | Ograniczenia (Constraints) | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator treningu. |
| `user_id` | `uuid` | `FK -> auth.users(id)`, `NOT NULL`, `ON DELETE CASCADE` | Właściciel treningu. |
| `date` | `date` | `NOT NULL`, `DEFAULT current_date` | Data odbycia treningu. |
| `notes` | `text` | `NULLABLE` | Opcjonalne notatki do treningu. |
| `created_at` | `timestamptz` | `DEFAULT now()`, `NOT NULL` | Data utworzenia wpisu. |
| `updated_at` | `timestamptz` | `DEFAULT now()`, `NOT NULL` | Data aktualizacji wpisu. |

### `workout_sets`
Szczegóły treningu – konkretne serie wykonane w ramach sesji.

| Kolumna | Typ Danych | Ograniczenia (Constraints) | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PK`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator serii. |
| `workout_id` | `uuid` | `FK -> workouts(id)`, `NOT NULL`, `ON DELETE CASCADE` | Przypisanie do konkretnego treningu. |
| `exercise_id` | `uuid` | `FK -> exercises(id)`, `NOT NULL` | Wykonane ćwiczenie. |
| `sort_order` | `integer` | `NOT NULL` | Kolejność serii w ramach treningu (1, 2, 3...). |
| `weight` | `numeric(5,2)` | `CHECK (weight >= 0)` | Ciężar w kg (dla siłowych). Np. 100.50. |
| `reps` | `integer` | `CHECK (reps >= 0)` | Liczba powtórzeń (dla siłowych). |
| `distance` | `numeric(8,2)` | `CHECK (distance >= 0)` | Dystans w km (dla cardio). |
| `time` | `integer` | `CHECK (time >= 0)` | Czas trwania w sekundach (dla cardio). |
| `calculated_1rm` | `numeric(6,2)` | `NULLABLE` | Wyliczony 1 Rep Max (dla siłowych). |
| `calculated_volume` | `numeric(10,2)` | `NULLABLE` | Wyliczona objętość: weight * reps. |
| `created_at` | `timestamptz` | `DEFAULT now()`, `NOT NULL` | Data utworzenia serii. |
| `updated_at` | `timestamptz` | `DEFAULT now()`, `NOT NULL` | Data aktualizacji serii. |

## 2. Relacje

1.  **Users -> Exercises (1:N, Nullable):**
    -   Jeden użytkownik może mieć wiele własnych ćwiczeń.
    -   Ćwiczenia bez przypisanego użytkownika (`user_id IS NULL`) są globalne.
    -   Usunięcie użytkownika usuwa jego prywatne ćwiczenia (`ON DELETE CASCADE`).

2.  **Users -> Workouts (1:N):**
    -   Jeden użytkownik ma wiele treningów.
    -   Usunięcie użytkownika usuwa wszystkie jego treningi (`ON DELETE CASCADE`).

3.  **Workouts -> Workout Sets (1:N):**
    -   Jeden trening składa się z wielu serii.
    -   Usunięcie treningu usuwa wszystkie powiązane serie (`ON DELETE CASCADE`).

4.  **Exercises -> Workout Sets (1:N):**
    -   Jedno ćwiczenie może występować w wielu seriach różnych treningów.
    -   Relacja jest wymagana, ale jeśli ćwiczenie jest `is_archived`, nadal może być linkowane.
    -   Usunięcie ćwiczenia z bazy (hard delete) jest zablokowane, jeśli istnieją powiązane serie (standardowe `ON DELETE RESTRICT` lub brak akcji), ale w aplikacji stosujemy Soft Delete.

## 3. Indeksy

Dla zapewnienia wydajności przy kluczowych zapytaniach (Dashboard, Wykresy):

1.  **Dashboard / Lista Treningów:**
    -   `CREATE INDEX idx_workouts_user_date ON workouts (user_id, date DESC);`
    -   Umożliwia szybkie pobieranie "ostatnich X treningów użytkownika".

2.  **Szczegóły Treningu:**
    -   `CREATE INDEX idx_workout_sets_workout_id ON workout_sets (workout_id);`
    -   Niezbędny do szybkiego łączenia (JOIN) przy pobieraniu całego treningu.

3.  **Wykresy i Analityka (Historia Ćwiczenia):**
    -   `CREATE INDEX idx_workout_sets_exercise_id ON workout_sets (exercise_id);`
    -   Umożliwia szybkie filtrowanie wszystkich serii dla danego ćwiczenia (np. "pokaż postęp w Bench Press").

4.  **Słownik Ćwiczeń:**
    -   `CREATE INDEX idx_exercises_user_id ON exercises (user_id);`
    -   Przyspiesza filtrowanie ćwiczeń użytkownika (oraz systemowych przez NULL).

## 4. Zasady Row Level Security (RLS)

Wszystkie tabele muszą mieć włączone RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

### `exercises`
-   **SELECT:** Widoczne, jeśli `user_id` jest równy `auth.uid()` LUB `user_id` jest `NULL` (systemowe).
    -   `auth.uid() = user_id OR user_id IS NULL`
-   **INSERT:** Dozwolone tylko, jeśli `user_id` równa się `auth.uid()`. Użytkownik nie może tworzyć ćwiczeń systemowych.
-   **UPDATE:** Dozwolone tylko dla własnych ćwiczeń (`user_id = auth.uid()`).
-   **DELETE:** Dozwolone tylko dla własnych ćwiczeń (`user_id = auth.uid()`).

### `workouts`
-   **ALL (SELECT, INSERT, UPDATE, DELETE):** Dozwolone tylko dla właściciela.
    -   `auth.uid() = user_id`

### `workout_sets`
-   **SELECT:** Użytkownik widzi serie należące do jego treningów.
    -   `workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())`
-   **INSERT/UPDATE/DELETE:** Użytkownik może modyfikować serie tylko w swoich treningach.
    -   To samo sprawdzenie co przy SELECT (przez `workout_id`).

## 5. Dodatkowe Uwagi

1.  **Typy Wyliczeniowe (ENUM):**
    -   Należy utworzyć typ: `CREATE TYPE exercise_type AS ENUM ('strength', 'cardio');`

2.  **Obsługa czasu (Time):**
    -   Zdecydowano się na typ `INTEGER` dla kolumny `time` w tabeli `workout_sets`. Wartość będzie przechowywana w **sekundach**. Konwersja na minuty nastąpi w warstwie aplikacji (Frontend). Zapewnia to większą elastyczność i łatwość obliczeń (np. tempo).

3.  **Wartości Wyliczane (Calculated Columns):**
    -   Kolumny `calculated_1rm` i `calculated_volume` są przechowywane w bazie ("Store"), a nie tylko obliczane w locie ("Compute"). Mimo że frontend dokonuje obliczeń, zapisanie ich pozwala na bardzo szybkie generowanie wykresów historycznych bez konieczności przeliczania tysięcy rekordów przy każdym zapytaniu analitycznym.

4.  **Extensions:**
    -   Zostanie wykorzystane rozszerzenie `moddatetime` (dostępne w Supabase) do automatycznej aktualizacji kolumny `updated_at` przy każdej zmianie rekordu.
