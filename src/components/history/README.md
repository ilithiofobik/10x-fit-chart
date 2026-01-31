# History Components

This directory contains all components related to the Workout History feature.

## Overview

The Workout History feature allows users to browse their past workouts in chronological order with pagination and filtering capabilities. Users can view workout summaries and navigate to detailed edit views.

## Components

### HistoryListProvider

Main provider component that manages state for the entire history list using React Context API.

**Usage:**
```tsx
<HistoryListProvider client:load />
```

**Features:**
- Fetches workouts with pagination
- Manages filters (date range, exercise)
- Provides error handling and loading states

### HistoryListHeader

Header section with title, description, and filter controls.

**Props:**
- `filters`: Current filter values
- `exercises`: Available exercises for filtering
- `onFilterChange`: Callback when filters are applied
- `onResetFilters`: Callback to reset all filters

**Features:**
- Date range picker (start/end date)
- Exercise dropdown filter
- Active filter indicators
- Reset filters button

### HistoryList

Main list component that renders workout cards in a responsive grid.

**Props:**
- `workouts`: Array of workout items
- `pagination`: Pagination metadata
- `isLoading`: Initial loading state
- `isLoadingMore`: Loading more items state
- `onLoadMore`: Callback for infinite scroll

**Features:**
- Responsive grid layout (1-3 columns)
- Loading skeletons
- Infinite scroll support
- Empty state handling

### WorkoutSummaryCard

Individual workout card showing summary information.

**Props:**
- `workout`: Workout data to display

**Features:**
- Date formatting (Today, Yesterday, full date)
- Exercise and set counts with icons
- Truncated notes preview (100 chars)
- Edit button linking to detail page

### LoadMoreButton

Button for loading next page of workouts.

**Props:**
- `hasMore`: Whether more items are available
- `isLoading`: Loading state
- `onClick`: Callback to load more

**Features:**
- Loading spinner
- Disabled state during load
- Auto-hide when no more items

### EmptyState

Displayed when user has no workouts.

**Features:**
- Friendly illustration
- Call-to-action button to log first workout
- Centered layout

## State Management

### useHistoryList Hook

Custom hook managing all history list state and API calls.

**Returns:**
- `state`: Current list state
- `actions`: Available actions (loadMore, applyFilters, resetFilters, reload)

### historyListReducer

Reducer handling all state mutations:
- Load workouts (initial + more)
- Apply/reset filters
- Set available exercises
- Error handling

## API Integration

### Endpoints Used

- `GET /api/workouts` - List workouts with pagination and filters
- `GET /api/exercises` - Available exercises for filter dropdown

### Query Parameters

- `limit`: Items per page (default: 20)
- `offset`: Pagination offset
- `order`: Sort order (desc = newest first)
- `start_date`: Filter by date range start
- `end_date`: Filter by date range end

## Styling

All components use Tailwind CSS and shadcn/ui components for consistent styling:
- Responsive grid (md:2 cols, lg:3 cols)
- Card-based layout
- Hover effects and transitions
- Loading skeletons
- Muted colors for secondary info

## Navigation

- List page: `/app/history`
- Edit page: `/app/history/[id]` (clicked from card)
- Back to dashboard: Via header navigation

## Client-Side Filtering

**Note:** Exercise filter is currently handled client-side. Backend API doesn't support `exercise_id` query parameter yet. Consider implementing server-side filtering for better performance with large datasets.

## Future Improvements

- [ ] Server-side exercise filtering
- [ ] Search by workout notes
- [ ] Sort options (date, volume, duration)
- [ ] Bulk operations (delete multiple)
- [ ] Export workouts (CSV, PDF)
- [ ] Workout statistics on list page
