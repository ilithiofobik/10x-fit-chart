# Plan Testów Jednostkowych - 10xFitChart

## Przegląd

Dokument określa priorytety i zakres testów jednostkowych dla projektu 10xFitChart. Testy jednostkowe stanowią fundament piramidy testowej (60% wszystkich testów) i koncentrują się na czystych funkcjach, logice biznesowej i reducerach React.

**Framework**: Vitest + @testing-library/react  
**Cel Coverage**: ≥ 80% dla krytycznych modułów  
**Szacowany czas implementacji**: 11.5h (2 sprinty)

---

## 🎯 Priorytet 1: KRYTYCZNE (Obowiązkowe)

### 1. Funkcje Kalkulacyjne

**Lokalizacja**: `src/lib/services/workout.service.ts`

**Funkcje do testowania**:
- `calculate1RM(weight: number, reps: number): number`
- `calculateVolume(weight: number, reps: number): number`

**Dlaczego**:
- ✅ Czyste funkcje - brak side effects, deterministyczne wyniki
- ✅ Logika biznesowa - kluczowe dla poprawności danych użytkownika
- ✅ Matematyka - łatwo sprawdzić edge cases (reps=0, ujemne wartości)
- ✅ Krytyczne dla MVP - metryka sukcesu: "100% wykresów poprawnie rozróżnia jednostki"

**Przypadki testowe**:
```typescript
describe('calculate1RM', () => {
  it('zwraca weight gdy reps=1')
  it('oblicza 1RM wzorem Brzycki dla reps > 1')
  it('rzuca błąd dla reps <= 0')
  it('rzuca błąd dla weight ujemnego')
  it('zaokrągla do 2 miejsc po przecinku')
});

describe('calculateVolume', () => {
  it('oblicza volume jako weight * reps')
  it('zaokrągla do 2 miejsc po przecinku')
  it('obsługuje liczby zmiennoprzecinkowe (22.5kg)')
});
```

**Szacowany czas**: 1h  
**ROI**: ⭐⭐⭐⭐⭐

---

### 2. Formatery

**Lokalizacja**: `src/lib/utils/formatters.ts`

**Funkcje do testowania**:
- `formatNumber(value: number): string`
- `formatVolume(value: number): string`
- `formatWorkoutDate(dateString: string): string`
- `formatChartValue(value: number, decimals?: number): string`
- `isValidISODate(dateString: string): boolean`
- `formatChartDate(dateString: string): string`
- `formatDateRange(startDate: string, endDate: string): string`

**Dlaczego**:
- ✅ Czyste funkcje - input → output, brak zależności
- ✅ Kluczowe dla UX - polskie locale, błędy w formatowaniu = utrata zaufania
- ✅ Edge cases - nieprawidłowe daty, null values, timezone issues
- ✅ Szybkie testy - wykonanie < 1ms, idealne do TDD

**Przypadki testowe**:
```typescript
describe('formatNumber', () => {
  it('formatuje z separatorami tysięcy (PL locale)')
  it('obsługuje liczby zmiennoprzecinkowe')
  it('obsługuje 0')
});

describe('formatWorkoutDate', () => {
  it('zwraca "Dzisiaj" dla dzisiejszej daty')
  it('zwraca "Wczoraj" dla wczorajszej daty')
  it('formatuje inne daty jako "d MMM yyyy"')
  it('obsługuje nieprawidłową datę (fallback)')
  it('obsługuje polskie locale (styczeń, luty, etc.)')
});

describe('isValidISODate', () => {
  it('waliduje poprawną datę ISO')
  it('zwraca false dla nieprawidłowej daty')
  it('zwraca false dla pustego stringa')
  it('zwraca false dla null/undefined')
});

describe('formatChartValue', () => {
  it('zaokrągla do 2 miejsc domyślnie')
  it('zaokrągla do custom liczby miejsc')
  it('obsługuje liczby całkowite')
});

describe('formatDateRange', () => {
  it('formatuje zakres dat')
  it('obsługuje ten sam rok')
  it('obsługuje różne lata')
  it('fallback dla nieprawidłowych dat')
});
```

**Szacowany czas**: 2h  
**ROI**: ⭐⭐⭐⭐⭐

---

### 3. Reducery React

**Lokalizacja**:
- `src/lib/hooks/workoutLoggerReducer.ts`
- `src/lib/hooks/workoutEditorReducer.ts`
- `src/lib/hooks/historyListReducer.ts`

**Akcje do testowania**:

