# API Endpoint Implementation Plan: List Workouts

## 1. Przegląd punktu końcowego

**Cel:** Zwrócenie listy treningów użytkownika z paginacją, filtrowaniem po datach i agregowanymi statystykami.

**Kluczowe cechy:**

- Metoda: `GET /api/workouts`
- Wymaga autoryzacji (Supabase Auth)
- Paginacja (limit/offset)
- Filtrowanie po zakresie dat (start_date, end_date)
- Sortowanie po dacie (asc/desc)
- Agregowane liczniki (exercise_count, set_count)
- Metadata paginacji (total, has_more)

## 2. Szczegóły żądania

**Struktura URL:** `/api/workouts?limit=20&offset=0&start_date=2026-01-01&end_date=2026-01-31&order=desc`

**Query Parameters (wszystkie opcjonalne):**

- `limit`: liczba rekordów (1-100, default: 20)
- `offset`: przesunięcie (≥0, default: 0)
- `start_date`: początek zakresu dat (ISO 8601: YYYY-MM-DD)
- `end_date`: koniec zakresu dat (ISO 8601: YYYY-MM-DD)
- `order`: sortowanie po dacie (`asc` | `desc`, default: `desc`)

**Headers:**

- `Authorization: Bearer {token}` (zarządzane przez Supabase)

## 3. Wykorzystywane typy

Z `src/types.ts`:

- `WorkoutListItemDTO` - Workout + `exercise_count: number` + `set_count: number`
- `ListWorkoutsResponse` - `{ workouts: WorkoutListItemDTO[], pagination: PaginationDTO }`
- `PaginationDTO` - `{ total: number, limit: number, offset: number, has_more: boolean }`

**Walidacja Zod (query parameters):**

