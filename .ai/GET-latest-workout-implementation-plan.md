# API Endpoint Implementation Plan: GET /api/workouts/latest

## 1. Przegląd punktu końcowego

Endpoint zwraca najnowszy (najświeższy chronologicznie) trening użytkownika wraz ze wszystkimi seriami i informacjami o ćwiczeniach. Służy do szybkiego podglądu ostatniej sesji treningowej lub jako punkt wyjścia do kopiowania treningu.

**Główne funkcjonalności:**

- Pobranie ostatniego treningu według daty
- Zwrócenie pełnych szczegółów (workout + sets + exercise metadata)
- Obsługa przypadku braku treningów (nowy użytkownik)

---

## 2. Szczegóły żądania

### HTTP Method & URL

```
GET /api/workouts/latest
```

**Parametry:** Brak (ani URL params, ani query string)

### Request Headers

- `Cookie: sb-access-token, sb-refresh-token` (sesja Supabase Auth)

---

## 3. Wykorzystywane typy

### Response DTOs

```typescript
// Response type
export type WorkoutDetailsDTO = Workout & {
  sets: WorkoutSetDTO[];
};

// Set with exercise info
export type WorkoutSetDTO = WorkoutSet & {
  exercise_name: string;
  exercise_type: ExerciseType;
};
```

Brak command modeli (endpoint GET bez body).

---

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

```json
{
  "id": "uuid",
  "user_id": "user_uuid",
  "date": "2026-01-15",
  "notes": "Great session",
  "created_at": "2026-01-15T20:00:00Z",
  "updated_at": "2026-01-15T20:00:00Z",
  "sets": [
    {
      "id": "set_uuid",
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
      "created_at": "2026-01-15T20:00:00Z",
      "updated_at": "2026-01-15T20:00:00Z"
    }
  ]
}
```

### Error Responses

| Status | Body                                   | Przypadek                   |
| ------ | -------------------------------------- | --------------------------- |
| 401    | `{ "error": "Unauthorized" }`          | Brak sesji użytkownika      |
| 404    | `{ "error": "No workouts found" }`     | Użytkownik nie ma treningów |
| 500    | `{ "error": "Internal server error" }` | Błąd bazy danych            |

---

## 5. Przepływ danych

### High-Level Flow

```
1. Request → Endpoint → Middleware (auth)
2. Service → getLatestWorkout(userId)
   a. Query workouts ORDER BY date DESC LIMIT 1
   b. If no workout → return null
   c. Query workout_sets for this workout
   d. Join exercises to get names & types
   e. Map to WorkoutDetailsDTO
3. Response:
   - If null → 404
   - If workout → 200 + WorkoutDetailsDTO
```

### Database Query

```sql
-- 1. Get latest workout
SELECT * FROM workouts
WHERE user_id = :userId
ORDER BY date DESC, created_at DESC
LIMIT 1;

-- 2. Get sets with exercise info (JOIN)
SELECT
  ws.*,
  e.name as exercise_name,
  e.type as exercise_type
FROM workout_sets ws
JOIN exercises e ON ws.exercise_id = e.id
WHERE ws.workout_id = :workoutId
ORDER BY ws.sort_order ASC;
```

**Supabase SDK equivalent:**

```typescript
// Single query with join
const { data, error } = await supabase
  .from("workouts")
  .select(
    `
    *,
    workout_sets (
      *,
      exercises (
        name,
        type
      )
    )
  `
  )
  .eq("user_id", userId)
  .order("date", { ascending: false })
  .order("created_at", { ascending: false })
  .limit(1)
  .single();
```

---

## 6. Względy bezpieczeństwa

### Checklist

- ✅ **Autentykacja** - Middleware sprawdza sesję Supabase Auth
- ✅ **Autoryzacja** - Query filtruje przez `user_id` z sesji
- ✅ **RLS Policy** - Supabase Row Level Security jako dodatkowa warstwa
- ✅ **No Input Validation** - Brak parametrów do walidacji
- ✅ **Private Data** - Użytkownik widzi tylko swoje treningi

### Expected RLS Policies

```sql
-- Dla workouts
CREATE POLICY "Users can read own workouts"
ON workouts FOR SELECT
USING (auth.uid() = user_id);

-- Dla workout_sets
CREATE POLICY "Users can read own workout sets"
ON workout_sets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM workouts
  WHERE workouts.id = workout_sets.workout_id
  AND workouts.user_id = auth.uid()
));
```

---

## 7. Obsługa błędów

### Error Handling Strategy

```typescript
// In endpoint
const user = context.locals.user;
if (!user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

try {
  const latestWorkout = await getLatestWorkout(supabase, user.id);

  if (!latestWorkout) {
    return new Response(JSON.stringify({ error: "No workouts found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(latestWorkout), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-cache",
    },
  });
} catch (error) {
  console.error("Error fetching latest workout:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Service Error Handling

```typescript
// In service
try {
  const { data, error } = await supabase.from("workouts")...;

  if (error) {
    console.error("Error fetching latest workout:", error);
    throw new Error("Failed to fetch latest workout");
  }

  // ... mapping logic
} catch (error) {
  console.error("Unexpected error in getLatestWorkout:", error);
  throw error;
}
```

---

## 8. Rozważania dotyczące wydajności

### Query Optimization

- **Single query** z nested select (Supabase foreign table join)
- **LIMIT 1** - pobiera tylko najnowszy rekord
- **Composite ORDER BY** - najpierw date, potem created_at

### Indexes (sprawdź/dodaj)

```sql
-- Index dla sortowania i filtrowania
CREATE INDEX IF NOT EXISTS idx_workouts_user_date
ON workouts(user_id, date DESC, created_at DESC);

