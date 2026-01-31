# Exercises View Components

Komponenty widoku Bazy Ćwiczeń (`/app/exercises`).

## Struktura komponentów

```
ExerciseManager (główny kontener)
├── ExerciseHeader (nagłówek + przycisk dodawania)
├── ExerciseFilters (wyszukiwanie + filtr typu)
├── ExerciseList (lista ćwiczeń)
│   └── ExerciseCard (karta pojedynczego ćwiczenia)
├── ExerciseFormDialog (dialog tworzenia/edycji)
└── ConfirmArchiveDialog (dialog potwierdzenia archiwizacji)
```

## Komponenty

### ExerciseManager
Główny komponent zarządzający stanem widoku. Odpowiedzialny za:
- Pobieranie danych z API (GET /api/exercises)
- Zarządzanie filtrami (search, type)
- Obsługę dialogów (create, edit, archive)
- Operacje CRUD (POST, PUT, DELETE)

### ExerciseHeader
Nagłówek widoku z przyciskiem "Dodaj ćwiczenie".

### ExerciseFilters
Sekcja filtrów:
- Pole wyszukiwania z debounce (300ms)
- Select dla typu ćwiczenia (All/Siłowe/Cardio)

### ExerciseList
Kontener listy z obsługą stanów:
- Loading (skeleton loader)
- Empty (brak wyników)
- Success (lista kart)

### ExerciseCard
Karta pojedynczego ćwiczenia:
- Nazwa, typ, status (badges)
- Menu akcji (Edytuj/Archiwizuj) - tylko dla własnych
- Hover effects

### ExerciseFormDialog
Dialog formularza z walidacją:
- Tryb create: nazwa + typ (required)
- Tryb edit: nazwa (typ disabled)
- Walidacja real-time i obsługa błędów API

### ConfirmArchiveDialog
Dialog potwierdzenia archiwizacji z ostrzeżeniem o konsekwencjach.

## Typy

Wszystkie typy zdefiniowane w `src/types.ts`:
- `ExercisesViewState` - stan widoku
- `ExerciseTypeFilter` - typ filtra
- Props dla wszystkich komponentów

## API Endpoints

- `GET /api/exercises` - lista ćwiczeń
- `POST /api/exercises` - tworzenie
- `PUT /api/exercises/:id` - edycja
- `DELETE /api/exercises/:id` - archiwizacja
