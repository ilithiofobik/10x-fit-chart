# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page jest głównym punktem wejścia do aplikacji 10xFitChart dla niezalogowanych użytkowników. Jej podstawowym celem jest prezentacja wartości aplikacji (Value Proposition) oraz konwersja odwiedzających w zarejestrowanych użytkowników poprzez przyciski Call-to-Action prowadzące do rejestracji i logowania.

Widok implementowany jest jako strona statyczna z elementami interaktywnymi (React Islands pattern w Astro), wykrywająca stan sesji użytkownika. Jeśli użytkownik jest już zalogowany, przyciski autoryzacyjne zamieniają się w link "Idź do aplikacji".

Kluczowe cechy:

- Desktop-first (responsywna, ale priorytet dla dużych ekranów)
- Dark mode (jedyny obsługiwany tryb)
- Język polski
- Brak wywołań API (prezentacyjny charakter)
- Wykrywanie sesji użytkownika przez Supabase Auth

## 2. Routing widoku

**Ścieżka**: `/` (root aplikacji)

**Typ strony**: Astro page z SSR (Server-Side Rendering)

**Plik**: `src/pages/index.astro`

**Logika przekierowania**:

- Jeśli użytkownik posiada aktywną sesję → wyświetla CTA "Przejdź do aplikacji" prowadzący do `/dashboard`
- Jeśli użytkownik nie jest zalogowany → wyświetla przyciski "Zaloguj się" i "Zarejestruj się"

## 3. Struktura komponentów

```
index.astro (Astro Page)
│
├── Layout (BaseLayout.astro)
│   ├── Head (meta, title, styles)
│   └── Body
│       └── LandingPageContent
│           ├── HeroSection (React)
│           │   ├── HeroHeading
│           │   ├── HeroDescription
│           │   └── AuthButtons (React)
│           │       ├── Button (Shadcn/ui) - "Zarejestruj się"
│           │       ├── Button (Shadcn/ui) - "Zaloguj się"
│           │       └── Button (Shadcn/ui) - "Przejdź do aplikacji" (conditional)
│           │
│           ├── FeatureGrid (React/Astro)
│           │   ├── FeatureCard
│           │   ├── FeatureCard
│           │   ├── FeatureCard
│           │   └── FeatureCard
│           │
│           └── Footer (Astro)
```

## 4. Szczegóły komponentów

### 4.1. BaseLayout.astro

**Opis**: Layout bazowy dla całej aplikacji, zawierający strukturę HTML, meta tagi, style globalne i nawigację.

**Główne elementy**:

- `<html lang="pl">` z klasą dark mode
- `<head>` z meta tagami (title, description, viewport, charset)
- `<body>` z containerem głównym
- Import globalnych stylów Tailwind

**Obsługiwane zdarzenia**: Brak (komponent strukturalny)

**Warunki walidacji**: Brak

**Typy**:

```typescript
interface Props {
  title: string;
  description?: string;
}
```

**Propsy**:

- `title: string` - tytuł strony do `<title>` tag
- `description?: string` - opcjonalny opis do meta description

### 4.2. HeroSection (React Component)

**Opis**: Sekcja hero zawierająca główny nagłówek aplikacji, krótki opis wartości oraz przyciski Call-to-Action. Komponent wykrywa stan sesji użytkownika i dostosowuje wyświetlane przyciski.

**Główne elementy**:

- `<section>` z klasami Tailwind (flex, min-h-screen, items-center, justify-center)
- `<div>` container z max-width
- `<h1>` - główny nagłówek "10xFitChart"
- `<p>` - tagline/opis wartości (2-3 zdania)
- `<AuthButtons />` - komponent z przyciskami CTA

**Obsługiwane zdarzenia**:

- Brak bezpośrednich zdarzeń (delegowane do AuthButtons)

**Warunki walidacji**: Brak

**Typy**:

```typescript
interface HeroSectionProps {
  isAuthenticated: boolean;
}
```

**Propsy**:

- `isAuthenticated: boolean` - czy użytkownik jest zalogowany (przekazywane z SSR)

