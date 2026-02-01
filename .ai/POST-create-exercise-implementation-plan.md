# API Endpoint Implementation Plan: Create Exercise

## 1. Przegląd punktu końcowego

**Cel:** Umożliwienie zalogowanemu użytkownikowi dodania własnego (prywatnego) ćwiczenia.

**Kluczowe cechy:**

- Metoda: `POST /api/exercises`
- Wymaga autoryzacji (Supabase Auth)
- Tworzy ćwiczenie użytkownika (user_id = authenticated user)
- Sprawdza unikalność nazwy dla użytkownika
- Zwraca 201 Created z pełnym ExerciseDTO

## 2. Szczegóły żądania

**Struktura URL:** `/api/exercises`

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer {token}` (zarządzane przez Supabase)

**Request Body (wszystkie pola wymagane):**

```json
{
  "name": "Cable Flyes",
  "type": "strength"
}
```

**Walidacja:**

- `name`: string, min 1 znak, max 100 znaków, trimmed
- `type`: enum ("strength" | "cardio")

## 3. Wykorzystywane typy

Z `src/types.ts`:

- `CreateExerciseCommand` - request body: `{ name: string, type: ExerciseType }`
- `ExerciseDTO` - response: Exercise + `is_system: boolean`
- `ExerciseType` - enum: `"strength" | "cardio"`

**Walidacja Zod (request body):**

```typescript
z.object({
  name: z.string().min(1).max(100).trim(),
  type: z.enum(["strength", "cardio"]),
});
```

## 4. Szczegóły odpowiedzi

**Sukces (201 Created):**

```json
{
  "id": "uuid",
  "user_id": "user_uuid",
  "name": "Cable Flyes",
  "type": "strength",
  "is_archived": false,
  "is_system": false,
  "created_at": "2026-01-16T11:00:00Z",
  "updated_at": "2026-01-16T11:00:00Z"
}
```

**Kody błędów:**

- `401` - Brak autoryzacji
- `400` - Nieprawidłowy request body
- `409` - Nazwa ćwiczenia już istnieje dla użytkownika
- `500` - Błąd serwera

## 5. Przepływ danych

1. **Middleware** → Dodaje `supabase` do `context.locals`
2. **Endpoint** → Weryfikuje autoryzację (getUser)
3. **Endpoint** → Parsuje i waliduje request body (Zod)
4. **Service** → Sprawdza unikalność nazwy dla użytkownika:
   - Query: `user_id = {userId} AND name = {name}`
   - Jeśli istnieje → throw ConflictError
5. **Service** → Insert do tabeli `exercises`:
   - `user_id`: z auth.user.id
   - `name`: z request body (trimmed)
   - `type`: z request body
   - `is_archived`: default false (DB default)
6. **Service** → Mapuje Exercise → ExerciseDTO (dodaje `is_system = false`)
7. **Endpoint** → Zwraca 201 z ExerciseDTO

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie:** Obowiązkowa weryfikacja sesji przed wykonaniem operacji
2. **Własność zasobu:** `user_id` MUSI pochodzić z `auth.user.id`, NIE z request body
3. **Walidacja długości:** Max 100 znaków (zgodnie z DB constraint) - zapobiega DoS
4. **Walidacja typu:** Tylko dozwolone wartości enum
5. **RLS Policy:** INSERT policy dla tabeli `exercises`:

   ```sql
   CREATE POLICY "Users can insert own exercises"
   ON exercises FOR INSERT
   WITH CHECK (user_id = auth.uid());
   ```

6. **Trimming:** Usunięcie białych znaków z nazwy przed zapisem
7. **Case sensitivity:** Rozważyć case-insensitive sprawdzanie duplikatów (future enhancement)

## 7. Obsługa błędów

| Scenariusz             | Kod | Odpowiedź                                               | Logowanie |
| ---------------------- | --- | ------------------------------------------------------- | --------- |
| Sukces                 | 201 | ExerciseDTO                                             | Nie       |
| Brak autoryzacji       | 401 | `{ message: "Unauthorized" }`                           | Nie       |
| Nieprawidłowy body     | 400 | `{ message: "Invalid request body", errors: {...} }`    | Nie       |
| Duplikat nazwy         | 409 | `{ message: "Exercise with this name already exists" }` | Nie       |
| Błąd DB (check unique) | 500 | `{ message: "Internal server error" }`                  | Tak       |
| Błąd DB (insert)       | 500 | `{ message: "Internal server error" }`                  | Tak       |

**Strategia:**

- Guard clause: 401 na początku (early return)
- Walidacja body: 400 z detalami błędów Zod
- Check duplikat: 409 (logika biznesowa, nie logujemy)
- Try-catch: 500 dla nieoczekiwanych błędów DB

## 8. Rozważania dotyczące wydajności

**Potencjalne wąskie gardła:**

- Sprawdzanie duplikatów wymaga dodatkowego query

**Optymalizacje:**

1. **Index na (user_id, name):** Przyspiesza sprawdzanie unikalności
2. **DB Constraint:** Dodanie UNIQUE constraint na (user_id, name) - zapobiega race conditions
3. **Transakcje:** Nie wymagane dla single insert

**Uwaga:**

- Operacja jest lekka (single row insert)
- Brak potrzeby cachowania (user-specific data)
- Rate limiting można rozważyć w przyszłości

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie serwisu

**Plik:** `src/lib/services/exercise.service.ts`

Dodaj funkcję: `createExercise(supabase, userId, command)`

```typescript
export async function createExercise(
  supabase: SupabaseClient,
  userId: string,
  command: CreateExerciseCommand
): Promise<ExerciseDTO>;
```

**Logika:**

1. Sprawdź czy nazwa istnieje dla użytkownika (query)
2. Jeśli tak → throw Error z odpowiednim komunikatem
3. Insert do `exercises` z user_id = userId
4. Mapuj Exercise → ExerciseDTO (is_system = false dla user exercises)
5. Return ExerciseDTO

### Krok 2: Dodanie POST handlera do endpointu

**Plik:** `src/pages/api/exercises/index.ts`

Dodaj funkcję `POST` obok istniejącego `GET`:

```typescript
export async function POST(context: APIContext): Promise<Response> {
  // 1. Guard: sprawdzenie autoryzacji
  // 2. Parsowanie i walidacja body (Zod)
  // 3. Wywołanie createExercise service
  // 4. Try-catch z obsługą błędów (409, 500)
  // 5. Return 201 z ExerciseDTO
}
```

### Krok 3: Schemat walidacji

Dodaj do pliku endpointu:

```typescript
const CreateExerciseBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  type: z.enum(["strength", "cardio"], {
    errorMap: () => ({ message: "Type must be 'strength' or 'cardio'" }),
  }),
});
```

### Krok 4: Obsługa błędów w serwisie

W `createExercise`:

- Custom error dla duplikatu: może być prosty Error z komunikatem
- Endpoint sprawdza message error i mapuje na odpowiedni kod (409 vs 500)
- Lub: użyć custom error class (np. `ConflictError`)

### Krok 5: Konfiguracja RLS w Supabase

**Policy INSERT:**

```sql
CREATE POLICY "Users can insert own exercises"
ON exercises FOR INSERT
WITH CHECK (user_id = auth.uid());
```

**Policy SELECT (już istnieje z GET):**

```sql
CREATE POLICY "Users can view system and own exercises"
ON exercises FOR SELECT
USING (user_id IS NULL OR user_id = auth.uid());
```

### Krok 6: Dodanie DB constraint (opcjonalne, ale zalecane)

```sql
ALTER TABLE exercises
ADD CONSTRAINT exercises_user_name_unique
UNIQUE (user_id, name);
```

**Uwaga:** To zapobiega race conditions na poziomie bazy danych.

### Krok 7: Testy manualne

- Test bez autoryzacji → 401
- Test z prawidłowymi danymi → 201 + ExerciseDTO
- Test z duplikatem nazwy → 409
- Test z nieprawidłowym typem → 400
- Test z pustą nazwą → 400
- Test z nazwą > 100 znaków → 400
- Test że `is_system = false` w odpowiedzi

## 10. Uwagi implementacyjne

**Best practices:**

- Guard clause dla autoryzacji na początku
- Walidacja przed wywołaniem serwisu
- Service rzuca errors, endpoint je obsługuje i mapuje na HTTP status
- Trim nazwy przed zapisem
- TypeScript strict mode

**Zależności:**

- Wymaga istniejącego `exercise.service.ts`
- Wymaga middleware Astro z supabase w locals
- Wymaga aktywnej sesji Supabase
- Typy z `src/types.ts`
