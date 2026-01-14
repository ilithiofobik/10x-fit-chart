# Dokument wymagań produktu (PRD) - FitChart

## 1. Przegląd produktu
FitChart to aplikacja internetowa typu desktop-first, służąca do śledzenia postępów treningowych z naciskiem na analizę danych historycznych i wizualizację trendów. Produkt adresowany jest do osób trenujących siłowo i wytrzymałościowo, które preferują wygodne wprowadzanie danych na komputerze "po fakcie" (np. wieczorem w domu) zamiast uciążliwego klikania w telefonie podczas treningu. System umożliwia głęboką analizę progresu (Progressive Overload) poprzez wykresy i statystyki.

Aplikacja w wersji MVP (Minimum Viable Product) skupia się na szybkości wprowadzania danych (nawigacja klawiaturą, kopiowanie treningów) oraz czytelnej prezentacji dwóch głównych typów aktywności: treningu siłowego (metryki: objętość, 1RM) oraz cardio (metryka: prędkość).

Technologicznie projekt oparty jest o Astro (SSR), React, Tailwind 4 oraz Supabase jako backend, hostowany na Cloudflare Pages.

## 2. Problem użytkownika
Osoby trenujące regularnie napotykają następujące problemy:
- Trudność w dostrzeżeniu długoterminowych trendów (progresu lub stagnacji) przy użyciu papierowych dzienników.
- Aplikacje mobilne są niewygodne do analizy dużej ilości danych historycznych na małym ekranie.
- Brak narzędzi desktopowych, które pozwalałyby na szybkie uzupełnienie całego treningu (batch entry) w kilka minut.
- Większość prostych aplikacji nie obsługuje poprawnie dwóch różnych modeli danych (siłowe vs cardio) na jednym wykresie lub w jednym widoku.

FitChart rozwiązuje te problemy, dostarczając interfejs zoptymalizowany pod klawiaturę i duże ekrany, z automatycznym przeliczaniem zaawansowanych metryk (Epley 1RM, Volume) i wizualizacją postępów.

## 3. Wymagania funkcjonalne

### 3.1. Uwierzytelnianie i Konta
- Rejestracja użytkownika (email + hasło) bez wymogu natychmiastowej weryfikacji email.
- Logowanie do systemu.
- Wylogowanie.
- Trwałe usuwanie konta przez użytkownika (kaskadowe usunięcie wszystkich powiązanych danych: treningów, definicji ćwiczeń).

### 3.2. Zarządzanie Bazą Ćwiczeń (Słownik)
- Baza startowa (Seed): System zawiera 30 predefiniowanych, najpopularniejszych ćwiczeń.
- Dodawanie własnych ćwiczeń przez użytkownika.
- Edycja nazw ćwiczeń (zmiana widoczna globalnie we wszystkich historycznych wpisach).
- Usuwanie ćwiczeń (Soft Delete): Ćwiczenie jest archiwizowane i znika z listy wyboru, ale historyczne dane treningowe pozostają zachowane.
- Kategoryzacja: Każde ćwiczenie musi mieć przypisany typ: Siłowe lub Cardio.

### 3.3. Dziennik Treningowy (Logger)
- Tworzenie wpisu treningowego z datą (możliwość backdatingu - wpisywania treningów wstecz).
- Formularz zoptymalizowany pod obsługę klawiaturą (Tab przechodzi do kolejnych pól).
- Dodawanie ćwiczeń do sesji treningowej.
- Obsługa serii dla ćwiczeń siłowych:
  - Pola: Ciężar (kg), Powtórzenia.
  - Automatyczne wyliczanie: Objętość (Volume), Szacowany 1RM (wzór Epleya).
- Obsługa serii dla ćwiczeń cardio:
  - Pola: Dystans (km, do 2 miejsc po przecinku), Czas (minuty).
  - Automatyczne wyliczanie: Średnia prędkość (km/h lub min/km).
- Funkcje przyspieszające (Smart Entry):
  - Kopiowanie całego poprzedniego treningu jako szablonu.
  - Auto-uzupełnianie nowej serii danymi z poprzedniej serii w ramach ćwiczenia.
- Edycja i usuwanie wpisów historycznych.

### 3.4. Analityka i Dashboard
- Widok główny po zalogowaniu prezentujący podsumowanie ostatnich 3 miesięcy.
- Widgety wykresów liniowych (biblioteka Recharts).
- Wizualizacja danych siłowych: Oś czasu vs Ciężar Maksymalny / 1RM / Objętość.
- Wizualizacja danych cardio: Oś czasu vs Średnia Prędkość / Dystans.
- Filtrowanie wykresów po zakresie dat.

