-- Fitness Tracker Schema for Supabase (MVP)
-- Run this in the Supabase SQL Editor to create tables and RLS policies.
-- Uses gen_random_uuid() (built-in in Postgres 13+, no extension required).

-- =============================================================================
-- TABLES
-- =============================================================================

-- Foods: reusable templates with nutrition per base amount (e.g. per 100g)
-- is_quick_add + quick_add_amount = show in "Most used" with one-tap default amount
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_amount NUMERIC(10,2) NOT NULL DEFAULT 100,
  base_unit TEXT NOT NULL DEFAULT 'g',
  calories NUMERIC(10,2) NOT NULL DEFAULT 0,
  protein NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs NUMERIC(8,2) NOT NULL DEFAULT 0,
  fats NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_quick_add BOOLEAN NOT NULL DEFAULT false,
  quick_add_amount NUMERIC(10,2),
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Food entries: logged consumption (stores calculated totals; quantity = amount in base_unit)
CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  calories NUMERIC(10,2) NOT NULL DEFAULT 0,
  protein NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs NUMERIC(8,2) NOT NULL DEFAULT 0,
  fats NUMERIC(8,2) NOT NULL DEFAULT 0,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercise definitions: reusable exercise library per user (e.g. Triceps Pushdown, Cable Fly)
CREATE TABLE exercise_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workout templates: exercise pools (e.g. Push, Pull, Legs, Chest + Triceps)
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template exercise pool: which exercise definitions belong to a template (order preserved)
CREATE TABLE workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_definition_id UUID NOT NULL REFERENCES exercise_definitions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workout sessions: multiple per day per user allowed (for calendar view)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  name TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercise entries: logged exercises within a session; optional link to exercise_definitions
CREATE TABLE exercise_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_definition_id UUID REFERENCES exercise_definitions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 0,
  reps INTEGER,
  weight_kg NUMERIC(8,2),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User settings: one row per user (defaults and goals)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  height_cm NUMERIC(5,2),
  current_weight_kg NUMERIC(6,2),
  target_weight_kg NUMERIC(6,2),
  calories_goal INTEGER NOT NULL DEFAULT 2000,
  protein_goal INTEGER NOT NULL DEFAULT 150,
  carbs_goal INTEGER NOT NULL DEFAULT 250,
  fats_goal INTEGER NOT NULL DEFAULT 65,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Body logs: historical weight entries by date (for charts and progress)
CREATE TABLE body_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weight_kg NUMERIC(6,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Trigger: keep user_settings.updated_at in sync
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_food_entries_user_date ON food_entries(user_id, log_date);
CREATE INDEX idx_food_entries_user_id ON food_entries(user_id);
CREATE INDEX idx_foods_user_id ON foods(user_id);
CREATE INDEX idx_exercise_definitions_user_id ON exercise_definitions(user_id);
CREATE INDEX idx_exercise_definitions_user_muscle ON exercise_definitions(user_id, muscle_group);
CREATE INDEX idx_workout_templates_user_id ON workout_templates(user_id);
CREATE INDEX idx_workout_template_exercises_template_id ON workout_template_exercises(template_id);
CREATE INDEX idx_workout_template_exercises_definition_id ON workout_template_exercises(exercise_definition_id);
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, session_date);
CREATE INDEX idx_workout_sessions_date_started ON workout_sessions(session_date, started_at NULLS LAST);
CREATE INDEX idx_exercise_entries_session_id ON exercise_entries(session_id);
CREATE INDEX idx_exercise_entries_definition_id ON exercise_entries(exercise_definition_id);
CREATE INDEX idx_body_logs_user_date ON body_logs(user_id, log_date);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES (USING + WITH CHECK for all)
-- =============================================================================

CREATE POLICY "Users can manage own foods"
  ON foods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own food_entries"
  ON food_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own exercise_definitions"
  ON exercise_definitions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own workout_templates"
  ON workout_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage workout_template_exercises in own templates"
  ON workout_template_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      WHERE wt.id = workout_template_exercises.template_id AND wt.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      WHERE wt.id = workout_template_exercises.template_id AND wt.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own workout_sessions"
  ON workout_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage exercise_entries in own sessions"
  ON exercise_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = exercise_entries.session_id AND ws.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = exercise_entries.session_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own user_settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own body_logs"
  ON body_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
