# Supabase Migrations

Ten folder zawiera migracje SQL dla bazy danych Supabase.

## Struktura

```
supabase/
└── migrations/
    └── 20260130_delete_user_account_function.sql
```

## Jak zastosować migracje

### Opcja 1: Ręcznie w Supabase Dashboard (zalecane dla MVP)

1. Otwórz Supabase Dashboard: https://supabase.com/dashboard
2. Wybierz swój projekt
3. Przejdź do **SQL Editor** (w menu bocznym)
4. Kliknij **New Query**
5. Skopiuj zawartość pliku `migrations/20260130_delete_user_account_function.sql`
6. Wklej do edytora
7. Kliknij **Run** (lub Ctrl+Enter)
8. Sprawdź czy sukces: powinieneś zobaczyć "Success. No rows returned"

### Opcja 2: Supabase CLI (dla zaawansowanych)

```bash
# Zainstaluj Supabase CLI (jeśli nie masz)
npm install -g supabase

# Zaloguj się
supabase login

# Link do projektu
supabase link --project-ref your-project-ref

# Zastosuj migracje
supabase db push
```

## Weryfikacja

Po zastosowaniu migracji, sprawdź czy funkcja istnieje:

```sql
-- W SQL Editor wykonaj:
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'delete_user_account';
```

Powinieneś zobaczyć:
```
routine_name: delete_user_account
routine_type: FUNCTION
```

## Testowanie funkcji (opcjonalne)

⚠️ **UWAGA:** To usunie twoje konto! Testuj tylko na testowym użytkowniku.

```sql
-- Będąc zalogowanym jako testowy user, wykonaj:
SELECT delete_user_account();
```

Powinieneś otrzymać:
```json
{
  "success": true,
  "user_id": "...",
  "deleted_workouts": 0,
  "deleted_exercises": 0,
  "message": "User account deleted successfully"
}
```

## Co robi funkcja?

Funkcja `delete_user_account()`:
1. Pobiera ID zalogowanego użytkownika (`auth.uid()`)
2. Usuwa wszystkie workouts użytkownika (cascade → workout_sets)
3. Usuwa wszystkie custom exercises użytkownika
4. Usuwa użytkownika z `auth.users`
5. Zwraca podsumowanie wykonanych operacji

**Bezpieczeństwo:**
- Używa `SECURITY DEFINER` aby mieć uprawnienia do usunięcia z `auth.users`
- Automatycznie weryfikuje autentykację (`auth.uid()`)
- Tylko zalogowany użytkownik może usunąć swoje własne konto
- Obsługa błędów i rollback transakcji

## Troubleshooting

### Problem: "permission denied for table auth.users"

To normalne! Dlatego używamy `SECURITY DEFINER`. Upewnij się, że funkcja została utworzona z tym atrybutem.

### Problem: "function delete_user_account() does not exist"

Migracja nie została zastosowana. Wykonaj kroki z sekcji "Jak zastosować migracje".

### Problem: "Not authenticated"

Funkcja wymaga zalogowanego użytkownika. Sprawdź czy sesja jest aktywna.