**workoutLoggerReducer**:
- `SET_DATE`
- `SET_NOTES`
- `ADD_EXERCISE`
- `REMOVE_EXERCISE`
- `ADD_SET`
- `UPDATE_SET`
- `REMOVE_SET`
- `LOAD_TEMPLATE`
- `RESET_STATE`

**workoutEditorReducer** (rozszerzenia):
- `LOAD_WORKOUT`
- `SET_ORIGINAL_DATE` (dla porównania zmian)

**Dlaczego**:
- ✅ Czyste funkcje - (state, action) → newState
- ✅ Złożona logika stanu - wiele akcji, immutability, edge cases
- ✅ Krytyczne dla UX - błędy w reducerze = utrata danych użytkownika
- ✅ Łatwe do testowania - nie wymaga renderowania komponentów

**Przypadki testowe**:
```typescript
describe('workoutLoggerReducer', () => {
  describe('ADD_EXERCISE', () => {
    it('dodaje ćwiczenie z pustą listą sets')
    it('generuje unique ID dla ćwiczenia')
    it('zachowuje istniejące ćwiczenia')
  });
  
  describe('UPDATE_SET', () => {
    it('aktualizuje konkretne pole bez zmiany innych')
    it('zachowuje immutability')
    it('obsługuje nieistniejący exerciseId (graceful)')
    it('obsługuje nieistniejący setIndex (graceful)')
  });
  
  describe('LOAD_TEMPLATE', () => {
    it('ładuje strukturę ćwiczeń z template')
    it('ustawia datę na dzisiaj (nie template date)')
    it('czyści notes')
    it('zachowuje exercise_id i strukturę sets')
  });
  
  describe('RESET_STATE', () => {
    it('resetuje do initialState')
    it('ustawia datę na dzisiaj')
  });
  
  describe('immutability', () => {
    it('nie mutuje oryginalnego state')
    it('zwraca nowy obiekt przy każdej akcji')
  });
});

describe('workoutEditorReducer', () => {
  describe('LOAD_WORKOUT', () => {
    it('ładuje pełne dane workout do edycji')
    it('zachowuje original_date dla porównania')
    it('mapuje WorkoutSetDTO na local format')
  });
});
```

**Szacowany czas**: 3h  
**ROI**: ⭐⭐⭐⭐⭐

---

## 🎯 Priorytet 2: WYSOKIE (Silnie rekomendowane)

### 4. Auth Guards

**Lokalizacja**: `src/lib/utils/auth-guards.ts`

**Funkcje do testowania**:
- `requireAuth(locals: App.Locals): User`
- `isAuthenticated(locals: App.Locals): boolean`
- `getUser(locals: App.Locals): User | null`

**Dlaczego**:
- ✅ Bezpieczeństwo - błąd = data leak
- ✅ Proste, ale krytyczne - łatwe do przetestowania, ważne konsekwencje
- ✅ Type safety - weryfikacja TypeScript types

**Przypadki testowe**:
```typescript
describe('requireAuth', () => {
  it('zwraca usera gdy jest zalogowany')
  it('rzuca Response 401 gdy brak usera')
  it('Response zawiera JSON z error message')
  it('Response ma poprawne headers (Content-Type)')
});

describe('isAuthenticated', () => {
  it('zwraca true gdy user istnieje')
  it('zwraca false gdy user = null')
  it('zwraca false gdy user = undefined')
});

describe('getUser', () => {
  it('zwraca user gdy istnieje')
  it('zwraca null gdy user = null')
  it('zwraca null gdy user = undefined')
});
```

**Szacowany czas**: 1h  
**ROI**: ⭐⭐⭐⭐

---

### 5. Walidacja w Serwisach

**Lokalizacja**: `src/lib/services/workout.service.ts`, `exercise.service.ts`

**Logika do testowania**:
- Walidacja type mismatch (strength z distance, cardio z weight)
- Walidacja exercise existence
- Custom error classes

**Dlaczego**:
- ✅ Business rules - zapobieganie nieprawidłowym danym
- ✅ Edge cases - puste sets, nieprawidłowe exercise_id
- ✅ Błędy customowe - ExerciseNotFoundError, ExerciseTypeMismatchError

