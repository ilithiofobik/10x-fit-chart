# Przewodnik testowania systemu autentykacji

## Wymagania wstępne

### 1. Sprawdź zmienne środowiskowe

Upewnij się, że plik `.env` zawiera:

```env
SUPABASE_URL=http://127.0.0.1:55321
SUPABASE_KEY=your_anon_key_here
```

### 2. Uruchom Supabase lokalnie (jeśli używasz local dev)

```bash
# Jeśli używasz Supabase CLI
supabase start
```

### 3. Uruchom dev server

```bash
npm run dev
```

---

## Scenariusze testowe

### Test 1: Rejestracja nowego użytkownika ✓

**Kroki:**

1. Otwórz http://localhost:4321/
2. Kliknij "Rozpocznij za darmo" lub wejdź na /register
3. Wypełnij formularz:
   - Email: `test@example.com`
   - Hasło: `password123`
   - Powtórz hasło: `password123`
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**

- ✅ Toast: "Konto utworzone pomyślnie"
- ✅ Automatyczne przekierowanie na `/app/dashboard`
- ✅ Widoczny dashboard z nawigacją
- ✅ User menu w prawym górnym rogu pokazuje inicjał (T)

**Sprawdź w DevTools (Application → Cookies):**

- ✅ Cookie `sb-access-token` jest ustawiony
- ✅ Cookie `sb-refresh-token` jest ustawiony

---

### Test 2: Duplikat email przy rejestracji ❌

**Kroki:**

1. Wejdź ponownie na /register
2. Użyj tego samego emaila: `test@example.com`
3. Hasło: `newpassword123`
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**

- ❌ Toast: "Ten adres email jest już zarejestrowany"
- ❌ HTTP Status 409 (sprawdź w Network tab)
- ✅ Formularz pozostaje otwarty

---

### Test 3: Walidacja formularza rejestracji 🔍

**Test 3.1: Nieprawidłowy email**

- Email: `invalid-email`
- Hasło: `password123`
- Błąd: "Nieprawidłowy format adresu email"

**Test 3.2: Hasło za krótkie**

- Email: `test2@example.com`
- Hasło: `short`
- Błąd: "Hasło musi mieć minimum 8 znaków"

**Test 3.3: Niezgodne hasła**

- Email: `test2@example.com`
- Hasło: `password123`
- Powtórz hasło: `different123`
- Błąd: "Hasła muszą być identyczne"

---

### Test 4: Logowanie ✓

**Kroki:**

1. Jeśli jesteś zalogowany, najpierw się wyloguj (User menu → Wyloguj się)
2. Wejdź na http://localhost:4321/login
3. Wprowadź credentials:
   - Email: `test@example.com`
   - Hasło: `password123`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- ✅ Toast: "Zalogowano pomyślnie"
- ✅ Przekierowanie na `/app/dashboard`
- ✅ Dashboard jest widoczny
- ✅ Cookies są ustawione

---

### Test 5: Nieprawidłowe credentials przy logowaniu ❌

**Kroki:**

1. Wejdź na /login
2. Email: `test@example.com`
3. Hasło: `wrongpassword`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**

- ❌ Toast: "Nieprawidłowy email lub hasło"
- ❌ HTTP Status 401
- ✅ Formularz pozostaje otwarty

---

### Test 6: Middleware - ochrona tras 🛡️

**Test 6.1: Niezalogowany próbuje wejść na chronioną trasę**

1. Wyloguj się (jeśli zalogowany)
2. Ręcznie wejdź na: http://localhost:4321/app/dashboard

**Oczekiwany rezultat:**

- ✅ Automatyczne przekierowanie na `/login`

**Test 6.2: Zalogowany próbuje wejść na stronę logowania**

1. Zaloguj się
2. Ręcznie wejdź na: http://localhost:4321/login

**Oczekiwany rezultat:**

- ✅ Automatyczne przekierowanie na `/app/dashboard`

---

### Test 7: Landing page - warunkowe przyciski 🎨

**Test 7.1: Dla niezalogowanego**

1. Wyloguj się
2. Wejdź na http://localhost:4321/

