# REST API Plan - 10xFitChart

## 1. Resources

The 10xFitChart application exposes the following REST API resources:

| Resource        | Database Table  | Description                                   |
| --------------- | --------------- | --------------------------------------------- |
| `/auth`         | `auth.users`    | User authentication and account management    |
| `/exercises`    | `exercises`     | Exercise dictionary (system and user-defined) |
| `/workouts`     | `workouts`      | User workout sessions                         |
| `/workout-sets` | `workout_sets`  | Individual sets within workouts               |
| `/analytics`    | Multiple tables | Aggregated analytics data and charts          |

## 2. Endpoints

### 2.1 Exercises (`/api/exercises`)

#### List Exercises

- **Method:** `GET /api/exercises`
- **Description:** List available exercises (system + user's private)
- **Query Parameters:**
  - `type` (optional): `strength` | `cardio`
  - `include_archived` (optional): `true` | `false` (default: `false`)
- **Success Response (200):**

  ```json
  {
    "exercises": [
      {
        "id": "uuid",
        "user_id": null,
        "name": "Bench Press",
        "type": "strength",
        "is_archived": false,
        "is_system": true,
        "created_at": "2026-01-16T10:00:00Z",
        "updated_at": "2026-01-16T10:00:00Z"
      }
    ]
  }
  ```

- **Error Responses:**
  - `401` - Unauthorized

#### Create Exercise

- **Method:** `POST /api/exercises`
- **Description:** Add custom exercise (US-004)
- **Request Body:**

  ```json
  {
    "name": "Cable Flyes",
    "type": "strength"
  }
  ```

- **Success Response (201):**

  ```json
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "name": "Cable Flyes",
    "type": "strength",
    "is_archived": false,
    "is_system": false,
    "created_at": "2026-01-16T11:00:00Z",
    "updated_at": "2026-01-16T11:00:00Z"
  }
  ```

- **Error Responses:**
  - `400` - Invalid type or missing name
  - `409` - Exercise name already exists for user

#### Update Exercise

- **Method:** `PUT /api/exercises/:id`
- **Description:** Edit exercise name
- **Request Body:**

  ```json
  {
    "name": "Cable Flyes (Incline)"
  }
  ```

- **Success Response (200):**

  ```json
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "name": "Cable Flyes (Incline)",
    "type": "strength",
    "is_archived": false,
    "is_system": false,
    "created_at": "2026-01-16T11:00:00Z",
    "updated_at": "2026-01-16T11:30:00Z"
  }
  ```

- **Error Responses:**
  - `403` - Cannot modify system exercise
  - `404` - Exercise not found or doesn't belong to user

#### Archive Exercise

- **Method:** `DELETE /api/exercises/:id`
- **Description:** Soft delete - archive exercise (US-005)
- **Success Response (200):**

  ```json
  {
    "id": "uuid",
    "is_archived": true,
    "message": "Exercise archived successfully"
  }
  ```

- **Error Responses:**
  - `403` - Cannot archive system exercise
  - `404` - Exercise not found or doesn't belong to user

---

### 2.3 Workouts (`/api/workouts`)

#### List Workouts

- **Method:** `GET /api/workouts`
- **Description:** List user's workouts with pagination
- **Query Parameters:**
  - `limit` (optional): 1-100 (default: 20)
  - `offset` (optional): ≥0 (default: 0)
  - `start_date` (optional): ISO 8601 date
  - `end_date` (optional): ISO 8601 date
  - `order` (optional): `asc` | `desc` (default: `desc`)
- **Success Response (200):**

  ```json
  {
    "workouts": [
      {
        "id": "uuid",
        "user_id": "user_uuid",
        "date": "2026-01-16",
        "notes": "Great session",
        "exercise_count": 5,
        "set_count": 15,
        "created_at": "2026-01-16T20:00:00Z",
        "updated_at": "2026-01-16T20:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "has_more": true
    }
  }
  ```

- **Error Responses:**
  - `401` - Unauthorized

#### Get Workout Details

- **Method:** `GET /api/workouts/:id`
- **Description:** Retrieve workout details with all sets (US-012)
- **Success Response (200):**

  ```json
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "date": "2026-01-16",
    "notes": "Great session",
    "created_at": "2026-01-16T20:00:00Z",
    "updated_at": "2026-01-16T20:00:00Z",
    "sets": [
      {
        "id": "uuid",
        "workout_id": "workout_uuid",
        "exercise_id": "exercise_uuid",
        "exercise_name": "Bench Press",
        "exercise_type": "strength",
        "sort_order": 1,
        "weight": 100.0,
        "reps": 8,
        "distance": null,
        "time": null,
        "calculated_1rm": 125.0,
        "calculated_volume": 800.0,
        "created_at": "2026-01-16T20:05:00Z",
        "updated_at": "2026-01-16T20:05:00Z"
      }
    ]
  }
  ```

- **Error Responses:**
  - `404` - Workout not found or doesn't belong to user

#### Create Workout

- **Method:** `POST /api/workouts`
- **Description:** Create new workout with backdating support (US-006, US-007, US-008)
- **Request Body:**

  ```json
  {
    "date": "2026-01-15",
    "notes": "Evening session",
    "sets": [
      {
        "exercise_id": "uuid",
        "sort_order": 1,
        "weight": 100.0,
        "reps": 8
      },
      {
        "exercise_id": "uuid",
        "sort_order": 2,
        "distance": 5.0,
        "time": 1800
      }
    ]
  }
  ```

- **Success Response (201):**

  ```json
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "date": "2026-01-15",
    "notes": "Evening session",
    "created_at": "2026-01-16T20:00:00Z",
    "updated_at": "2026-01-16T20:00:00Z",
    "sets": [
      {
        "id": "uuid",
        "workout_id": "workout_uuid",
        "exercise_id": "exercise_uuid",
        "sort_order": 1,
        "weight": 100.0,
        "reps": 8,
        "distance": null,
        "time": null,
        "calculated_1rm": 125.0,
        "calculated_volume": 800.0,
        "created_at": "2026-01-16T20:00:00Z",
        "updated_at": "2026-01-16T20:00:00Z"
      }
    ]
  }
  ```

- **Error Responses:**
  - `400` - Validation error (invalid data)
  - `404` - Exercise ID doesn't exist

#### Update Workout

- **Method:** `PUT /api/workouts/:id`
- **Description:** Edit existing workout (US-012)
- **Request Body:**

  ```json
  {
    "date": "2026-01-15",
    "notes": "Updated notes",
    "sets": [
      {
        "id": "existing_set_uuid",
        "exercise_id": "uuid",
        "sort_order": 1,
        "weight": 102.5,
        "reps": 8
      }
    ]
  }
  ```

- **Success Response (200):**

  ```json
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "date": "2026-01-15",
    "notes": "Updated notes",
    "updated_at": "2026-01-16T21:00:00Z",
    "sets": [...]
  }
  ```

- **Error Responses:**
  - `404` - Workout not found
  - `400` - Validation error

#### Delete Workout

- **Method:** `DELETE /api/workouts/:id`
- **Description:** Delete workout and all its sets
- **Success Response (200):**

  ```json
  {
    "message": "Workout deleted successfully"
  }
  ```

- **Error Responses:**
  - `404` - Workout not found

#### Get Latest Workout

- **Method:** `GET /api/workouts/latest`
- **Description:** Retrieve user's most recent workout
- **Success Response (200):**

  ```json
  {
    "id": "uuid",
    "user_id": "user_uuid",
    "date": "2026-01-15",
    "notes": "Great session",
    "created_at": "2026-01-15T20:00:00Z",
    "updated_at": "2026-01-15T20:00:00Z",
    "sets": [...]
  }
  ```

- **Error Responses:**
  - `404` - User has no workouts yet

#### Copy Workout Template

- **Method:** `POST /api/workouts/:id/copy`
- **Description:** Copy workout as template (US-009)
- **Query Parameters:**
  - `date` (optional): ISO 8601 date (default: today)
- **Success Response (200):**

  ```json
  {
    "template": {
      "date": "2026-01-16",
      "notes": "",
      "sets": [
        {
          "exercise_id": "uuid",
          "exercise_name": "Bench Press",
          "exercise_type": "strength",
          "sort_order": 1,
          "weight": 100.0,
          "reps": 8
        }
      ]
    }
  }
  ```

- **Error Responses:**
  - `404` - Workout not found

---

### 2.4 Workout Sets (`/api/workout-sets`)

#### Create Workout Set

- **Method:** `POST /api/workout-sets`
- **Description:** Add individual set to workout
- **Request Body:**

  ```json
  {
    "workout_id": "uuid",
    "exercise_id": "uuid",
    "sort_order": 3,
    "weight": 95.0,
    "reps": 10
  }
  ```

- **Success Response (201):**

  ```json
  {
    "id": "uuid",
    "workout_id": "workout_uuid",
    "exercise_id": "exercise_uuid",
    "sort_order": 3,
    "weight": 95.0,
    "reps": 10,
    "distance": null,
    "time": null,
    "calculated_1rm": 126.67,
    "calculated_volume": 950.0,
    "created_at": "2026-01-16T20:15:00Z",
    "updated_at": "2026-01-16T20:15:00Z"
  }
  ```

- **Error Responses:**
  - `400` - Validation error
  - `403` - Workout doesn't belong to user
  - `404` - Workout or exercise not found

#### Update Workout Set

- **Method:** `PUT /api/workout-sets/:id`
- **Description:** Edit individual set
- **Request Body:**

  ```json
  {
    "weight": 97.5,
    "reps": 10
  }
  ```

- **Success Response (200):**

  ```json
  {
    "id": "uuid",
    "workout_id": "workout_uuid",
    "exercise_id": "exercise_uuid",
    "sort_order": 3,
    "weight": 97.5,
    "reps": 10,
    "calculated_1rm": 130.0,
    "calculated_volume": 975.0,
    "updated_at": "2026-01-16T20:20:00Z"
  }
  ```

- **Error Responses:**
  - `404` - Set not found or workout doesn't belong to user
  - `400` - Validation error

#### Delete Workout Set

- **Method:** `DELETE /api/workout-sets/:id`
- **Description:** Delete individual set
- **Success Response (200):**

  ```json
  {
    "message": "Workout set deleted successfully"
  }
  ```

- **Error Responses:**
  - `404` - Set not found or workout doesn't belong to user

---

### 2.5 Analytics (`/api/analytics`)

#### Get Dashboard Summary

- **Method:** `GET /api/analytics/dashboard`
- **Description:** Dashboard summary data (US-011)
- **Query Parameters:**
  - `months` (optional): 1-12 (default: 3)
- **Success Response (200):**

  ```json
  {
    "period": {
      "start_date": "2025-10-16",
      "end_date": "2026-01-16",
      "months": 3
    },
    "summary": {
      "total_workouts": 36,
      "total_sets": 540,
      "total_volume": 125000.0,
      "unique_exercises": 12
    },
    "recent_workouts": [
      {
        "id": "uuid",
        "date": "2026-01-15",
        "exercise_count": 5,
        "set_count": 15
      }
    ]
  }
  ```

- **Error Responses:**
  - `401` - Unauthorized

#### Get Exercise Progress

- **Method:** `GET /api/analytics/exercises/:exercise_id/progress`
- **Description:** Historical progress data for single exercise (US-011)
- **Query Parameters:**
  - `start_date` (optional): ISO 8601 date
  - `end_date` (optional): ISO 8601 date
  - `metric` (optional): `max_weight` | `1rm` | `volume` | `avg_speed` | `distance`
- **Success Response (200) - Strength:**

  ```json
  {
    "exercise": {
      "id": "uuid",
      "name": "Bench Press",
      "type": "strength"
    },
    "metric": "1rm",
    "data_points": [
      {
        "date": "2026-01-10",
        "workout_id": "uuid",
        "value": 125.0,
        "details": {
          "weight": 100.0,
          "reps": 8
        }
      }
    ]
  }
  ```

- **Success Response (200) - Cardio:**

  ```json
  {
    "exercise": {
      "id": "uuid",
      "name": "Running",
      "type": "cardio"
    },
    "metric": "avg_speed",
    "data_points": [
      {
        "date": "2026-01-10",
        "workout_id": "uuid",
        "value": 10.0,
        "details": {
          "distance": 5.0,
          "time": 1800
        }
      }
    ]
  }
  ```

- **Error Responses:**
  - `404` - Exercise not found or not accessible

#### Get Personal Records

- **Method:** `GET /api/analytics/personal-records`
- **Description:** User's personal records
- **Query Parameters:**
  - `exercise_id` (optional): Filter by specific exercise
- **Success Response (200):**

  ```json
  {
    "records": [
      {
        "exercise_id": "uuid",
        "exercise_name": "Bench Press",
        "exercise_type": "strength",
        "max_weight": 120.0,
        "max_1rm": 150.0,
        "max_volume": 1200.0,
        "achieved_date": "2026-01-15",
        "workout_id": "uuid"
      },
      {
        "exercise_id": "uuid",
        "exercise_name": "Running",
        "exercise_type": "cardio",
        "max_distance": 10.0,
        "best_speed": 12.5,
        "achieved_date": "2026-01-12",
        "workout_id": "uuid"
      }
    ]
  }
  ```

- **Error Responses:**
  - `401` - Unauthorized

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Provider:** Supabase Auth (JWT-based authentication)

**Flow:**

1. Client sends credentials to `/api/auth/login` or `/api/auth/register`
2. Server validates credentials via Supabase Auth
3. Server returns JWT access token and refresh token
4. Client stores tokens securely (httpOnly cookie)
5. Client includes `Authorization: Bearer {access_token}` header in subsequent requests
6. Server validates JWT and extracts `user_id` via `auth.uid()` function

**Token Expiration:**

- Access token: 1 hour
- Refresh token: 7 days

**Token Refresh:**
Endpoint `POST /api/auth/refresh` with `refresh_token` in body returns new access token.

### 3.2 Authorization Strategy

**Row Level Security (RLS):**
All data isolation enforced at database level via PostgreSQL RLS policies.

**RLS Policies:**

1. **Table `exercises`:**
   - `SELECT`: `user_id = auth.uid() OR user_id IS NULL` (own + system)
   - `INSERT`: `user_id = auth.uid()` (own only)
   - `UPDATE/DELETE`: `user_id = auth.uid()` (own only)

2. **Table `workouts`:**
   - `ALL`: `user_id = auth.uid()` (own only)

3. **Table `workout_sets`:**
   - `ALL`: `workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())`

**API Layer:**

- All protected endpoints require valid JWT in Authorization header
- Missing/invalid token → `401 Unauthorized`
- RLS policies automatically ensure data isolation

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

**Exercises:**

- `name`: Required, 1-100 characters, unique per user
- `type`: Required, enum (`strength`, `cardio`)
- `is_archived`: Boolean, default `false`
- System exercises (`user_id IS NULL`) are read-only

**Workouts:**

- `date`: Required, format YYYY-MM-DD, can be past date, not future
- `notes`: Optional, max 1000 characters
- Must contain at least 1 set
- Backdating allowed (US-006)

**Workout Sets:**

- `workout_id`: Required, must exist and belong to user
- `exercise_id`: Required, must exist and be accessible to user
- `sort_order`: Required, integer > 0

**For strength exercises (`type = strength`):**

- `weight`: Numeric, `≥ 0`, precision (5,2), required
- `reps`: Integer, `> 0`, required
- `distance`, `time`: Must be `null`

**For cardio exercises (`type = cardio`):**

- `distance`: Numeric, `≥ 0`, precision (8,2), required
- `time`: Integer (seconds), `≥ 0`, required
- `weight`, `reps`: Must be `null`

### 4.2 Business Logic

**1. Automatic Calculations (server-side):**

All calculated fields are computed server-side and stored in database for chart performance.

**1RM (Epley Formula) - strength exercises only:**

```
calculated_1rm = weight * (1 + reps / 30)
```

- Recalculated on create/update of set
- Stored in `workout_sets.calculated_1rm`

**Volume - strength exercises only:**

```
calculated_volume = weight * reps
```

- Recalculated on create/update of set
- Stored in `workout_sets.calculated_volume`

**Average Speed (Cardio):**

```
avg_speed = distance / (time / 3600)  // km/h
pace = time / distance                // seconds per km
```

- Calculated on-demand in analytics endpoints
- Not stored (computed from distance + time)

**2. Soft Delete for Exercises:**

- Exercise deletion sets `is_archived = true`
- Archived exercises hidden in selection lists
- Historical data maintains references to archived exercises
- Prevents breaking referential integrity

**3. Automatic Timestamps:**

- `created_at`: Set on INSERT via `DEFAULT now()`
- `updated_at`: Automatically updated via `moddatetime` trigger

**4. Transaction Safety:**

- Workout create/update operations are atomic (workout + all sets in one transaction)
- Rollback on any validation error
- Ensures data consistency

**5. Metric Separation (US-007, US-008):**

- System automatically recognizes exercise type
- Validates presence of appropriate fields (weight/reps for strength, distance/time for cardio)
- Analytics endpoints return different metrics based on type
- Prevents mixing units (kg vs km) in charts

**6. Backdating Support (US-006):**

- `date` field in workouts accepts past dates
- Enables logging workouts "after the fact"
- Workouts sorted chronologically regardless of entry order

**7. Workout Copying (US-009):**

- Endpoint `/workouts/:id/copy` returns structure as template
- Does not immediately create database record
- Client pre-populates form, user edits, then POST `/workouts`

**8. Chart Performance:**

- Precalculated 1RM and volume eliminate need to recalculate thousands of records
- Indexes on `workout_sets.exercise_id` speed up history filtering
- Aggregations in analytics endpoints return ready data for Recharts