-- Index dla workout_sets (foreign key)
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout
ON workout_sets(workout_id, sort_order);
```

### Cache Strategy

```typescript
// Cache headers (short cache for frequently accessed data)
headers: {
  "Content-Type": "application/json",
  "Cache-Control": "private, max-age=60, stale-while-revalidate=30"
}
```

**Uwagi:**

- `private` - cache tylko w przeglądarce użytkownika
- `max-age=60` - ważny przez 1 minutę
- `stale-while-revalidate=30` - może zwrócić stary przez 30s podczas revalidacji

### Expected Latency

- Auth check: ~5-10ms
- DB query (with join): ~30-80ms
- **Total:** ~50-100ms

---

## 9. Etapy wdrożenia

### Krok 1: Service Layer

**Lokalizacja:** `src/lib/services/workout.service.ts`

Dodaj funkcję:

```typescript
/**
 * Get user's latest workout with all sets and exercise info
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @returns WorkoutDetailsDTO or null if no workouts exist
 */
export async function getLatestWorkout(supabase: SupabaseClient, userId: string): Promise<WorkoutDetailsDTO | null> {
  // Query latest workout with sets and exercises
  const { data: workout, error } = await supabase
    .from("workouts")
    .select(
      `
      *,
      workout_sets (
        *,
        exercises (
          name,
          type
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() to allow null result

  if (error) {
    console.error("Error fetching latest workout:", error);
    throw new Error("Failed to fetch latest workout");
  }

  // If no workout exists
  if (!workout) {
    return null;
  }

  // Map workout_sets to WorkoutSetDTO
  const sets: WorkoutSetDTO[] = (workout.workout_sets || []).map((set: any) => {
    const exercise = set.exercises;
    return {
      ...set,
      exercise_name: exercise.name,
      exercise_type: exercise.type,
      exercises: undefined, // Remove nested exercises object
    };
  });

  // Sort sets by sort_order
  sets.sort((a, b) => a.sort_order - b.sort_order);

  // Remove workout_sets from workout object
  const { workout_sets, ...workoutData } = workout;

  // Return WorkoutDetailsDTO
  return {
    ...workoutData,
    sets,
  };
}
```

### Krok 2: API Endpoint

**Lokalizacja:** `src/pages/api/workouts/latest.ts`

```typescript
import type { APIRoute } from "astro";
import { getLatestWorkout } from "../../../lib/services/workout.service";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  // Auth check
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const latestWorkout = await getLatestWorkout(supabase, user.id);

    if (!latestWorkout) {
      return new Response(JSON.stringify({ error: "No workouts found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(latestWorkout), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/workouts/latest:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Krok 3: Testing

**Scenariusze testowe:**

1. ✅ Happy path (200) - użytkownik z treningami
2. ✅ No workouts (404) - nowy użytkownik
3. ✅ No auth (401) - brak sesji
4. ✅ Multiple workouts - zwraca najnowszy
5. ✅ Same date - zwraca ostatni created_at

**Przykładowe testy (curl):**

```bash
# Test 1: Authorized user with workouts
curl -X GET http://localhost:4321/api/workouts/latest \
  -H "Cookie: sb-access-token=..."
# Expected: 200 + WorkoutDetailsDTO

# Test 2: New user
curl -X GET http://localhost:4321/api/workouts/latest \
  -H "Cookie: sb-access-token=..."
# Expected: 404 + { "error": "No workouts found" }

# Test 3: No auth
curl -X GET http://localhost:4321/api/workouts/latest
# Expected: 401 + { "error": "Unauthorized" }
```

### Krok 4: Code Review Checklist

- [ ] Service function `getLatestWorkout` implemented
- [ ] Handles null case (no workouts)
- [ ] Endpoint file created at correct path
- [ ] Auth check present (401 handling)
- [ ] 404 handling for no workouts
- [ ] Sets are sorted by sort_order
- [ ] Exercise info properly mapped
- [ ] Error logging consistent
- [ ] Cache headers configured
- [ ] TypeScript compiles without errors
- [ ] Manual tests passed

---

## 10. Podsumowanie

Endpoint `GET /api/workouts/latest` umożliwia szybkie pobranie ostatniej sesji treningowej użytkownika z pełnymi szczegółami. Implementacja wykorzystuje single query z joinami dla optymalnej wydajności.

**Kluczowe punkty:**

- ✅ Brak parametrów - prosty endpoint
- ✅ Single query z nested select (performance)
- ✅ Obsługa przypadku braku treningów (404)
- ✅ Proper sorting (date DESC, created_at DESC)
- ✅ Cache headers (60s TTL)
- ✅ Security przez user_id filtering + RLS

**Estimated implementation time:** 1-2 godziny