**Przypadki testowe**:
```typescript
describe('workout.service - Validation', () => {
  describe('validateExerciseType', () => {
    it('rzuca ExerciseTypeMismatchError gdy strength ma distance')
    it('rzuca ExerciseTypeMismatchError gdy strength ma time')
    it('rzuca ExerciseTypeMismatchError gdy cardio ma weight')
    it('rzuca ExerciseTypeMismatchError gdy cardio ma reps')
    it('akceptuje poprawne pola dla strength (weight, reps)')
    it('akceptuje poprawne pola dla cardio (distance, time)')
  });
  
  describe('validateExerciseExists', () => {
    it('zwraca exercise gdy istnieje')
    it('rzuca ExerciseNotFoundError gdy nie istnieje')
    it('weryfikuje accessibility (system lub user\'s)')
  });
});

describe('exercise.service - Validation', () => {
  describe('checkNameUnique', () => {
    it('akceptuje unikalną nazwę')
    it('rzuca ExerciseAlreadyExistsError dla duplikatu')
    it('case-insensitive sprawdzanie nazwy')
  });
});
```

**Szacowany czas**: 2h  
**ROI**: ⭐⭐⭐⭐

---

### 6. Hook Logic (bez renderowania)

**Lokalizacja**: `src/lib/hooks/useDashboard.ts`

**Funkcje pomocnicze do testowania**:
- `isValidMonths(value: number): boolean`
- `validateDashboardData(data: unknown): data is DashboardSummaryDTO`

**Dlaczego**:
- ✅ Business logic - walidacja months, error handling
- ✅ Bez UI - testowanie logiki, nie renderowania
- ✅ Deterministyczne - mocki fetch, przewidywalne wyniki

**Przypadki testowe**:
```typescript
describe('useDashboard - Logic', () => {
  describe('isValidMonths', () => {
    it('zwraca true dla dozwolonych wartości (1, 3, 6, 12)')
    it('zwraca false dla niedozwolonych')
    it('zwraca false dla 0 i liczb ujemnych')
  });
  
  describe('validateDashboardData', () => {
    it('akceptuje poprawną strukturę')
    it('odrzuca null')
    it('odrzuca obiekt bez period')
    it('odrzuca obiekt bez summary')
    it('odrzuca summary z ujemnymi wartościami')
    it('odrzuca summary z nieprawidłowymi typami')
    it('akceptuje pustą recent_workouts array')
  });
});

describe('fetchDashboardData (mocked)', () => {
  it('wykonuje fetch z poprawnymi parametrami')
  it('obsługuje timeout (10s)')
  it('przekierowuje na /login przy 401')
  it('rzuca Error przy 500+')
  it('waliduje response data')
  it('rzuca Error dla nieprawidłowej struktury')
});
```

**Szacowany czas**: 2h  
**ROI**: ⭐⭐⭐

---

## 🎯 Priorytet 3: ŚREDNIE (Warto dodać)

### 7. Utils

**Lokalizacja**: `src/lib/utils/utils.ts`

**Funkcje do testowania**:
- `cn(...inputs: ClassValue[]): string` (clsx + tailwind-merge)

**Przypadki testowe**:
```typescript
describe('cn', () => {
  it('łączy klasy')
  it('obsługuje conditional classes')
  it('merguje Tailwind conflicting classes')
  it('obsługuje undefined, null, false')
  it('obsługuje arrays')
  it('obsługuje objects')
});
```

**Szacowany czas**: 30min  
**ROI**: ⭐⭐⭐

---

### 8. Auth Error Mappers

**Lokalizacja**: `src/lib/utils/auth-errors.ts` (jeśli istnieje)

**Funkcje do testowania**:
- Mapowanie błędów Supabase Auth na user-friendly komunikaty PL

**Przypadki testowe**:
```typescript
describe('mapAuthError', () => {
  it('mapuje "User already registered" na polski')
  it('mapuje "Invalid login credentials" na polski')
  it('obsługuje nieznane błędy (fallback)')
});
```

**Szacowany czas**: 30min  
**ROI**: ⭐⭐

---

## ❌ CO NIE POWINNO BYĆ W UNIT TESTACH

### 1. Komponenty React z UI
❌ **Nie unit test** → Użyj **Component Tests** z Testing Library
- Przykłady: `Dashboard.tsx`, `LoginForm.tsx`, `ExerciseManager.tsx`
- Powód: Wymagają renderowania, DOM, interakcji użytkownika

### 2. Endpointy API
❌ **Nie unit test** → Użyj **Integration Tests**
- Przykłady: `/api/workouts/index.ts`, `/api/auth/login.ts`
- Powód: Wymagają HTTP context, Supabase client, session handling

