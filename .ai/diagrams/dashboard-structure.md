# Dashboard View - Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    dashboard.astro (Astro Page)                 │
│                     Layout: LayoutApp                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Dashboard (React Island)                      │
│                  Hook: useDashboard(3)                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              DashboardHeader                              │ │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐   │ │
│  │  │ <h1>Dashboard   │  │ Select (1,3,6,12 months)     │   │ │
│  │  └─────────────────┘  └──────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    StatsGrid                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ │
│  │  │StatCard  │ │StatCard  │ │StatCard  │ │StatCard  │    │ │
│  │  │Treningi  │ │  Serie   │ │Objętość  │ │Ćwiczenia │    │ │
│  │  │  Icon    │ │  Icon    │ │  Icon    │ │  Icon    │    │ │
│  │  │  Label   │ │  Label   │ │  Label   │ │  Label   │    │ │
│  │  │  Value   │ │  Value   │ │  Value   │ │  Value   │    │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────┐ ┌───────────────────────────────┐│
│  │  RecentWorkoutsList     │ │ ProgressChartWidget           ││
│  │ ┌─────────────────────┐ │ │ ┌───────────────────────────┐││
│  │ │RecentWorkoutsHeader │ │ │ │      ChartHeader          │││
│  │ │ <h2> + Link         │ │ │ │  <h2>Postęp treningowy    │││
│  │ └─────────────────────┘ │ │ └───────────────────────────┘││
│  │ ┌─────────────────────┐ │ │ ┌───────────────────────────┐││
│  │ │WorkoutSummaryCard   │ │ │ │     ProgressChart         │││
│  │ │ Date | Ex | Sets    │ │ │ │   (Recharts LineChart)    │││
│  │ └─────────────────────┘ │ │ │                           │││
│  │ ┌─────────────────────┐ │ │ │   ┌───────────────────┐   │││
│  │ │WorkoutSummaryCard   │ │ │ │   │  ResponsiveContainer││││
│  │ └─────────────────────┘ │ │ │   │  LineChart          │││
│  │ ┌─────────────────────┐ │ │ │   │  XAxis (dates)      │││
│  │ │WorkoutSummaryCard   │ │ │ │   │  YAxis (values)     │││
│  │ └─────────────────────┘ │ │ │   │  Tooltip (custom)   │││
│  │ ┌─────────────────────┐ │ │ │   │  Line (data)        │││
│  │ │WorkoutSummaryCard   │ │ │ │   └───────────────────┘   │││
│  │ └─────────────────────┘ │ │ └───────────────────────────┘││
│  │ ┌─────────────────────┐ │ │                               ││
│  │ │WorkoutSummaryCard   │ │ │                               ││
│  │ └─────────────────────┘ │ │                               ││
│  └─────────────────────────┘ └───────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

Data Flow:
┌──────────────────┐
│   useDashboard   │ ← Custom Hook
│   (State Mgmt)   │
└────────┬─────────┘
         │
         ├─ fetchDashboardData() → GET /api/analytics/dashboard?months=N
         │                          ↓
         │                      Response: DashboardSummaryDTO
         │                          ↓
         ├─ data: DashboardSummaryDTO | null
         ├─ selectedMonths: number
         ├─ isLoading: boolean
         ├─ error: string | null
         ├─ onMonthsChange(months)
         └─ refetch()
              ↓
    ┌─────────────────────────────────┐
    │      Dashboard Component        │
    │  - transformToChartData()       │
    │  - ErrorState                   │
    │  - Conditional rendering        │
    └─────────────────────────────────┘

Loading States:
┌────────────────────────────────────────┐
│ isLoading = true                       │
├────────────────────────────────────────┤
│ StatsGrid        → 4x StatCard Skeleton│
│ RecentWorkouts   → 5x Card Skeleton    │
│ ProgressChart    → Card Skeleton       │
└────────────────────────────────────────┘

Empty States:
┌────────────────────────────────────────┐
│ data.summary.total_workouts === 0      │
├────────────────────────────────────────┤
│ StatsGrid        → Values = 0          │
│ RecentWorkouts   → Empty State + CTA   │
│ ProgressChart    → Empty State         │
└────────────────────────────────────────┘

Error States:
┌────────────────────────────────────────┐
│ error !== null                         │
├────────────────────────────────────────┤
│ ErrorState       → Alert + Retry Button│
│ (hides all other content)              │
└────────────────────────────────────────┘

Responsive Layout:
┌────────────────────────────────────────┐
│ Mobile (< 640px)                       │
├────────────────────────────────────────┤
│ StatsGrid:     1 column                │
│ Content:       1 column (stacked)      │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Tablet (640px - 1023px)                │
├────────────────────────────────────────┤
│ StatsGrid:     2 columns               │
│ Content:       1 column (stacked)      │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Desktop (≥ 1024px)                     │
├────────────────────────────────────────┤
│ StatsGrid:     4 columns               │
│ Content:       2 columns (side-by-side)│
└────────────────────────────────────────┘
```

## Component Dependencies

```
Dashboard
├── useDashboard (hook)
│   ├── fetchDashboardData
│   └── formatters (for validation)
├── DashboardHeader
│   └── Select (Shadcn/ui)
├── StatsGrid
│   └── StatCard (×4)
│       ├── Card (Shadcn/ui)
│       ├── Skeleton (Shadcn/ui)
│       └── Lucide Icons
├── RecentWorkoutsList
│   ├── RecentWorkoutsHeader
│   │   └── Button (Shadcn/ui)
│   ├── WorkoutSummaryCard (×5)
│   │   ├── Card (Shadcn/ui)
│   │   └── Lucide Icons
│   ├── Card (Empty State)
│   └── Skeleton (Loading)
└── ProgressChartWidget
    ├── ChartHeader
    ├── ProgressChart
    │   └── Recharts
    │       ├── ResponsiveContainer
    │       ├── LineChart
    │       ├── XAxis
    │       ├── YAxis
    │       ├── Tooltip (CustomTooltip)
    │       ├── CartesianGrid
    │       └── Line
    ├── Card (Shadcn/ui)
    └── Skeleton (Loading)
```

## File Structure

```
src/
├── components/
│   └── dashboard/
│       ├── Dashboard.tsx              [Main container, orchestrates all]
│       ├── DashboardHeader.tsx        [Title + period selector]
│       ├── StatCard.tsx               [Single KPI card]
│       ├── StatsGrid.tsx              [4 StatCards in responsive grid]
│       ├── WorkoutSummaryCard.tsx     [Single workout card]
│       ├── RecentWorkoutsHeader.tsx   [Section header with link]
│       ├── RecentWorkoutsList.tsx     [List of workout cards]
│       ├── ChartHeader.tsx            [Chart section header]
│       ├── ProgressChart.tsx          [Recharts LineChart wrapper]
│       ├── ProgressChartWidget.tsx    [Chart + states wrapper]
│       └── index.ts                   [Barrel exports]
├── lib/
│   ├── hooks/
│   │   └── useDashboard.ts            [Data fetching + state]
│   └── utils/
│       └── formatters.ts              [Number/date formatting]
├── pages/
│   ├── app/
│   │   └── dashboard.astro            [Page entry point]
│   └── api/
│       └── analytics/
│           └── dashboard.ts           [API endpoint]
└── types.ts                           [TypeScript definitions]
```