```typescript
z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

## 4. Szczegóły odpowiedzi

**Sukces (200):**

```json
{
  "workouts": [
    {
      "id": "uuid",
      "user_id": "user_uuid",
      "date": "2026-01-16",
      "notes": "Great session",
      "exercise_count": 5,
      "set_count": 15,
      "created_at": "2026-01-16T20:00:00Z",
      "updated_at": "2026-01-16T20:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**Kody błędów:**

- `401` - Brak autoryzacji
- `400` - Nieprawidłowe parametry (limit > 100, offset < 0, invalid date)
- `500` - Błąd serwera

## 5. Przepływ danych

1. **Middleware** → Dodaje `supabase` do `context.locals`
2. **Endpoint** → Weryfikuje autoryzację (getUser)
3. **Endpoint** → Waliduje query params (Zod)
4. **Service** → Wykonuje 2 zapytania do Supabase:
   - **Query 1 (COUNT):** Total workouts matching filters
   - **Query 2 (SELECT):** Workouts with JOIN do workout_sets dla agregacji:
     - Filtr: `user_id = {userId}`
     - Filtr: `date >= {start_date}` (jeśli podano)
     - Filtr: `date <= {end_date}` (jeśli podano)
     - Order: `date {asc|desc}`
     - Paginacja: `LIMIT {limit} OFFSET {offset}`
     - Agregacja: `COUNT(DISTINCT exercise_id)`, `COUNT(*)`
5. **Service** → Oblicza `has_more = offset + limit < total`
6. **Service** → Zwraca `ListWorkoutsResponse`
7. **Endpoint** → Zwraca 200 z response

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie:** Weryfikacja sesji Supabase (getUser)
2. **Autoryzacja:** Filtrowanie na poziomie zapytania (`user_id = current_user.id`)
3. **RLS Policy:** SELECT dla workouts z warunkiem `user_id = auth.uid()`
4. **Walidacja limit:** Max 100 zapobiega DOS przez zbyt duże zapytania
5. **Walidacja dat:** Regex dla ISO 8601 zapobiega injection
6. **N+1 Problem:** Agregacja w jednym query (JOIN lub subquery)
7. **Information disclosure:** Użytkownik widzi tylko własne treningi

## 7. Obsługa błędów

| Scenariusz          | Kod | Odpowiedź                                 | Logowanie |
| ------------------- | --- | ----------------------------------------- | --------- |
| Sukces              | 200 | ListWorkoutsResponse                      | Nie       |
| Brak autoryzacji    | 401 | `{ message: "Unauthorized" }`             | Nie       |
| limit > 100         | 400 | `{ message: "Invalid query parameters" }` | Nie       |
| offset < 0          | 400 | `{ message: "Invalid query parameters" }` | Nie       |
| Invalid date format | 400 | `{ message: "Invalid query parameters" }` | Nie       |
| Błąd DB (count)     | 500 | `{ message: "Internal server error" }`    | Tak       |
| Błąd DB (select)    | 500 | `{ message: "Internal server error" }`    | Tak       |

## 8. Rozważania dotyczące wydajności

**Wąskie gardła:**

- Agregacja exercise_count i set_count wymaga JOIN/subquery
- COUNT(\*) dla total może być wolny dla dużych zbiorów

**Optymalizacje:**

1. **Index na (user_id, date):** Przyspiesza filtrowanie i sortowanie
2. **Agregacja w jednym query:** Użyj LEFT JOIN do workout_sets z GROUP BY
3. **Limit COUNT:** Rozważyć cache dla total lub approximate count dla bardzo dużych zbiorów
4. **Order by date:** Index wspiera sortowanie

**Implementacja agregacji:**

```sql
SELECT
  w.*,
  COUNT(DISTINCT ws.exercise_id) as exercise_count,
  COUNT(ws.id) as set_count
FROM workouts w
LEFT JOIN workout_sets ws ON ws.workout_id = w.id
WHERE w.user_id = ?
  AND w.date >= ? AND w.date <= ?
GROUP BY w.id
ORDER BY w.date DESC
LIMIT ? OFFSET ?
```

## 9. Etapy wdrożenia

### Krok 1: Utworzenie serwisu

**Plik:** `src/lib/services/workout.service.ts`

Funkcja: `listWorkouts(supabase, userId, filters)`

- Parametry: `{ limit, offset, startDate?, endDate?, order }`
- Query 1: COUNT total workouts z filtrami
- Query 2: SELECT workouts z LEFT JOIN dla agregacji
- Mapowanie do WorkoutListItemDTO[]
- Obliczenie has_more
- Return: { workouts, pagination }

### Krok 2: Utworzenie endpointu

**Plik:** `src/pages/api/workouts/index.ts`

```typescript
export const prerender = false;

export async function GET(context: APIContext) {
  // 1. Guard: autoryzacja
  // 2. Walidacja query params (Zod)
  // 3. Wywołanie service
  // 4. Try-catch
  // 5. Return 200 z ListWorkoutsResponse
}
```

### Krok 3: Implementacja schematu walidacji

```typescript
const QueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

### Krok 4: Konfiguracja RLS

**Policy SELECT dla workouts:**

```sql
CREATE POLICY "Users can view own workouts"
ON workouts FOR SELECT
USING (user_id = auth.uid());
```

**Policy SELECT dla workout_sets (dla JOIN):**

```sql
CREATE POLICY "Users can view own workout sets"
ON workout_sets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workouts
    WHERE workouts.id = workout_sets.workout_id
    AND workouts.user_id = auth.uid()
  )
);
```

### Krok 5: Implementacja agregacji w serwisie

Użyj Supabase query builder z:

- `.select('*, workout_sets(exercise_id)')`
- Lub wykonaj COUNT w aplikacji po pobraniu danych
- Lub użyj raw SQL przez `.rpc()` dla lepszej wydajności

### Krok 6: Dodanie indeksów

```sql
CREATE INDEX idx_workouts_user_date ON workouts(user_id, date DESC);
CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);
```

### Krok 7: Testy manualne

- Test domyślny (bez params) → pierwszych 20, desc
- Test z limit=5 → 5 treningów
- Test z offset=10 → pomija pierwsze 10
- Test z start_date/end_date → tylko z zakresu
- Test z order=asc → najstarsze pierwsze
- Test paginacji: has_more = true/false
- Test bez autoryzacji → 401
- Test z limit > 100 → 400

## 10. Uwagi implementacyjne

**Best practices:**

- Guard clause dla autoryzacji
- Walidacja przed wywołaniem serwisu
- Agregacja w jednym query (avoid N+1)
- Index na (user_id, date) dla wydajności

**Zależności:**

- Wymaga middleware Astro
- Wymaga aktywnej sesji Supabase
- Typy z `src/types.ts`
