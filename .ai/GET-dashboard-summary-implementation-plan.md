# API Endpoint Implementation Plan: GET /api/analytics/dashboard

## 1. Przegląd punktu końcowego

Endpoint zwraca podsumowanie statystyk treningowych użytkownika za określony okres (domyślnie 3 miesiące). Zawiera agregaty (liczba treningów, serii, objętość, unikalne ćwiczenia) oraz listę ostatnich 5 treningów z metadanymi.

**Główne funkcjonalności:**
- Agregacja statystyk w okresie (months wstecz od dziś)
- Obliczanie total_volume z calculated_volume
- Lista ostatnich treningów z counts
- Parametr months (1-12)

---

## 2. Szczegóły żądania

### HTTP Method & URL
```
GET /api/analytics/dashboard?months=3
```

### Query Parameters
- `months` (number, optional) - Liczba miesięcy wstecz (1-12, default: 3)

### Request Headers
- `Cookie: sb-access-token, sb-refresh-token` (sesja Supabase Auth)

---

## 3. Wykorzystywane typy

### Response DTOs
```typescript
export interface DashboardSummaryDTO {
  period: PeriodDTO;
  summary: SummaryStatsDTO;
  recent_workouts: RecentWorkoutDTO[];
}

export interface PeriodDTO {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  months: number;     // 1-12
}

export interface SummaryStatsDTO {
  total_workouts: number;
  total_sets: number;
  total_volume: number;      // SUM(calculated_volume)
  unique_exercises: number;
}

export interface RecentWorkoutDTO {
  id: string;
  date: string;              // YYYY-MM-DD
  exercise_count: number;    // unique exercises
  set_count: number;         // total sets
}
```

### Zod Schema
```typescript
const monthsParamSchema = z.coerce
  .number()
  .int()
  .min(1, "Months must be at least 1")
  .max(12, "Months must be at most 12")
  .default(3);
```

---

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)
```json
{
  "period": {
    "start_date": "2025-10-16",
    "end_date": "2026-01-16",
    "months": 3
  },
  "summary": {
    "total_workouts": 36,
    "total_sets": 540,
    "total_volume": 125000.00,
    "unique_exercises": 12
  },
  "recent_workouts": [
    {
      "id": "uuid",
      "date": "2026-01-15",
      "exercise_count": 5,
      "set_count": 15
    }
  ]
}
```

### Error Responses

| Status | Body | Przypadek |
|--------|------|-----------|
| 400 | `{ "error": "Invalid input", "details": [...] }` | months < 1 lub > 12 |
| 401 | `{ "error": "Unauthorized" }` | Brak sesji |
| 500 | `{ "error": "Internal server error" }` | Błąd DB |

---

## 5. Przepływ danych

### High-Level Flow
```
1. Request → Validate months param (default 3)
2. Calculate period (start_date, end_date)
3. Query aggregates (workouts, sets, volume, exercises)
4. Query recent workouts (last 5 with counts)
5. Map to DashboardSummaryDTO
6. Response 200 + JSON
```

### Database Queries
```typescript
// 1. Summary aggregates
const { data: summary } = await supabase
  .from("workouts")
  .select(`
    id,
    workout_sets!inner(
      exercise_id,
      calculated_volume
    )
  `)
  .eq("user_id", userId)
  .gte("date", startDate)
  .lte("date", endDate);

// 2. Recent workouts
const { data: recent } = await supabase
  .from("workouts")
  .select(`
    id,
    date,
    workout_sets(id, exercise_id)
  `)
  .eq("user_id", userId)
  .order("date", { ascending: false })
  .order("created_at", { ascending: false })
  .limit(5);
```

### Logic
```typescript
// Calculate period
const endDate = new Date();
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - months);

// Aggregate from query results
total_workouts = workouts.length;
total_sets = sum of all sets;
total_volume = sum of calculated_volume (non-null);
unique_exercises = Set(exercise_ids).size;
```

---

## 6. Względy bezpieczeństwa

### Checklist
- ✅ **Auth** - Middleware sprawdza sesję
- ✅ **Authorization** - Filter przez user_id
- ✅ **Input validation** - Zod (months 1-12)
- ✅ **RLS** - Policies na workouts/workout_sets
- ✅ **Private data** - tylko dane użytkownika

### Cache Headers
```typescript
headers: {
  "Content-Type": "application/json",
  "Cache-Control": "private, max-age=300, stale-while-revalidate=60"
}
```
Cache: 5 minut (dane rzadko się zmieniają w krótkim czasie).

---

## 7. Obsługa błędów

