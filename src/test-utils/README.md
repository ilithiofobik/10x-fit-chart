# Testing Guide - 10xFitChart

## Przegląd

Projekt używa **Vitest** jako głównego frameworka do testów jednostkowych i komponentów. Środowisko testowe jest w pełni skonfigurowane z wsparciem dla TypeScript, React, i JSX.

## 🚀 Szybki Start

### Uruchamianie Testów

```bash
# Uruchom wszystkie testy (watch mode)
npm test

# Uruchom testy raz (CI mode)
npm run test:unit

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy z coverage
npm run test:coverage

# Uruchom w trybie watch
npm run test:watch
```

### Uruchamianie Konkretnych Testów

```bash
# Uruchom konkretny plik
npx vitest src/lib/utils/formatters.test.ts

# Uruchom testy pasujące do wzorca
npx vitest -t "formatNumber"

# Uruchom tylko w konkretnym katalogu
npx vitest src/lib/utils
```

## 📁 Struktura Testów

```
src/
├── lib/
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── formatters.test.ts       # Testy jednostkowe
│   ├── services/
│   │   ├── workout.service.ts
│   │   └── workout.service.test.ts
│   └── hooks/
│       ├── useDashboard.ts
│       └── useDashboard.test.ts
├── test-utils/
│   ├── setup.ts                     # Konfiguracja globalna
│   ├── fixtures.ts                  # Mock data
│   ├── test-utils.tsx               # Helpery React Testing Library
│   └── index.ts                     # Re-exports
└── components/
    └── auth/
        ├── LoginForm.tsx
        └── LoginForm.test.tsx       # Testy komponentów
```

## 🛠️ Konfiguracja

### Pliki Konfiguracyjne

- **`vitest.config.ts`** - Główna konfiguracja Vitest
- **`src/test-utils/setup.ts`** - Setup wykonywany przed każdym testem
- **`tsconfig.json`** - Path aliases (@/\*)

### Environment

- **Test Runner**: Vitest 4.x
- **Environment**: jsdom (dla testów React)
- **Globals**: Włączone (describe, it, expect bez importów)
- **Coverage**: V8 provider

## 📝 Pisanie Testów

### Struktura Testu (AAA Pattern)

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myFunction";

describe("myFunction", () => {
  it("should do something specific", () => {
    // Arrange - przygotowanie danych
    const input = 42;

    // Act - wykonanie akcji
    const result = myFunction(input);

    // Assert - weryfikacja wyniku
    expect(result).toBe(84);
  });
});
```

### Test Czystej Funkcji

```typescript
// src/lib/utils/formatters.test.ts
import { describe, it, expect } from "vitest";
import { formatNumber } from "./formatters";

describe("formatNumber", () => {
  it("formatuje liczby z separatorami tysięcy", () => {
    expect(formatNumber(1000)).toContain("000");
    expect(formatNumber(125000)).toContain("125");
  });

  it("obsługuje edge cases", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(-1000)).toContain("-");
  });
});
```

### Test z Mockami

```typescript
import { describe, it, expect, vi } from "vitest";

describe("fetchData", () => {
  it("wywołuje fetch z poprawnymi parametrami", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    global.fetch = mockFetch;

    await fetchData("/api/test");

    expect(mockFetch).toHaveBeenCalledWith("/api/test", expect.any(Object));
  });
});
```

### Test Komponentu React

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("renderuje formularz logowania", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
  });

  it("wywołuje onSubmit po kliknięciu", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/hasło/i), "password123");
    await user.click(screen.getByRole("button", { name: /zaloguj/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});
```

### Test Reducera

```typescript
import { describe, it, expect } from "vitest";
import { workoutLoggerReducer, initialState } from "./workoutLoggerReducer";

describe("workoutLoggerReducer", () => {
  it("ADD_EXERCISE dodaje ćwiczenie", () => {
    const action = {
      type: "ADD_EXERCISE" as const,
      payload: { exerciseId: "123", exerciseName: "Bench Press", type: "strength" },
    };

    const newState = workoutLoggerReducer(initialState, action);

    expect(newState.exercises).toHaveLength(1);
    expect(newState.exercises[0].name).toBe("Bench Press");
  });

  it("zachowuje immutability", () => {
    const state = { ...initialState };
    const newState = workoutLoggerReducer(state, someAction);

    expect(newState).not.toBe(state);
  });
});
```

## 🎯 Test Utilities

### Dostępne Fixtures

```typescript
import {
  mockExerciseStrength,
  mockExerciseCardio,
  mockWorkoutDetails,
  mockDashboardSummary,
  mockUser,
} from "@/test-utils/fixtures";

// Używanie w testach
const exercise = mockExerciseStrength;
expect(exercise.type).toBe("strength");
```