### 4.3. AuthButtons (React Component)

**Opis**: Inteligentny komponent wyświetlający odpowiednie przyciski w zależności od stanu sesji. Dla niezalogowanych pokazuje "Zaloguj się" i "Zarejestruj się", dla zalogowanych pokazuje "Przejdź do aplikacji".

**Główne elementy**:

- `<div>` flex container dla przycisków
- `Button` (Shadcn/ui) - "Zarejestruj się" (variant="default")
- `Button` (Shadcn/ui) - "Zaloguj się" (variant="outline")
- `Button` (Shadcn/ui) - "Przejdź do aplikacji" (variant="default", conditional)

**Obsługiwane zdarzenia**:

- `onClick` na przyciskach → nawigacja do odpowiednich ścieżek:
  - "Zarejestruj się" → `/register`
  - "Zaloguj się" → `/login`
  - "Przejdź do aplikacji" → `/dashboard`

**Warunki walidacji**: Brak (routing nie wymaga walidacji)

**Typy**:

```typescript
interface AuthButtonsProps {
  isAuthenticated: boolean;
}
```

**Propsy**:

- `isAuthenticated: boolean` - stan sesji użytkownika

### 4.4. FeatureGrid (React/Astro Component)

**Opis**: Siatka prezentująca kluczowe funkcje aplikacji. Może być implementowana jako statyczny komponent Astro (preferowane dla wydajności) lub React (jeśli wymagane animacje).

**Główne elementy**:

