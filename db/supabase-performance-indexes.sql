-- Optional performance indexes for dashboard + meals load paths.
-- Safe to run multiple times.

create index if not exists idx_user_meal_completions_user_date
  on public.user_meal_completions (user_id, meal_date);

create index if not exists idx_user_workout_completions_user_date
  on public.user_workout_completions (user_id, workout_date);

create index if not exists idx_user_habit_logs_user_date
  on public.user_habit_logs (user_id, habit_date);

create index if not exists idx_user_workout_sessions_plan_date
  on public.user_workout_sessions (plan_id, scheduled_date);

create index if not exists idx_user_workout_plans_active_lookup
  on public.user_workout_plans (user_id, archived, completed, start_date desc);

create index if not exists idx_user_meal_plans_user_active
  on public.user_meal_plans (user_id, active);

create index if not exists idx_meal_template_days_goal_level_weekday
  on public.meal_template_days (goal_id, level_id, weekday);

create index if not exists idx_meal_template_options_meal_order
  on public.meal_template_options (template_meal_id, option_order);
