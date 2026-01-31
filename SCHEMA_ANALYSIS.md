# Supabase Schema Analysis

## Overview
This project uses **two separate schema files** that define overlapping database structures. This analysis identifies the complete database structure, conflicts, and recommendations.

---

## Schema Files

1. **`supabase-schema.sql`** (1,922 lines) - Main schema with meal/workout planning
2. **`supabase-workout-schema.sql`** (1,168 lines) - Workout-specific schema with exercise configs

---

## Core Tables Structure

### 1. User Management

#### `users`
- **Primary Key**: `id` (bigint, auto-increment)
- **Columns**: 
  - `email` (text, unique, NOT NULL)
  - `username` (text, unique, NOT NULL)
  - `password_hash` (text, NOT NULL)
  - `name` (text, NOT NULL)
  - `gender` (text, nullable)
  - `created_at` (timestamptz)
- **Indexes**: `idx_users_email`, `idx_users_username`

#### `profiles`
- **Primary Key**: `user_id` (references users.id)
- **Columns**:
  - `age`, `height_cm`, `weight_kg`, `bmi`
  - `goal`, `target_weight`
  - `preference`, `allergies`
  - `avatar_url`
  - `updated_at`
- **Relationship**: One-to-one with users

#### `user_providers`
- **Purpose**: OAuth provider authentication
- **Columns**: `provider`, `provider_user_id`, `user_id`
- **Unique Constraint**: `(provider, provider_user_id)`

---

### 2. Planning System

#### `plan_levels`
- **Purpose**: Defines workout/meal plan difficulty levels
- **Values**: 'Beginner', 'Intermediate', 'Advanced'
- **Columns**: `portion_multiplier`, `training_multiplier`, `notes`
- **Note**: Defined in BOTH schemas (duplicate)

#### `effort_adjustments`
- **Purpose**: Adjustments for high/low effort days
- **Values**: 'high' (+150 kcal), 'low' (-100 kcal)

---

### 3. Meal Planning System

#### `meal_goals`
- **Purpose**: Meal plan goals (e.g., "Lose Weight", "Build Muscle")
- **Columns**: Macro targets (kcal, protein, carbs, fat) with min/max ranges

#### `meal_template_days`
- **Purpose**: Template meals for specific days/levels
- **Structure**: Links goal → level → weekday → meals
- **Unique**: `(goal_id, level_id, weekday)`

#### `meal_template_meals`
- **Purpose**: Individual meal items within a day
- **Columns**: `meal_label`, `food_description`, macro values, `meal_order`

#### `user_meal_plans`
- **Purpose**: Active meal plans for users
- **Columns**: 
  - `active` (boolean) - **CONFLICT**: Main schema uses `active`
  - `current_day_index`, `start_date`
  - Links to `meal_goals` and `plan_levels`

#### `user_meal_logs`
- **Purpose**: Daily meal logging
- **Unique**: `(user_plan_id, log_date)`

---

### 4. Workout Planning System

#### ⚠️ **CONFLICT: Two Different Workout Plan Structures**

**Structure A** (supabase-schema.sql):
- `workout_goals` → `workout_template_days` → `workout_template_exercises`
- `user_workout_plans` with `active` column
- `user_workout_logs`

**Structure B** (supabase-workout-schema.sql):
- `workout_plan_configs` (JSONB configs with full workout plans)
- `user_workout_plans` with `archived` column (NOT `active`)
- `user_workout_sessions` (more detailed than logs)
- `user_workout_streaks`
- `user_workout_activity`

#### `workout_plan_configs`
- **Purpose**: Stores complete workout plans as JSONB
- **Schema Versions**: 
  - `'1.0'` - Full 90-day plans for 4 goals (Lose Weight, Build Muscle, Improve Endurance, General Fitness)
  - `'exercise_videos_v1'` - Exercise categories with videos
- **Structure**: Nested JSON with seed weeks, progression rules, burn multipliers

#### `user_workout_plans` (Structure B - Active)
- **Columns**:
  - `schema_version` (references workout_plan_configs)
  - `goal_slug`, `level_code`
  - `current_day` (1-180)
  - `archived` (boolean) - **CONFLICT with Structure A's `active`**
  - `streak_count`, `completed`
- **Unique**: `(user_id, goal_slug, start_date)`

#### `user_workout_sessions`
- **Purpose**: Individual workout session logs
- **Columns**:
  - `workouts` (JSONB) - Full exercise array
  - `base_burn`, `adjusted_burn`
  - `status` ('pending', 'completed', 'skipped')
  - `actual_metrics` (JSONB)
- **Unique**: `(plan_id, scheduled_date)`