### 3.5. Interfejs i UX
- Tryb Ciemny (Dark Mode) jako domyślny i jedyny.
- Responsywność RWD (zachowanie czytelności na tabletach/mniejszych oknach, ale priorytet Desktop).
- Landing Page dla niezalogowanych użytkowników z informacjami o produkcie.
- Obsługa błędów: Walidacja po stronie klienta (liczby dodatnie), komunikaty Toast przy błędach sieciowych.

## 4. Granice produktu

### W ZAKRESIE (In-Scope)
- Aplikacja webowa działająca w przeglądarkach desktopowych (Chrome, Firefox, Edge, Safari).
- Język interfejsu: Polski.
- Obsługa manualnego wprowadzania danych.
- Walidacja podstawowa (format danych).
- Hosting na Cloudflare Pages.

### POZA ZAKRESEM (Out-of-Scope) dla MVP
- Dedykowana aplikacja mobilna (Native/PWA) - strona ma działać, ale nie jest to priorytet.
- Funkcje społecznościowe (rankingi, znajomi, udostępnianie).
- Planer treningowy (kalendarz przyszłych treningów).
- Import/Eksport danych (CSV, JSON).
- Śledzenie wagi ciała i wymiarów ciała użytkownika.
- Integracje API z zewnętrznymi usługami (Garmin, Strava, Apple Health).
- Zaawansowane parametry serii (RPE, czas przerwy, tempo).
- Resetowanie hasła (flow "zapomniałem hasła").

## 5. Historyjki użytkowników

### Sekcja: Uwierzytelnianie i Konto

ID: US-001
Tytuł: Rejestracja nowego użytkownika
Opis: Jako nowy użytkownik chcę założyć konto podając email i hasło, aby móc rozpocząć zapisywanie swoich treningów.
Kryteria akceptacji:
- Użytkownik widzi formularz z polami Email i Hasło.
- System waliduje format emaila i minimalną długość hasła.
- Po udanej rejestracji użytkownik jest automatycznie logowany i przekierowany do Dashboardu.
- Jeśli email już istnieje, system wyświetla odpowiedni komunikat błędu.

ID: US-002
Tytuł: Logowanie do systemu
Opis: Jako powracający użytkownik chcę zalogować się na swoje konto, aby uzyskać dostęp do moich danych.
Kryteria akceptacji:
- Użytkownik może wpisać email i hasło.
- Błędne dane powodują wyświetlenie komunikatu (Toast).
- Poprawne dane przekierowują do widoku Dashboardu.

ID: US-003
Tytuł: Usuwanie konta
Opis: Jako użytkownik chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich danych, aby zrealizować swoje prawo do bycia zapomnianym.
Kryteria akceptacji:
- Dostępny przycisk "Usuń konto" w ustawieniach/profilu.
- System wymaga potwierdzenia akcji (np. modal).
- Po potwierdzeniu wszystkie dane użytkownika (treningi, definicje ćwiczeń, konto auth) są usuwane z Supabase.
- Użytkownik zostaje wylogowany i przekierowany na stronę główną.

### Sekcja: Słownik Ćwiczeń

ID: US-004
Tytuł: Dodawanie własnego ćwiczenia
Opis: Jako użytkownik chcę dodać nowe ćwiczenie do bazy, którego nie ma na liście startowej, aby móc je uwzględnić w treningu.
Kryteria akceptacji:
- Użytkownik może zdefiniować nazwę ćwiczenia.
- Użytkownik musi wybrać kategorię: Siłowe lub Cardio.
- Nowe ćwiczenie pojawia się natychmiast na liście wyboru w formularzu treningu.
- Nazwa ćwiczenia musi być unikalna w obrębie konta użytkownika.

ID: US-005
Tytuł: Archiwizacja ćwiczenia (Soft Delete)
Opis: Jako użytkownik chcę usunąć ćwiczenie, którego już nie wykonuję, aby nie zaśmiecało mi listy wyboru, ale chcę zachować jego historię.
Kryteria akceptacji:
- Użytkownik może oznaczyć ćwiczenie jako usunięte/zarchiwizowane.
- Ćwiczenie znika z listy wyboru przy dodawaniu nowego treningu.
- Historyczne treningi zawierające to ćwiczenie nadal wyświetlają je poprawnie na wykresach i listach.

### Sekcja: Dziennik Treningowy (Logger)

ID: US-006
Tytuł: Tworzenie treningu z datą wsteczną
Opis: Jako użytkownik chcę dodać trening, który odbył się wczoraj lub kilka dni temu, aby uzupełnić luki w dzienniku.
Kryteria akceptacji:
- Domyślna data ustawiona jest na "dzisiaj".
- Użytkownik może zmienić datę za pomocą date-pickera lub wpisując ją ręcznie.
- Trening zapisuje się z wybraną datą i jest odpowiednio sortowany w historii.