### Mock Fetch Response

```typescript
import { mockFetchResponse, mockFetchError } from "@/test-utils/fixtures";

// Success response
global.fetch = vi.fn().mockImplementation(() => mockFetchResponse({ data: "test" }));

// Error response
global.fetch = vi.fn().mockImplementation(() => mockFetchError("Not found", 404));
```

### Global Mocks

Dostępne automatycznie w każdym teście:

- `localStorage` - mockowany z pełną funkcjonalnością
- `sessionStorage` - mockowany z pełną funkcjonalnością
- `fetch` - domyślnie vi.fn()
- `matchMedia` - mockowany
- `IntersectionObserver` - mockowany
- `ResizeObserver` - mockowany

## 📊 Coverage

### Generowanie Raportu

```bash
npm run test:coverage
```

Raport zostanie wygenerowany w `coverage/` i automatycznie otworzy się w przeglądarce.

### Cele Coverage

| Moduł                      | Target |
| -------------------------- | ------ |
| `src/lib/services/`        | ≥ 85%  |
| `src/lib/utils/`           | ≥ 90%  |
| `src/lib/hooks/`           | ≥ 80%  |
| `src/components/` (logika) | ≥ 70%  |

### Ignorowanie Plików

Pominięte z coverage:

- `src/test-utils/`
- `src/components/ui/` (komponenty Shadcn)
- `*.test.ts`, `*.spec.ts`
- `*.config.ts`

## 🐛 Debugging

### Debug w VSCode

Dodaj do `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug w Chrome DevTools

```bash
# Uruchom z debuggerem
node --inspect-brk ./node_modules/vitest/vitest.mjs

# Otwórz chrome://inspect w przeglądarce
```

### Wyświetlanie Logów

```typescript
import { describe, it } from "vitest";

describe("My test", () => {
  it("debuguje problem", () => {
    console.log("Debug info:", someValue); // Logi będą widoczne w output
  });
});
```

## ⚡ Best Practices

### 1. Nazewnictwo

- Pliki testowe: `*.test.ts` lub `*.test.tsx`
- Describe blocks: nazwa modułu/funkcji
- It blocks: zdanie opisujące zachowanie ("should...", "powinien...")

### 2. Organizacja

```typescript
describe("ModuleName", () => {
  describe("functionName", () => {
    it("handles normal case");
    it("handles edge case");
    it("throws error for invalid input");
  });
});
```

### 3. Assertions

- Używaj najbardziej specyficznych matcherów
- Unikaj `toBeTruthy()` / `toBeFalsy()` - użyj `toBe(true)` / `toBe(false)`
- Dla obiektów: `toEqual()` zamiast `toBe()`

```typescript
// ✅ Dobre
expect(result).toBe(42);
expect(user.name).toBe("John");
expect(array).toHaveLength(3);

// ❌ Złe
expect(result).toBeTruthy();
expect(!!user.name).toBe(true);
expect(array.length).toBe(3);
```

### 4. Mocking

- Mock tylko to, co jest konieczne
- Prefer spies over mocks gdy możliwe
- Resetuj mocki w `afterEach()`

```typescript
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.clearAllMocks(); // lub vi.resetAllMocks()
});
```

### 5. Async Tests

```typescript
// ✅ Używaj async/await
it("fetches data", async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// ❌ Unikaj callback hell
it("fetches data", (done) => {
  fetchData().then((data) => {
    expect(data).toBeDefined();
    done();
  });
});
```

## 🔗 Linki

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/react)
- [Testing Best Practices](./.cursor/rules/vitest-unit-testing.mdc)
- [Full Test Plan](../.ai/testing-plan.md)
- [Unit Test Priorities](../.ai/unit-test-plan.md)

## 🚨 Troubleshooting

### Problem: "Cannot find module '@/...'"

**Rozwiązanie**: Sprawdź `vitest.config.ts` - alias `@/` musi być skonfigurowany:

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### Problem: "ReferenceError: describe is not defined"

**Rozwiązanie**: Sprawdź `vitest.config.ts` - globals muszą być włączone:

```typescript
test: {
  globals: true;
}
```

### Problem: Testy nie widzą zmian w plikach

**Rozwiązanie**: Uruchom z `--no-cache`:

```bash
npx vitest --no-cache
```

### Problem: Import statements fail

**Rozwiązanie**: Sprawdź `type: "module"` w `package.json`

---

**Ostatnia aktualizacja**: 2026-02-01  
**Wersja Vitest**: 4.0.18
