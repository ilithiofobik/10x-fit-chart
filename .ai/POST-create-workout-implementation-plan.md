# API Endpoint Implementation Plan: Create Workout

## 1. Przegląd punktu końcowego

**Cel:** Utworzenie nowego treningu wraz z setami w jednej operacji transakcyjnej, z obsługą backdating i automatycznymi obliczeniami.

**Kluczowe cechy:**

- Metoda: `POST /api/workouts`
- Wymaga autoryzacji (Supabase Auth)
- Transakcja atomowa (workout + multiple sets)
- Backdating support (data w przeszłości/przyszłości)
- Obliczanie 1RM i volume dla ćwiczeń siłowych
- Walidacja exercise_id i zgodności typów
- Zwraca 201 z pełnym WorkoutDetailsDTO

## 2. Szczegóły żądania

**Struktura URL:** `/api/workouts`

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer {token}`

**Request Body:**

```json
{
  "date": "2026-01-15",
  "notes": "Evening session",
  "sets": [
    {
      "exercise_id": "uuid",
      "sort_order": 1,
      "weight": 100.0,
      "reps": 8
    },
    {
      "exercise_id": "uuid",
      "sort_order": 2,
      "distance": 5.0,
      "time": 1800
    }
  ]
}
```

**Wymagane pola:**

- `date`: ISO 8601 date (YYYY-MM-DD)
- `sets`: array (min 1 element)
  - `exercise_id`: uuid
  - `sort_order`: integer > 0

**Opcjonalne pola:**

- `notes`: string | null
- W każdym set: `weight`, `reps`, `distance`, `time` (zależnie od typu ćwiczenia)

## 3. Wykorzystywane typy

Z `src/types.ts`:

- `CreateWorkoutCommand` - request: `{ date: string, notes?: string | null, sets: CreateWorkoutSetCommand[] }`
- `CreateWorkoutSetCommand` - `{ exercise_id, sort_order, weight?, reps?, distance?, time? }`
- `WorkoutDetailsDTO` - response: Workout + `sets: WorkoutSetDTO[]`
- `WorkoutSetDTO` - WorkoutSet + `exercise_name: string` + `exercise_type: ExerciseType`

**Walidacja Zod:**

```typescript
z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().nullable().optional(),
  sets: z
    .array(
      z.object({
        exercise_id: z.string().uuid(),
        sort_order: z.number().int().positive(),
        weight: z.number().min(0).max(999.99).nullable().optional(),
        reps: z.number().int().min(0).nullable().optional(),
        distance: z.number().min(0).max(999999.99).nullable().optional(),
        time: z.number().int().min(0).nullable().optional(),
      })
    )
    .min(1, "At least one set is required"),
});
```

## 4. Szczegóły odpowiedzi

**Sukces (201 Created):**

```json
{
  "id": "uuid",
  "user_id": "user_uuid",
  "date": "2026-01-15",
  "notes": "Evening session",
  "created_at": "2026-01-16T20:00:00Z",
  "updated_at": "2026-01-16T20:00:00Z",
  "sets": [
    {
      "id": "uuid",
      "workout_id": "workout_uuid",
      "exercise_id": "exercise_uuid",
      "exercise_name": "Bench Press",
      "exercise_type": "strength",
      "sort_order": 1,
      "weight": 100.0,
      "reps": 8,
      "distance": null,
      "time": null,
      "calculated_1rm": 125.0,
      "calculated_volume": 800.0,
      "created_at": "2026-01-16T20:00:00Z",
      "updated_at": "2026-01-16T20:00:00Z"
    }
  ]
}
```

**Kody błędów:**

- `401` - Brak autoryzacji
- `400` - Nieprawidłowy body, pusta array, type mismatch
- `404` - Exercise nie istnieje lub nie jest dostępny
- `500` - Błąd transakcji

## 5. Przepływ danych

1. **Middleware** → Dodaje supabase do context.locals
2. **Endpoint** → Weryfikuje autoryzację (getUser)
3. **Endpoint** → Parsuje i waliduje body (Zod)
4. **Service** → Weryfikuje exercises (bulk query):
   - Query wszystkie exercise_id z request
   - Sprawdza czy istnieją i są dostępne (system lub user's)
   - Jeśli któryś brak → throw NotFoundError
5. **Service** → Waliduje zgodność typów dla każdego set
6. **Service** → Rozpoczyna transakcję:
   - **INSERT workout:** user_id, date, notes
   - **Dla każdego set:**
     - Oblicza 1RM (jeśli strength): `weight / (1.0278 - 0.0278 * reps)`
     - Oblicza volume (jeśli strength): `weight * reps`
     - **INSERT workout_set:** wszystkie pola + calculated values
7. **Service** → Pobiera utworzony workout z JOIN do sets i exercises
8. **Service** → Mapuje do WorkoutDetailsDTO
9. **Endpoint** → Zwraca 201 z WorkoutDetailsDTO

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie:** Weryfikacja sesji przed operacją
2. **Własność zasobu:** user_id z auth.user, NIE z request
3. **Exercise access control:** Sprawdzenie że exercise jest system LUB należy do usera
4. **Transakcja:** Atomowość - rollback przy jakimkolwiek błędzie
5. **Walidacja dat:** Regex ISO 8601, akceptujemy backdating
6. **Walidacja liczb:** Min/max zgodnie z DB constraints
7. **RLS Policies:**
   - INSERT workouts: `user_id = auth.uid()`
   - INSERT workout_sets: przez workout ownership
8. **Limit sets:** Rozważyć max 100 sets per workout (DOS prevention)

## 7. Obsługa błędów

| Scenariusz         | Kod | Odpowiedź                                         | Logowanie |
| ------------------ | --- | ------------------------------------------------- | --------- |
| Sukces             | 201 | WorkoutDetailsDTO                                 | Nie       |
| Brak auth          | 401 | `{ message: "Unauthorized" }`                     | Nie       |
| Invalid body       | 400 | `{ message: "Invalid request body" }`             | Nie       |
| Empty sets         | 400 | `{ message: "At least one set is required" }`     | Nie       |
| Type mismatch      | 400 | `{ message: "Field mismatch for exercise type" }` | Nie       |
| Exercise not found | 404 | `{ message: "One or more exercises not found" }`  | Nie       |
| Transaction error  | 500 | `{ message: "Internal server error" }`            | Tak       |
| Calculation error  | 500 | `{ message: "Internal server error" }`            | Tak       |

## 8. Rozważania dotyczące wydajności

**Wąskie gardła:**

- Walidacja exercises wymaga query
- Multiple INSERTs w transakcji
- JOIN do pobrania danych po utworzeniu

**Optymalizacje:**

1. **Bulk exercise validation:** Jeden query dla wszystkich exercise_id
2. **Batch INSERT sets:** Użyj array insert zamiast pętli
3. **Single transaction:** Wszystko w jednej transakcji DB
4. **Index FK:** workout_id, exercise_id dla szybkich JOIN

**Supabase transaction:**
Supabase JS client nie wspiera transakcji natywnie - użyć:

- **Opcja A:** PostgreSQL function (RPC) z transakcją
- **Opcja B:** Multiple awaits z rollback handling

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie workout.service.ts

Dodaj: `createWorkout(supabase, userId, command)`

**Logika:**

1. Bulk validate exercises (jeden query z IN clause)
2. Sprawdź typy ćwiczeń vs pola setów
3. INSERT workout
4. Loop przez sets:
   - Oblicz 1RM i volume (jeśli strength)
   - Batch INSERT workout_sets
5. Query utworzony workout z JOIN
6. Mapuj do WorkoutDetailsDTO

### Krok 2: Funkcje pomocnicze

**calculate1RM(weight, reps):**

```typescript
// Wzór Brzycki: 1RM = weight / (1.0278 - 0.0278 * reps)
function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight / (1.0278 - 0.0278 * reps);
}
```

**calculateVolume(weight, reps):**

```typescript
function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}
```

### Krok 3: Dodanie POST do endpointu

**Plik:** `src/pages/api/workouts/index.ts`

```typescript
export async function POST(context: APIContext) {
  // 1. Guard: auth
  // 2. Parse + validate body
  // 3. Call service
  // 4. Try-catch with 404, 400, 500
  // 5. Return 201
}
```

### Krok 4: Walidacja typu ćwiczenia vs pola

W serwisie przed INSERT:

```typescript
for (const set of sets) {
  const exercise = exercisesMap.get(set.exercise_id);
  if (exercise.type === "strength") {
    // Może mieć weight/reps, NIE może distance/time
    if (set.distance || set.time) throw ValidationError;
  } else {
    // Może mieć distance/time, NIE może weight/reps
    if (set.weight || set.reps) throw ValidationError;
  }
}
```

### Krok 5: RLS Policies

```sql
CREATE POLICY "Users can insert own workouts"
ON workouts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert sets for own workouts"
ON workout_sets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE id = workout_sets.workout_id
    AND user_id = auth.uid()
  )
);
```

### Krok 6: Testy

- Sukces: strength exercise z weight/reps → 201 + calculated fields
- Sukces: cardio exercise z distance/time → 201
- Sukces: backdating (date w przeszłości)
- Błąd: empty sets array → 400
- Błąd: invalid exercise_id → 404
- Błąd: strength exercise z distance → 400
- Błąd: cardio exercise z weight → 400
- Błąd: bez autoryzacji → 401

### Krok 7: Optymalizacja - PostgreSQL Function (opcjonalnie)

Dla lepszej wydajności, utwórz DB function:

```sql
CREATE FUNCTION create_workout_with_sets(
  p_user_id uuid,
  p_date date,
  p_notes text,
  p_sets jsonb
) RETURNS jsonb AS $$
  -- Transaction logic here
$$ LANGUAGE plpgsql;
```

Wywołaj przez `.rpc('create_workout_with_sets', {...})`

## 10. Uwagi implementacyjne

**Best practices:**

- Guard clause dla auth
- Walidacja przed transakcją
- Atomowość operacji (rollback przy błędzie)
- Clear error messages
- TypeScript strict mode

**Wzór Brzycki dla 1RM:**

- Dokładny dla 1-10 reps
- Dla reps > 10 może być mniej dokładny

**Zależności:**

- Wymaga exercise.service.ts (do walidacji exercises)
- Middleware Astro z supabase
- Typy z src/types.ts