ID: US-007
Tytuł: Logowanie serii siłowej z wyliczeniami
Opis: Jako użytkownik chcę wpisać ciężar i powtórzenia dla ćwiczenia siłowego, aby system automatycznie zapisał te dane.
Kryteria akceptacji:
- Formularz dla typu "Siłowe" zawiera pola: Ciężar (kg), Powtórzenia.
- System akceptuje liczby całkowite i zmiennoprzecinkowe (np. 22.5 kg).
- System w tle oblicza 1RM (wg Epleya) oraz Objętość (Volume) dla danej serii.

ID: US-008
Tytuł: Logowanie serii cardio
Opis: Jako użytkownik chcę wpisać dystans i czas dla biegania, aby system monitorował moje tempo.
Kryteria akceptacji:
- Formularz dla typu "Cardio" zawiera pola: Dystans (km), Czas (min).
- System automatycznie wylicza średnią prędkość.
- Wykresy dla tego ćwiczenia będą oparte o prędkość/dystans, a nie ciężar.

ID: US-009
Tytuł: Kopiowanie ostatniego treningu
Opis: Jako użytkownik chcę jednym kliknięciem załadować ćwiczenia z ostatniego treningu, aby zaoszczędzić czas na ponownym wybieraniu tych samych ćwiczeń.
Kryteria akceptacji:
- Przycisk "Kopiuj ostatni trening" dostępny w pustym formularzu.
- Kliknięcie ładuje listę ćwiczeń i układ serii z ostatniego zapisanego treningu.
- Użytkownik może edytować załadowane wartości przed zapisem.

ID: US-010
Tytuł: Nawigacja klawiaturą (Tab Index)
Opis: Jako użytkownik chcę przechodzić między polami formularza (Ciężar -> Powtórzenia -> Nowa Seria) używając tylko klawiatury (Tab/Enter), aby wprowadzanie danych było błyskawiczne.
Kryteria akceptacji:
- Kolejność focusowania (tab-order) jest logiczna (od lewej do prawej, wierszami).
- Naciśnięcie Enter w ostatnim polu serii automatycznie dodaje nową serię lub przenosi do przycisku zapisu.
- Nie ma pułapek klawiaturowych (focus trap).

### Sekcja: Analityka i Historia

ID: US-011
Tytuł: Podgląd wykresu postępu siłowego
Opis: Jako użytkownik chcę zobaczyć wykres liniowy mojego szacowanego 1RM w wyciskaniu leżąc, aby ocenić czy staję się silniejszy.
Kryteria akceptacji:
- Wykres generuje się poprawnie dla wybranego ćwiczenia siłowego.
- Oś X to czas, Oś Y to wartość 1RM (lub maksymalny ciężar - konfigurowalne).
- Punkty danych są połączone linią.
- Tooltip po najechaniu na punkt pokazuje dokładną datę i wartość.

ID: US-012
Tytuł: Edycja historycznego treningu
Opis: Jako użytkownik chcę poprawić błędnie wpisany ciężar w treningu sprzed tygodnia, aby moje wykresy nie pokazywały fałszywych skoków formy.
Kryteria akceptacji:
- Użytkownik może wejść w widok historii i wybrać konkretny trening.
- Po edycji i zapisaniu, statystyki i wykresy są natychmiast aktualizowane.

### Sekcja: Interfejs

ID: US-013
Tytuł: Landing Page dla niezalogowanych
Opis: Jako gość wchodzący na stronę główną, chcę zobaczyć czym jest aplikacja i mieć możliwość rejestracji/logowania.
Kryteria akceptacji:
- Strona główna (root) wykrywa brak sesji.
- Wyświetla prosty opis wartości (Value Proposition).
- Wyświetla przyciski "Zaloguj" i "Zarejestruj".
- Nie pokazuje pustego dashboardu.

## 6. Metryki sukcesu

1.  **Czas wprowadzania danych (Time to Track):** Średni czas potrzebny na wprowadzenie kompletnego treningu (składającego się z 5 ćwiczeń po 3 serie) przez powracającego użytkownika wynosi poniżej 3 minut.
2.  **Szybkość onboardingu (Time to First Value):** Nowy użytkownik jest w stanie przejść proces od wejścia na stronę, przez rejestrację, aż do zapisania pierwszego (nawet prostego) treningu w czasie poniżej 60 sekund.
3.  **Poprawność typów danych:** 100% wykresów generowanych przez system poprawnie rozróżnia jednostki (nie miesza kg z km) w zależności od typu ćwiczenia przypisanego w bazie.
4.  **Retencja (opcjonalnie dla MVP):** Użytkownicy, którzy wprowadzili co najmniej 3 treningi, wracają do aplikacji w kolejnym tygodniu.