**Oczekiwany rezultat:**

- ✅ Widoczne 2 przyciski:
  - "Rozpocznij za darmo" (primary)
  - "Zaloguj się" (outline)

**Test 7.2: Dla zalogowanego**

1. Zaloguj się
2. Wejdź na http://localhost:4321/

**Oczekiwany rezultat:**

- ✅ Widoczny 1 przycisk:
  - "Przejdź do aplikacji"
- ✅ Kliknięcie przenosi na `/app/dashboard`

---

### Test 8: Nawigacja aplikacji 🧭

**Kroki:**

1. Zaloguj się
2. Sprawdź nagłówek (AppHeader)

**Oczekiwany rezultat:**

- ✅ Logo: "10xFitChart" (link do /app/dashboard)
- ✅ Nawigacja desktopowa (widoczna na >= md):
  - Dashboard
  - Loguj
  - Historia
  - Ćwiczenia
- ✅ User menu (Avatar z inicjałem)
- ✅ Hamburger menu (widoczne na < md)

**Sprawdź user menu (kliknij avatar):**

- ✅ Email użytkownika
- ✅ Link "Profil" → /app/profile
- ✅ Przycisk "Wyloguj się"

---

### Test 9: Wylogowanie ✓

**Kroki:**

1. Będąc zalogowanym, kliknij Avatar
2. Kliknij "Wyloguj się"

**Oczekiwany rezultat:**

- ✅ Toast: "Wylogowano pomyślnie"
- ✅ Przekierowanie na `/` (landing page)
- ✅ Widoczne przyciski dla niezalogowanych
- ✅ Cookies są usunięte (sprawdź DevTools)
- ✅ Próba wejścia na /app/dashboard → redirect /login

---

### Test 10: Strona profilu 👤

**Kroki:**

1. Zaloguj się
2. Wejdź na http://localhost:4321/app/profile
   lub User menu → Profil

**Oczekiwany rezultat:**

- ✅ Widoczne sekcje:
  - "Informacje o koncie" (email, ID)
  - "Akcje" (przycisk Wyloguj się)
  - "Strefa niebezpieczna" (przycisk Usuń konto)

---

### Test 11: Usuwanie konta (US-003) ⚠️

**⚠️ UWAGA:** Ten test jest destruktywny! Użyj testowego konta.

**Kroki:**

1. Zaloguj się na konto testowe
2. Wejdź na /app/profile
3. W sekcji "Strefa niebezpieczna" kliknij "Usuń konto"
4. Pojawi się modal z AlertDialog
5. Przeczytaj ostrzeżenie
6. Kliknij "Tak, usuń moje konto"

**Oczekiwany rezultat:**

- ✅ Modal z jasnym ostrzeżeniem:
  - "Czy na pewno chcesz usunąć konto?"
  - "Ta akcja jest nieodwracalna..."
- ✅ Przycisk "Anuluj" (zamyka modal)
- ✅ Przycisk "Tak, usuń moje konto" (destructive style)
- ✅ Po potwierdzeniu:
  - Toast: "Konto zostało usunięte"
  - Przekierowanie na `/`
  - Próba zalogowania na to samo konto → błąd

**Sprawdź w Supabase Dashboard:**

- ✅ User został usunięty z `auth.users`
- ✅ Wszystkie workouts użytkownika zostały usunięte
- ✅ Wszystkie custom exercises zostały usunięte

---

### Test 12: Responsywność - mobile menu 📱

**Kroki:**

1. Zaloguj się
2. Zmień szerokość okna przeglądarki na < 768px
   lub użyj DevTools → Responsive mode

**Oczekiwany rezultat:**

- ✅ Nawigacja desktopowa ukryta
- ✅ Widoczny hamburger button (☰)
- ✅ Kliknięcie otwiera drawer z lewej strony
- ✅ W drawerze:
  - User info na górze (avatar + email)
  - Linki nawigacyjne (Dashboard, Loguj, Historia, Ćwiczenia)
  - Link "Profil" na dole
- ✅ Kliknięcie linku zamyka drawer i przenosi na stronę

