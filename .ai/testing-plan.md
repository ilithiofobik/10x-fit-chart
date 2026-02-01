# Plan Testów - 10xFitChart

## 1. Wprowadzenie i Cele Testowania

### 1.1. Kontekst Projektu

10xFitChart to aplikacja webowa typu desktop-first do śledzenia postępów treningowych z naciskiem na szybkie wprowadzanie danych i głęboką analizę historyczną. Aplikacja obsługuje dwa typy aktywności: trening siłowy (metryki: objętość, 1RM) oraz cardio (metryka: prędkość).

### 1.2. Cele Testowania

- **Zapewnienie jakości**: Weryfikacja, że wszystkie wymagania funkcjonalne z PRD są zaimplementowane poprawnie
- **Bezpieczeństwo danych**: Walidacja Row Level Security (RLS) i polityk dostępu w Supabase
- **Wydajność UX**: Potwierdzenie spełnienia metryk sukcesu (wprowadzanie treningu < 3 min, onboarding < 60s)
- **Poprawność obliczeń**: Weryfikacja kalkulacji 1RM, Volume, prędkości cardio
- **Stabilność**: Wykrycie regresji przy przyszłych zmianach kodu
- **Dostępność**: Walidacja nawigacji klawiaturą i standardów WCAG 2.1 AA

### 1.3. Podejście do Testowania

Plan przyjmuje podejście **piramidy testowej**:

- Fundament: Testy jednostkowe (60%) - logika biznesowa, kalkulacje, reducery
- Środek: Testy integracyjne (30%) - serwisy + Supabase, endpointy API
- Szczyt: Testy E2E (10%) - krytyczne ścieżki użytkownika

---

## 2. Zakres Testów

### 2.1. W Zakresie (In-Scope)

#### 2.1.1. Funkcjonalności Biznesowe

- Uwierzytelnianie: rejestracja, logowanie, wylogowanie, usuwanie konta
- Zarządzanie ćwiczeniami: CRUD, soft delete, walidacja unikalności nazw
- Logger treningowy: tworzenie, backdating, kopiowanie ostatniego treningu
- Historia: listowanie, filtrowanie, edycja, usuwanie treningów
- Analityka: dashboard, statystyki, wykresy postępów
- Walidacja typów danych: rozróżnienie strength/cardio, blokada niewłaściwych pól

#### 2.1.2. Komponenty Techniczne

- Kalkulacje matematyczne: 1RM (Brzycki), Volume, prędkość cardio
- Row Level Security: izolacja danych użytkowników
- Middleware: ochrona tras `/app/*`, przekierowania
- Reducery React: zarządzanie stanem Loggera i Editora
- Formatery: poprawne wyświetlanie dat, liczb (polskie locale)
- Walidacja Zod: schematy dla API requests/responses

#### 2.1.3. Aspekty UX

- Nawigacja klawiaturą: Tab order, Enter w polach formularza
- Responsywność: działanie na desktopie (priorytet), tablecie
- Komunikaty błędów: Toast notifications, walidacja frontendowa
- Loading states: Skeleton UI, spinners

### 2.2. Poza Zakresem (Out-of-Scope)

- Dedykowana aplikacja mobilna (PWA)
- Import/Eksport danych (CSV, JSON)
- Integracje z zewnętrznymi API (Garmin, Strava)
- Flow resetowania hasła
- Testy wydajnościowe pod dużym obciążeniem (load testing)
- Testy penetracyjne (security audit) - zakładamy zaufanie do Supabase RLS

---

## 3. Typy Testów

### 3.1. Testy Jednostkowe (Unit Tests)

#### 3.1.1. Framework i Narzędzia

- **Test Runner**: Vitest 2.x
- **Assertions**: wbudowane w Vitest
- **Mocking**: vi.fn(), vi.mock() z Vitest
- **Coverage**: vitest --coverage (minimum 80% dla services, utils, hooks)

#### 3.1.2. Cele

