## 1. Frontend (Warstwa Prezentacji)

Technologie odpowiedzialne za interfejs użytkownika, interakcję i renderowanie w przeglądarce.

- Astro 5 – Główny framework (meta-framework) aplikacji. Odpowiada za routing, strukturę projektu i Server-Side Rendering (SSR). Łączy statyczny content (Landing Page) z dynamiczną aplikacją.
- React 19 – Biblioteka UI do budowania interaktywnych komponentów, takich jak formularze treningowe, dashboardy i zarządzanie stanem aplikacji.
- Tailwind CSS 4 – Utility-first CSS framework do szybkiego i spójnego stylowania aplikacji bezpośrednio w kodzie komponentów.
- Shadcn/ui – Zestaw gotowych, dostępnych komponentów (przyciski, inputy, okna dialogowe), które przyspieszają budowę MVP i zapewniają profesjonalny wygląd.
- Recharts – Biblioteka do wizualizacji danych, służąca do generowania wykresów postępów siłowych i cardio.

## 2. Backend i Baza Danych (Warstwa Danych)

Infrastruktura "serverless" zastępująca tradycyjny backend, odpowiedzialna za dane i logikę biznesową.

- Supabase – Platforma Backend-as-a-Service (BaaS). Dostarcza bazę danych, autoryzację i API bez konieczności zarządzania serwerem.
- PostgreSQL – Silnik relacyjnej bazy danych pod spodem Supabase. Przechowuje ustrukturyzowane dane (użytkownicy, treningi, serie).
- Supabase Auth – Gotowy moduł uwierzytelniania obsługujący rejestrację, logowanie, sesje i zarządzanie tożsamością użytkowników.
- Row Level Security (RLS) – Warstwa bezpieczeństwa w bazie danych Postgres. Zapewnia izolację danych, gwarantując, że użytkownik ma dostęp tylko do swoich rekordów.

## 3. CI/CD i Hosting (Infrastruktura i Automatyzacja)

Procesy dostarczania aplikacji i miejsce jej uruchomienia.

- Cloudflare Pages – Platforma hostingowa typu Edge. Zapewnia globalną dystrybucję aplikacji, wysoką wydajność i obsługę funkcji SSR (Server-Side Rendering).
- GitHub Actions (CI) – System ciągłej integracji. Automatyzuje zadania przed wdrożeniem, takie jak sprawdzanie typów (TypeScript), lintowanie kodu czy uruchamianie testów przy każdym Pull Requeście.
- Cloudflare Pages (CD) – System ciągłego dostarczania. Automatycznie pobiera zweryfikowany kod z repozytorium, buduje aplikację i wdraża nową wersję na produkcję.