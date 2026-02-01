# Strona: Logger Treningowy

**Ścieżka**: `/app/log`

## Opis

Główny widok do wprowadzania danych treningowych. Umożliwia szybkie logowanie ćwiczeń siłowych i cardio z wykorzystaniem nawigacji klawiaturowej.

## Funkcjonalność

### Podstawowe

- ✅ Wybór daty treningu (backdating support)
- ✅ Dodawanie notatek (max 1000 znaków)
- ✅ Wyszukiwanie i wybór ćwiczeń
- ✅ Inline tworzenie nowych ćwiczeń
- ✅ Kopiowanie ostatniego treningu

### Logowanie serii

- ✅ **Siłowe**: Ciężar (kg) + Powtórzenia
- ✅ **Cardio**: Dystans (km) + Czas (min)
- ✅ Dynamiczne pola w zależności od typu
- ✅ Walidacja real-time
- ✅ Keyboard navigation (Tab/Enter)

### Smart Features

- ✅ Auto-save do localStorage (protection przed F5)
- ✅ Debounced persistence (500ms)
- ✅ Loading states dla wszystkich akcji
- ✅ Toast notifications
- ✅ Confirmation przy wyjściu z niezapisanymi zmianami

## Komponenty

Widok składa się z 10 komponentów React:

1. **WorkoutLoggerProvider** - Main context provider
2. **WorkoutHeader** - Date picker + notes
3. **QuickActions** - Copy last workout button
4. **ExerciseCombobox** - Exercise selection with search
5. **ExerciseList** - List of exercises
6. **ExerciseCard** - Single exercise container
7. **ExerciseHeader** - Exercise name + type badge
8. **SetTable** - Table of sets
9. **SetRow** - Polymorphic input row
10. **WorkoutActions** - Save/Cancel buttons

## API Endpoints

- `GET /api/exercises` - Lista ćwiczeń
- `POST /api/exercises` - Tworzenie ćwiczenia
- `GET /api/workouts/latest` - Ostatni trening
- `POST /api/workouts` - Zapisanie treningu

## User Stories

Widok realizuje następujące User Stories z PRD:

- **US-006**: Backdating support
- **US-007**: Logowanie siłowe z 1RM/Volume
- **US-008**: Logowanie cardio z prędkością
- **US-009**: Kopiowanie ostatniego treningu
- **US-010**: Nawigacja klawiaturą

## Accessibility

- ✅ ARIA labels na inputach
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Error states z aria-invalid
- ✅ Screen reader friendly

## Performance

Bundle size: **156.73 kB** (45.98 kB gzipped)

Optymalizacje:

- Debounced localStorage save
- useCallback dla event handlers
- Conditional rendering (exercises list)
- No unnecessary re-renders

## Testing Checklist

### Manual Testing

- [ ] Dodawanie ćwiczenia siłowego
- [ ] Dodawanie ćwiczenia cardio
- [ ] Tworzenie nowego ćwiczenia inline
- [ ] Kopiowanie ostatniego treningu
- [ ] Wybór daty wstecznej
- [ ] Walidacja pól (błędne wartości)
- [ ] Keyboard navigation (Tab)
- [ ] Enter dodaje nową serię
- [ ] Usuwanie serii
- [ ] Usuwanie ćwiczenia
- [ ] Zapisanie treningu
- [ ] Anulowanie z confirmation
- [ ] F5 restore draft
- [ ] Toast notifications
- [ ] Loading states

### Edge Cases

- [ ] Brak internetu podczas zapisu
- [ ] Sesja wygasła (401)
- [ ] Błędy walidacji (400)
- [ ] Ćwiczenie nie istnieje (404)
- [ ] Konflikt nazwy (409)
- [ ] localStorage pełny
- [ ] localStorage zablokowany
- [ ] Uszkodzony draft w localStorage
