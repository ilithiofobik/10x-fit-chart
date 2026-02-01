# 10xFitChart

10xFitChart is a desktop-first workout tracking application designed for efficient data entry and deep historical analysis. Built with Astro, React, and Supabase, it enables users to log strength and cardio sessions quickly using keyboard navigation and visualizes progressive overload trends through detailed charts.

## Project Description

Regular trainees often struggle to see long-term trends using paper logs or mobile apps that are cumbersome for analyzing large amounts of historical data. 10xFitChart solves this by providing an interface optimized for keyboard usage and large screens, automatically calculating advanced metrics (like Epley 1RM, Volume) and visualizing progress.

**Key Features:**

- **Desktop-First Design:** Optimized for large screens and keyboard navigation.
- **Rapid Data Entry:** "Smart Entry" features like copying previous workouts and auto-filling series.
- **Deep Analytics:** Visualization of strength (1RM, Volume) and cardio (Speed, Distance) trends using Recharts.
- **Dual-Type Tracking:** distinct handling and visualization for Strength vs. Cardio exercises.

## Tech Stack

- **Framework:** [Astro 5](https://astro.build/) (SSR)
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Components:** [Shadcn/ui](https://ui.shadcn.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Testing:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **Hosting:** Cloudflare Pages

## Getting Started Locally

### Prerequisites

- **Node.js**: Version 22.14.0 (see `.nvmrc`).
- **npm**: Package manager (comes with Node.js).

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/ilithiofobik/10x-fitness.git
    cd 10x-fitness
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory and add your Supabase credentials:

    ```env
    PUBLIC_SUPABASE_URL=your_supabase_project_url
    PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

The application should now be running at `http://localhost:4321`.

## Testing

The project uses **Vitest** for unit and component testing.

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (for CI)
npm run test:unit

# Open Vitest UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

For detailed testing guidelines, see [Testing Guide](./src/test-utils/README.md).

### Test Coverage Goals

- **Services & Utils**: ≥ 80% coverage
- **Hooks & Reducers**: ≥ 80% coverage
- **Components (logic)**: ≥ 70% coverage

## Available Scripts

| Script                  | Description                                               |
| :---------------------- | :-------------------------------------------------------- |
| `npm run dev`           | Starts the local development server with Astro.           |
| `npm run build`         | Builds the production application to the `./dist` folder. |
| `npm run preview`       | Previews the production build locally.                    |
| `npm run lint`          | Runs ESLint to check for code quality issues.             |
| `npm run lint:fix`      | Runs ESLint and automatically fixes fixable issues.       |
| `npm run format`        | Formats code using Prettier.                              |
| `npm test`              | Runs unit tests in watch mode.                            |
| `npm run test:unit`     | Runs unit tests once (CI mode).                           |
| `npm run test:ui`       | Opens Vitest UI for interactive test debugging.           |
| `npm run test:coverage` | Generates test coverage report.                           |

## Project Scope

The current MVP (Minimum Viable Product) includes:

- **Authentication**: User registration, login, and account management via Supabase Auth.
- **Exercise Dictionary**: Management of custom exercises with Strength or Cardio categorization.
- **Workout Logger**: Comprehensive logging system supporting sets, reps, weight (strength) and distance, time (cardio). Includes backdating and history editing.
- **Analytics Dashboard**: Interactive charts for visualizing progress over time.

## Project Status

🚧 **In Development (MVP)**

This project is currently in the MVP phase, focusing on core functionality for desktop users. Mobile support and advanced social features are planned for future releases.

## License

MIT License
