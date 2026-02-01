# API Endpoint Implementation Plan: PUT /api/exercises/:id

## 1. Przegląd punktu końcowego

Endpoint służy do aktualizacji nazwy ćwiczenia utworzonego przez użytkownika. Umożliwia zmianę nazwy tylko dla ćwiczeń prywatnych (nie-systemowych), które należą do zalogowanego użytkownika.

**Główne funkcjonalności:**

- Edycja nazwy prywatnego ćwiczenia
- Walidacja właścicielstwa zasobu
- Blokada modyfikacji ćwiczeń systemowych
- Walidacja unikalności nazwy

---

## 2. Szczegóły żądania

### HTTP Method & URL

```
PUT /api/exercises/:id
```

**Route Parameters:**

- `id` (string, required) - UUID ćwiczenia do zaktualizowania

### Request Headers

- `Content-Type: application/json`
- `Cookie: sb-access-token, sb-refresh-token` (sesja Supabase Auth)

### Request Body

```json
{
  "name": "Cable Flyes (Incline)"
}
```

**Body Schema:**

- `name` (string, required) - Nowa nazwa ćwiczenia (1-100 znaków po trim)

---

## 3. Wykorzystywane typy

### DTOs

```typescript
// Request
export interface UpdateExerciseCommand {
  name: string;
}

// Response
export type ExerciseDTO = Exercise & {
  is_system: boolean;
};
```

### Zod Schemas

```typescript
const uuidParamSchema = z.string().uuid("Invalid exercise ID format");

const updateExerciseSchema = z.object({
  name: z
    .string({ required_error: "Exercise name is required" })
    .trim()
    .min(1, "Exercise name cannot be empty")
    .max(100, "Exercise name must not exceed 100 characters"),
});
```

---

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Cable Flyes (Incline)",
  "type": "strength",
  "is_archived": false,
  "is_system": false,
  "created_at": "2026-01-16T11:00:00Z",
  "updated_at": "2026-01-31T14:30:00Z"
}
```

### Error Responses

| Status | Error                                  | Przypadek                                  |
| ------ | -------------------------------------- | ------------------------------------------ |
| 400    | Invalid input                          | Błędna walidacja (pusty name, zły UUID)    |
| 401    | Unauthorized                           | Brak sesji użytkownika                     |
| 403    | Cannot modify system exercise          | Próba edycji ćwiczenia systemowego         |
| 404    | Exercise not found                     | Nie istnieje lub nie należy do użytkownika |
| 409    | Exercise with this name already exists | Duplikat nazwy                             |
| 500    | Internal server error                  | Błąd bazy danych                           |

---

## 5. Przepływ danych

### High-Level Flow

```
1. Request → Endpoint → Middleware (auth)
2. Validate params (UUID) & body (name)
3. Service → updateExercise()
   a. Fetch exercise (verify exists)
   b. Check ownership (user_id = userId)
   c. Check not system (user_id IS NOT NULL)
   d. Check name uniqueness (exclude current exercise)
   e. UPDATE in database
4. Map to ExerciseDTO (add is_system field)
5. Response → 200 + ExerciseDTO
```

### Database Operations

```sql
-- 1. Fetch for validation
SELECT * FROM exercises WHERE id = :id LIMIT 1;

-- 2. Check uniqueness
SELECT id FROM exercises
WHERE user_id = :userId AND name = :name AND id != :id LIMIT 1;

-- 3. Update
UPDATE exercises SET name = :name WHERE id = :id RETURNING *;
```

---

## 6. Względy bezpieczeństwa

### Checklist

- ✅ **Autentykacja** - Middleware sprawdza sesję Supabase Auth
- ✅ **Autoryzacja** - Weryfikacja ownership (`user_id === userId`)
- ✅ **System Exercise Protection** - Blokada edycji gdy `user_id IS NULL`
- ✅ **Input Validation** - Zod schema (XSS protection)
- ✅ **UUID Validation** - Zapobiega injection attacks
- ✅ **RLS Policy** - Supabase Row Level Security jako dodatkowa warstwa

### RLS Policy (sprawdź/dodaj w bazie)

```sql
CREATE POLICY "Users can update own exercises"
ON exercises FOR UPDATE
USING (auth.uid() = user_id);
```

---

## 7. Obsługa błędów

### Custom Error Classes

```typescript
// Dodaj w src/lib/services/exercise.service.ts
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