- Testowanie izolowanych funkcji i modułów
- Weryfikacja logiki biznesowej bez zależności zewnętrznych
- Szybkie wykonanie (< 10s dla całego suite'a)

#### 3.1.3. Obszary Objęte Testami Jednostkowymi

**A. Kalkulacje (`src/lib/services/workout.service.ts`)**

- `calculate1RM()`:
  - Przypadek reps=1 → zwraca weight bez modyfikacji
  - Formuła Brzycki dla reps > 1
  - Edge cases: reps=0, weight ujemny
- `calculateVolume()`:
  - Prosty wzór weight \* reps
  - Zaokrąglenie do 2 miejsc po przecinku

**B. Formatery (`src/lib/utils/formatters.ts`)**

- `formatNumber()`: polskie locale, separatory tysięcy
- `formatDate()`: format DD.MM.YYYY
- `formatVolume()`: dodanie jednostki "kg"
- `formatSpeed()`: konwersja km/h, min/km

**C. Walidatory (`src/lib/utils/auth-guards.ts`)**

- `isAuthenticated()`: sprawdzanie locals.user
- `requireAuth()`: rzucanie błędu gdy brak auth

**D. Reducery React (`src/lib/hooks/workoutLoggerReducer.ts`, `workoutEditorReducer.ts`)**

- Actions:
  - `SET_DATE`: poprawna aktualizacja daty
  - `ADD_EXERCISE`: dodanie ćwiczenia z pustą listą sets
  - `REMOVE_EXERCISE`: usunięcie z zachowaniem kolejności
  - `ADD_SET`: dodanie serii z sort_order
  - `UPDATE_SET`: aktualizacja konkretnego pola
  - `LOAD_TEMPLATE`: załadowanie struktury z ostatniego treningu
  - `RESET_STATE`: czyszczenie do stanu początkowego
- State mutations: immutability, brak side-effects

**E. Serwisy - Logika Biznesowa**

**exercise.service.ts**:

- `listExercises()`:
  - Filtrowanie po type (strength/cardio)
  - Wykluczanie zarchiwizowanych (is_archived=true)
  - Zwracanie globalnych (user_id=null) + user's
- `createExercise()`:
  - Walidacja unikalności nazwy per user
  - Rzucanie ExerciseAlreadyExistsError
- `archiveExercise()`:
  - Soft delete: is_archived=true
  - Zabezpieczenie przed archiwizacją globalnych

**workout.service.ts**:

- `createWorkout()`:
  - Walidacja exercise_id (exists, accessible)
  - Walidacja type mismatch (strength z distance, cardio z weight)
  - Transakcyjność: rollback workout przy błędzie sets
- `getLatestWorkout()`:
  - Sortowanie date DESC, created_at DESC
  - Zwracanie null dla nowego usera
- `updateWorkout()`:
  - Weryfikacja ownership (user_id)
  - Delete old sets + insert new (atomic)

**analytics.service.ts**:

- `getDashboardSummary()`:
  - Poprawne obliczanie zakresu dat (months back)
  - Agregacje: total_workouts, total_sets, total_volume, unique_exercises
  - Limit 5 dla recent_workouts

**F. Hooks React (`src/lib/hooks/useDashboard.ts`, `useWorkoutLogger.ts`)**

- `useDashboard`:
  - Walidacja initialMonths (fallback do 3)
  - Fetch data on mount i przy zmianie selectedMonths
  - Error handling: retry, network errors
  - Loading states
- `useWorkoutLogger`, `useWorkoutEditor`:
  - Integracja z reducerami
  - LocalStorage synchronization (mock)
  - API calls (mock fetch)

#### 3.1.4. Przykładowa Struktura Testu

```typescript
// src/lib/services/workout.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculate1RM, calculateVolume } from "./workout.service";

describe("workout.service - Calculations", () => {
  describe("calculate1RM", () => {
    it("powinien zwrócić weight gdy reps=1", () => {
      expect(calculate1RM(100, 1)).toBe(100);
    });

    it("powinien obliczyć 1RM wzorem Brzycki dla reps > 1", () => {
      const result = calculate1RM(100, 8);
      expect(result).toBeCloseTo(125.0, 1);
    });

    it("powinien rzucić błąd dla reps <= 0", () => {
      expect(() => calculate1RM(100, 0)).toThrow();
    });
  });

  describe("calculateVolume", () => {
    it("powinien obliczyć volume jako weight * reps", () => {
      expect(calculateVolume(100, 8)).toBe(800);
    });

    it("powinien zaokrąglić do 2 miejsc po przecinku", () => {
      expect(calculateVolume(22.5, 10)).toBe(225.0);
    });
  });
});
```

---

### 3.2. Testy Integracyjne (Integration Tests)

#### 3.2.1. Framework i Narzędzia

- **Test Runner**: Vitest
- **HTTP Mocking**: MSW (Mock Service Worker) lub vitest-fetch-mock
- **Supabase Mocking**: Supabase Test Helpers lub mock SupabaseClient
- **Database**: Supabase Local Development (opcjonalnie Docker)

#### 3.2.2. Cele

- Weryfikacja współpracy między warstwami (serwis ↔ Supabase)
- Testowanie endpointów API z rzeczywistymi schematami Zod
- Walidacja RLS policies w izolowanym środowisku

#### 3.2.3. Obszary Objęte Testami Integracyjnymi

**A. Endpointy API**

**POST /api/auth/register**:

- Sukces: utworzenie użytkownika, zwrot 201, automatyczne logowanie
- Błąd: email już istnieje → 409
- Walidacja: nieprawidłowy format email → 400

**POST /api/auth/login**:

- Sukces: poprawne dane → 200, cookie sesji
- Błąd: nieprawidłowe hasło → 401

**DELETE /api/auth/delete-account**:

- Sukces: kaskadowe usunięcie workouts, exercises, user → 200
- Weryfikacja: dane faktycznie usunięte z DB

**GET /api/exercises**:

- Zwraca globalne + user's exercises
- Filtrowanie po type=strength
- Wykluczanie is_archived=true (domyślnie)

**POST /api/exercises**:

- Sukces: utworzenie custom exercise → 201
- Błąd: duplikat nazwy → 409
- Walidacja: brak type → 400

**PUT /api/exercises/:id**:

- Sukces: zmiana nazwy → 200
- Błąd: próba edycji globalnego (user_id=null) → 403
- Błąd: nie należy do usera → 404

**DELETE /api/exercises/:id**:

- Sukces: soft delete (is_archived=true) → 200
- Historyczne treningi nadal odczytują nazwę

**GET /api/workouts**:

- Paginacja: limit, offset, has_more
- Filtrowanie: start_date, end_date
- Sortowanie: order=desc (domyślnie)
- Agregacje: exercise_count, set_count

**POST /api/workouts**:

- Sukces: utworzenie workout + sets w transakcji → 201
- Błąd: exercise_id nie istnieje → 404
- Błąd: type mismatch (strength z distance) → 400
- Kalkulacje: calculated_1rm, calculated_volume zapisane

**GET /api/workouts/:id**:

- Sukces: szczegóły workout + sets z exercise_name/type → 200
- Błąd: workout innego usera → 404 (RLS)

**PUT /api/workouts/:id**:

- Sukces: aktualizacja date, notes, sets → 200
- Atomowość: stare sets usunięte, nowe wstawione
- Błąd: nie należy do usera → 404

**DELETE /api/workouts/:id**:

- Sukces: hard delete workout + kaskada sets → 200
- Błąd: nie należy do usera → 404

**GET /api/workouts/latest**:

- Sukces: zwrot ostatniego treningu → 200
- Nowy user: brak treningów → 200 null

**GET /api/analytics/dashboard**:

- Query param: months (1, 3, 6, 12)
- Zwraca: summary (4 statystyki), recent_workouts (5 ostatnich)
- Filtrowanie danych: tylko z ostatnich X miesięcy

**B. Serwisy + Supabase Client**

- Wszystkie funkcje z `exercise.service.ts`, `workout.service.ts`, `analytics.service.ts` z realnym/mockowym klientem Supabase
- Weryfikacja query builders: `.select()`, `.insert()`, `.update()`, `.delete()`, `.eq()`, `.order()`
- Testowanie RLS: próba dostępu do danych innego usera (powinno zwrócić 0 wyników)

#### 3.2.4. Przykładowa Struktura Testu

```typescript
// src/pages/api/workouts/index.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestContext } from "@/test-utils/supabase-test";

describe("POST /api/workouts", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  it("powinien utworzyć workout z setami strength", async () => {
    const payload = {
      date: "2026-02-01",
      notes: "Test workout",
      sets: [{ exercise_id: "bench-press-id", sort_order: 1, weight: 100, reps: 8 }],
    };

    const response = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // mock auth context
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.sets[0].calculated_1rm).toBeCloseTo(125, 1);
    expect(data.sets[0].calculated_volume).toBe(800);
  });

  it("powinien zwrócić 400 przy type mismatch", async () => {
    const payload = {
      date: "2026-02-01",
      sets: [
        { exercise_id: "bench-press-id", sort_order: 1, distance: 5.0, time: 30 }, // strength z cardio polami
      ],
    };

    const response = await fetch("/api/workouts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error", /cannot have distance/);
  });
});
```

---

### 3.3. Testy Komponentów React (Component Tests)

#### 3.3.1. Framework i Narzędzia

- **Testing Library**: @testing-library/react
- **User Events**: @testing-library/user-event
- **Environment**: jsdom (Vitest)
- **Mocking**: vi.mock() dla Context, fetch

#### 3.3.2. Cele

- Weryfikacja renderowania UI w zależności od props/state
- Testowanie interakcji użytkownika (kliknięcia, wpisywanie)
- Walidacja dostępności (role, aria-labels)

#### 3.3.3. Obszary Objęte Testami Komponentów

**A. Komponenty Auth**

- `LoginForm`:
  - Walidacja: puste pola → wyświetlenie błędu
  - Submit: wywołanie POST /api/auth/login
  - Sukces: przekierowanie na /app/dashboard
  - Błąd: wyświetlenie Toast z komunikatem
- `RegisterForm`: analogicznie
- `DeleteAccountButton`:
  - Kliknięcie otwiera AlertDialog
  - Potwierdzenie wywołuje DELETE /api/auth/delete-account
  - Anulowanie zamyka dialog

**B. Komponenty Dashboard**

- `Dashboard`:
  - Loading state: wyświetlenie Skeleton
  - Success: renderowanie StatsGrid, RecentWorkoutsList, ProgressChartWidget
  - Error: wyświetlenie komunikatu z przyciskiem Retry
- `StatCard`:
  - Props: title, value, unit, trend → poprawne wyświetlenie
- `ProgressChart`:
  - Props: data, type=strength → wykres z 1RM na osi Y
  - Props: data, type=cardio → wykres z prędkością

**C. Komponenty Exercises**

- `ExerciseManager`:
  - Fetch exercises on mount
  - Search: filtrowanie po nazwie (lokalnie)
  - Filter: type=strength → tylko siłowe
  - Kliknięcie "Dodaj" → otwarcie ExerciseFormDialog
- `ExerciseFormDialog`:
  - Tryb create: puste pola, submit → POST /api/exercises
  - Tryb edit: wypełnione pola, submit → PUT /api/exercises/:id
  - Walidacja: nazwa wymagana
- `ExerciseCard`:
  - Wyświetlenie nazwy, typu, badge (system/user)
  - Dropdown menu: Edit, Archive
  - Kliknięcie Archive → ConfirmArchiveDialog

**D. Komponenty Workout Logger**

- `WorkoutLoggerProvider`:
  - Inicjalizacja: pusty state lub z localStorage
  - Context dostępny dla dzieci
- `ExerciseCombobox`:
  - Filtrowanie opcji po wpisanej frazie
  - Stan "No results" → przycisk "Utwórz ćwiczenie"
  - Wybór ćwiczenia → callback onSelect
- `SetRow`:
  - Props type=strength: renderowanie input weight, reps
  - Props type=cardio: renderowanie input distance, time
  - Enter w ostatnim polu → callback onAddSet
  - Tab order: weight → reps → przycisk "+"
- `QuickActions`:
  - Kliknięcie "Kopiuj ostatni" → fetch /api/workouts/latest → dispatch LOAD_TEMPLATE

**E. Komponenty History**

- `HistoryList`:
  - Fetch workouts on mount z paginacją
  - Infinite scroll: kliknięcie "Załaduj więcej" → zwiększenie offset
  - Pusta lista: wyświetlenie EmptyState
- `WorkoutSummaryCard`:
  - Wyświetlenie daty, exercise_count, set_count
  - Kliknięcie → przekierowanie na /app/history/:id

**F. Komponenty Layout**

- `AppHeader`:
  - Desktop: wyświetlenie linków nawigacyjnych
  - Mobile: hamburger menu → MobileMenu
  - UserMenu: dropdown z opcjami Profil, Wyloguj
- `UserMenu`:
  - Kliknięcie Wyloguj → POST /api/auth/logout → przekierowanie na /

#### 3.3.4. Przykładowa Struktura Testu

```typescript
// src/components/auth/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('powinien wyświetlić błąd walidacji dla pustego email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /zaloguj/i });
    await user.click(submitButton);

    expect(screen.getByText(/nieprawidłowy format email/i)).toBeInTheDocument();
  });

  it('powinien wywołać POST /api/auth/login przy submit', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/hasło/i), 'password123');
    await user.click(screen.getByRole('button', { name: /zaloguj/i }));

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    }));
  });
});
```

---

### 3.4. Testy End-to-End (E2E Tests)

#### 3.4.1. Framework i Narzędzia

- **Test Runner**: Playwright lub Cypress
- **Browser**: Chromium, Firefox (Playwright)
- **Environment**: Local dev server lub staging

#### 3.4.2. Cele

- Weryfikacja krytycznych ścieżek użytkownika w rzeczywistej przeglądarce
- Testowanie integracji frontend ↔ backend ↔ baza danych
- Walidacja nawigacji, sesji, lokalStorage

#### 3.4.3. Scenariusze E2E

**Scenariusz 1: Rejestracja i Pierwszy Trening (US-001, US-006)**

1. Otwarcie `/`
2. Kliknięcie "Zarejestruj się"
3. Wypełnienie formularza: email, hasło
4. Submit → weryfikacja przekierowania na `/app/dashboard`
5. Kliknięcie "Loguj Trening"
6. Wybór daty (dzisiaj)
7. Combobox: wyszukanie "Bench Press"
8. Wpisanie: weight=80, reps=10
9. Enter → dodanie nowej serii
10. Wpisanie: weight=80, reps=9
11. Kliknięcie "Zakończ trening"
12. Weryfikacja: Toast "Zapisano", przekierowanie na Dashboard
13. Sprawdzenie: Dashboard pokazuje 1 trening, 2 serie

**Scenariusz 2: Kopiowanie Ostatniego Treningu (US-009)**

1. Logowanie jako istniejący user
2. Przejście do `/app/log`
3. Kliknięcie "Kopiuj ostatni trening"
4. Weryfikacja: formularz wypełniony danymi z ostatniego treningu
5. Modyfikacja: zmiana weight w pierwszej serii
6. Zapis
7. Weryfikacja: nowy trening w historii

**Scenariusz 3: Nawigacja Klawiaturą (US-010)**

1. Przejście do `/app/log`
2. Focus w polu weight (automatycznie)
3. Wpisanie: 100
4. Naciśnięcie Tab → focus w polu reps
5. Wpisanie: 8
6. Naciśnięcie Enter → dodanie nowej serii, focus w weight następnej
7. Weryfikacja: brak focus trap, logiczny tab order

**Scenariusz 4: Edycja Historycznego Treningu (US-012)**

1. Przejście do `/app/history`
2. Kliknięcie na trening sprzed tygodnia
3. Zmiana weight w drugiej serii
4. Kliknięcie "Zapisz"
5. Powrót do historii
6. Weryfikacja: zmienione dane widoczne w podsumowaniu

**Scenariusz 5: Archiwizacja Ćwiczenia (US-005)**

1. Przejście do `/app/exercises`
2. Wyszukanie własnego ćwiczenia "Cable Flyes"
3. Kliknięcie menu → "Archiwizuj"
4. Potwierdzenie w dialogu
5. Weryfikacja: ćwiczenie znika z listy
6. Przejście do historii → trening z "Cable Flyes" nadal wyświetla nazwę

**Scenariusz 6: Usunięcie Konta (US-003)**

1. Logowanie
2. Przejście do `/app/profile`
3. Kliknięcie "Usuń konto"
4. Potwierdzenie w AlertDialog
5. Weryfikacja: przekierowanie na `/`, brak sesji
6. Próba logowania → komunikat "User not found"

**Scenariusz 7: Dashboard - Filtrowanie Okresu**

1. Logowanie jako user z historią > 6 miesięcy
2. Dashboard: domyślnie 3 miesiące
3. Zmiana selectora na "6 miesięcy"
4. Weryfikacja: statystyki i wykres zaktualizowane
5. Sprawdzenie: liczba treningów się zwiększyła

#### 3.4.4. Przykładowa Struktura Testu

```typescript
// e2e/register-and-log-workout.spec.ts
import { test, expect } from "@playwright/test";

test("user powinien zarejestrować się i zalogować pierwszy trening", async ({ page }) => {
  await page.goto("/");

  // Rejestracja
  await page.click("text=Zarejestruj się");
  await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
  await page.fill('input[type="password"]', "SecurePassword123");
  await page.click('button:has-text("Utwórz konto")');

  // Weryfikacja przekierowania na Dashboard
  await expect(page).toHaveURL("/app/dashboard");

  // Przejście do Loggera
  await page.click("text=Loguj Trening");
  await expect(page).toHaveURL("/app/log");

  // Wybór ćwiczenia
  await page.click('button:has-text("Wybierz ćwiczenie")');
  await page.fill('input[placeholder*="Szukaj"]', "Bench Press");
  await page.click("text=Bench Press");

  // Wprowadzenie serii 1
  await page.fill('input[name="weight"]', "80");
  await page.press('input[name="weight"]', "Tab");
  await page.fill('input[name="reps"]', "10");
  await page.press('input[name="reps"]', "Enter");

  // Seria 2 (automatycznie dodana)
  await page.fill('input[name="weight"]:visible', "80");
  await page.press('input[name="weight"]:visible', "Tab");
  await page.fill('input[name="reps"]:visible', "9");

  // Zapis treningu
  await page.click('button:has-text("Zakończ trening")');

  // Weryfikacja Toast
  await expect(page.locator("text=Trening zapisany")).toBeVisible();

  // Weryfikacja Dashboard
  await expect(page).toHaveURL("/app/dashboard");
  await expect(page.locator("text=1").first()).toBeVisible(); // total_workouts
  await expect(page.locator("text=2")).toBeVisible(); // total_sets
});
```

---

### 3.5. Testy Dostępności (Accessibility Tests)

#### 3.5.1. Narzędzia

- **axe-core**: Automatyczne sprawdzanie WCAG
- **Lighthouse**: Audit dostępności w Chrome DevTools
- **Manual testing**: Nawigacja klawiaturą, screen reader (NVDA/VoiceOver)

#### 3.5.2. Kryteria

- Kontrast kolorów: minimum 4.5:1 (WCAG AA)
- Semantyczne HTML: użycie `<button>`, `<nav>`, `<main>`
- ARIA labels: dla ikon bez tekstu
- Focus indicators: widoczne obramowanie przy Tab
- Keyboard navigation: wszystkie interaktywne elementy dostępne z klawiatury

#### 3.5.3. Obszary Objęte

- Formularze: logowanie, rejestracja, workout logger
- Przyciski: wyraźne focus, aria-label dla ikon
- Dialogi: focus trap, Escape zamyka
- Combobox: aria-expanded, aria-owns, role="combobox"
- Tabela serii: headers, accessible names

#### 3.5.4. Przykładowy Test

```typescript
// src/components/auth/LoginForm.a11y.test.tsx
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoginForm } from './LoginForm';

expect.extend(toHaveNoViolations);

describe('LoginForm - Accessibility', () => {
  it('nie powinien mieć naruszeń WCAG', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

### 3.6. Testy Wydajnościowe (Performance Tests)

#### 3.6.1. Narzędzia

- **Lighthouse CI**: Continuous performance monitoring
- **Chrome DevTools**: Performance profiler
- **Vitest**: Benchmark dla krytycznych funkcji

#### 3.6.2. Cele

- Weryfikacja metryk UX z PRD (Time to Track < 3 min, Time to First Value < 60s)
- Optymalizacja renderowania (React.memo, useMemo)
- Monitoring bundle size

#### 3.6.3. Metryki

- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle size**: < 300KB (initial load)

#### 3.6.4. Obszary Objęte

- Dashboard: lazy loading dla wykresów
- Logger: debounce dla localStorage sync
- History: virtual scrolling dla długich list

#### 3.6.5. Przykładowy Benchmark

```typescript
// src/lib/services/workout.service.bench.ts
import { bench, describe } from "vitest";
import { calculate1RM } from "./workout.service";

describe("workout.service - Performance", () => {
  bench("calculate1RM dla 1000 wywołań", () => {
    for (let i = 0; i < 1000; i++) {
      calculate1RM(100, 8);
    }
  });
});
```

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Rejestracja Użytkownika (US-001)

| ID     | Scenariusz                      | Kroki                                                                                                                     | Oczekiwany Rezultat                                                         | Priorytet |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------- |
| TC-001 | Rejestracja z poprawnymi danymi | 1. Wejdź na `/register`<br>2. Wpisz email: test@example.com<br>3. Wpisz hasło: SecurePass123<br>4. Kliknij "Utwórz konto" | Status: 201<br>Przekierowanie na `/app/dashboard`<br>Cookie sesji ustawione | Wysoki    |
| TC-002 | Rejestracja z istniejącym email | 1. Wejdź na `/register`<br>2. Wpisz email już w bazie<br>3. Submit                                                        | Status: 409<br>Toast: "Email już istnieje"                                  | Wysoki    |
| TC-003 | Walidacja - nieprawidłowy email | 1. Wpisz email: "invalid"<br>2. Submit                                                                                    | Status: 400<br>Błąd frontendowy: "Nieprawidłowy format"                     | Średni    |
| TC-004 | Walidacja - hasło za krótkie    | 1. Wpisz hasło < 8 znaków<br>2. Submit                                                                                    | Błąd walidacji Zod: "Min 8 znaków"                                          | Średni    |

### 4.2. Dodawanie Własnego Ćwiczenia (US-004)

| ID     | Scenariusz                 | Kroki                                                                                               | Oczekiwany Rezultat                                         | Priorytet |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------- |
| TC-010 | Dodanie ćwiczenia siłowego | 1. `/app/exercises`<br>2. Kliknij "Dodaj"<br>3. Nazwa: "Cable Flyes"<br>4. Typ: Siłowe<br>5. Submit | Status: 201<br>Ćwiczenie w liście<br>`is_system: false`     | Wysoki    |
| TC-011 | Duplikat nazwy             | 1. Dodaj "Cable Flyes"<br>2. Próba dodania ponownie                                                 | Status: 409<br>Toast: "Ćwiczenie o tej nazwie już istnieje" | Wysoki    |
| TC-012 | Edycja nazwy               | 1. Wybierz ćwiczenie<br>2. Edit → zmień nazwę<br>3. Submit                                          | Status: 200<br>Nazwa zaktualizowana w liście i historii     | Średni    |
| TC-013 | Próba edycji globalnego    | 1. Wybierz exercise z `user_id=null`<br>2. Kliknij Edit                                             | Przycisk Edit nieaktywny lub brak w menu                    | Średni    |

### 4.3. Logowanie Treningu Siłowego (US-007)

| ID     | Scenariusz                          | Kroki                                                                                                                                                 | Oczekiwany Rezultat                                                              | Priorytet |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------- |
| TC-020 | Podstawowy trening 2x ćwiczenie     | 1. `/app/log`<br>2. Wybierz "Bench Press"<br>3. Seria 1: 100kg x 8<br>4. Seria 2: 100kg x 7<br>5. Dodaj "Squat"<br>6. Seria 1: 120kg x 5<br>7. Zapisz | Status: 201<br>`calculated_1rm` dla każdej serii<br>`calculated_volume` poprawne | Krytyczny |
| TC-021 | Backdating - trening z przeszłości  | 1. Zmień datę na 2026-01-25<br>2. Dodaj ćwiczenie i serie<br>3. Zapisz                                                                                | Trening z datą 2026-01-25<br>Sortowanie w historii poprawne                      | Wysoki    |
| TC-022 | Type mismatch - strength z distance | 1. Wybierz "Bench Press" (strength)<br>2. Wypełnij distance, time (pola cardio)<br>3. Submit                                                          | Status: 400<br>Błąd: "Strength exercise cannot have distance"                    | Wysoki    |
| TC-023 | Puste serie                         | 1. Dodaj ćwiczenie bez żadnych serii<br>2. Submit                                                                                                     | Walidacja: "Dodaj przynajmniej jedną serię"                                      | Średni    |

### 4.4. Logowanie Treningu Cardio (US-008)

| ID     | Scenariusz                      | Kroki                                                                  | Oczekiwany Rezultat                                         | Priorytet |
| ------ | ------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- | --------- |
| TC-030 | Trening biegowy                 | 1. Wybierz "Running" (cardio)<br>2. Seria 1: 5.0km, 30min<br>3. Zapisz | Status: 201<br>Prędkość: 10 km/h<br>`weight`, `reps` = null | Wysoki    |
| TC-031 | Type mismatch - cardio z weight | 1. Wybierz "Running" (cardio)<br>2. Wypełnij weight, reps<br>3. Submit | Status: 400<br>Błąd: "Cardio exercise cannot have weight"   | Wysoki    |
| TC-032 | Dystans dziesiętny              | 1. Seria: 5.75km, 35min<br>2. Zapisz                                   | Akceptacja: 2 miejsca po przecinku<br>Prędkość: ~9.86 km/h  | Średni    |

### 4.5. Kopiowanie Ostatniego Treningu (US-009)

| ID     | Scenariusz                       | Kroki                                                                                                         | Oczekiwany Rezultat                                                                                        | Priorytet |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------- |
| TC-040 | Kopiowanie istniejącego treningu | 1. `/app/log`<br>2. Kliknij "Kopiuj ostatni"<br>3. Zweryfikuj wypełnienie<br>4. Modyfikuj ciężar<br>5. Zapisz | Formularz wypełniony strukturą ostatniego<br>Data ustawiona na dzisiaj (nie template)<br>Nowy workout w DB | Krytyczny |
| TC-041 | Brak historii - nowy user        | 1. Nowy user<br>2. `/app/log`<br>3. Kliknij "Kopiuj ostatni"                                                  | GET /api/workouts/latest → null<br>Przycisk nieaktywny lub komunikat                                       | Średni    |

### 4.6. Archiwizacja Ćwiczenia (US-005)

| ID     | Scenariusz                     | Kroki                                                                                       | Oczekiwany Rezultat                                                  | Priorytet |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------- |
| TC-050 | Soft delete ćwiczenia          | 1. `/app/exercises`<br>2. Wybierz user's exercise<br>3. Menu → Archiwizuj<br>4. Potwierdź   | Status: 200<br>`is_archived: true`<br>Znika z listy (default filter) | Wysoki    |
| TC-051 | Historyczne treningi zachowane | 1. Archiwizuj ćwiczenie użyte w przeszłości<br>2. `/app/history`<br>3. Otwórz stary trening | Nazwa ćwiczenia nadal widoczna<br>Brak błędów 404                    | Krytyczny |
| TC-052 | Próba archiwizacji globalnego  | 1. Wybierz exercise z `user_id=null`<br>2. Spróbuj archiwizować                             | Status: 403 lub brak opcji w UI                                      | Średni    |

### 4.7. Edycja Historycznego Treningu (US-012)

| ID     | Scenariusz                     | Kroki                                                                              | Oczekiwany Rezultat                                                                            | Priorytet |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------- |
| TC-060 | Korekta ciężaru                | 1. `/app/history`<br>2. Wybierz trening<br>3. Zmień weight: 100 → 105<br>4. Zapisz | Status: 200<br>Zaktualizowany `calculated_1rm`, `volume`<br>Dashboard: wykres z nową wartością | Wysoki    |
| TC-061 | Zmiana daty                    | 1. Edytuj trening<br>2. Zmień date: 2026-01-20 → 2026-01-18<br>3. Zapisz           | Trening przesunięty w historii<br>Sortowanie poprawne                                          | Średni    |
| TC-062 | Usunięcie ćwiczenia z treningu | 1. Edytuj trening<br>2. Usuń jedno z 3 ćwiczeń<br>3. Zapisz                        | Stare sets usunięte<br>Nowe sets: tylko 2 ćwiczenia                                            | Średni    |

### 4.8. Dashboard - Analityka (US-011)

| ID     | Scenariusz                  | Kroki                                                                       | Oczekiwany Rezultat                                                                                                                                                 | Priorytet |
| ------ | --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| TC-070 | Domyślny widok (3 miesiące) | 1. Zaloguj się<br>2. `/app/dashboard`                                       | GET /api/analytics/dashboard?months=3<br>Statystyki: total_workouts, total_sets, total_volume, unique_exercises<br>Recent: 5 ostatnich<br>Wykres: dane z 3 miesięcy | Krytyczny |
| TC-071 | Zmiana okresu na 6 miesięcy | 1. Dashboard<br>2. Zmień select na "6 miesięcy"<br>3. Poczekaj na fetch     | GET /api/analytics/dashboard?months=6<br>Statystyki zaktualizowane<br>Wykres: więcej punktów                                                                        | Wysoki    |
| TC-072 | Pusty stan - nowy user      | 1. Nowy user<br>2. Dashboard                                                | total_workouts: 0<br>EmptyState: "Zaloguj pierwszy trening"                                                                                                         | Średni    |
| TC-073 | Wykres siłowy - 1RM         | 1. Dashboard<br>2. Widget wykresu: wybierz "Bench Press"<br>3. Metryka: 1RM | Oś Y: wartości 1RM (kg)<br>Tooltip: data + wartość                                                                                                                  | Wysoki    |

### 4.9. Usuwanie Konta (US-003)

| ID     | Scenariusz                 | Kroki                                                                      | Oczekiwany Rezultat                                                                                                                         | Priorytet |
| ------ | -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| TC-080 | Kaskadowe usunięcie danych | 1. `/app/profile`<br>2. Kliknij "Usuń konto"<br>3. Potwierdź w AlertDialog | DELETE /api/auth/delete-account<br>Usunięte: auth.users, workouts, workout_sets, exercises (user's)<br>Wylogowanie<br>Przekierowanie na `/` | Krytyczny |
| TC-081 | Anulowanie usuwania        | 1. `/app/profile`<br>2. Kliknij "Usuń konto"<br>3. Anuluj w dialogu        | Dialog zamknięty<br>Konto nietknięte                                                                                                        | Niski     |

### 4.10. Nawigacja Klawiaturą (US-010)

| ID     | Scenariusz              | Kroki                                                                                                                              | Oczekiwany Rezultat                                             | Priorytet |
| ------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------- |
| TC-090 | Tab order w loggerze    | 1. `/app/log`<br>2. Dodaj ćwiczenie strength<br>3. Focus w weight (auto)<br>4. Tab → focus w reps<br>5. Tab → focus w przycisk "+" | Logiczny tab order<br>Brak przeskoków                           | Wysoki    |
| TC-091 | Enter tworzy nową serię | 1. Logger, seria 1<br>2. Wypełnij weight, reps<br>3. Enter w polu reps                                                             | Nowa seria dodana<br>Focus w weight nowej serii                 | Krytyczny |
| TC-092 | Focus trap w dialogu    | 1. Otwórz ExerciseFormDialog<br>2. Tab kilkakrotnie                                                                                | Focus krąży: pole nazwa → select type → Cancel → Submit → nazwa | Średni    |

---

## 5. Środowisko Testowe

### 5.1. Środowiska

| Środowisko     | Cel                                 | URL                               | Baza Danych                                    | Auth                     |
| -------------- | ----------------------------------- | --------------------------------- | ---------------------------------------------- | ------------------------ |
| **Local**      | Development, unit/integration tests | `http://localhost:4321`           | Supabase Local (Docker) lub Supabase Cloud Dev | Testowy projekt Supabase |
| **Staging**    | Pre-production, E2E tests           | `https://staging.10xfitchart.app` | Supabase Cloud Staging                         | Izolowane od produkcji   |
| **Production** | Smoke tests                         | `https://10xfitchart.app`         | Supabase Cloud Production                      | Rzeczywiste konta        |

### 5.2. Konfiguracja Local

#### 5.2.1. Wymagania

- Node.js: v20.x (zgodnie z `.nvmrc`)
- npm: v10.x
- Docker (opcjonalnie): dla Supabase Local
- Git

#### 5.2.2. Instalacja Zależności

```bash
# Instalacja pakietów aplikacji
npm install

# Instalacja Vitest (jeśli nie ma w package.json)
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/user-event jsdom

# Instalacja Playwright dla E2E
npm install -D @playwright/test
npx playwright install
```

#### 5.2.3. Konfiguracja Vitest

Utwórz plik `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-utils/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test-utils/", "**/*.d.ts", "**/*.config.*", "**/dist/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

#### 5.2.4. Setup File dla Testów

Utwórz `src/test-utils/setup.ts`:

```typescript
import "@testing-library/jest-dom";
import { beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup po każdym teście
afterEach(() => {
  cleanup();
});

// Mock globalnego fetch (jeśli nie używamy MSW)
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;
```

#### 5.2.5. Supabase Test Helpers

Utwórz `src/test-utils/supabase-test.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

const SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test-key";

export function createTestSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function createTestUser() {
  const client = createTestSupabaseClient();
  const email = `test-${Date.now()}@example.com`;
  const password = "TestPassword123";

  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;

  return { user: data.user!, email, password };
}

export async function cleanupTestData(userId: string) {
  const client = createTestSupabaseClient();
  // Kaskadowe usunięcie przez DELETE użytkownika
  await client.from("workouts").delete().eq("user_id", userId);
  await client.from("exercises").delete().eq("user_id", userId);
}
```

### 5.3. Dane Testowe

#### 5.3.1. Seed Exercises

- Wykorzystaj migrację `20260116120100_seed_system_exercises.sql`
- 30 predefiniowanych ćwiczeń: 20 strength, 10 cardio

#### 5.3.2. Fixtures dla Testów

Utwórz `src/test-utils/fixtures.ts`:

```typescript
import type { Exercise, WorkoutDetailsDTO, CreateWorkoutCommand } from "@/types";

export const mockExerciseStrength: Exercise = {
  id: "test-bench-press",
  user_id: null,
  name: "Bench Press",
  type: "strength",
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

export const mockExerciseCardio: Exercise = {
  id: "test-running",
  user_id: null,
  name: "Running",
  type: "cardio",
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

export const mockWorkoutCommand: CreateWorkoutCommand = {
  date: "2026-02-01",
  notes: "Test workout",
  sets: [
    {
      exercise_id: "test-bench-press",
      sort_order: 1,
      weight: 100,
      reps: 8,
    },
    {
      exercise_id: "test-bench-press",
      sort_order: 2,
      weight: 100,
      reps: 7,
    },
  ],
};

export const mockWorkoutDetails: WorkoutDetailsDTO = {
  id: "test-workout-id",
  user_id: "test-user-id",
  date: "2026-02-01",
  notes: "Test workout",
  created_at: "2026-02-01T20:00:00Z",
  updated_at: "2026-02-01T20:00:00Z",
  sets: [
    {
      id: "test-set-1",
      workout_id: "test-workout-id",
      exercise_id: "test-bench-press",
      exercise_name: "Bench Press",
      exercise_type: "strength",
      sort_order: 1,
      weight: 100,
      reps: 8,
      distance: null,
      time: null,
      calculated_1rm: 125.0,
      calculated_volume: 800,
      created_at: "2026-02-01T20:05:00Z",
      updated_at: "2026-02-01T20:05:00Z",
    },
  ],
};
```

---

## 6. Narzędzia do Testowania

### 6.1. Test Runners i Frameworki

| Narzędzie                       | Wersja  | Zastosowanie            | Instalacja                             |
| ------------------------------- | ------- | ----------------------- | -------------------------------------- |
| **Vitest**                      | ^2.0.0  | Unit, Integration tests | `npm i -D vitest @vitest/ui`           |
| **@testing-library/react**      | ^16.0.0 | Component tests         | `npm i -D @testing-library/react`      |
| **@testing-library/user-event** | ^14.5.0 | Symulacja interakcji    | `npm i -D @testing-library/user-event` |
| **jsdom**                       | ^25.0.0 | Browser environment     | `npm i -D jsdom`                       |
| **Playwright**                  | ^1.50.0 | E2E tests               | `npm i -D @playwright/test`            |

### 6.2. Mocking i Fixtures

| Narzędzie             | Zastosowanie          |
| --------------------- | --------------------- |
| **vi.fn()**           | Mock funkcji w Vitest |
| **vi.mock()**         | Mock całych modułów   |
| **MSW** (opcjonalnie) | Mock HTTP requests    |

### 6.3. Coverage i Reporting

| Narzędzie                    | Konfiguracja                                      |
| ---------------------------- | ------------------------------------------------- |
| **Vitest Coverage**          | Provider: v8, Reporters: text, json, html         |
| **Playwright HTML Reporter** | Automatycznie generowany po `npx playwright test` |

### 6.4. CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/test.yml`):

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run preview &
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 7. Harmonogram Testów

### 7.1. Fazy Testowania

| Faza                                  | Czas Trwania            | Typy Testów | Odpowiedzialny  |
| ------------------------------------- | ----------------------- | ----------- | --------------- |
| **Unit Tests - Implementacja**        | Sprint 1-2 (2 tygodnie) | Unit        | Dev Team        |
| **Integration Tests - Implementacja** | Sprint 2-3 (2 tygodnie) | Integration | Dev Team + QA   |
| **Component Tests - Implementacja**   | Sprint 3-4 (2 tygodnie) | Component   | Frontend Dev    |
| **E2E Tests - Implementacja**         | Sprint 4-5 (1 tydzień)  | E2E         | QA Engineer     |
| **Regression Testing**                | Każdy sprint            | All         | Automated CI/CD |
| **Exploratory Testing**               | Przed każdym release'm  | Manual      | QA Engineer     |
| **Accessibility Audit**               | Pre-release (1 dzień)   | A11y        | QA + Dev Lead   |

### 7.2. Milestone'y

| Milestone                       | Deadline         | Deliverables                                                    |
| ------------------------------- | ---------------- | --------------------------------------------------------------- |
| **M1: Unit Test Coverage 80%**  | Koniec Sprintu 2 | - Testy dla services, utils, hooks<br>- Coverage report         |
| **M2: Integration Tests - API** | Koniec Sprintu 3 | - Wszystkie endpointy przetestowane<br>- RLS validation         |
| **M3: Component Tests**         | Koniec Sprintu 4 | - Kluczowe komponenty (auth, logger, dashboard)<br>- A11y tests |
| **M4: E2E Critical Paths**      | Koniec Sprintu 5 | - 7 głównych scenariuszy E2E<br>- CI/CD pipeline                |
| **M5: MVP Release**             | Sprint 6         | - Wszystkie testy green<br>- Smoke tests na produkcji           |

### 7.3. Frequency

| Typ Testu       | Kiedy Uruchamiać            | Trigger                      |
| --------------- | --------------------------- | ---------------------------- |
| **Unit**        | Przy każdym commit          | Pre-commit hook (Husky) + CI |
| **Integration** | Przy każdym PR              | GitHub Actions               |
| **Component**   | Przy każdym PR              | GitHub Actions               |
| **E2E**         | Nightly build + Pre-release | Scheduled CI (noc) + Manual  |
| **A11y**        | Pre-release                 | Manual audit                 |
| **Performance** | Weekly                      | Lighthouse CI                |

---

## 8. Kryteria Akceptacji Testów

### 8.1. Definicja "Done" dla Testów

**Feature jest gotowe, gdy:**

1. ✅ Unit tests: coverage ≥ 80% dla nowego kodu
2. ✅ Integration tests: wszystkie endpointy API przetestowane
3. ✅ Component tests: kluczowe interakcje pokryte
4. ✅ E2E tests: krytyczna ścieżka użytkownika działa
5. ✅ Wszystkie testy przechodzą lokalnie i w CI
6. ✅ Brak regresjii w istniejących testach
7. ✅ Code review zaakceptowany
8. ✅ Dokumentacja testów zaktualizowana

### 8.2. Entry Criteria (Warunki Wejścia)

Przed rozpoczęciem testów:

- ✅ Kod zaimplementowany i zmergowany do develop
- ✅ Aplikacja builduje się bez błędów
- ✅ Linter: brak błędów ESLint
- ✅ TypeScript: brak błędów kompilacji
- ✅ Środowisko testowe dostępne (local/staging)
- ✅ Dane testowe załadowane (seed)

### 8.3. Exit Criteria (Warunki Wyjścia)

Testy zakończone sukcesem, gdy:

- ✅ Wszystkie zaplanowane testy wykonane
- ✅ Pass rate ≥ 95% (tolerancja 5% dla flaky tests)
- ✅ Krytyczne bugi: 0
- ✅ Wysokie bugi: ≤ 2 (z planem naprawy)
- ✅ Coverage: unit ≥ 80%, integration ≥ 70%
- ✅ Performance: LCP < 2.5s, FID < 100ms
- ✅ A11y: 0 naruszeń WCAG AA
- ✅ Sign-off od Tech Lead i Product Owner

### 8.4. Coverage Targets

| Warstwa           | Target Coverage | Narzędzie         |
| ----------------- | --------------- | ----------------- |
| **Services**      | ≥ 85%           | Vitest Coverage   |
| **Utils**         | ≥ 90%           | Vitest Coverage   |
| **Hooks**         | ≥ 80%           | Vitest Coverage   |
| **Components**    | ≥ 70%           | @testing-library  |
| **API Endpoints** | 100%            | Integration Tests |

### 8.5. Bug Severity Matrix

| Severity      | Definicja                         | Przykład                              | Action                   |
| ------------- | --------------------------------- | ------------------------------------- | ------------------------ |
| **Krytyczny** | Blokuje kluczową funkcjonalność   | Nie można zapisać treningu            | Fix natychmiast, hotfix  |
| **Wysoki**    | Poważny błąd, workaround możliwy  | RLS leak - widoczne dane innego usera | Fix w bieżącym sprincie  |
| **Średni**    | Bug wpływający na UX, nie blokuje | Toast nie znika automatycznie         | Fix w następnym sprincie |
| **Niski**     | Kosmetyczny                       | Błąd w formatowaniu daty (USA vs PL)  | Backlog                  |

---

## 9. Role i Odpowiedzialności

### 9.1. Test Team

| Rola              | Odpowiedzialności                                                                               | Osoba               |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------- |
| **QA Lead**       | - Nadzór nad planem testów<br>- Review testów<br>- Reporting do stakeholders<br>- Test strategy | [QA Lead Name]      |
| **QA Engineer**   | - Pisanie E2E tests<br>- Exploratory testing<br>- Bug reporting<br>- Accessibility audits       | [QA Engineer Name]  |
| **Frontend Dev**  | - Unit tests dla komponentów<br>- Component tests<br>- Fixing frontend bugs                     | [Frontend Dev Name] |
| **Backend Dev**   | - Unit tests dla services<br>- Integration tests dla API<br>- DB migrations tests               | [Backend Dev Name]  |
| **Tech Lead**     | - Code review testów<br>- CI/CD pipeline setup<br>- Performance testing oversight               | [Tech Lead Name]    |
| **Product Owner** | - UAT (User Acceptance Testing)<br>- Sign-off na release                                        | [PO Name]           |

### 9.2. RACI Matrix (dla Procesu Testowania)

| Aktywność              | QA Lead | QA Eng  | Dev     | Tech Lead | PO    |
| ---------------------- | ------- | ------- | ------- | --------- | ----- |
| Tworzenie planu testów | **R**   | C       | C       | **A**     | I     |
| Pisanie unit tests     | I       | I       | **R/A** | C         | I     |
| Pisanie E2E tests      | C       | **R/A** | C       | C         | I     |
| Bug reporting          | I       | **R**   | I       | **A**     | I     |
| Bug fixing             | I       | I       | **R/A** | C         | I     |
| Test automation CI/CD  | C       | C       | **R**   | **A**     | I     |
| Release sign-off       | C       | C       | I       | **R**     | **A** |

**Legenda**: R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## 10. Procedury Raportowania Błędów

### 10.1. Bug Tracking Tool

- **Narzędzie**: GitHub Issues (lub Jira, jeśli dostępne)
- **Labels**: `bug`, `critical`, `high`, `medium`, `low`, `frontend`, `backend`, `ux`, `a11y`

### 10.2. Struktura Raportu Błędu

**Template Issue:**

```markdown
## 🐛 [Severity] Krótki opis błędu

### Środowisko

- **Browser/OS**: Chrome 131 / Windows 11
- **URL**: https://staging.10xfitchart.app/app/log
- **User**: test-user@example.com
- **Build**: commit SHA lub tag wersji

### Kroki Reprodukcji

1. Zaloguj się jako test-user
2. Przejdź do /app/log
3. Dodaj ćwiczenie "Bench Press"
4. Wpisz weight: -50 (ujemna wartość)
5. Kliknij "Zakończ trening"

### Oczekiwane Zachowanie

- Walidacja powinna zablokować submit
- Toast: "Ciężar musi być liczbą dodatnią"

### Aktualne Zachowanie

- Workout zapisuje się z weight=-50
- Brak walidacji frontendowej

### Screenshot/Video

[Załącz screenshot]

### Logi/Stack Trace (jeśli dotyczy)
```

Error: ...

```

### Dodatkowe Informacje
- First occurrence: 2026-02-01
- Frequency: Zawsze
- Related tests: TC-023 (pomija ten case)

### Sugerowana Poprawka
- Dodać walidację Zod dla `weight: z.number().positive()`
- Dodać test case w `workout.service.test.ts`
```

### 10.3. Bug Workflow

1. **Zgłoszenie**: QA lub Dev tworzy issue z pełnym opisem
2. **Triage**: QA Lead przypisuje severity i osobę odpowiedzialną
3. **Assigned**: Dev potwierdza akceptację (lub zwraca z pytaniami)
4. **In Progress**: Dev pracuje nad fixem + dodaje test regresyjny
5. **Code Review**: PR z fixem + testem → review
6. **Testing**: QA weryfikuje fix na staging
7. **Closed**: Po zatwierdzeniu przez QA

### 10.4. Escalation Path

- **Krytyczny bug wykryty w produkcji**:
  1. Natychmiastowa notyfikacja: Tech Lead + PO (Slack/Email)
  2. Hotfix branch: `hotfix/critical-bug-name`
  3. Priorytet: wstrzymanie innych prac
  4. Deploy: po smoke tests → production
  5. Post-mortem: analiza przyczyny + plan prewencji

### 10.5. Metrics i Reporting

**Weekly Test Report** (wysyłany każdy piątek):

- Liczba wykonanych testów (unit, integration, E2E)
- Pass rate (%)
- Nowe bugi: Krytyczne / Wysokie / Średnie / Niskie
- Fixed bugi: w tym tygodniu
- Coverage: aktualny stan
- Blockers: problemy wymagające uwagi

**Release Test Report** (przed każdym release'm):

- Podsumowanie wszystkich testów
- Status exit criteria
- Lista known issues (z workaroundami)
- Rekomendacja: GO / NO-GO

---

## 11. Załączniki

### 11.1. Skrypty NPM

Dodaj do `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --reporter=verbose",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### 11.2. Vitest Config (Integration)

`vitest.integration.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 30000, // dłuższy timeout dla integration
  },
});
```

### 11.3. Playwright Config

`playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 11.4. Linki do Dokumentacji

- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev/
- Supabase Testing: https://supabase.com/docs/guides/getting-started/local-development
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- Recharts: https://recharts.org/

---

## 12. Podsumowanie i Next Steps

### 12.1. Kluczowe Priorytety

1. **Implementacja Unit Tests** (Sprint 1-2)
   - Zacznij od kalkulacji (calculate1RM, calculateVolume)
   - Następnie reducery i hooki
   - Cel: 80% coverage

2. **Implementacja Integration Tests** (Sprint 2-3)
   - Przetestuj wszystkie endpointy API
   - Zweryfikuj RLS policies
   - Mock Supabase lub użyj local instance

3. **Implementacja E2E Tests** (Sprint 4-5)
   - Skoncentruj się na 7 krytycznych scenariuszach
   - Użyj Playwright dla stabilności
   - Integracja z CI/CD

4. **Continuous Improvement**
   - Code review testów: wymóg w PR
   - Refactoring testów: utrzymanie DRY
   - Monitoring flaky tests: retry strategy

### 12.2. Success Criteria dla MVP

✅ **Definicja sukcesu testowania MVP:**

- Unit tests: ≥ 80% coverage
- Integration tests: wszystkie API endpoints pokryte
- E2E tests: 7 głównych scenariuszy green
- 0 krytycznych bugów
- ≤ 2 wysokie bugi (z planem fix)
- CI/CD: wszystkie etapy automatyczne
- Performance: LCP < 2.5s, FID < 100ms
- Accessibility: 0 naruszeń WCAG AA

### 12.3. Post-MVP Enhancements

- **Visual Regression Tests**: Percy lub Chromatic dla UI
- **Load Testing**: Artillery lub k6 dla API
- **Security Testing**: OWASP ZAP dla vulnerability scan
- **Cross-browser Testing**: Rozszerzenie Playwright na Safari, Edge
- **Mutation Testing**: Stryker dla jakości testów jednostkowych

---

**Koniec Planu Testów**

Data utworzenia: 2026-02-01  
Wersja: 1.0  
Status: Draft → Wymaga review i akceptacji  
Następna rewizja: Po Sprincie 2 (po implementacji pierwszych testów)