```typescript
try {
  const months = monthsParamSchema.parse(url.searchParams.get("months"));
  const summary = await getDashboardSummary(supabase, user.id, months);
  return new Response(JSON.stringify(summary), { status: 200 });
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({ 
        error: "Invalid input", 
        details: error.errors.map(e => e.message) 
      }),
      { status: 400 }
    );
  }
  console.error("Error fetching dashboard summary:", error);
  return new Response(
    JSON.stringify({ error: "Internal server error" }),
    { status: 500 }
  );
}
```

---

## 8. Rozważania dotyczące wydajności

### Optimization
- **Single query** z nested select dla summary
- **Separate query** dla recent workouts
- **In-memory aggregation** (workouts count, sets count, volume sum)
- **Indexes** na (user_id, date)

### Expected Latency
- Auth: ~5-10ms
- Queries: ~50-150ms (2 queries)
- Aggregation: ~5-10ms
- **Total:** ~100-200ms

---

## 9. Etapy wdrożenia

### Krok 1: Service Layer
**Lokalizacja:** `src/lib/services/analytics.service.ts` (nowy plik)

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { DashboardSummaryDTO, PeriodDTO } from "../../types";

export async function getDashboardSummary(
  supabase: SupabaseClient,
  userId: string,
  months: number
): Promise<DashboardSummaryDTO> {
  // Calculate period
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const period: PeriodDTO = {
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    months,
  };

  // Query workouts with sets
  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select(`
      id,
      workout_sets!inner(
        id,
        exercise_id,
        calculated_volume
      )
    `)
    .eq("user_id", userId)
    .gte("date", period.start_date)
    .lte("date", period.end_date);

  if (workoutsError) {
    console.error("Error fetching workouts:", workoutsError);
    throw new Error("Failed to fetch dashboard data");
  }

  // Aggregate summary
  let total_sets = 0;
  let total_volume = 0;
  const unique_exercises = new Set<string>();

  (workouts || []).forEach(workout => {
    (workout.workout_sets || []).forEach(set => {
      total_sets++;
      if (set.calculated_volume) {
        total_volume += Number(set.calculated_volume);
      }
      unique_exercises.add(set.exercise_id);
    });
  });

  // Query recent workouts
  const { data: recentWorkouts, error: recentError } = await supabase
    .from("workouts")
    .select(`
      id,
      date,
      workout_sets(id, exercise_id)
    `)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentError) {
    console.error("Error fetching recent workouts:", recentError);
    throw new Error("Failed to fetch recent workouts");
  }

  // Map recent workouts
  const recent_workouts = (recentWorkouts || []).map(workout => {
    const sets = workout.workout_sets || [];
    const exercise_ids = new Set(sets.map(s => s.exercise_id));
    
    return {
      id: workout.id,
      date: workout.date,
      exercise_count: exercise_ids.size,
      set_count: sets.length,
    };
  });

  return {
    period,
    summary: {
      total_workouts: workouts?.length || 0,
      total_sets,
      total_volume,
      unique_exercises: unique_exercises.size,
    },
    recent_workouts,
  };
}
```

### Krok 2: API Endpoint
**Lokalizacja:** `src/pages/api/analytics/dashboard.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { getDashboardSummary } from "../../../lib/services/analytics.service";

export const prerender = false;

const monthsParamSchema = z.coerce
  .number()
  .int()
  .min(1, "Months must be at least 1")
  .max(12, "Months must be at most 12")
  .default(3);

export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const months = monthsParamSchema.parse(
      context.url.searchParams.get("months")
    );

    const summary = await getDashboardSummary(supabase, user.id, months);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: error.errors.map((e) => e.message),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Unexpected error in GET /api/analytics/dashboard:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Krok 3: Testing
```bash
# Happy path
curl "http://localhost:4321/api/analytics/dashboard?months=3" \
  -H "Cookie: sb-access-token=..."

# Custom months
curl "http://localhost:4321/api/analytics/dashboard?months=6"

# Invalid months
curl "http://localhost:4321/api/analytics/dashboard?months=13"
# Expected: 400

# No auth
curl "http://localhost:4321/api/analytics/dashboard"
# Expected: 401
```

### Krok 4: Checklist
- [x] Service created in correct location
- [x] Zod validation for months
- [x] Auth check (401)
- [x] Period calculation correct
- [x] Aggregates calculated properly
- [x] Recent workouts limited to 5
- [x] Cache headers configured
- [x] TypeScript compiles (no errors in new files)
- [ ] Manual tests passed (requires user testing with browser)

---

## 10. Podsumowanie

Endpoint `GET /api/analytics/dashboard` agreguje dane treningowe użytkownika za okres N miesięcy. Oblicza statystyki (workouts, sets, volume, exercises) i zwraca 5 ostatnich treningów.

**Kluczowe punkty:**
- ✅ Query param validation (months 1-12)
- ✅ Date range calculation
- ✅ In-memory aggregation (performance)
- ✅ Cache 5 minut
- ✅ Security przez user_id filtering

**Estimated time:** 2-3 godziny
