import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { Ingredient } from "@/types/database";

/*
 * Database schema (PostgreSQL). Change it here, then run `npm run db:generate`
 * to create a migration; migrations run automatically when the app starts.
 *
 * Every app table carries user_id so every query can be scoped to the signed-in user.
 * App columns keep snake_case property names to match the shapes the UI already uses.
 */

const createdAt = () => timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow();

// ---------------------------------------------------------------------------
// Auth (Better Auth). Property names are what Better Auth expects; columns are snake_case.
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const userId = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

// ---------------------------------------------------------------------------
// Food
// ---------------------------------------------------------------------------

/** Saved food types: nutrition per base_amount base_unit (e.g. per 100 g, per 1 egg, per 1 serving). */
export const foods = pgTable(
  "foods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    name: text("name").notNull(),
    base_amount: doublePrecision("base_amount").notNull().default(100),
    base_unit: text("base_unit").notNull().default("g"),
    calories: doublePrecision("calories").notNull().default(0),
    protein: doublePrecision("protein").notNull().default(0),
    carbs: doublePrecision("carbs").notNull().default(0),
    fats: doublePrecision("fats").notNull().default(0),
    is_quick_add: boolean("is_quick_add").notNull().default(false),
    quick_add_amount: doublePrecision("quick_add_amount"),
    image_path: text("image_path"),
    /** For saved meals (base_unit "serving"): what they're made of, so they can be edited later. */
    ingredients: jsonb("ingredients").$type<Ingredient[]>(),
    created_at: createdAt(),
  },
  (t) => [unique("foods_user_name_unique").on(t.user_id, t.name)]
);

/** Logged food: stores the calculated totals so history never changes when a food is edited. */
export const foodEntries = pgTable(
  "food_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    food_id: uuid("food_id").references(() => foods.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    calories: doublePrecision("calories").notNull().default(0),
    protein: doublePrecision("protein").notNull().default(0),
    carbs: doublePrecision("carbs").notNull().default(0),
    fats: doublePrecision("fats").notNull().default(0),
    quantity: doublePrecision("quantity").notNull().default(0),
    log_date: date("log_date", { mode: "string" }).notNull(),
    meal_type: text("meal_type"),
    image_path: text("image_path"),
    created_at: createdAt(),
  },
  (t) => [index("food_entries_user_date_idx").on(t.user_id, t.log_date)]
);

// ---------------------------------------------------------------------------
// Workouts
// ---------------------------------------------------------------------------

export const exerciseDefinitions = pgTable(
  "exercise_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    name: text("name").notNull(),
    muscle_group: text("muscle_group"),
    created_at: createdAt(),
  },
  (t) => [index("exercise_definitions_user_idx").on(t.user_id)]
);

/** Workout days of the user's split (e.g. "Chest & Triceps"). */
export const workoutTemplates = pgTable(
  "workout_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    name: text("name").notNull(),
    created_at: createdAt(),
  },
  (t) => [index("workout_templates_user_idx").on(t.user_id)]
);

export const workoutTemplateExercises = pgTable(
  "workout_template_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    template_id: uuid("template_id")
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: "cascade" }),
    exercise_definition_id: uuid("exercise_definition_id")
      .notNull()
      .references(() => exerciseDefinitions.id, { onDelete: "cascade" }),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: createdAt(),
  },
  (t) => [
    index("workout_template_exercises_template_idx").on(t.template_id),
    index("workout_template_exercises_user_idx").on(t.user_id),
  ]
);

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    session_date: date("session_date", { mode: "string" }).notNull(),
    name: text("name"),
    notes: text("notes"),
    started_at: timestamp("started_at", { withTimezone: true, mode: "string" }),
    created_at: createdAt(),
  },
  (t) => [index("workout_sessions_user_date_idx").on(t.user_id, t.session_date)]
);

export const exerciseEntries = pgTable(
  "exercise_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    session_id: uuid("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exercise_definition_id: uuid("exercise_definition_id").references(() => exerciseDefinitions.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    sets: integer("sets").notNull().default(0),
    reps: integer("reps"),
    weight_kg: doublePrecision("weight_kg"),
    notes: text("notes"),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: createdAt(),
  },
  (t) => [
    index("exercise_entries_session_idx").on(t.session_id),
    index("exercise_entries_definition_idx").on(t.exercise_definition_id),
    // Exercise history (Workouts + Stats) loads all of a user's entries.
    index("exercise_entries_user_idx").on(t.user_id),
  ]
);

// ---------------------------------------------------------------------------
// Body & settings
// ---------------------------------------------------------------------------

export const userSettings = pgTable("user_settings", {
  user_id: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  height_cm: doublePrecision("height_cm"),
  current_weight_kg: doublePrecision("current_weight_kg"),
  target_weight_kg: doublePrecision("target_weight_kg"),
  calories_goal: integer("calories_goal").notNull().default(2000),
  protein_goal: integer("protein_goal").notNull().default(150),
  carbs_goal: integer("carbs_goal").notNull().default(250),
  fats_goal: integer("fats_goal").notNull().default(65),
  created_at: createdAt(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const bodyLogs = pgTable(
  "body_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    log_date: date("log_date", { mode: "string" }).notNull(),
    weight_kg: doublePrecision("weight_kg"),
    notes: text("notes"),
    created_at: createdAt(),
  },
  (t) => [unique("body_logs_user_date_unique").on(t.user_id, t.log_date)]
);