// Już istnieje: ExerciseConflictError
```

### Error Mapping

```typescript
try {
  // validation & service call
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: "Invalid input",
        details: error.errors.map((e) => e.message),
      }),
      { status: 400 }
    );
  }
  if (error instanceof ForbiddenError) {
    return new Response(JSON.stringify({ error: error.message }), { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return new Response(JSON.stringify({ error: error.message }), { status: 404 });
  }
  if (error instanceof ExerciseConflictError) {
    return new Response(JSON.stringify({ error: error.message }), { status: 409 });
  }
  console.error("Unexpected error:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
}
```

---

## 8. Rozważania dotyczące wydajności

### Database Indexes (dodaj jeśli nie istnieją)

```sql
-- migrations/YYYYMMDD_add_exercise_indexes.sql
CREATE INDEX IF NOT EXISTS idx_exercises_user_name ON exercises(user_id, name);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
```

### Cache Headers

```typescript
headers: {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate"
}
```

### Performance Metrics

- **Queries:** 3 (fetch, uniqueness check, update)
- **Expected latency:** 100-200ms
- **Optimizations:** Connection pooling (Supabase), indexes, Cloudflare Edge

---

## 9. Etapy wdrożenia

### Krok 1: Service Layer

**Lokalizacja:** `src/lib/services/exercise.service.ts`

Dodaj error classes i funkcję:

```typescript
export async function updateExercise(
  supabase: SupabaseClient,
  userId: string,
  exerciseId: string,
  command: UpdateExerciseCommand
): Promise<ExerciseDTO> {
  const { name } = command;

  // 1. Fetch exercise
  const { data: exercise, error: fetchError } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();

  if (fetchError || !exercise) {
    throw new NotFoundError("Exercise not found");
  }

  // 2. Check ownership
  if (exercise.user_id !== userId) {
    throw new NotFoundError("Exercise not found");
  }

  // 3. Check if system
  if (exercise.user_id === null) {
    throw new ForbiddenError("Cannot modify system exercise");
  }

  // 4. Check uniqueness
  const { data: existing, error: checkError } = await supabase
    .from("exercises")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .neq("id", exerciseId)
    .limit(1);

  if (checkError) {
    console.error("Error checking uniqueness:", checkError);
    throw new Error("Failed to check exercise name uniqueness");
  }

  if (existing && existing.length > 0) {
    throw new ExerciseConflictError("Exercise with this name already exists");
  }

  // 5. Update
  const { data: updated, error: updateError } = await supabase
    .from("exercises")
    .update({ name })
    .eq("id", exerciseId)
    .select()
    .single();

  if (updateError || !updated) {
    console.error("Error updating exercise:", updateError);
    throw new Error("Failed to update exercise");
  }

  // 6. Map to DTO
  return { ...updated, is_system: false };
}
```

### Krok 2: API Endpoint

**Lokalizacja:** `src/pages/api/exercises/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import type { UpdateExerciseCommand } from "../../../types";
import {
  updateExercise,
  ExerciseConflictError,
  NotFoundError,
  ForbiddenError,
} from "../../../lib/services/exercise.service";

export const prerender = false;

const uuidParamSchema = z.string().uuid("Invalid exercise ID format");

const updateExerciseSchema = z.object({
  name: z
    .string({ required_error: "Exercise name is required" })
    .trim()
    .min(1, "Exercise name cannot be empty")
    .max(100, "Exercise name must not exceed 100 characters"),
});

export const PUT: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const exerciseId = uuidParamSchema.parse(context.params.id);
    const body = await context.request.json();
    const validatedData: UpdateExerciseCommand = updateExerciseSchema.parse(body);

    const updatedExercise = await updateExercise(supabase, user.id, exerciseId, validatedData);

    return new Response(JSON.stringify(updatedExercise), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    // Error handling (patrz sekcja 7)
  }
};
```

### Krok 3: Database Setup

1. Dodaj indexy (jeśli nie istnieją)
2. Sprawdź RLS policy
3. Verify trigger na `updated_at`

### Krok 4: Testing

**Scenariusze testowe:**

1. ✅ Happy path (200)
2. ✅ Invalid UUID (400)
3. ✅ Empty name (400)
4. ✅ No auth (401)
5. ✅ System exercise (403)
6. ✅ Not found (404)
7. ✅ Duplicate name (409)

### Krok 5: Code Review Checklist

- [ ] Service function implemented
- [ ] Error classes added and exported
- [ ] Endpoint file created in correct location
- [ ] Auth check present
- [ ] All error cases handled
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Database indexes added
- [ ] RLS policy configured
- [ ] Manual tests passed

---

## 10. Podsumowanie

Endpoint `PUT /api/exercises/:id` umożliwia użytkownikom edycję nazw swoich prywatnych ćwiczeń z pełną walidacją, ochroną przed nieautoryzowanym dostępem i sprawdzaniem unikalności nazw.

**Kluczowe punkty:**

- ✅ Walidacja wejścia przez Zod
- ✅ Autoryzacja na poziomie użytkownika i zasobu
- ✅ Ochrona ćwiczeń systemowych
- ✅ Sprawdzanie unikalności nazwy
- ✅ Spójne kody błędów HTTP
- ✅ Performance optimization (indexy)
- ✅ Security best practices (RLS, input validation)

**Estimated implementation time:** 2-3 godziny