---

### Test 13: Pokazuj/Ukryj hasło 👁️

**Kroki:**

1. Wejdź na /login lub /register
2. Zacznij wpisywać hasło
3. Kliknij przycisk "Pokaż" obok pola hasła

**Oczekiwany rezultat:**

- ✅ Hasło jest widoczne jako plain text
- ✅ Przycisk zmienia się na "Ukryj"
- ✅ Kliknięcie "Ukryj" ponownie maskuje hasło

---

### Test 14: Długość sesji (opcjonalny) ⏰

**Test długoterminowy - wymaga czekania:**

**Test 14.1: Access token refresh (1h)**

1. Zaloguj się
2. Czekaj 1 godzinę (lub zmień TTL w Supabase Dashboard)
3. Odśwież stronę /app/dashboard

**Oczekiwany rezultat:**

- ✅ Middleware automatycznie odświeża access token
- ✅ User pozostaje zalogowany
- ✅ Dashboard renderuje się poprawnie

**Test 14.2: Wygaśnięcie refresh token (7 dni)**

1. Zaloguj się
2. Czekaj 7 dni (lub ręcznie usuń cookies)
3. Odśwież stronę

**Oczekiwany rezultat:**

- ❌ Sesja wygasła
- ✅ Redirect na `/login`
- ✅ Toast: "Sesja wygasła. Zaloguj się ponownie"

---

## Checklist przed deployem na produkcję

### Environment

- [ ] `SUPABASE_URL` ustawiony na production URL
- [ ] `SUPABASE_KEY` ustawiony na production anon key
- [ ] (Opcjonalnie) `SUPABASE_SERVICE_ROLE_KEY` dla delete-account

### Supabase Dashboard

- [ ] Email Auth włączony
- [ ] Email confirmation wyłączone (zgodnie z MVP)
- [ ] RLS policies utworzone dla:
  - [ ] `exercises`
  - [ ] `workouts`
  - [ ] `workout_sets`
- [ ] (Zalecane) Database function `delete_user_account()` utworzona

### Security

- [ ] Rate limiting skonfigurowany (Cloudflare lub Supabase)
- [ ] HTTPS wymuszony (automatyczne przez Cloudflare Pages)
- [ ] CORS skonfigurowany poprawnie

### Testing

- [ ] Wszystkie powyższe testy przeprowadzone ✅
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Brak błędów w server logs

---

## Debugging tips 🐛

### Problem: Cookies nie są ustawiane

**Sprawdź:**

1. DevTools → Application → Cookies
2. Czy domena to localhost (nie 127.0.0.1)?
3. Czy `sameSite` jest ustawiony na "lax"?
4. Czy w dev środowisku `secure: false`?

### Problem: Redirect loop między /login i /app/dashboard

**Sprawdź:**

1. Czy middleware poprawnie wykrywa sesję?
2. Console log w middleware: `console.log('User:', user)`
3. Czy cookies są poprawnie odczytywane przez `supabaseServer()`?

### Problem: "Unauthorized" przy usuwaniu konta

**Sprawdź:**

1. Czy `locals.user` jest ustawiony w middleware?
2. Czy `requireAuth()` rzuca Response 401?
3. Console log w endpoint: `console.log('User from locals:', locals.user)`

### Problem: "Service role key required" przy delete-account

**Rozwiązanie:**

- Użyj database function zamiast `admin.deleteUser()`
- Lub dodaj `SUPABASE_SERVICE_ROLE_KEY` do env

---

## Metryki do monitorowania

Po wdrożeniu, monitoruj:

- **Czas rejestracji:** Średni czas od wejścia na /register do pierwszego dashboard view
- **Bounce rate na /login:** Odsetek użytkowników wychodzących po błędzie logowania
- **Session duration:** Średni czas trwania sesji użytkownika
- **Delete account rate:** Ile % użytkowników usuwa konto (powinno być niskie)

---

## Gotowe! 🎉

Po przejściu wszystkich testów system autentykacji jest w pełni funkcjonalny i zgodny z PRD (US-001, US-002, US-003).
