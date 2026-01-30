# Specyfikacja Techniczna Systemu Autentykacji - 10xFitChart MVP

## Spis treści
1. [Wstęp](#wstęp)
2. [Architektura Interfejsu Użytkownika](#architektura-interfejsu-użytkownika)
3. [Logika Backendowa](#logika-backendowa)
4. [System Autentykacji](#system-autentykacji)
5. [Przepływ Danych i Integracje](#przepływ-danych-i-integracje)
6. [Walidacja i Obsługa Błędów](#walidacja-i-obsługa-błędów)

---

## Wstęp

Niniejsza specyfikacja opisuje architekturę i implementację systemu autentykacji dla aplikacji 10xFitChart MVP. System realizuje wymagania US-001 (Rejestracja) i US-002 (Logowanie) z dokumentu PRD, wykorzystując stos technologiczny: **Astro 5 (SSR)**, **React 19**, **TypeScript 5**, **Tailwind 4**, **Shadcn/ui** oraz **Supabase Auth**.

### Zakres funkcjonalny
- **US-001**: Rejestracja nowego użytkownika (email + hasło, automatyczne logowanie po rejestracji)
- **US-002**: Logowanie użytkownika (email + hasło, przekierowanie do dashboardu)
- **US-003**: Trwałe usuwanie konta użytkownika (kaskadowe usunięcie danych, wylogowanie, przekierowanie na stronę główną)
- **Wylogowanie**: Zakończenie sesji i przekierowanie na stronę główną
- **Ochrona tras**: Middleware zabezpieczające dostęp do strefy `/app/*`

### Struktura URL aplikacji
Aplikacja dzieli się na dwie główne strefy URL:
- **Strefa publiczna**: `/` (landing), `/login`, `/register`
- **Strefa chroniona**: `/app/*` (wszystkie funkcjonalności wymagające logowania)
  - `/app/dashboard` - główny widok po zalogowaniu
  - `/app/log` - formularz logowania treningu
  - `/app/history` - historia treningów
  - `/app/exercises` - zarządzanie słownikiem ćwiczeń
  - `/app/profile` - profil użytkownika i ustawienia konta

### Ograniczenia MVP
- Brak funkcji odzyskiwania hasła (out-of-scope)
- Brak weryfikacji emaila (rejestracja bez potwierdzenia)
- Brak logowania społecznościowego (OAuth)
- Język interfejsu: polski

---

## Architektura Interfejsu Użytkownika

### 1.1. Podział na strefy aplikacji

Aplikacja dzieli się na **dwie główne strefy**, różniące się wymaganiami autoryzacyjnymi i sposobem renderowania:

#### Strefa Publiczna (Non-Auth)
- **Ścieżki**: `/`, `/login`, `/register`
- **Dostęp**: Publiczny (każdy użytkownik, niezależnie od stanu sesji)
- **Rendering**: Astro SSR (Server-Side Rendering)
- **Charakterystyka**: Strony statyczne z minimalnymi interakcjami React (wyspy)

#### Strefa Chroniona (Authenticated)
- **Ścieżki**: `/app/*` (np. `/app/dashboard`, `/app/log`, `/app/history`, `/app/exercises`, `/app/profile`)
- **Dostęp**: Wymaga aktywnej sesji użytkownika
- **Rendering**: Astro SSR + React Islands (dynamiczne komponenty)
- **Ochrona**: Middleware sprawdza sesję przed renderowaniem

### 1.2. Struktura stron i komponentów

#### 1.2.1. Landing Page (`/` - `src/pages/index.astro`)

**Stan obecny**: Strona sprawdza sesję użytkownika server-side i renderuje warunkowo przyciski CTA.

**Zmiany do wprowadzenia**:
- **Modyfikacja komponentu `HeroSection`**: Obecnie renderuje pojedynczy przycisk CTA, wymaga aktualizacji aby renderować:
  - Dla niezalogowanych: **dwa przyciski** - główny "Rozpocznij za darmo" (CTA do `/register`) i drugorzędny "Zaloguj się" (link do `/login`)
  - Dla zalogowanych: przycisk "Przejdź do aplikacji" (link do `/app/dashboard`)
- Komponent już obsługuje prop `isAuthenticated`, wymaga tylko rozszerzenia logiki renderowania przycisków

**Kluczowe komponenty**:
- `HeroSection` (React Island, client:load): 
  - Props: `isAuthenticated: boolean`
  - Renderuje warunkowo:
    - Jeśli `isAuthenticated === false`: 
      - Przycisk główny (CTA): "Rozpocznij za darmo" (link do `/register`)
      - Przycisk drugorzędny: "Zaloguj się" (link do `/login`)
    - Jeśli `isAuthenticated === true`: "Przejdź do aplikacji" (link do `/app/dashboard`)
- `FeatureGrid` (Astro statyczny): Lista zalet produktu
- `Footer` (Astro statyczny): Stopka z linkami

**Server-side logic (Astro frontmatter)**:
```typescript
// Pobierz sesję z Supabase
const supabase = supabaseServer(Astro);
const { data: { session }, error } = await supabase.auth.getSession();
const isAuthenticated = !!session && !error;
```

---

#### 1.2.2. Strona Rejestracji (`/register` - `src/pages/register.astro`)

**Cel**: Umożliwienie utworzenia nowego konta użytkownika.

**Struktura strony** (Astro SSR):
```typescript
// src/pages/register.astro
---
import Layout from "@/layouts/Layout.astro";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { supabaseServer } from "@/db/supabase-server";

// Sprawdź czy użytkownik jest już zalogowany
const supabase = supabaseServer(Astro);
const { data: { session } } = await supabase.auth.getSession();

// Przekieruj na dashboard jeśli zalogowany
if (session) {
  return Astro.redirect("/app/dashboard");
}
---

<Layout title="Rejestracja - 10xFitChart" description="Zarejestruj się w 10xFitChart">
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md">
      <RegisterForm client:load />
    </div>
  </div>
</Layout>
```

**Komponent `RegisterForm` (React, nowy plik: `src/components/auth/RegisterForm.tsx`)**:

**Struktura komponentu**:
- **Biblioteka formularza**: React Hook Form + Zod
- **UI**: Shadcn/ui (`Card`, `Input`, `Button`, `Label`)
- **Stany**:
  - `isLoading`: boolean (stan ładowania podczas rejestracji)
  - `error`: string | null (komunikat błędu globalnego)

**Pola formularza**:
1. **Email**:
   - Type: `email`
   - Walidacja: Format emaila (regex Zod), wymagane
   - Placeholder: "twoj@email.pl"
   
2. **Hasło**:
   - Type: `password`
   - Walidacja: Minimalna długość 8 znaków, wymagane
   - Placeholder: "Min. 8 znaków"
   - Dodatkowy UI: Przycisk "Pokaż/Ukryj" hasło (opcjonalny dla MVP)

3. **Powtórz hasło**:
   - Type: `password`
   - Walidacja: Musi być identyczne z polem "Hasło"
   - Placeholder: "Potwierdź hasło"
   - **Uwaga**: Pole nie jest wymienione w PRD, ale jest dodane jako dobra praktyka UX (zabezpieczenie przed literówkami)

**Akcje**:
- Przycisk "Zarejestruj się" (primary, disabled gdy `isLoading === true`)
- Link "Masz już konto? Zaloguj się" (link do `/login`)

**Logika submitu**:
```typescript
async function handleSubmit(data: RegisterFormData) {
  setIsLoading(true);
  setError(null);

  try {
    // 1. Wywołaj endpoint rejestracji
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Nieznany błąd');
    }

    // 2. Po sukcesie (201) - automatyczne logowanie następuje po stronie serwera
    // 3. Przekieruj na dashboard
    window.location.href = '/app/dashboard';
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}
```

**Walidacja client-side (Zod schema)**:
```typescript
const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"]
});
```

**Scenariusze błędów**:
- Email już istnieje (409): "Ten adres email jest już zarejestrowany"
- Problem z siecią: "Problem z połączeniem. Spróbuj ponownie."
- Błąd walidacji: Komunikaty pod konkretnymi polami

---

#### 1.2.3. Strona Logowania (`/login` - `src/pages/login.astro`)

**Cel**: Umożliwienie zalogowania się istniejącego użytkownika.

**Struktura strony** (Astro SSR):
```typescript
// src/pages/login.astro
---
import Layout from "@/layouts/Layout.astro";
import { LoginForm } from "@/components/auth/LoginForm";
import { supabaseServer } from "@/db/supabase-server";

// Sprawdź czy użytkownik jest już zalogowany
const supabase = supabaseServer(Astro);
const { data: { session } } = await supabase.auth.getSession();

// Przekieruj na dashboard jeśli zalogowany
if (session) {
  return Astro.redirect("/app/dashboard");
}
---

<Layout title="Logowanie - 10xFitChart" description="Zaloguj się do 10xFitChart">
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md">
      <LoginForm client:load />
    </div>
  </div>
</Layout>
```

**Komponent `LoginForm` (React, nowy plik: `src/components/auth/LoginForm.tsx`)**:

**Struktura komponentu**:
- **Biblioteka formularza**: React Hook Form + Zod
- **UI**: Shadcn/ui (`Card`, `Input`, `Button`, `Label`)
- **Toast**: Dla komunikatów błędów (biblioteka `sonner` lub Shadcn Toast)
- **Stany**:
  - `isLoading`: boolean
  - `error`: string | null

**Pola formularza**:
1. **Email**:
   - Type: `email`
   - Walidacja: Format emaila, wymagane
   - Placeholder: "twoj@email.pl"
   
2. **Hasło**:
   - Type: `password`
   - Walidacja: Wymagane
   - Placeholder: "Twoje hasło"

**Akcje**:
- Przycisk "Zaloguj się" (primary, disabled gdy `isLoading === true`)
- Link "Nie masz konta? Zarejestruj się" (link do `/register`)
- ~~Link "Zapomniałeś hasła?"~~ (out-of-scope dla MVP)

**Logika submitu**:
```typescript
async function handleSubmit(data: LoginFormData) {
  setIsLoading(true);
  setError(null);

  try {
    // 1. Wywołaj endpoint logowania
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Nieznany błąd');
    }

    // 2. Po sukcesie (200) - sesja ustawiona w cookie przez serwer
    // 3. Wyświetl toast sukcesu (opcjonalny)
    toast.success('Zalogowano pomyślnie');
    
    // 4. Przekieruj na dashboard
    window.location.href = '/app/dashboard';
  } catch (err) {
    // 5. Wyświetl błąd w Toast
    toast.error(err.message);
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}
```

**Walidacja client-side (Zod schema)**:
```typescript
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane")
});
```

**Scenariusze błędów**:
- Nieprawidłowe dane logowania (401): "Nieprawidłowy email lub hasło"
- Problem z siecią: "Problem z połączeniem. Spróbuj ponownie."
- Konto nieaktywne: "Twoje konto zostało zdezaktywowane"

---

#### 1.2.4. Dashboard (`/app/dashboard` - `src/pages/app/dashboard.astro`)

**Cel**: Główny widok po zalogowaniu - podsumowanie treningów i statystyk.

**Zmiany do wprowadzenia**:
- **Dodanie nowego layoutu** `LayoutApp.astro` (szczegóły poniżej)
- **Zastąpienie placeholder** aktualną zawartością dashboardu (zgodnie z ui-plan.md)
- **Brak zmian** w logice server-side auth (middleware chroni trasę)

**Struktura strony** (Astro SSR):
```typescript
// src/pages/app/dashboard.astro
---
import LayoutApp from "@/layouts/LayoutApp.astro";
// Import komponentów dashboardu (zgodnie z ui-plan.md)
---

<LayoutApp title="Dashboard - 10xFitChart">
  <!-- Zawartość dashboardu: StatsGrid, RecentWorkoutsList, ProgressChartWidget -->
</LayoutApp>
```

**Uwaga**: Szczegółowa implementacja dashboardu wykracza poza zakres autentykacji i jest opisana w ui-plan.md.

---

#### 1.2.5. Profil Użytkownika (`/app/profile` - `src/pages/app/profile.astro`)

**Cel**: Zarządzanie kontem użytkownika (wylogowanie, usunięcie konta).

**Realizuje**: US-003 (Usuwanie konta)

**Struktura strony** (Astro SSR):
```typescript
// src/pages/app/profile.astro
---
import LayoutApp from "@/layouts/LayoutApp.astro";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DeleteAccountButton } from "@/components/auth/DeleteAccountButton";
import { supabaseServer } from "@/db/supabase-server";

const supabase = supabaseServer(Astro);
const { data: { user } } = await supabase.auth.getUser();
---

<LayoutApp title="Profil - 10xFitChart">
  <div class="max-w-2xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-6">Profil użytkownika</h1>
    
    <div class="space-y-6">
      <div>
        <label class="text-sm text-muted-foreground">Email</label>
        <p class="text-lg">{user?.email}</p>
      </div>
      
      <div class="border-t pt-6">
        <SignOutButton client:load />
      </div>
      
      <div class="border-t pt-6">
        <h2 class="text-xl font-semibold mb-3 text-destructive">Strefa niebezpieczna</h2>
        <p class="text-sm text-muted-foreground mb-4">
          Usunięcie konta jest nieodwracalne i spowoduje trwałe usunięcie wszystkich Twoich danych.
        </p>
        <DeleteAccountButton client:load />
      </div>
    </div>
  </div>
</LayoutApp>
```

**Komponent `SignOutButton` (React, nowy plik: `src/components/auth/SignOutButton.tsx`)**:

**Struktura komponentu**:
```typescript
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SignOutButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Nie udało się wylogować');
      }
      
      // Przekieruj na stronę główną
      window.location.href = '/';
    } catch (err) {
      toast.error(err.message);
      setIsLoading(false);
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleSignOut} 
      disabled={isLoading}
    >
      {isLoading ? 'Wylogowywanie...' : 'Wyloguj się'}
    </Button>
  );
}
```

**Komponent `DeleteAccountButton` (React, nowy plik: `src/components/auth/DeleteAccountButton.tsx`)**:

**Cel**: Realizacja US-003 (Trwałe usuwanie konta użytkownika)

**Struktura komponentu**:
```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function DeleteAccountButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDeleteAccount() {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/delete-account', { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się usunąć konta');
      }
      
      // Przekieruj na stronę główną
      toast.success('Konto zostało usunięte');
      window.location.href = '/';
    } catch (err) {
      toast.error(err.message);
      setIsLoading(false);
      setIsOpen(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          Usuń konto
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta akcja jest nieodwracalna. Wszystkie Twoje dane (treningi, ćwiczenia, statystyki) 
            zostaną trwale usunięte z naszych serwerów.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Usuwanie...' : 'Tak, usuń moje konto'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Kryteria akceptacji (US-003)**:
- Modal z potwierdzeniem (AlertDialog z Shadcn/ui)
- Jasna informacja o konsekwencjach (nieodwracalność, usunięcie wszystkich danych)
- Kaskadowe usunięcie danych z bazy (przez RLS i polityki Supabase)
- Automatyczne wylogowanie i przekierowanie na stronę główną

---

### 1.3. Layouty

#### 1.3.1. Layout Podstawowy (`src/layouts/Layout.astro`)

**Stan obecny**: Podstawowy layout dla wszystkich stron (publicznych i chronionych).

**Zmiany do wprowadzenia**:
- **Brak zmian** - obecny layout jest wystarczający dla stron publicznych

**Struktura**:
- Standardowy HTML skeleton (head, body)
- Brak nawigacji (każda strona zarządza swoją strukturą)
- Slot dla zawartości

---

#### 1.3.2. Layout Aplikacji (`src/layouts/LayoutApp.astro` - **NOWY**)

**Cel**: Wspólny layout dla wszystkich stron w strefie `/app/*` z nawigacją i user menu.

**Struktura** (Astro SSR):
```typescript
// src/layouts/LayoutApp.astro
---
import Layout from "./Layout.astro";
import { AppHeader } from "@/components/layout/AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { supabaseServer } from "@/db/supabase-server";

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;

// Pobierz dane użytkownika dla user menu
const supabase = supabaseServer(Astro);
const { data: { user } } = await supabase.auth.getUser();
---

<Layout title={title} description={description}>
  <AppHeader user={user} client:load />
  
  <main class="max-w-7xl mx-auto px-4 py-6">
    <slot />
  </main>
  
  <Toaster position="top-right" />
</Layout>
```

**Komponent `AppHeader` (React, nowy plik: `src/components/layout/AppHeader.tsx`)**:

**Struktura komponentu**:
```typescript
interface AppHeaderProps {
  user: {
    email: string;
    id: string;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="max-w-7xl mx-auto px-4 flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="/app/dashboard" class="font-bold text-xl">10xFitChart</a>
        
        {/* Desktop Navigation */}
        <nav class="hidden md:flex gap-6">
          <a href="/app/dashboard">Dashboard</a>
          <a href="/app/log">Loguj</a>
          <a href="/app/history">Historia</a>
          <a href="/app/exercises">Ćwiczenia</a>
        </nav>
        
        {/* User Menu (Dropdown) */}
        <UserMenu user={user} />
        
        {/* Mobile Menu (Hamburger) */}
        <MobileMenu user={user} />
      </div>
    </header>
  );
}
```

**Komponent `UserMenu` (React)**:
- Dropdown z Shadcn/ui (`DropdownMenu`)
- Avatar z inicjałem emaila
- Opcje:
  - "Profil" (link do `/app/profile`)
  - Separator
  - "Wyloguj się" (wywołuje akcję wylogowania)

**Komponent `MobileMenu` (React)**:
- Hamburger button
- Sheet/Drawer (Shadcn/ui) z linkami nawigacyjnymi
- User info na górze drawer

---

### 1.4. Podsumowanie komponentów do stworzenia

**Nowe pliki React**:
1. `src/components/auth/RegisterForm.tsx`
2. `src/components/auth/LoginForm.tsx`
3. `src/components/auth/SignOutButton.tsx`
4. `src/components/auth/DeleteAccountButton.tsx` (realizacja US-003)
5. `src/components/layout/AppHeader.tsx`
6. `src/components/layout/UserMenu.tsx`
7. `src/components/layout/MobileMenu.tsx`

**Nowe pliki Astro**:
1. `src/layouts/LayoutApp.astro`

**Modyfikacje istniejących plików**:
1. `src/pages/login.astro` - zamiana placeholder na `LoginForm`
2. `src/pages/register.astro` - zamiana placeholder na `RegisterForm`
3. `src/pages/app/dashboard.astro` - zmiana layoutu na `LayoutApp`, rozwój zawartości
4. **Utworzenie** `src/pages/app/profile.astro` (nowy plik z funkcją usuwania konta)

---

## Logika Backendowa

### 2.1. Endpointy API

System autentykacji wymaga trzech nowych endpointów API:

#### 2.1.1. POST `/api/auth/register` - Rejestracja użytkownika

**Plik**: `src/pages/api/auth/register.ts`

**Typ**: API Route (Astro)

**Request Body**:
```typescript
{
  email: string;      // Wymagane, format email
  password: string;   // Wymagane, min. 8 znaków
}
```

**Walidacja**:
```typescript
const registerCommandSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków")
});
```

**Logika**:
1. Waliduj dane wejściowe za pomocą Zod
2. Wywołaj `supabase.auth.signUp({ email, password })`
3. Jeśli sukces:
   - Supabase automatycznie tworzy użytkownika w tabeli `auth.users`
   - Automatycznie loguje użytkownika (zwraca sesję)
   - Ustaw sesję w cookie (za pomocą `supabaseServer(Astro)`)
   - Zwróć 201 Created z `{ message: "Konto utworzone pomyślnie" }`
4. Jeśli błąd:
   - Email już istnieje: 409 Conflict `{ error: "Ten adres email jest już zarejestrowany" }`
   - Inne błędy: 400 Bad Request `{ error: "Nie udało się utworzyć konta" }`

**Kod (pseudo)**:
```typescript
// src/pages/api/auth/register.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseServer } from "@/db/supabase-server";

const registerCommandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Parse i waliduj body
  const body = await request.json();
  const validation = registerCommandSchema.safeParse(body);
  
  if (!validation.success) {
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { email, password } = validation.data;

  // 2. Utwórz klienta Supabase z obsługą cookies
  const supabase = supabaseServer({ cookies } as any); // Adapter do Astro.cookies

  // 3. Zarejestruj użytkownika
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined // Brak weryfikacji email w MVP
    }
  });

  if (error) {
    // Sprawdź typ błędu
    if (error.message.includes("already registered")) {
      return new Response(
        JSON.stringify({ error: "Ten adres email jest już zarejestrowany" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Nie udało się utworzyć konta" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Zwróć sukces (sesja już ustawiona w cookie przez supabaseServer)
  return new Response(
    JSON.stringify({ 
      message: "Konto utworzone pomyślnie",
      user: { id: data.user?.id, email: data.user?.email }
    }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
};
```

**Uwaga**: Adapter `supabaseServer` automatycznie zarządza ciasteczkami sesji, więc nie trzeba ręcznie ich ustawiać.

---

#### 2.1.2. POST `/api/auth/login` - Logowanie użytkownika

**Plik**: `src/pages/api/auth/login.ts`

**Typ**: API Route (Astro)

**Request Body**:
```typescript
{
  email: string;      // Wymagane
  password: string;   // Wymagane
}
```

**Walidacja**:
```typescript
const loginCommandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
```

**Logika**:
1. Waliduj dane wejściowe
2. Wywołaj `supabase.auth.signInWithPassword({ email, password })`
3. Jeśli sukces:
   - Ustaw sesję w cookie
   - Zwróć 200 OK z `{ message: "Zalogowano pomyślnie" }`
4. Jeśli błąd:
   - Nieprawidłowe dane: 401 Unauthorized `{ error: "Nieprawidłowy email lub hasło" }`
   - Inne błędy: 400 Bad Request

**Kod (pseudo)**:
```typescript
// src/pages/api/auth/login.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseServer } from "@/db/supabase-server";

const loginCommandSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json();
  const validation = loginCommandSchema.safeParse(body);
  
  if (!validation.success) {
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { email, password } = validation.data;
  const supabase = supabaseServer({ cookies } as any);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: "Nieprawidłowy email lub hasło" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ 
      message: "Zalogowano pomyślnie",
      user: { id: data.user?.id, email: data.user?.email }
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
```

---

#### 2.1.3. POST `/api/auth/logout` - Wylogowanie użytkownika

**Plik**: `src/pages/api/auth/logout.ts`

**Typ**: API Route (Astro)

**Request Body**: Brak (można wysłać pusty body)

**Logika**:
1. Wywołaj `supabase.auth.signOut()`
2. Usuń cookie sesji
3. Zwróć 200 OK z `{ message: "Wylogowano pomyślnie" }`

**Kod (pseudo)**:
```typescript
// src/pages/api/auth/logout.ts
import type { APIRoute } from "astro";
import { supabaseServer } from "@/db/supabase-server";

export const POST: APIRoute = async ({ cookies }) => {
  const supabase = supabaseServer({ cookies } as any);

  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(
      JSON.stringify({ error: "Nie udało się wylogować" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ message: "Wylogowano pomyślnie" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
```

---

#### 2.1.4. DELETE `/api/auth/delete-account` - Usuwanie konta użytkownika

**Plik**: `src/pages/api/auth/delete-account.ts`

**Typ**: API Route (Astro)

**Realizuje**: US-003 (Trwałe usuwanie konta użytkownika)

**Request Body**: Brak (autentykacja przez sesję)

**Logika**:
1. Sprawdź czy użytkownik jest zalogowany (z `locals.user`)
2. Pobierz `user_id` z sesji
3. Wywołaj funkcję usuwającą dane użytkownika (kaskadowo):
   - Usuń wszystkie treningi użytkownika (`workouts` + `workout_sets` przez foreign key cascade)
   - Usuń wszystkie niestandardowe ćwiczenia użytkownika (`exercises` gdzie `user_id = ...`)
   - Usuń użytkownika z Supabase Auth (`supabase.auth.admin.deleteUser()`)
4. Wyloguj użytkownika (`supabase.auth.signOut()`)
5. Zwróć 200 OK z `{ message: "Konto zostało usunięte" }`

**Kod (pseudo)**:
```typescript
// src/pages/api/auth/delete-account.ts
import type { APIRoute } from "astro";
import { supabaseServer } from "@/db/supabase-server";

export const DELETE: APIRoute = async ({ locals, cookies }) => {
  const user = locals.user;

  // 1. Sprawdź autentykację
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = supabaseServer({ cookies } as any);

  try {
    // 2. Usuń wszystkie dane użytkownika (RLS automatycznie filtruje)
    // Kolejność jest ważna ze względu na foreign keys
    
    // 2a. Usuń workout_sets (przez cascade delete w workouts)
    // 2b. Usuń workouts
    const { error: workoutsError } = await supabase
      .from("workouts")
      .delete()
      .eq("user_id", user.id);

    if (workoutsError) {
      console.error("Error deleting workouts:", workoutsError);
      throw new Error("Nie udało się usunąć treningów");
    }

    // 2c. Usuń niestandardowe ćwiczenia użytkownika
    const { error: exercisesError } = await supabase
      .from("exercises")
      .delete()
      .eq("user_id", user.id);

    if (exercisesError) {
      console.error("Error deleting exercises:", exercisesError);
      throw new Error("Nie udało się usunąć ćwiczeń");
    }

    // 3. Usuń użytkownika z Supabase Auth
    // UWAGA: To wymaga service_role key, nie user key
    // Alternatywnie można użyć database function
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      throw new Error("Nie udało się usunąć konta");
    }

    // 4. Wyloguj użytkownika (usuń sesję)
    await supabase.auth.signOut();

    // 5. Zwróć sukces
    return new Response(
      JSON.stringify({ message: "Konto zostało usunięte" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Nie udało się usunąć konta" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

**Uwaga o uprawnieniach**:
Usunięcie użytkownika z Supabase Auth wymaga użycia `service_role` key, nie standardowego `anon` key. 
W Astro SSR, klient `supabaseServer` powinien być skonfigurowany z uprawnieniami wystarczającymi do tej operacji.

**Alternatywne podejście (zalecane)**:
Zamiast używać `supabase.auth.admin.deleteUser()` w aplikacji, można stworzyć **Database Function** w Supabase, 
która wykona kaskadowe usunięcie i będzie wywołana przez RPC:

```sql
-- W migracji Supabase
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usuń workout_sets (przez cascade)
  DELETE FROM workouts WHERE user_id = auth.uid();
  
  -- Usuń exercises użytkownika
  DELETE FROM exercises WHERE user_id = auth.uid();
  
  -- Usuń użytkownika z auth.users (wymaga SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
```

**Wywołanie z aplikacji**:
```typescript
const { error } = await supabase.rpc('delete_user_account');
```

**Kryteria akceptacji (US-003)**:
- Kaskadowe usunięcie wszystkich powiązanych danych (treningi, serie, ćwiczenia)
- Usunięcie konta auth z Supabase
- Automatyczne wylogowanie po usunięciu
- Odpowiednia obsługa błędów (rollback jeśli coś się nie uda)

---

### 2.2. Middleware - Ochrona tras

**Cel**: Zabezpieczenie strefy `/app/*` przed dostępem niezalogowanych użytkowników.

**Plik**: `src/middleware/index.ts`

**Obecny stan**: Middleware tworzy klienta Supabase i przekazuje go w `context.locals`.

**Zmiany do wprowadzenia**: Dodanie logiki sprawdzania sesji i przekierowania.

**Nowa logika**:
```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { supabaseServer } from "@/db/supabase-server";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, cookies } = context;

  // 1. Utwórz klienta Supabase
  const supabase = supabaseServer({ cookies } as any);
  context.locals.supabase = supabase;

  // 2. Pobierz sesję
  const { data: { session } } = await supabase.auth.getSession();

  // 3. Sprawdź czy ścieżka wymaga autentykacji
  const isProtectedRoute = url.pathname.startsWith('/app');
  const isAuthRoute = ['/login', '/register'].includes(url.pathname);

  // 4. Jeśli chroniona trasa i brak sesji - przekieruj na /login
  if (isProtectedRoute && !session) {
    return redirect('/login');
  }

  // 5. Jeśli strona auth i użytkownik zalogowany - przekieruj na /app/dashboard
  if (isAuthRoute && session) {
    return redirect('/app/dashboard');
  }

  // 6. Kontynuuj renderowanie
  return next();
});
```

**Uwaga**: Ta logika zapewnia:
- Niezalogowani użytkownicy nie mogą wejść na `/app/*`
- Zalogowani użytkownicy są automatycznie przekierowywani z `/login` i `/register` na dashboard

---

### 2.3. Modele danych (Typy)

**Plik**: `src/types.ts`

**Nowe typy do dodania**:

```typescript
// ============================================================================
// AUTH DTOs
// ============================================================================

/**
 * Command to register a new user
 * Used in: POST /api/auth/register
 */
export interface RegisterCommand {
  email: string;
  password: string;
}

/**
 * Command to log in a user
 * Used in: POST /api/auth/login
 */
export interface LoginCommand {
  email: string;
  password: string;
}

/**
 * Response after successful authentication
 * Used in: POST /api/auth/register, POST /api/auth/login
 */
export interface AuthSuccessResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Generic error response for auth operations
 */
export interface AuthErrorResponse {
  error: string;
}
```

**Uwaga**: Typy użytkownika (`User`) są już dostępne w Supabase Auth, nie trzeba ich definiować ponownie.

---

### 2.4. Usługi (Services)

**Cel**: Enkapsulacja logiki autentykacji dla ułatwienia testowania i reużywalności.

**Opcjonalny krok**: Dla MVP można pominąć warstwę serwisów i utrzymać logikę bezpośrednio w API routes.

**Jeśli zdecydujemy się na serwisy** (nowy plik: `src/lib/services/auth.service.ts`):

```typescript
// src/lib/services/auth.service.ts
import type { SupabaseClient } from "@/db/supabase.client";
import type { RegisterCommand, LoginCommand } from "@/types";

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  async register(command: RegisterCommand) {
    const { data, error } = await this.supabase.auth.signUp({
      email: command.email,
      password: command.password
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async login(command: LoginCommand) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    return session;
  }

  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    return user;
  }
}
```

**Użycie w API routes**:
```typescript
const authService = new AuthService(supabase);
const result = await authService.register({ email, password });
```

---

## System Autentykacji

### 3.1. Integracja z Supabase Auth

Supabase Auth dostarcza kompletne rozwiązanie do zarządzania użytkownikami, sesjami i tokenami JWT.

#### 3.1.1. Konfiguracja Supabase Client

**Obecny stan**: Aplikacja posiada dwa typy klientów Supabase:

1. **Client-side** (`src/db/supabase.client.ts`):
   - Używany w komponentach React
   - Nie ma dostępu do cookies
   - Używa `localStorage` do przechowywania sesji (domyślne zachowanie)

2. **Server-side** (`src/db/supabase-server.ts`):
   - Używany w Astro pages i API routes
   - Zarządza cookies za pomocą `Astro.cookies`
   - Custom storage adapter

**Zmiany do wprowadzenia**:
- **Brak zmian** w `supabase.client.ts`
- **Brak zmian** w `supabase-server.ts` - obecna implementacja jest poprawna

**Uwaga o bezpieczeństwie cookies**:
Obecna konfiguracja `supabaseServer` ustawia `secure: true` dla cookies, co wymaga HTTPS. W środowisku deweloperskim (localhost) może to powodować problemy. Zalecane zmiany:

```typescript
// src/db/supabase-server.ts
setItem: (key: string, value: string) => {
  Astro.cookies.set(key, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
    secure: import.meta.env.PROD, // Tylko w produkcji
    httpOnly: false // Musi być false dla Supabase Auth
  });
}
```

---

#### 3.1.2. Przepływ autoryzacji

##### Rejestracja (signUp):
```
1. User wypełnia formularz rejestracji
   ↓
2. React component → POST /api/auth/register { email, password }
   ↓
3. API route → supabase.auth.signUp()
   ↓
4. Supabase tworzy użytkownika w tabeli auth.users
   ↓
5. Supabase zwraca sesję (access_token, refresh_token)
   ↓
6. supabaseServer automatycznie zapisuje tokeny w cookies
   ↓
7. API zwraca 201 Created
   ↓
8. React component → window.location.href = '/app/dashboard'
   ↓
9. Middleware wykrywa sesję → renderuje dashboard
```

##### Logowanie (signInWithPassword):
```
1. User wypełnia formularz logowania
   ↓
2. React component → POST /api/auth/login { email, password }
   ↓
3. API route → supabase.auth.signInWithPassword()
   ↓
4. Supabase weryfikuje credentials
   ↓
5. Jeśli poprawne - zwraca sesję
   ↓
6. supabaseServer zapisuje tokeny w cookies
   ↓
7. API zwraca 200 OK
   ↓
8. React component → window.location.href = '/app/dashboard'
   ↓
9. Middleware wykrywa sesję → renderuje dashboard
```

##### Wylogowanie (signOut):
```
1. User klika "Wyloguj się"
   ↓
2. React component → POST /api/auth/logout
   ↓
3. API route → supabase.auth.signOut()
   ↓
4. Supabase unieważnia sesję
   ↓
5. supabaseServer usuwa cookies
   ↓
6. API zwraca 200 OK
   ↓
7. React component → window.location.href = '/'
   ↓
8. Middleware nie wykrywa sesji → renderuje landing page
```

##### Ochrona tras (Middleware):
```
1. User wchodzi na /app/dashboard
   ↓
2. Middleware uruchamia się przed renderowaniem
   ↓
3. Middleware → supabase.auth.getSession() (odczyt z cookies)
   ↓
4a. Jeśli sesja istnieje → next() (renderuj stronę)
4b. Jeśli sesja nie istnieje → redirect('/login')
```

---

#### 3.1.3. Zarządzanie sesjami

**Przechowywanie sesji**:
- **Server-side**: Cookies (HttpOnly zalecane, ale nie wymagane dla Supabase)
- **Czas życia**: 7 dni (konfigurowalny w `maxAge`)
- **Odświeżanie tokenu**: Automatyczne przez Supabase Auth (refresh_token)

**Strategia odświeżania**:
Supabase Auth automatycznie odświeża `access_token` gdy:
- Token wygaśnie (domyślnie 1 godzina)
- Klient Supabase wykryje brak ważnego tokenu

W Astro SSR, odświeżanie dzieje się:
1. Przy każdym requestie server-side (w middleware lub page load)
2. Supabase client automatycznie sprawdza ważność tokenu
3. Jeśli access_token wygasł, używa refresh_token do uzyskania nowego
4. Nowa sesja jest zapisywana w cookies

**Obsługa wygaśnięcia sesji**:
Jeśli refresh_token również wygaśnie (po 7 dniach nieaktywności):
1. `getSession()` zwróci `null`
2. Middleware przekieruje na `/login`
3. User musi zalogować się ponownie

---

#### 3.1.4. Bezpieczeństwo

**Najlepsze praktyki zaimplementowane**:

1. **Hasła**:
   - Minimalna długość: 8 znaków (walidacja client + server)
   - Hashowanie: Automatyczne przez Supabase (bcrypt)
   - Nie przechowujemy plain text passwords

2. **Tokeny sesji**:
   - JWT podpisane przez Supabase
   - Krótki czas życia access_token (1h)
   - Refresh_token przechowywany w secure cookie

3. **Cookies**:
   - `sameSite: "lax"` - ochrona przed CSRF
   - `secure: true` (tylko HTTPS w produkcji)
   - `httpOnly: false` - wymagane dla Supabase client-side

4. **API Endpoints**:
   - Walidacja Zod na wszystkich endpointach
   - Zwracanie ogólnych błędów (nie ujawniamy szczegółów ataku)
   - Rate limiting (do rozważenia w przyszłości)

5. **Middleware**:
   - Weryfikacja sesji przed każdym chronioną trasą
   - Automatyczne przekierowania dla niezalogowanych

**Zabezpieczenia Supabase**:
- Row Level Security (RLS) - polityki dostępu do danych
- Automatyczna weryfikacja JWT w zapytaniach
- Ochrona przed SQL Injection

---

### 3.2. Kontekst użytkownika w Astro

**Cel**: Udostępnienie informacji o zalogowanym użytkowniku w komponentach Astro i React.

#### 3.2.1. Locals (Astro context)

**Plik**: `src/middleware/index.ts`

**Rozszerzenie**: Dodaj użytkownika do `context.locals`

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = supabaseServer(context);
  context.locals.supabase = supabase;

  // Dodaj użytkownika do locals
  const { data: { user } } = await supabase.auth.getUser();
  context.locals.user = user;

  // ... reszta logiki middleware

  return next();
});
```

**Typ (rozszerzenie `src/env.d.ts`)**:
```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import("@/db/supabase.client").SupabaseClient;
    user: {
      id: string;
      email: string;
      // ... inne pola z Supabase User
    } | null;
  }
}
```

**Użycie w Astro pages**:
```astro
---
const user = Astro.locals.user;
---

{user && <p>Zalogowany jako: {user.email}</p>}
```

---

#### 3.2.2. Props do komponentów React

**Przekazywanie danych użytkownika**:
```astro
---
import { UserProfile } from "@/components/UserProfile";
const user = Astro.locals.user;
---

<UserProfile user={user} client:load />
```

**Alternatywnie**: Komponent React może pobierać dane samodzielnie (client-side):
```typescript
// W komponencie React
const { data: { user } } = await supabaseClient.auth.getUser();
```

**Zalecenie**: Preferuj przekazywanie przez props (SSR) dla lepszej wydajności i SEO.

---

## Przepływ Danych i Integracje

### 4.1. Diagram przepływu autentykacji

```
┌─────────────────────────────────────────────────────────────────┐
│                         LANDING PAGE (/)                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Astro SSR: Sprawdź sesję (supabase.auth.getSession()) │   │
│  └───────────────────┬─────────────────────────────────────┘   │
│                      │                                           │
│         ┌────────────┴──────────────┐                           │
│         │                            │                           │
│    Zalogowany?                  Niezalogowany?                  │
│         │                            │                           │
│    "Przejdź do app"            "Zarejestruj się"                │
└─────┬───────────────────────────────┬───────────────────────────┘
      │                                │
      │                                ▼
      │                     ┌────────────────────┐
      │                     │  /register         │
      │                     │  (RegisterForm)    │
      │                     └──────┬─────────────┘
      │                            │
      │                            │ Submit
      │                            ▼
      │                     POST /api/auth/register
      │                            │
      │                            │ supabase.auth.signUp()
      │                            │
      │                            ▼
      │                     Sesja w cookies
      │                            │
      ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      /app/dashboard                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │    Middleware: Weryfikuj sesję przed renderowaniem      │   │
│  └────────────────────┬────────────────────────────────────┘   │
│                       │                                          │
│            ┌──────────┴───────────┐                             │
│            │                      │                              │
│       Sesja OK?              Brak sesji?                         │
│            │                      │                              │
│       Renderuj                redirect('/login')                │
│            │                      │                              │
│            ▼                      ▼                              │
│  ┌───────────────────┐    ┌──────────────┐                     │
│  │ LayoutApp         │    │  /login      │                     │
│  │ - AppHeader       │    │  (LoginForm) │                     │
│  │ - User Menu       │    └──────┬───────┘                     │
│  │ - Dashboard       │           │                              │
│  └───────────────────┘           │ Submit                       │
│            │                      ▼                              │
│            │           POST /api/auth/login                     │
│            │                      │                              │
│            │           supabase.auth.signInWithPassword()       │
│            │                      │                              │
│            │                      ▼                              │
│            │            Sesja w cookies                         │
│            │                      │                              │
│            └──────────────────────┘                             │
│                       │                                          │
│                       ▼                                          │
│            User korzysta z app                                  │
│                       │                                          │
│                       │ Klik "Wyloguj"                          │
│                       ▼                                          │
│            POST /api/auth/logout                                │
│                       │                                          │
│            supabase.auth.signOut()                              │
│                       │                                          │
│            Usunięcie cookies                                    │
│                       │                                          │
│                       ▼                                          │
│            redirect('/')                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.2. Integracja z istniejącymi API endpoints

**Zabezpieczenie istniejących tras**:

Wszystkie istniejące endpointy w `/api/exercises` i `/api/workouts` wymagają autentykacji.

**Sposób weryfikacji w API routes**:

```typescript
// Przykład: src/pages/api/exercises/index.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  // Sprawdź czy użytkownik jest zalogowany
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Pobierz ćwiczenia użytkownika
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", user.id); // Filtruj po user_id

  // ... reszta logiki
};
```

**Zalecenie**: Dodaj funkcję helper do sprawdzania autentykacji:

```typescript
// src/lib/utils/auth-guards.ts
export function requireAuth(locals: App.Locals) {
  if (!locals.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return locals.user;
}

// Użycie:
const user = requireAuth(locals);
```

---

### 4.3. Row Level Security (RLS) w Supabase

**Cel**: Zapewnienie, że użytkownicy mają dostęp tylko do swoich danych.

**Polityki RLS do ustawienia w Supabase** (SQL):

#### Tabela `exercises`:
```sql
-- Użytkownik może widzieć swoje ćwiczenia + systemowe
CREATE POLICY "Users can view their exercises and system exercises"
ON exercises FOR SELECT
USING (
  user_id = auth.uid() OR user_id IS NULL
);

-- Użytkownik może tworzyć tylko swoje ćwiczenia
CREATE POLICY "Users can create their own exercises"
ON exercises FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Użytkownik może aktualizować tylko swoje ćwiczenia
CREATE POLICY "Users can update their own exercises"
ON exercises FOR UPDATE
USING (user_id = auth.uid());

-- Użytkownik może archiwizować tylko swoje ćwiczenia
CREATE POLICY "Users can delete their own exercises"
ON exercises FOR DELETE
USING (user_id = auth.uid());
```

#### Tabela `workouts`:
```sql
-- Użytkownik może widzieć tylko swoje treningi
CREATE POLICY "Users can view their own workouts"
ON workouts FOR SELECT
USING (user_id = auth.uid());

-- Użytkownik może tworzyć tylko swoje treningi
CREATE POLICY "Users can create their own workouts"
ON workouts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Użytkownik może aktualizować tylko swoje treningi
CREATE POLICY "Users can update their own workouts"
ON workouts FOR UPDATE
USING (user_id = auth.uid());

-- Użytkownik może usuwać tylko swoje treningi
CREATE POLICY "Users can delete their own workouts"
ON workouts FOR DELETE
USING (user_id = auth.uid());
```

#### Tabela `workout_sets`:
```sql
-- Użytkownik może widzieć serie tylko ze swoich treningów
CREATE POLICY "Users can view sets from their own workouts"
ON workout_sets FOR SELECT
USING (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid()
  )
);

-- Użytkownik może tworzyć serie tylko w swoich treningach
CREATE POLICY "Users can create sets in their own workouts"
ON workout_sets FOR INSERT
WITH CHECK (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid()
  )
);

-- Użytkownik może aktualizować serie tylko w swoich treningach
CREATE POLICY "Users can update sets in their own workouts"
ON workout_sets FOR UPDATE
USING (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid()
  )
);

-- Użytkownik może usuwać serie tylko w swoich treningach
CREATE POLICY "Users can delete sets in their own workouts"
ON workout_sets FOR DELETE
USING (
  workout_id IN (
    SELECT id FROM workouts WHERE user_id = auth.uid()
  )
);
```

**Włączenie RLS**:
```sql
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
```

**Uwaga**: Gdy RLS jest włączony, Supabase automatycznie filtruje zapytania na podstawie JWT tokenu użytkownika.

---

## Walidacja i Obsługa Błędów

### 5.1. Walidacja po stronie klienta

**Biblioteki**:
- **Zod**: Schematy walidacji
- **React Hook Form**: Zarządzanie formularzami
- **Zod Resolver**: Integracja Zod z React Hook Form

**Przykład integracji** (w `RegisterForm.tsx`):

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  // ... reszta komponentu
}
```

**Wyświetlanie błędów**:
```tsx
<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    {...register("email")}
    aria-invalid={errors.email ? "true" : "false"}
  />
  {errors.email && (
    <p class="text-sm text-destructive mt-1">{errors.email.message}</p>
  )}
</div>
```

---

### 5.2. Walidacja po stronie serwera

**Cel**: Nigdy nie ufaj danym z klienta - zawsze waliduj na backendzie.

**Podejście**:
1. Definiuj schematy Zod dla każdego endpointa
2. Użyj `safeParse()` do walidacji body
3. Zwracaj 400 Bad Request dla błędnych danych

**Przykład**:
```typescript
// src/pages/api/auth/register.ts
const registerCommandSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków")
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  
  // Walidacja
  const validation = registerCommandSchema.safeParse(body);
  
  if (!validation.success) {
    // Zwróć pierwsze błędy walidacji
    const firstError = validation.error.errors[0];
    return new Response(
      JSON.stringify({ error: firstError.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Kontynuuj z zwalidowanymi danymi
  const { email, password } = validation.data;
  // ...
};
```

---

### 5.3. Obsługa błędów API

**Standardowy format odpowiedzi błędu**:
```typescript
{
  error: string; // Opis błędu dla użytkownika (po polsku)
}
```

**Kody statusu HTTP**:
- **400 Bad Request**: Błąd walidacji, nieprawidłowe dane
- **401 Unauthorized**: Brak sesji, nieprawidłowe credentials
- **403 Forbidden**: Użytkownik nie ma uprawnień (rzadko w MVP)
- **404 Not Found**: Zasób nie istnieje
- **409 Conflict**: Email już istnieje (rejestracja)
- **500 Internal Server Error**: Nieoczekiwany błąd serwera

**Mapowanie błędów Supabase na przyjazne komunikaty**:

```typescript
// src/lib/utils/error-messages.ts
export function getAuthErrorMessage(supabaseError: string): string {
  const errorMap: Record<string, string> = {
    "User already registered": "Ten adres email jest już zarejestrowany",
    "Invalid login credentials": "Nieprawidłowy email lub hasło",
    "Email not confirmed": "Potwierdź swój adres email",
    "User not found": "Nie znaleziono użytkownika",
    // ... inne mapowania
  };

  return errorMap[supabaseError] || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
}
```

**Użycie**:
```typescript
if (error) {
  const message = getAuthErrorMessage(error.message);
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

---

### 5.4. Obsługa błędów w React

**Toast notifications** (biblioteka `sonner`):

**Instalacja**:
```bash
npm install sonner
```

**Setup w `LayoutApp.astro`**:
```astro
---
import { Toaster } from "sonner";
---

<Layout>
  <!-- ... -->
  <Toaster position="top-right" richColors />
</Layout>
```

**Użycie w komponentach**:
```typescript
import { toast } from "sonner";

// Sukces
toast.success("Zalogowano pomyślnie");

// Błąd
toast.error("Nieprawidłowy email lub hasło");

// Info
toast.info("Sprawdź swoją skrzynkę email");
```

**W FormularzeLoginForm**:
```typescript
try {
  const response = await fetch('/api/auth/login', { /* ... */ });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }
  
  toast.success("Zalogowano pomyślnie");
  window.location.href = '/app/dashboard';
} catch (err) {
  toast.error(err.message);
}
```

---

### 5.5. Strategia retry dla błędów sieciowych

**Opcjonalnie dla MVP**: Implementacja automatycznego retry dla błędów 5xx.

**Przykład**:
```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status >= 500 && i < retries - 1) {
        // Czekaj przed kolejną próbą
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      return response;
    } catch (err) {
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}
```

---

## Podsumowanie implementacji

### Lista plików do utworzenia:

**Nowe komponenty React**:
1. `src/components/auth/RegisterForm.tsx`
2. `src/components/auth/LoginForm.tsx`
3. `src/components/auth/SignOutButton.tsx`
4. `src/components/auth/DeleteAccountButton.tsx` (realizacja US-003)
5. `src/components/layout/AppHeader.tsx`
6. `src/components/layout/UserMenu.tsx`
7. `src/components/layout/MobileMenu.tsx`

**Nowe pliki Astro**:
1. `src/layouts/LayoutApp.astro`
2. `src/pages/app/profile.astro`

**Nowe API routes**:
1. `src/pages/api/auth/register.ts`
2. `src/pages/api/auth/login.ts`
3. `src/pages/api/auth/logout.ts`
4. `src/pages/api/auth/delete-account.ts` (realizacja US-003)

**Opcjonalne serwisy**:
1. `src/lib/services/auth.service.ts`
2. `src/lib/utils/auth-guards.ts`
3. `src/lib/utils/error-messages.ts`

### Lista plików do modyfikacji:

1. `src/middleware/index.ts` - dodanie logiki ochrony tras
2. `src/db/supabase-server.ts` - poprawka secure cookie
3. `src/pages/index.astro` - aktualizacja przekazywania props do HeroSection
4. `src/components/landing/HeroSection.tsx` - dodanie drugiego przycisku ("Zaloguj się") dla niezalogowanych
5. `src/pages/login.astro` - zamiana na `LoginForm`
6. `src/pages/register.astro` - zamiana na `RegisterForm`
7. `src/pages/app/dashboard.astro` - zmiana layoutu na `LayoutApp`
8. `src/types.ts` - dodanie typów auth
9. `src/env.d.ts` - rozszerzenie `App.Locals`

### Zależności do instalacji:

```bash
npm install zod @hookform/resolvers react-hook-form sonner
```

### Konfiguracja Supabase (SQL):

1. Włączenie RLS na tabelach `exercises`, `workouts`, `workout_sets`
2. Dodanie polityk RLS (kod SQL podany w sekcji 4.3)
3. **Database Function dla usuwania konta** (zalecane):

```sql
-- Migracja: supabase/migrations/YYYYMMDDHHMMSS_add_delete_account_function.sql
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usuń workout_sets (przez cascade delete w workouts)
  DELETE FROM workouts WHERE user_id = auth.uid();
  
  -- Usuń exercises użytkownika (nie systemowe)
  DELETE FROM exercises WHERE user_id = auth.uid();
  
  -- Usuń użytkownika z auth.users
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Nadaj uprawnienia
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
```

---

## Następne kroki (poza zakresem MVP autentykacji)

Funkcjonalności do implementacji w przyszłości:
1. **Odzyskiwanie hasła** (forgot password flow)
2. **Weryfikacja emaila** (email confirmation)
3. **Zmiana hasła** (w profilu użytkownika)
4. **Logowanie społecznościowe** (OAuth: Google, GitHub)
5. **Dwuskładnikowe uwierzytelnianie** (2FA)
6. **Rate limiting** dla endpointów auth (ochrona przed atakami brute-force)

---

## Koniec specyfikacji

Niniejsza specyfikacja opisuje kompletną architekturę i implementację systemu autentykacji dla 10xFitChart MVP, realizującą wymagania **US-001** (Rejestracja), **US-002** (Logowanie) oraz **US-003** (Usuwanie konta) z dokumentu PRD. Implementacja zgodna z tą specyfikacją zapewnia bezpieczny, skalowalny i przyjazny użytkownikowi system uwierzytelniania, w pełni zintegrowany ze stosem technologicznym aplikacji (Astro, React, Supabase).
