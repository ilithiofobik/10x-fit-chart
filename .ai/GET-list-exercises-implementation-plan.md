# API Endpoint Implementation Plan: List Exercises

## 1. Przegląd punktu końcowego

**Cel:** Zwrócenie listy dostępnych ćwiczeń dla zalogowanego użytkownika (systemowe + prywatne).

**Kluczowe cechy:**

- Metoda: `GET /api/exercises`
- Wymaga autoryzacji (Supabase Auth)
- Zwraca ćwiczenia z obliczonym polem `is_system`
- Domyślnie ukrywa zarchiwizowane ćwiczenia
- Opcjonalne filtrowanie po typie

## 2. Szczegóły żądania

**Struktura URL:** `/api/exercises?type={strength|cardio}&include_archived={true|false}`

**Query Parameters:**

- `type` (opcjonalny): `strength` | `cardio`
- `include_archived` (opcjonalny): `true` | `false` (default: `false`)

**Headers:**

- `Authorization: Bearer {token}` (zarządzane przez Supabase)

## 3. Wykorzystywane typy

Z `src/types.ts`:

- `Exercise` - bazowa encja
- `ExerciseDTO` - z polem `is_system: boolean`
- `ListExercisesResponse` - `{ exercises: ExerciseDTO[] }`
- `ExerciseType` - `"strength" | "cardio"`

**Walidacja Zod (query parameters):**

```typescript
z.object({
  type: z.enum(['strength', 'cardio']).optional(),
  include_archived: z.coerce.boolean().optional().default(false)
})
```

## 4. Szczegóły odpowiedzi

**Sukces (200):**

```json
{
  "exercises": [
    {
      "id": "uuid",
      "user_id": null,
      "name": "Bench Press",
      "type": "strength",
      "is_archived": false,
      "is_system": true,
      "created_at": "2026-01-16T10:00:00Z",
      "updated_at": "2026-01-16T10:00:00Z"
    }
  ]
}
```

**Kody błędów:**

- `401` - Brak autoryzacji
- `400` - Nieprawidłowe parametry
- `500` - Błąd serwera

## 5. Przepływ danych

1. **Middleware** → Dodaje `supabase` do `context.locals`
2. **Endpoint** → Waliduje autoryzację (sprawdzenie sesji)
3. **Endpoint** → Waliduje query params (Zod)
4. **Service** → Pobiera dane z Supabase:
   - Filtr: `user_id IS NULL OR user_id = {current_user_id}`
   - Filtr: `type = {type}` (jeśli podano)
   - Filtr: `is_archived = false` (jeśli `include_archived !== true`)
5. **Service** → Mapuje `Exercise[]` → `ExerciseDTO[]` (dodaje `is_system`)
6. **Endpoint** → Zwraca `ListExercisesResponse`

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie:** Weryfikacja sesji Supabase (`getUser()`)
2. **Autoryzacja:** Filtrowanie na poziomie zapytania:
   - `user_id IS NULL` (systemowe)
   - `user_id = current_user.id` (prywatne użytkownika)
3. **Walidacja wejścia:** Zod dla query params
4. **RLS:** Konfiguracja Row Level Security w Supabase jako dodatkowa warstwa
5. **Brak information disclosure:** Użytkownik nie widzi ćwiczeń innych użytkowników

## 7. Obsługa błędów

| Scenariusz | Kod | Odpowiedź | Logowanie |
|------------|-----|-----------|-----------|
| Brak autoryzacji | 401 | `{ message: "Unauthorized" }` | Nie |
| Nieprawidłowe parametry | 400 | `{ message: "Invalid query parameters" }` | Nie |
| Błąd bazy danych | 500 | `{ message: "Internal server error" }` | Tak (console.error) |
| Nieoczekiwany błąd | 500 | `{ message: "Internal server error" }` | Tak (console.error) |

## 8. Etapy wdrożenia

### Krok 1: Utworzenie serwisu

**Plik:** `src/lib/services/exercise.service.ts`

Funkcja: `listExercises(supabase, userId, filters)`

- Parametry: `SupabaseClient`, `userId: string`, `{ type?, includeArchived? }`
- Zapytanie do tabeli `exercises` z filtrami
- Mapowanie: dodanie `is_system = user_id === null`
- Zwraca: `ExerciseDTO[]`
- Obsługa błędów bazy danych

### Krok 2: Utworzenie endpointu

**Plik:** `src/pages/api/exercises/index.ts`

```typescript
export const prerender = false;

export async function GET(context: APIContext) {
  // 1. Guard: Sprawdzenie autoryzacji
  // 2. Walidacja query params (Zod)
  // 3. Wywołanie service
  // 4. Try-catch z obsługą błędów
  // 5. Zwrócenie response
}
```

### Krok 3: Implementacja schematu walidacji

- Zdefiniowanie schematu Zod dla query params
- Parsowanie `context.url.searchParams`
- Obsługa błędów walidacji → 400

### Krok 4: Konfiguracja Row Level Security

**Supabase Policy dla tabeli `exercises`:**

```sql
CREATE POLICY "Users can view system and own exercises"
ON exercises FOR SELECT
USING (user_id IS NULL OR user_id = auth.uid());
```

### Krok 5: Testy manualne

- Test bez autoryzacji → 401
- Test z `type=strength` → tylko strength exercises
- Test z `include_archived=true` → zawiera archived
- Test domyślny → tylko aktywne, wszystkie typy
- Test ćwiczeń systemowych vs prywatnych

### Krok 6: Obsługa błędów i logowanie

- Dodanie try-catch w endpoincie
- Logowanie błędów serwera z kontekstem
- Zwracanie generycznych komunikatów użytkownikowi

### Krok 7: Optymalizacja

- Index na `(user_id, type, is_archived)` w bazie danych
- Cache policy dla ćwiczeń systemowych (rozważyć w przyszłości)

## 9. Uwagi implementacyjne

**Best practices:**

- Guard clauses na początku funkcji (autoryzacja, walidacja)
- Early returns dla błędów
- Happy path na końcu
- Użycie `context.locals.supabase` zamiast importu
- TypeScript strict mode

**Dependency:**

- Wymaga skonfigurowanego middleware Astro
- Wymaga aktywnej sesji Supabase
- Zależność od typów z `src/db/database.types.ts`