- `<section>` z klasami Tailwind
- `<div>` grid container (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- 4x `<FeatureCard />` - karty z ikonami i opisami funkcji

**Obsługiwane zdarzenia**: Brak (statyczny content)

**Warunki walidacji**: Brak

**Typy**:

```typescript
interface FeatureGridProps {
  features: FeatureItem[];
}

interface FeatureItem {
  title: string;
  description: string;
  icon: string; // nazwa ikony z lucide-react
}
```

**Propsy**:

- `features: FeatureItem[]` - tablica z opisami funkcji

### 4.5. FeatureCard (React/Astro Component)

**Opis**: Pojedyncza karta prezentująca funkcję aplikacji - ikona, tytuł i krótki opis.

**Główne elementy**:

- `<div>` card container z border i padding
- Ikona (z biblioteki lucide-react)
- `<h3>` - tytuł funkcji
- `<p>` - opis funkcji (1-2 zdania)

**Obsługiwane zdarzenia**: Brak

**Warunki walidacji**: Brak

**Typy**:

```typescript
interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}
```

**Propsy**:

- `title: string` - nazwa funkcji
- `description: string` - opis funkcji
- `icon: string` - nazwa ikony

### 4.6. Footer (Astro Component)

**Opis**: Stopka strony z informacjami o prawach autorskich.

**Główne elementy**:

- `<footer>` z klasami Tailwind
- `<div>` container z tekstem copyright
- Opcjonalnie: linki do polityki prywatności (out-of-scope dla MVP)

**Obsługiwane zdarzenia**: Brak

**Warunki walidacji**: Brak

**Typy**: Brak (statyczny komponent)

**Propsy**: Brak

## 5. Typy

### 5.1. Typy komponentów Landing Page

```typescript
// src/components/landing/types.ts

/**
 * Props dla głównej sekcji Hero
 */
export interface HeroSectionProps {
  isAuthenticated: boolean;
}

/**
 * Props dla komponentu przycisków autoryzacyjnych
 */
export interface AuthButtonsProps {
  isAuthenticated: boolean;
}

/**
 * Pojedyncza funkcja aplikacji do wyświetlenia
 */
export interface FeatureItem {
  title: string;
  description: string;
  icon: string; // Nazwa ikony z lucide-react (np. "BarChart3", "Keyboard")
}

/**
 * Props dla siatki funkcji
 */
export interface FeatureGridProps {
  features: FeatureItem[];
}

/**
 * Props dla pojedynczej karty funkcji
 */
export interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}
```

### 5.2. Typy pomocnicze (jeśli potrzebne)

```typescript
/**
 * Props dla layoutu bazowego
 */
export interface BaseLayoutProps {
  title: string;
  description?: string;
}
```

### 5.3. Content data (statyczne dane funkcji)

```typescript
// src/data/landing-features.ts

import type { FeatureItem } from "@/components/landing/types";

export const landingFeatures: FeatureItem[] = [
  {
    title: "Szybkie wprowadzanie",
    description: "Nawigacja klawiaturą i kopiowanie treningów oszczędza czas",
    icon: "Keyboard",
  },
  {
    title: "Głęboka analiza",
    description: "Wykresy postępów i trendy historyczne w jednym miejscu",
    icon: "BarChart3",
  },
  {
    title: "Siłowe i Cardio",
    description: "Oddzielne metryki dla różnych typów aktywności",
    icon: "Dumbbell",
  },
  {
    title: "Desktop-first",
    description: "Zoptymalizowane pod kątem komputerów i dużych ekranów",
    icon: "Monitor",
  },
];
```

## 6. Zarządzanie stanem

### 6.1. Stan na poziomie strony (SSR)

**Wykrywanie sesji**:

```typescript
// src/pages/index.astro

import { supabaseServer } from "@/db/supabase-server";

const { cookies } = Astro;
const supabase = supabaseServer(Astro);

// Sprawdzenie sesji użytkownika
const {
  data: { session },
} = await supabase.auth.getSession();
const isAuthenticated = !!session;
```

Stan `isAuthenticated` jest określany podczas SSR i przekazywany jako props do komponentów React.

### 6.2. Stan komponentów React

Komponenty Landing Page są głównie prezentacyjne i nie wymagają złożonego zarządzania stanem. Jedyny stan przechowywany to:

**HeroSection/AuthButtons**:

- `isAuthenticated` - przekazywany jako prop z poziomu strony Astro
- Brak lokalnego stanu - komponent jest stateless

**FeatureGrid**:

- Statyczne dane funkcji przekazywane jako props
- Brak lokalnego stanu

### 6.3. Niestandardowe hooki

**Nie wymagane** dla Landing Page. Wszystkie komponenty są proste, prezentacyjne i nie potrzebują złożonej logiki.

W przyszłości, jeśli dodamy animacje lub śledzenie interakcji, możemy rozważyć:

```typescript
// Przykład (opcjonalnie, out-of-scope dla MVP)
// useScrollAnimation() - dla animacji przy scrollowaniu
// useAnalytics() - dla śledzenia kliknięć CTA
```

## 7. Integracja API

### 7.1. Brak wywołań API

Landing Page **nie wykonuje żadnych wywołań API** po stronie klienta. Jedyna interakcja z Supabase odbywa się podczas SSR:

```typescript
// W src/pages/index.astro (Server-Side)
const {
  data: { session },
} = await supabase.auth.getSession();
```

### 7.2. Nawigacja do endpointów autoryzacji

Przyciski CTA prowadzą do innych widoków aplikacji, które obsługują autoryzację:

- **Przycisk "Zarejestruj się"**: `window.location.href = '/register'`
- **Przycisk "Zaloguj się"**: `window.location.href = '/login'`
- **Przycisk "Przejdź do aplikacji"**: `window.location.href = '/dashboard'`

Nawigacja może być zaimplementowana przez:

1. Standardowe linki `<a href="...">` (preferowane dla SEO)
2. Astro `<a>` z `data-astro-prefetch`
3. Client-side navigation z `window.location.href`

**Rekomendacja**: Użyć standardowych linków `<a>` wewnątrz komponentów `Button` z Shadcn/ui (prop `asChild`).

## 8. Interakcje użytkownika

### 8.1. Kliknięcie "Zarejestruj się"

**Trigger**: Kliknięcie przycisku "Zarejestruj się"

**Akcja**:

1. Nawigacja do `/register`
2. Brak walidacji (to tylko link)

**Oczekiwany rezultat**:

- Użytkownik jest przekierowany na stronę rejestracji

### 8.2. Kliknięcie "Zaloguj się"

**Trigger**: Kliknięcie przycisku "Zaloguj się"

**Akcja**:

1. Nawigacja do `/login`
2. Brak walidacji

**Oczekiwany rezultat**:

- Użytkownik jest przekierowany na stronę logowania

### 8.3. Kliknięcie "Przejdź do aplikacji"

**Trigger**: Kliknięcie przycisku "Przejdź do aplikacji" (tylko dla zalogowanych)

**Akcja**:

1. Nawigacja do `/dashboard`
2. Brak walidacji (sesja już zweryfikowana przez SSR)

**Oczekiwany rezultat**:

- Zalogowany użytkownik jest przekierowany do dashboardu

### 8.4. Hover nad przyciskami

**Trigger**: Najechanie kursorem na przyciski CTA

**Akcja**:

- Zmiana stylu przycisku (Shadcn/ui hover states)
- Opcjonalnie: delikatna animacja (scale, shadow)

**Oczekiwany rezultat**:

- Wizualna informacja zwrotna o możliwości kliknięcia

### 8.5. Scrollowanie strony

**Trigger**: Scrollowanie w dół strony

**Akcja**:

- Wyświetlenie kolejnych sekcji (Hero → Features → Footer)
- Opcjonalnie: animacje fade-in/slide-in (out-of-scope dla MVP)

**Oczekiwany rezultat**:

- Płynne przewijanie treści

## 9. Warunki i walidacja

### 9.1. Warunek: Stan sesji użytkownika

**Weryfikacja**: Na poziomie SSR w `index.astro`

**Komponent**: `HeroSection` → `AuthButtons`

**Logika**:

```typescript
if (isAuthenticated) {
  // Pokaż przycisk "Przejdź do aplikacji"
} else {
  // Pokaż przyciski "Zaloguj się" i "Zarejestruj się"
}
```

**Wpływ na UI**:

- Zmiana widoczności przycisków
- Zmiana tekstu CTA
- Zmiana ścieżki nawigacji

### 9.2. Warunek: Dane funkcji aplikacji

**Weryfikacja**: TypeScript type checking

**Komponent**: `FeatureGrid` → `FeatureCard`

**Logika**:

```typescript
// Walidacja struktury danych
landingFeatures.forEach((feature) => {
  if (!feature.title || !feature.description || !feature.icon) {
    console.error("Invalid feature data:", feature);
  }
});
```

**Wpływ na UI**:

- Poprawne renderowanie kart funkcji
- Wyświetlenie odpowiednich ikon

### 9.3. Brak walidacji formularzy

Landing Page **nie zawiera formularzy** - wszystkie interakcje są prostymi linkami/nawigacją. Walidacja danych użytkownika będzie wymagana dopiero na stronach `/register` i `/login`.

## 10. Obsługa błędów

### 10.1. Błąd pobierania sesji (SSR)

**Scenariusz**: Supabase zwraca błąd podczas `getSession()`

**Obsługa**:

```typescript
try {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("Session check failed:", error);
  }
  const isAuthenticated = !!session && !error;
} catch (err) {
  console.error("Unexpected error:", err);
  const isAuthenticated = false; // Domyślnie traktuj jako niezalogowanego
}
```

**Rezultat**:

- Użytkownik traktowany jako niezalogowany
- Wyświetlenie domyślnych przycisków CTA
- Nie blokuje działania strony

### 10.2. Błąd ładowania komponentu React

**Scenariusz**: Błąd hydratacji lub renderowania komponentu

**Obsługa**:

```typescript
// ErrorBoundary (opcjonalnie, out-of-scope dla MVP)
// Jeśli komponent się nie załaduje, strona nadal wyświetli statyczną treść
```

**Rezultat**:

- Graceful degradation - strona nadal czytelna
- Logowanie błędu do konsoli

### 10.3. Błąd nawigacji

**Scenariusz**: Kliknięcie linku, który nie istnieje

**Obsługa**:

- Astro routing automatycznie obsługuje 404
- Middleware może przekierować do Landing Page

**Rezultat**:

- Wyświetlenie strony 404 (jeśli zaimplementowana)
- Lub przekierowanie do `/`

### 10.4. Brak JavaScript w przeglądarce

**Scenariusz**: Przeglądarka ma wyłączony JavaScript

**Obsługa**:

- Komponenty Astro renderują się server-side
- Linki `<a>` działają bez JS
- React Islands mogą nie być interaktywne, ale treść jest dostępna

**Rezultat**:

- Podstawowa funkcjonalność zachowana (linki działają)
- Brak animacji i interakcji React

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

Utworzyć następujące pliki:

```
src/
├── pages/
│   └── index.astro                           # Główna strona Landing Page
├── layouts/
│   └── BaseLayout.astro                      # Layout bazowy
├── components/
│   └── landing/
│       ├── types.ts                          # Typy dla komponentów LP
│       ├── HeroSection.tsx                   # Sekcja Hero (React)
│       ├── AuthButtons.tsx                   # Przyciski CTA (React)
│       ├── FeatureGrid.astro                 # Siatka funkcji (Astro)
│       ├── FeatureCard.astro                 # Karta funkcji (Astro)
│       └── Footer.astro                      # Stopka (Astro)
└── data/
    └── landing-features.ts                   # Dane funkcji aplikacji
```

### Krok 2: Implementacja BaseLayout.astro

1. Utworzyć podstawową strukturę HTML z `<!DOCTYPE html>`
2. Dodać `<head>` z meta tagami (charset, viewport, description)
3. Ustawić `lang="pl"` i klasę dark mode
4. Zaimportować globalne style Tailwind
5. Dodać `<slot />` dla treści dzieci

### Krok 3: Definicja typów

1. Utworzyć plik `src/components/landing/types.ts`
2. Zdefiniować wszystkie interfejsy:
   - `HeroSectionProps`
   - `AuthButtonsProps`
   - `FeatureItem`
   - `FeatureGridProps`
   - `FeatureCardProps`
3. Dodać JSDoc comments dla każdego typu

### Krok 4: Utworzenie danych statycznych

1. Utworzyć plik `src/data/landing-features.ts`
2. Zdefiniować tablicę `landingFeatures` z 4 funkcjami:
   - Szybkie wprowadzanie (Keyboard)
   - Głęboka analiza (BarChart3)
   - Siłowe i Cardio (Dumbbell)
   - Desktop-first (Monitor)
3. Upewnić się, że nazwy ikon pasują do `lucide-react`

### Krok 5: Implementacja FeatureCard.astro

1. Utworzyć komponent przyjmujący props: `title`, `description`, `icon`
2. Zaimportować odpowiednią ikonę z `lucide-react`
3. Zbudować layout karty:
   - Container z border, rounded corners, padding
   - Ikona na górze (rozmiar ~48px)
   - Tytuł `<h3>` (font-semibold, text-lg)
   - Opis `<p>` (text-sm, text-muted-foreground)
4. Zastosować style Tailwind zgodne z dark mode

### Krok 6: Implementacja FeatureGrid.astro

1. Utworzyć `<section>` z odpowiednim paddingiem i marginesem
2. Dodać nagłówek sekcji (opcjonalnie): "Dlaczego 10xFitChart?"
3. Utworzyć grid container:
   - `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
4. Zmapować `features` i renderować `<FeatureCard />` dla każdego
5. Przekazać `title`, `description`, `icon` jako props

### Krok 7: Implementacja AuthButtons.tsx (React)

1. Utworzyć komponent funkcyjny przyjmujący `isAuthenticated`
2. Zaimportować `Button` z Shadcn/ui
3. Dodać logikę warunkową:
   ```tsx
   if (isAuthenticated) {
     return (
       <Button asChild>
         <a href="/dashboard">Przejdź do aplikacji</a>
       </Button>
     );
   }
   return (
     <div className="flex gap-4">
       <Button asChild>
         <a href="/register">Zarejestruj się</a>
       </Button>
       <Button variant="outline" asChild>
         <a href="/login">Zaloguj się</a>
       </Button>
     </div>
   );
   ```
4. Zastosować odpowiednie style (flex, gap, center)
5. Dodać `client:load` directive przy użyciu w Astro

### Krok 8: Implementacja HeroSection.tsx (React)

1. Utworzyć komponent funkcyjny przyjmujący `isAuthenticated`
2. Zbudować layout sekcji:
   - Container `min-h-screen flex items-center justify-center`
   - Max-width wrapper (np. `max-w-4xl`)
   - Centrowany content (text-center)
3. Dodać elementy:
   - `<h1>` - "10xFitChart" (text-5xl, font-bold, gradient?)
   - `<p>` - tagline (text-xl, text-muted-foreground, max-w-2xl)
     "Śledź postępy treningowe z precyzją. Desktop-first aplikacja do analizy siłowej i cardio."
4. Renderować `<AuthButtons isAuthenticated={isAuthenticated} />`
5. Dodać spacing (gap-y-6 lub podobne)

### Krok 9: Implementacja Footer.astro

1. Utworzyć `<footer>` z paddingiem i border-top
2. Dodać container z tekstem copyright:
   - "© 2026 10xFitChart. Wszelkie prawa zastrzeżone."
3. Wycentrować tekst
4. Zastosować style text-sm i text-muted-foreground

### Krok 10: Konfiguracja klienta Supabase (jeśli jeszcze nie istnieje)

1. Upewnić się, że istnieje `src/db/supabase-server.ts`
2. Funkcja powinna tworzyć klienta Supabase z server-side cookies:
   ```typescript
   export function supabaseServer(Astro: AstroGlobal) {
     return createServerClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_ANON_KEY, {
       cookies: {
         get(key) {
           return Astro.cookies.get(key)?.value;
         },
         set(key, value, options) {
           Astro.cookies.set(key, value, options);
         },
         remove(key) {
           Astro.cookies.delete(key);
         },
       },
     });
   }
   ```

### Krok 11: Implementacja src/pages/index.astro

1. Zaimportować `BaseLayout`
2. Zaimportować `HeroSection`, `FeatureGrid`, `Footer`
3. Zaimportować dane `landingFeatures`
4. Dodać blok frontmatter do sprawdzenia sesji:

   ```typescript
   import { supabaseServer } from "@/db/supabase-server";

   const supabase = supabaseServer(Astro);
   const {
     data: { session },
     error,
   } = await supabase.auth.getSession();
   const isAuthenticated = !!session && !error;
   ```

5. Zbudować strukturę strony:
   ```astro
   <BaseLayout title="10xFitChart - Śledź postępy treningowe" description="...">
     <HeroSection isAuthenticated={isAuthenticated} client:load />
     <FeatureGrid features={landingFeatures} />
     <Footer />
   </BaseLayout>
   ```

### Krok 12: Stylowanie i Dark Mode

1. Upewnić się, że w `tailwind.config.js` jest włączony dark mode:
   ```js
   darkMode: "class";
   ```
2. Dodać klasę `dark` do `<html>` w `BaseLayout.astro`
3. Użyć zmiennych CSS z Shadcn/ui dla spójnych kolorów:
   - `background`, `foreground`
   - `card`, `card-foreground`
   - `muted`, `muted-foreground`
   - `primary`, `primary-foreground`
4. Przetestować kontrast i czytelność

### Krok 13: Testowanie responsywności

1. Przetestować widok na różnych rozdzielczościach:
   - Desktop: 1920x1080, 1440x900
   - Tablet: 1024x768, 768x1024
   - Mobile: 375x667 (informacyjnie, nie jest priorytetem)
2. Sprawdzić breakpointy Tailwind (sm, md, lg, xl)
3. Upewnić się, że:
   - Hero text jest czytelny
   - Przyciski nie są za małe
   - Feature grid przechodzi z 4 kolumn → 2 → 1
4. Przetestować w różnych przeglądarkach (Chrome, Firefox, Safari, Edge)

### Krok 14: Optymalizacja wydajności

1. Upewnić się, że komponenty React używają `client:load` tylko tam gdzie potrzebne
2. Rozważyć `client:visible` dla `FeatureGrid` jeśli będzie React
3. Zoptymalizować rozmiary ikon (użyć `size` prop z lucide-react)
4. Sprawdzić Lighthouse score:
   - Performance > 90
   - Accessibility > 90
   - Best Practices > 90
   - SEO > 90

### Krok 15: Dodanie meta tagów SEO

W `BaseLayout.astro` dodać:

1. `<meta name="description" content="...">`
2. Open Graph tags:
   - `og:title`
   - `og:description`
   - `og:type` (website)
   - `og:url`
3. Twitter Card tags (opcjonalnie)
4. Canonical URL

### Krok 16: Walidacja dostępności (a11y)

1. Sprawdzić, czy wszystkie interaktywne elementy są dostępne z klawiatury
2. Upewnić się, że kolejność tab order jest logiczna
3. Dodać `aria-label` tam gdzie potrzebne
4. Sprawdzić kontrast kolorów (WCAG AA minimum)
5. Dodać alt text dla ikon (jeśli używane jako obrazy)
6. Przetestować z screen readerem (NVDA/JAWS/VoiceOver)

### Krok 17: Testy end-to-end (opcjonalnie dla MVP)

1. Test: Niezalogowany użytkownik widzi przyciski "Zaloguj" i "Zarejestruj"
2. Test: Zalogowany użytkownik widzi przycisk "Przejdź do aplikacji"
3. Test: Kliknięcie "Zarejestruj się" przekierowuje do `/register`
4. Test: Kliknięcie "Zaloguj się" przekierowuje do `/login`
5. Test: Kliknięcie "Przejdź do aplikacji" przekierowuje do `/dashboard`

### Krok 18: Code review i refaktoryzacja

1. Sprawdzić, czy wszystkie komponenty mają odpowiednie typy
2. Usunąć nieużywane importy
3. Upewnić się, że naming conventions są spójne
4. Dodać komentarze JSDoc tam gdzie potrzebne
5. Sprawdzić czy kod przechodzi lintery (ESLint, Prettier)

### Krok 19: Dokumentacja

1. Dodać README w folderze `components/landing/` z opisem komponentów
2. Udokumentować proces dodawania nowych funkcji do `FeatureGrid`
3. Opisać jak zmienić tekst CTA i wartości Value Proposition

### Krok 20: Deploy i weryfikacja produkcyjna

1. Zbudować aplikację lokalnie: `npm run build`
2. Sprawdzić, czy nie ma błędów TypeScript
3. Przetestować build lokalnie: `npm run preview`
4. Zdeployować na Cloudflare Pages
5. Zweryfikować działanie na produkcji:
   - Sprawdzić wszystkie linki
   - Przetestować wykrywanie sesji
   - Sprawdzić czas ładowania (Core Web Vitals)

---

## Uwagi końcowe

### Priorytety dla MVP:

1. ✅ Funkcjonalność podstawowa (przyciski działają, sesja wykrywana)
2. ✅ Responsywność (szczególnie desktop)
3. ✅ Dostępność (a11y podstawowa)
4. ⚠️ Animacje (opcjonalnie, out-of-scope)
5. ⚠️ Zaawansowane SEO (out-of-scope)

### Szacowany czas implementacji:

- Doświadczony programista: **4-6 godzin**
- Junior programista: **8-12 godzin**

### Zależności:

- Supabase Auth musi być skonfigurowane
- Shadcn/ui Button musi być zainstalowany
- Tailwind CSS 4 musi być skonfigurowany z dark mode
- Strony `/register`, `/login`, `/dashboard` muszą istnieć (mogą być placeholder)

### Możliwe rozszerzenia (poza MVP):

- Animacje scroll (framer-motion)
- Video demo w Hero Section
- Sekcja testimoniali
- FAQ accordion
- Newsletter signup
- Śledzenie konwersji (analytics)