#### `user_workout_streaks`
- **Purpose**: Tracks workout consistency streaks
- **Columns**: `current_streak`, `longest_streak`, `last_activity_date`

#### `user_workout_activity`
- **Purpose**: Daily activity summary
- **Unique**: `(user_id, activity_date)`

---

### 5. Goals & Progress Tracking (NEW - Added for Goals Page)

#### `water_intake`
- **Purpose**: Daily water intake tracking
- **Columns**: `date`, `amount` (ml)
- **Unique**: `(user_id, date)`

#### `body_measurements`
- **Purpose**: Body measurement tracking over time
- **Columns**: `measurement_date`, `chest_cm`, `arms_cm`, `waist_cm`, `hips_cm`, `thighs_cm`, `neck_cm`
- **Unique**: `(user_id, measurement_date)`

#### `strength_records`
- **Purpose**: Personal records (PRs) for exercises
- **Columns**: `exercise_name`, `weight_kg`, `reps`, `sets`, `record_date`, `notes`
- **Unique**: `(user_id, exercise_name, record_date)`

#### `progress_photos`
- **Purpose**: Progress photo storage
- **Columns**: `photo_date`, `photo_url`, `photo_type` ('front', 'side', 'back', 'full')

#### `habit_logs`
- **Purpose**: Habit tracking calendar
- **Columns**: `date`, `habit_type`, `status` ('hit', 'partial', 'missed')
- **Unique**: `(user_id, date, habit_type)`

---

## Critical Issues Identified

### 1. **Duplicate Table Definitions**
- `plan_levels` defined in both schemas
- `workout_plan_configs` defined in both schemas
- `user_workout_plans` defined TWICE with different structures
- `user_providers` defined twice in main schema

### 2. **Column Name Conflicts**
- **`user_workout_plans.active`** (supabase-schema.sql) vs **`user_workout_plans.archived`** (supabase-workout-schema.sql)
- Server code uses `archived` (from server.js line 211-213)
- Main schema tries to create index on `active` which doesn't exist

### 3. **Schema Inconsistencies**
- Main schema has old workout structure (templates)
- Workout schema has new structure (JSONB configs)
- Both try to create same tables with different columns

### 4. **Duplicate Data Inserts**
- `plan_levels` inserts appear multiple times
- `workout_plan_configs` inserts appear multiple times

### 5. **Missing Relationships**
- `strength_records` could link to `user_workout_sessions` but doesn't
- `body_measurements` has no foreign keys to other tables

---

## Current Active Structure (Based on Server Code)

The server code (`server.js`) uses:
- ✅ `user_workout_plans` with **`archived`** column
- ✅ `user_workout_sessions` (not `user_workout_logs`)
- ✅ `workout_plan_configs` with JSONB
- ✅ `user_workout_activity` for summaries

**Conclusion**: `supabase-workout-schema.sql` is the **active** workout schema.

---

## Recommendations

### 1. **Consolidate Schemas**
- Merge both schemas into one authoritative file
- Remove duplicate definitions
- Use `archived` instead of `active` for workout plans

### 2. **Fix Index Creation**
- The conditional index creation (DO block) is good, but should check for `archived` not `active`
- Or: Standardize on one column name across all tables

### 3. **Add Missing Tables to Active Schema**
- Ensure `water_intake`, `body_measurements`, `strength_records`, `progress_photos`, `habit_logs` are in the active schema

### 4. **Schema Versioning**
- Consider adding a schema version tracking table
- Document which schema file is authoritative

### 5. **Relationship Improvements**
- Link `strength_records` to `user_workout_sessions` via optional foreign key
- Consider linking `body_measurements` to user goals

---

## Table Count Summary

**Total Tables**: ~25 tables
- User Management: 3 tables
- Meal Planning: 5 tables
- Workout Planning: 6 tables (conflicting structures)
- Goals/Progress: 5 tables
- Lookup/Config: 3 tables
- OAuth: 1 table
- Streaks: 1 table

---

## Data Flow

```
User Registration
  ↓
users + profiles + user_providers
  ↓
Goal Selection
  ↓
workout_plan_configs (JSONB) → user_workout_plans
  ↓
Daily Workouts
  ↓
user_workout_sessions → user_workout_activity
  ↓
Goals Page
  ↓
body_measurements, strength_records, water_intake, habit_logs
```

---

## Next Steps

1. **Decide which schema is authoritative** (recommend: workout schema)
2. **Remove duplicates** from main schema
3. **Add goals tables** to active schema
4. **Update index creation** to use `archived`
5. **Test schema execution** end-to-end
6. **Document migration path** for existing databases