### 3. Supabase Queries
❌ **Nie mockuj całego Supabase** → Użyj **Integration Tests** z prawdziwym klientem
- Przykłady: Funkcje w `exercise.service.ts` wywołujące `supabase.from(...)`
- Powód: Mockowanie Supabase query builder = testowanie mocka, nie kodu

### 4. E2E Flows
❌ **Nie unit test** → Użyj **Playwright E2E**
- Przykłady: Cały przepływ rejestracji → logowania → zapisu treningu
- Powód: Wymagają pełnego środowiska, przeglądarki, network

### 5. Middleware
❌ **Nie unit test** → Użyj **Integration Tests**
- Przykład: `src/middleware/index.ts`
- Powód: Wymaga Astro context, routing, cookies

---

## 📊 Podsumowanie Priorytetów

| Element | Priorytet | Czas | ROI | Zalecany Sprint |
|---------|-----------|------|-----|-----------------|
| Kalkulacje (1RM, Volume) | 🔴 Krytyczny | 1h | ⭐⭐⭐⭐⭐ | Sprint 1, Tydzień 1 |
| Formatery | 🔴 Krytyczny | 2h | ⭐⭐⭐⭐⭐ | Sprint 1, Tydzień 1 |
| Reducery | 🔴 Krytyczny | 3h | ⭐⭐⭐⭐⭐ | Sprint 1, Tydzień 2 |
| Auth Guards | 🟠 Wysoki | 1h | ⭐⭐⭐⭐ | Sprint 2, Tydzień 1 |
| Walidacja w Serwisach | 🟠 Wysoki | 2h | ⭐⭐⭐⭐ | Sprint 2, Tydzień 1 |
| Hook Logic (bez UI) | 🟠 Wysoki | 2h | ⭐⭐⭐ | Sprint 2, Tydzień 2 |
| Utils (cn) | 🟡 Średni | 30min | ⭐⭐⭐ | Sprint 2, Tydzień 2 |
| Auth Error Mappers | 🟡 Średni | 30min | ⭐⭐ | Sprint 2, Tydzień 2 |

**Łączny czas**: 11.5h (w 2 sprinty)  
**Cel Coverage**: ≥ 80% dla wymienionych modułów

---

## 🚀 Harmonogram Implementacji

### Sprint 1, Tydzień 1 (3h)
- [x] Setup Vitest configuration
- [x] Setup test utils i fixtures
- [ ] Testy kalkulacji (`workout.service.ts` - calculations)
- [ ] Testy formatery (`formatters.ts`)

### Sprint 1, Tydzień 2 (3h)
- [ ] Testy reducery (`workoutLoggerReducer.ts`)
- [ ] Testy reducery (`workoutEditorReducer.ts`)
- [ ] Testy reducery (`historyListReducer.ts`)

### Sprint 2, Tydzień 1 (3h)
- [ ] Testy auth guards (`auth-guards.ts`)
- [ ] Testy walidacji w serwisach (`workout.service.ts`, `exercise.service.ts`)

### Sprint 2, Tydzień 2 (2.5h)
- [ ] Testy hook logic (`useDashboard.ts`)
- [ ] Testy utils (`utils.ts`)
- [ ] Testy auth error mappers (jeśli istnieją)
- [ ] Review coverage i uzupełnienie luk

---

## 📝 Checklist przed rozpoczęciem

- [ ] Zainstalować zależności: `npm i -D vitest @vitest/ui jsdom`
- [ ] Stworzyć `vitest.config.ts`
- [ ] Stworzyć `src/test-utils/setup.ts`
- [ ] Stworzyć `src/test-utils/fixtures.ts`
- [ ] Dodać scripts do `package.json`:
  - `"test": "vitest"`
  - `"test:unit": "vitest run --reporter=verbose"`
  - `"test:watch": "vitest --watch"`
  - `"test:coverage": "vitest run --coverage"`
  - `"test:ui": "vitest --ui"`
- [ ] Skonfigurować pre-commit hook (Husky) dla testów

---

## 📚 Dodatkowe Zasoby

- **Vitest Docs**: https://vitest.dev/
- **Testing Best Practices**: `.cursor/rules/vitest-unit-testing.mdc`
- **Pełny Plan Testów**: `.ai/testing-plan.md`

---

**Data utworzenia**: 2026-02-01  
**Autor**: AI Assistant  
**Status**: Draft → Do review  
**Następna aktualizacja**: Po Sprint 1 (weryfikacja coverage i dostosowanie priorytetów)
